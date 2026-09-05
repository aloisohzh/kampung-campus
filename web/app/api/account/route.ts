import { ownerOf } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export function accountDetails(request: Request) {
  ownerOf(request);
  let name = request.headers.get('oai-authenticated-user-full-name') || '';
  if (
    request.headers.get('oai-authenticated-user-full-name-encoding') ===
    'percent-encoded-utf-8'
  ) {
    try {
      name = decodeURIComponent(name);
    } catch {
      name = '';
    }
  }
  return {
    name: name.slice(0, 120),
    email: (request.headers.get('oai-authenticated-user-email') || '').slice(
      0,
      254,
    ),
  };
}
export function GET(request: Request) {
  try {
    return Response.json(accountDetails(request), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return Response.json({ error: 'Please sign in.' }, { status: 401 });
  }
}
