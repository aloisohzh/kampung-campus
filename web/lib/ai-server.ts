import { env } from 'cloudflare:workers';
import { database, ownerOf, loadSpace } from './storage';
import { canPlan } from './access';
export const aiConfig = () =>
  env as unknown as { OPENAI_API_KEY?: string; OPENAI_MODEL?: string };
export const aiJson = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
export function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
export function aiFailure(e: unknown) {
  const status = (e as { status?: number }).status;
  return aiJson(
    {
      error: status
        ? (e as Error).message
        : 'AI could not complete this request. Please try again.',
    },
    status || 502,
  );
}
export async function plannerOwner(request: Request, mutation = false) {
  const owner = ownerOf(request);
  if (mutation && request.headers.get('origin') !== new URL(request.url).origin)
    fail('Invalid request origin.', 403);
  const space = await loadSpace(owner);
  if (!space.state.profile?.completedAt)
    fail('Complete your profile before planning an activity.', 403);
  if (!canPlan(space.state.activeRole || 'resident'))
    fail('Switch to Resident or Organiser to use the activity planner.', 403);
  return { owner, ...space };
}
export async function consumeAi(owner: string, kind: string, limit: number) {
  const db = database(),
    window = Math.floor(Date.now() / 3600000),
    id = owner + ':' + kind + ':' + window;
  await db
    .prepare('DELETE FROM ai_usage WHERE owner = ? AND window < ?')
    .bind(owner, window - 24)
    .run();
  const row = await db
    .prepare(
      'INSERT INTO ai_usage (id,owner,window,count) VALUES (?,?,?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count',
    )
    .bind(id, owner, window, limit)
    .first();
  if (!row)
    fail(
      'Your hourly AI allowance has been reached. Please try again next hour.',
      429,
    );
}
