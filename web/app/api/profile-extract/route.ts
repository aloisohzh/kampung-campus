import { env } from 'cloudflare:workers';
import { ownerOf, loadSpace } from '@/lib/storage';
import { analyseDocument } from '@/lib/document-ai';
export const dynamic = 'force-dynamic';
const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
function configuration() {
  return env as unknown as { OPENAI_API_KEY?: string; OPENAI_MODEL?: string };
}
export function GET(request: Request) {
  try {
    ownerOf(request);
    return json({ available: !!configuration().OPENAI_API_KEY });
  } catch {
    return json({ error: 'Please sign in.' }, 401);
  }
}
export async function POST(request: Request) {
  try {
    const owner = ownerOf(request);
    if (request.headers.get('origin') !== new URL(request.url).origin)
      return json({ error: 'Invalid request origin.' }, 403);
    const space = await loadSpace(owner);
    if (!space.state.profile)
      return json(
        { error: 'Create your account before analysing a document.' },
        403,
      );
    const config = configuration();
    if (!config.OPENAI_API_KEY)
      return json(
        {
          error:
            'AI document extraction is not connected yet. You can review text-based skill suggestions and save your file.',
          code: 'AI_NOT_CONFIGURED',
        },
        503,
      );
    if (Number(request.headers.get('content-length') || 0) > 6 * 1024 * 1024)
      return json({ error: 'Choose a document under 5 MB.' }, 413);
    const form = await request.formData();
    const file = form.get('file');
    const text = form.get('text');
    const kind = form.get('kind');
    if (form.get('consent') !== 'true')
      return json({ error: 'Confirm document analysis first.' }, 400);
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 5 * 1024 * 1024 ||
      ![
        'application/pdf',
        'image/jpeg',
        'image/png',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type)
    )
      return json(
        { error: 'Choose a PDF, DOCX, TXT, JPG or PNG under 5 MB.' },
        400,
      );
    if (
      typeof text !== 'string' ||
      text.length > 60000 ||
      typeof kind !== 'string' ||
      !['CV / résumé', 'Certification', 'Accreditation'].includes(kind)
    )
      return json({ error: 'Review the document type and try again.' }, 400);
    const extraction = await analyseDocument(
      config.OPENAI_API_KEY,
      config.OPENAI_MODEL || 'gpt-4.1-mini',
      file,
      text,
      kind,
    );
    return json({ extraction, method: 'ai' });
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 401) return json({ error: 'Please sign in.' }, 401);
    return json(
      {
        error:
          e instanceof Error && e.name !== 'TimeoutError'
            ? e.message
            : 'Analysis took too long. Please try again or save the document as it is.',
      },
      502,
    );
  }
}
