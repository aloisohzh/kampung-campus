import { accountDetails } from '../account/route';
import { loadSpace, mutateSpace, ownerOf } from '@/lib/storage';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
function failure(e: unknown) {
  const error = e as Error & { status?: number };
  console.error('Pilot request failed:', error.message);
  return json(
    {
      error: error.status
        ? error.message
        : 'Your workspace is temporarily unavailable. Please try again.',
    },
    error.status || 500,
  );
}
export async function GET(request: Request) {
  try {
    const result = await loadSpace(ownerOf(request));
    return json(result);
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 30000)
      return json({ error: 'This request is too large.' }, 413);
    const raw = await request.text();
    if (raw.length > 30000)
      return json({ error: 'This request is too large.' }, 413);
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin)
      return json(
        { error: 'This request must come from your Kampung Campus site.' },
        403,
      );
    let command;
    try {
      command = JSON.parse(raw);
    } catch {
      return json({ error: 'Invalid JSON request.' }, 400);
    }
    if (!command || typeof command !== 'object' || Array.isArray(command))
      return json({ error: 'Invalid command.' }, 400);
    if (command?.type === 'profileLogin')
      command.email = accountDetails(request).email;
    return json(await mutateSpace(ownerOf(request), command));
  } catch (e) {
    return failure(e);
  }
}
