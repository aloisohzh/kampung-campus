import { env } from 'cloudflare:workers';
import { database, ownerOf } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const owner = ownerOf(request);
    if (request.headers.get('origin') !== new URL(request.url).origin)
      return Response.json(
        { error: 'Invalid request origin.' },
        { status: 403 },
      );
    if (
      Number(request.headers.get('content-length') || 0) >
      5 * 1024 * 1024 + 20000
    )
      return Response.json(
        { error: 'Each attachment must be under 5 MB.' },
        { status: 413 },
      );
    const form = await request.formData();
    const file = form.get('file');
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
    )
      return Response.json(
        { error: 'Choose a JPG, PNG, or PDF under 5 MB.' },
        { status: 400 },
      );
    const id = crypto.randomUUID();
    await env.FILES.put(id, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
    await database()
      .prepare(
        'INSERT INTO evidence_uploads (id,owner,name,content_type,size,created) VALUES (?,?,?,?,?,?)',
      )
      .bind(
        id,
        owner,
        file.name.slice(0, 150),
        file.type,
        file.size,
        new Date().toISOString(),
      )
      .run();
    return Response.json({ id, name: file.name });
  } catch (e) {
    console.error('Evidence upload:', (e as Error).message);
    return Response.json(
      { error: 'The evidence could not be uploaded. Please try again.' },
      { status: 500 },
    );
  }
}
export async function GET(request: Request) {
  try {
    const owner = ownerOf(request),
      id = new URL(request.url).searchParams.get('id');
    const metadata = await database()
      .prepare(
        'SELECT id,name,content_type FROM evidence_uploads WHERE id = ? AND owner = ?',
      )
      .bind(id, owner)
      .first<{ id: string; name: string; content_type: string }>();
    if (!metadata) return new Response('Not found', { status: 404 });
    const file = await env.FILES.get(metadata.id);
    if (!file) return new Response('Not found', { status: 404 });
    return new Response(file.body, {
      headers: {
        'Content-Type': metadata.content_type,
        'Content-Disposition': `attachment; filename="evidence-${id}.${metadata.content_type === 'application/pdf' ? 'pdf' : metadata.content_type === 'image/png' ? 'png' : 'jpg'}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }
}
