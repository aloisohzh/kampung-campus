import {
  aiConfig,
  aiJson,
  aiFailure,
  plannerOwner,
  consumeAi,
  fail,
} from '@/lib/ai-server';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const { owner } = await plannerOwner(request, true);
    const config = aiConfig();
    if (!config.OPENAI_API_KEY) fail('Voice input is not connected yet.', 503);
    if (Number(request.headers.get('content-length') || 0) > 11 * 1024 * 1024)
      fail('Record a shorter message.', 413);
    const form = await request.formData(),
      file = form.get('file');
    if (
      !(file instanceof File) ||
      file.size < 100 ||
      file.size > 10 * 1024 * 1024 ||
      ![
        'audio/webm',
        'video/webm',
        'audio/mp4',
        'video/mp4',
        'audio/mpeg',
        'audio/wav',
      ].includes(file.type.split(';')[0])
    )
      fail('Use a supported recording under 10 MB.');
    await consumeAi(owner, 'voice', 15);
    const input = new FormData();
    input.set('file', file);
    input.set('model', 'gpt-4o-mini-transcribe');
    input.set('response_format', 'json');
    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + config.OPENAI_API_KEY },
        body: input,
        signal: AbortSignal.timeout(45000),
      },
    );
    if (!response.ok) {
      await response.text();
      fail(
        'Voice transcription is unavailable. You can type your message or try again.',
        502,
      );
    }
    const result = (await response.json()) as { text?: string };
    if (!result.text?.trim())
      fail('No speech was detected. Try again closer to the microphone.', 422);
    return aiJson({ text: result.text.slice(0, 4000) });
  } catch (e) {
    return aiFailure(e);
  }
}
