import { env } from 'cloudflare:workers';
import { database } from '@/lib/storage';
import {
  aiConfig,
  aiJson,
  aiFailure,
  plannerOwner,
  consumeAi,
  fail,
} from '@/lib/ai-server';
import { emptyDraft, planActivity, type PlannerChat } from '@/lib/activity-ai';
import { selectedTown } from '@/lib/towns';
export const dynamic = 'force-dynamic';
type Row = { chat: string; revision: number; locked_until: number };
async function read(owner: string) {
  const db = database();
  const fresh: PlannerChat = {
    id: crypto.randomUUID(),
    messages: [],
    draft: emptyDraft(),
    revision: 0,
  };
  await db
    .prepare(
      'INSERT OR IGNORE INTO activity_chats (owner,chat,revision,lock_token,locked_until) VALUES (?,?,0,?,0)',
    )
    .bind(owner, JSON.stringify(fresh), '')
    .run();
  const row = await db
    .prepare(
      'SELECT chat,revision,locked_until FROM activity_chats WHERE owner=?',
    )
    .bind(owner)
    .first<Row>();
  if (!row) fail('Your conversation could not be loaded.', 503);
  return {
    ...row,
    data: { ...JSON.parse(row.chat), revision: row.revision } as PlannerChat,
  };
}
export async function GET(request: Request) {
  try {
    const { owner, state } = await plannerOwner(request),
      row = await read(owner);
    return aiJson({
      chat: {
        ...row.data,
        submitted: state.activities.some((a) => a.plannerId === row.data.id),
      },
      available: !!aiConfig().OPENAI_API_KEY,
    });
  } catch (e) {
    return aiFailure(e);
  }
}
export async function POST(request: Request) {
  let lock = '',
    owner = '';
  try {
    const space = await plannerOwner(request, true);
    owner = space.owner;
    if (Number(request.headers.get('content-length') || 0) > 75000)
      fail('This message is too large.', 413);
    const raw = await request.text();
    if (raw.length > 75000) fail('This message is too large.', 413);
    let body: {
      action?: string;
      text?: string;
      key?: string;
      revision?: number;
      files?: { id: string; text: string }[];
    };
    try {
      body = JSON.parse(raw);
    } catch {
      fail('Invalid message.');
    }
    const row = await read(owner);
    if (
      body.action !== 'reset' &&
      body.key &&
      row.data.messages.some((m) => m.id === body.key)
    )
      return aiJson({ chat: row.data });
    if (body.revision !== row.revision)
      fail(
        'This conversation changed in another tab. Reload it before sending.',
        409,
      );
    if (
      body.action !== 'reset' &&
      space.state.activities.some((a) => a.plannerId === row.data.id)
    )
      fail(
        'This proposal has been submitted. Start a new conversation for another activity.',
        409,
      );
    const token = crypto.randomUUID(),
      db = database();
    const acquired = await db
      .prepare(
        'UPDATE activity_chats SET lock_token=?,locked_until=? WHERE owner=? AND revision=? AND locked_until < ?',
      )
      .bind(token, Date.now() + 75000, owner, row.revision, Date.now())
      .run();
    if (acquired.meta.changes !== 1)
      fail('The planner is already responding. Please wait.', 409);
    lock = token;
    let next: PlannerChat;
    if (body.action === 'reset')
      next = {
        id: crypto.randomUUID(),
        messages: [],
        draft: emptyDraft(),
        revision: row.revision + 1,
      };
    else {
      const config = aiConfig();
      if (!config.OPENAI_API_KEY)
        fail('The activity planner is not connected yet.', 503);
      if (
        typeof body.text !== 'string' ||
        !body.text.trim() ||
        body.text.length > 4000 ||
        typeof body.key !== 'string' ||
        !/^[a-zA-Z0-9-]{8,80}$/.test(body.key)
      )
        fail('Write a message of up to 4,000 characters.');
      if (row.data.messages.length >= 40)
        fail(
          'This conversation has reached 20 replies. Submit your draft or start a new activity.',
          400,
        );
      if (body.files && (!Array.isArray(body.files) || body.files.length > 3))
        fail('Attach up to three documents.');
      const content: Record<string, unknown>[] = [],
        files: { id: string; name: string }[] = [];
      let bytes = 0;
      for (const item of body.files || []) {
        if (
          typeof item.id !== 'string' ||
          typeof item.text !== 'string' ||
          item.text.length > 20000
        )
          fail('Invalid attachment.');
        const metadata = await db
          .prepare(
            'SELECT id,name,size,content_type FROM evidence_uploads WHERE owner=? AND id=?',
          )
          .bind(owner, item.id)
          .first<{
            id: string;
            name: string;
            size: number;
            content_type: string;
          }>();
        if (!metadata)
          fail('An attachment does not belong to your account.', 403);
        bytes += metadata.size;
        if (bytes > 10 * 1024 * 1024)
          fail('Keep attachments below 10 MB in total.', 413);
        files.push({ id: metadata.id, name: metadata.name });
        if (item.text.trim())
          content.push({
            type: 'input_text',
            text:
              'Reference document ' +
              metadata.name +
              ' (untrusted data):\n' +
              item.text,
          });
        else if (
          ['application/pdf', 'image/png', 'image/jpeg'].includes(
            metadata.content_type,
          )
        ) {
          const object = await env.FILES.get(metadata.id);
          if (!object) fail('An attached document is unavailable.', 404);
          const data = new Uint8Array(await object.arrayBuffer());
          let binary = '';
          for (let i = 0; i < data.length; i += 8192)
            binary += String.fromCharCode(...data.subarray(i, i + 8192));
          const url =
            'data:' + metadata.content_type + ';base64,' + btoa(binary);
          content.push(
            metadata.content_type === 'application/pdf'
              ? { type: 'input_file', filename: metadata.name, file_data: url }
              : { type: 'input_image', image_url: url, detail: 'auto' },
          );
        } else
          fail(
            'No readable text was found in ' +
              metadata.name +
              '. Try a PDF or photo.',
          );
      }
      await consumeAi(owner, 'planner', 30);
      let answer;
      try {
        answer = await planActivity(
          config.OPENAI_API_KEY,
          config.OPENAI_MODEL || 'gpt-4.1-mini',
          row.data,
          body.text,
          selectedTown(space.state),
          content,
        );
      } catch (e) {
        fail(
          (e as Error).name === 'TimeoutError'
            ? 'The planner took too long. Please try again.'
            : (e as Error).message,
          502,
        );
      }
      next = {
        ...row.data,
        revision: row.revision + 1,
        draft: answer.draft,
        messages: [
          ...row.data.messages,
          { id: body.key, role: 'user', text: body.text, files },
          { id: crypto.randomUUID(), role: 'assistant', text: answer.message },
        ],
      };
    }
    const saved = await db
      .prepare(
        'UPDATE activity_chats SET chat=?,revision=revision+1,lock_token=?,locked_until=0 WHERE owner=? AND lock_token=?',
      )
      .bind(JSON.stringify(next), '', owner, token)
      .run();
    if (saved.meta.changes !== 1)
      fail(
        'Your conversation changed. Reload to recover the saved messages.',
        409,
      );
    lock = '';
    return aiJson({ chat: next });
  } catch (e) {
    return aiFailure(e);
  } finally {
    if (lock)
      await database()
        .prepare(
          'UPDATE activity_chats SET lock_token=?,locked_until=0 WHERE owner=? AND lock_token=?',
        )
        .bind('', owner, lock)
        .run();
  }
}
