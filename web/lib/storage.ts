import { env } from 'cloudflare:workers';
import { createSeed } from './seed';
import { execute, RuleError } from './domain';
import type { PilotState, Command } from './model';
export function database() {
  if (!env.DB) throw new Error('The pilot database is unavailable.');
  return env.DB;
}
export function ownerOf(request: Request) {
  const user = request.headers.get('oai-authenticated-user-id');
  if (user) return user;
  if (import.meta.env.DEV) return 'local-development';
  throw Object.assign(new Error('Please sign in with ChatGPT.'), {
    status: 401,
  });
}
type Row = { state: string; revision: number };
export async function loadSpace(owner: string) {
  const db = database();
  let row = await db
    .prepare('SELECT state, revision FROM pilot_spaces WHERE owner = ?')
    .bind(owner)
    .first<Row>();
  if (!row) {
    await db
      .prepare(
        'INSERT OR IGNORE INTO pilot_spaces (owner,state,revision,commit_id,updated) VALUES (?,?,0,?,?)',
      )
      .bind(
        owner,
        JSON.stringify(createSeed()),
        crypto.randomUUID(),
        new Date().toISOString(),
      )
      .run();
    row = await db
      .prepare('SELECT state, revision FROM pilot_spaces WHERE owner = ?')
      .bind(owner)
      .first<Row>();
  }
  if (!row) throw new Error('Your sandbox could not be opened.');
  return { state: JSON.parse(row.state) as PilotState, revision: row.revision };
}
export async function mutateSpace(owner: string, command: Command) {
  const db = database();
  if (command.evidence) {
    if (!Array.isArray(command.evidence) || command.evidence.length > 3)
      throw new RuleError('Attach up to three evidence files.');
    for (const id of command.evidence) {
      const file = await db
        .prepare('SELECT id FROM evidence_uploads WHERE id = ? AND owner = ?')
        .bind(id, owner)
        .first();
      if (!file)
        throw new RuleError(
          'An evidence attachment does not belong to your sandbox.',
        );
    }
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const before = await loadSpace(owner);
    const result = execute(before.state, command);
    if (result.state === before.state)
      return { ...result, revision: before.revision };
    const revision = before.revision + 1,
      commit = crypto.randomUUID(),
      updated = new Date().toISOString();
    const changes = await db.batch([
      db
        .prepare(
          'UPDATE pilot_spaces SET state = ?, revision = ?, commit_id = ?, updated = ? WHERE owner = ? AND revision = ?',
        )
        .bind(
          JSON.stringify(result.state),
          revision,
          commit,
          updated,
          owner,
          before.revision,
        ),
      db
        .prepare(
          'INSERT INTO pilot_events (id,owner,revision,actor,action,message,created) SELECT ?,owner,revision,?,?,?,? FROM pilot_spaces WHERE owner = ? AND commit_id = ?',
        )
        .bind(
          commit,
          command.actor,
          command.type,
          result.message,
          updated,
          owner,
          commit,
        ),
    ]);
    if (changes[0].meta.changes === 1) return { ...result, revision };
  }
  throw Object.assign(
    new Error('Another action just changed your sandbox. Please try again.'),
    { status: 409 },
  );
}
