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
        : 'Your sandbox is temporarily unavailable. Please try again.',
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
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin)
      return json(
        { error: 'This request must come from your pilot site.' },
        403,
      );
    if (Number(request.headers.get('content-length') || 0) > 30000)
      return json({ error: 'This request is too large.' }, 413);
    const raw = await request.text();
    if (raw.length > 30000)
      return json({ error: 'This request is too large.' }, 413);
    return json(await mutateSpace(ownerOf(request), JSON.parse(raw)));
  } catch (e) {
    return failure(e);
  }
}
