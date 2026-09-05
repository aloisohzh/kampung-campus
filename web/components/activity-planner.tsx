'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  ArrowUp,
  Paperclip,
  Mic,
  Square,
  X,
  FileText,
  Plus,
  Volume2,
  Check,
  LoaderCircle,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  categories,
  draftReady,
  type PlannerChat,
  type ActivityDraft,
} from '@/lib/activity-ai';
import type { Actor } from '@/lib/model';
import type { Run } from '@/lib/presentation';
import { readCV } from '@/lib/document-reader';
type ApiResult = {
  error?: string;
  chat: PlannerChat;
  available: boolean;
  id: string;
  text: string;
};
type Attachment = { id: string; name: string; text: string; size: number };
export function ActivityPlanner({
  town,
  actor,
  run,
  disabled,
}: {
  town: string;
  actor: Actor;
  run: Run;
  disabled: boolean;
}) {
  const [chat, setChat] = useState<PlannerChat | null>(null),
    [draft, setDraft] = useState<ActivityDraft | null>(null);
  const [available, setAvailable] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]),
    [recording, setRecording] = useState(false),
    [seconds, setSeconds] = useState(0),
    [transcribing, setTranscribing] = useState(false),
    [micPending, setMicPending] = useState(false);
  const [review, setReview] = useState(false),
    [resetConfirm, setResetConfirm] = useState(false),
    [agreed, setAgreed] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setInterval> | null>(null),
    mounted = useRef(true),
    controller = useRef<AbortController | null>(null),
    input = useRef<HTMLInputElement>(null),
    bottom = useRef<HTMLDivElement>(null);
  const blocked = busy || disabled || recording || transcribing || micPending;
  async function load() {
    setError('');
    try {
      const r = await fetch('/api/activity-planner');
      const data = (await r.json()) as ApiResult;
      if (!r.ok) throw new Error(data.error);
      setChat(data.chat);
      setDraft(data.chat.draft);
      setAvailable(data.available);
    } catch (e) {
      setError(
        (e as Error).message || 'Your conversation could not be loaded.',
      );
    }
  }
  useEffect(() => {
    mounted.current = true;
    const initial = setTimeout(() => void load(), 0);
    return () => {
      clearTimeout(initial);
      {
        mounted.current = false;
        controller.current?.abort();
        if (timer.current) clearInterval(timer.current);
        if (recorder.current?.state === 'recording') recorder.current.stop();
        stream.current?.getTracks().forEach((t) => t.stop());
        window.speechSynthesis?.cancel();
      }
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chat?.messages.length, busy]);
  async function post(body: Record<string, unknown>) {
    controller.current = new AbortController();
    const r = await fetch('/api/activity-planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, revision: chat?.revision }),
      signal: controller.current.signal,
    });
    const data = (await r.json()) as ApiResult;
    if (!r.ok) throw new Error(data.error || 'The planner could not respond.');
    setChat(data.chat);
    setDraft(data.chat.draft);
    return data.chat as PlannerChat;
  }
  async function send(message = text) {
    if (blocked || !chat || !message.trim() || chat.submitted || !available)
      return;
    setBusy(true);
    setError('');
    try {
      await post({
        text: message.trim(),
        key: crypto.randomUUID(),
        files: attachments.map(({ id, text }) => ({ id, text })),
      });
      setText('');
      setAttachments([]);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function attach(files: FileList | null) {
    if (!files?.length || blocked) return;
    setError('');
    setBusy(true);
    const chosen = [...files];
    let staged = [...attachments];
    try {
      if (chosen.length + staged.length > 3)
        throw new Error('Attach up to three files per message.');
      for (const file of chosen) {
        if (
          file.size > 5 * 1024 * 1024 ||
          staged.reduce((sum, f) => sum + f.size, 0) + file.size >
            10 * 1024 * 1024
        )
          throw new Error(
            'Each file must be under 5 MB; keep the total below 10 MB.',
          );
        const form = new FormData();
        form.set('file', file);
        const r = await fetch('/api/evidence', { method: 'POST', body: form });
        const data = (await r.json()) as ApiResult;
        if (!r.ok) throw new Error(data.error);
        const content = await readCV(file);
        staged = [
          ...staged,
          {
            id: data.id,
            name: file.name,
            text: content.text.slice(0, 20000),
            size: file.size,
          },
        ];
        setAttachments(staged);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }
  async function startVoice() {
    if (blocked) return;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setError(
        'Voice recording is unavailable in this browser. You can type your message.',
      );
      return;
    }
    setError('');
    setMicPending(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(
        (type) => MediaRecorder.isTypeSupported(type),
      );
      if (!mime)
        throw new Error(
          'This browser does not support a compatible recording format.',
        );
      const rec = new MediaRecorder(media, { mimeType: mime });
      recorder.current = rec;
      const chunks: Blob[] = [];
      let size = 0;
      rec.ondataavailable = (e) => {
        if (e.data.size) {
          chunks.push(e.data);
          size += e.data.size;
          if (size > 9 * 1024 * 1024 && rec.state === 'recording') rec.stop();
        }
      };
      rec.onerror = () => {
        setError('Recording was interrupted. Please try again.');
        if (rec.state === 'recording') rec.stop();
      };
      rec.onstop = async () => {
        if (timer.current) clearInterval(timer.current);
        media.getTracks().forEach((t) => t.stop());
        recorder.current = null;
        stream.current = null;
        if (!mounted.current) return;
        setRecording(false);
        setTranscribing(true);
        try {
          const file = new File(
            chunks,
            mime.includes('mp4') ? 'voice.mp4' : 'voice.webm',
            { type: mime.split(';')[0] },
          );
          const form = new FormData();
          form.set('file', file);
          const r = await fetch('/api/activity-voice', {
            method: 'POST',
            body: form,
          });
          const data = (await r.json()) as ApiResult;
          if (!r.ok) throw new Error(data.error);
          if (mounted.current)
            setText((previous) => (previous ? previous + ' ' : '') + data.text);
        } catch (e) {
          if (mounted.current) setError((e as Error).message);
        } finally {
          if (mounted.current) setTranscribing(false);
        }
      };
      rec.start(1000);
      setRecording(true);
      setSeconds(0);
      let elapsed = 0;
      timer.current = setInterval(() => {
        elapsed++;
        setSeconds(elapsed);
        if (elapsed >= 60 && rec.state === 'recording') rec.stop();
      }, 1000);
    } catch (e) {
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setError(
        (e as Error).name === 'NotAllowedError'
          ? 'Microphone access was declined. Allow it in your browser or type your message.'
          : (e as Error).message,
      );
    } finally {
      setMicPending(false);
    }
  }
  const patch = (key: keyof ActivityDraft, value: string | number) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  return (
    <div className="planner-layout">
      <section className="planner-chat panel">
        <div className="planner-toolbar">
          <div>
            <span className="planner-avatar">
              <Sparkles size={19} />
            </span>
            <div>
              <strong>Kampung assistant</strong>
              <small>
                <MapPin size={12} /> {town}
              </small>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={blocked || !chat}
            onClick={() => setResetConfirm(true)}
          >
            <Plus size={16} />
            New activity
          </Button>
        </div>
        <div
          className="planner-messages"
          role="log"
          aria-label="Activity planning conversation"
          aria-live="polite"
        >
          {!chat?.messages.length && (
            <div className="planner-welcome">
              <span className="planner-flower">
                <Sparkles size={28} />
              </span>
              <h2>
                What shall we bring
                <br />
                the neighbourhood together for?
              </h2>
              <p>
                A walk, a workshop, something entirely new.
                <br />
                Start with a thought. We’ll work out the details together.
              </p>
              <div className="planner-starters">
                {[
                  'A beginner-friendly gardening workshop',
                  'A weekend walk with neighbours',
                  'Share my cooking skills with a small group',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    disabled={blocked || !chat || !available}
                    onClick={() => void send(prompt)}
                  >
                    {prompt}
                    <ArrowUp size={15} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat?.messages.map((m) => (
            <article key={m.id} className={'planner-message ' + m.role}>
              <span className="eyebrow">
                {m.role === 'user' ? 'YOU' : 'KAMPUNG ASSISTANT'}
              </span>
              <p>{m.text}</p>
              {m.files?.map((f) => (
                <a
                  className="planner-file"
                  href={'/api/evidence?id=' + encodeURIComponent(f.id)}
                  key={f.id}
                >
                  <FileText size={14} />
                  {f.name}
                </a>
              ))}
              {m.role === 'assistant' && (
                <button
                  className="planner-read"
                  aria-label="Read response aloud"
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      const speech = new SpeechSynthesisUtterance(m.text);
                      speech.lang = 'en-SG';
                      window.speechSynthesis.speak(speech);
                    } else
                      setError('Read-aloud is not supported in this browser.');
                  }}
                >
                  <Volume2 size={15} />
                  Read aloud
                </button>
              )}
            </article>
          ))}
          {busy && (
            <output className="planner-thinking">
              <LoaderCircle className="spin" size={16} />
              Working on your idea…
            </output>
          )}
          <div ref={bottom} />
        </div>
        {error && (
          <div className="notice error" role="alert">
            {error}
            <button onClick={() => void load()}>Reload conversation</button>
          </div>
        )}
        {!available && (
          <p className="notice">
            The AI planner is currently unavailable. Please try again later.
          </p>
        )}
        {chat?.submitted ? (
          <div className="planner-submitted">
            <Check size={20} />
            <div>
              <strong>Proposal sent for review</strong>
              <p>
                An organiser can review and publish it from the Organiser
                workspace.
              </p>
            </div>
          </div>
        ) : (
          <div className="planner-composer">
            <div className="planner-attachments">
              {attachments.map((f) => (
                <span key={f.id}>
                  <FileText size={14} />
                  {f.name}
                  <button
                    disabled={blocked}
                    aria-label={'Remove ' + f.name}
                    onClick={() =>
                      setAttachments((items) =>
                        items.filter((x) => x.id !== f.id),
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <textarea
              aria-label="Message the activity planner"
              placeholder="I’d like to bring my neighbours together for…"
              value={text}
              maxLength={4000}
              disabled={blocked || !available || !chat}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <div className="planner-compose-actions">
              <div>
                <input
                  ref={input}
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={(e) => void attach(e.target.files)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={blocked || !available}
                  aria-label="Attach documents or images"
                  onClick={() => input.current?.click()}
                >
                  <Paperclip size={19} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={recording ? 'recording' : ''}
                  disabled={!recording && (blocked || !available)}
                  aria-label={
                    recording ? 'Stop recording' : 'Record a voice message'
                  }
                  onClick={() =>
                    recording ? recorder.current?.stop() : void startVoice()
                  }
                >
                  {recording ? <Square size={18} /> : <Mic size={19} />}
                </Button>
                <span className="quiet-copy">
                  {recording
                    ? 'Recording ' + seconds + 's / 60s'
                    : transcribing
                      ? 'Transcribing…'
                      : micPending
                        ? 'Opening microphone…'
                        : 'PDF, DOCX, TXT or image'}
                </span>
              </div>
              <Button
                className="planner-send"
                size="icon"
                aria-label="Send message"
                disabled={blocked || !available || !text.trim() || !chat}
                onClick={() => void send()}
              >
                <ArrowUp size={20} />
              </Button>
            </div>
            <p className="planner-privacy">
              Messages and attached files are sent to OpenAI to help plan your
              activity. Review voice transcripts before sending.
            </p>
          </div>
        )}
      </section>
      <aside className="planner-draft panel">
        <span className="eyebrow">YOUR ACTIVITY, TAKING SHAPE</span>
        <h2>{draft?.title || 'A little spark. A shared moment.'}</h2>
        <p>
          {draft?.description ||
            'Your idea becomes a practical plan here as you chat.'}
        </p>
        <dl>
          {[
            ['Town', town],
            ['Category', draft?.category],
            ['Meeting place', draft?.location],
            [
              'When',
              draft?.starts
                ? new Date(draft.starts).toLocaleString('en-SG', {
                    timeZone: 'Asia/Singapore',
                  })
                : '',
            ],
            ['Group size', draft?.title ? draft.capacity + ' neighbours' : ''],
            [
              'Duration',
              draft?.title ? draft.durationMinutes + ' minutes' : '',
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || 'To be decided'}</dd>
            </div>
          ))}
        </dl>
        <div className="planner-safety">
          <strong>Safety & accessibility</strong>
          <p>
            {draft?.safety ||
              'We’ll include a plan so everyone feels welcome and supported.'}
          </p>
        </div>
        <Button
          className="primary-button"
          disabled={blocked || !draft?.title || chat?.submitted}
          onClick={() => {
            setAgreed(false);
            setReview(true);
          }}
        >
          Review proposal
        </Button>
        <small>
          Check the details before submitting. An organiser reviews and
          publishes each activity.
        </small>
      </aside>
      <Dialog
        open={review}
        onOpenChange={(open) => !blocked && setReview(open)}
      >
        <DialogContent className="planner-review">
          <DialogTitle>Make the plan yours</DialogTitle>
          <DialogDescription>
            Confirm the details and safety plan. Times are in Singapore time.
          </DialogDescription>
          {draft && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!agreed || !draftReady(draft) || !chat) return;
                if (
                  await run('propose', {
                    ...draft,
                    key: 'planner-' + chat.id,
                    plannerId: chat.id,
                    agreed: true,
                  })
                ) {
                  setChat({ ...chat, submitted: true });
                  setReview(false);
                }
              }}
            >
              <div className="planner-review-grid">
                <label>
                  Activity name
                  <input
                    required
                    minLength={5}
                    maxLength={100}
                    value={draft.title}
                    onChange={(e) => patch('title', e.target.value)}
                  />
                </label>
                <label>
                  Category
                  <select
                    required
                    value={draft.category}
                    onChange={(e) => patch('category', e.target.value)}
                  >
                    <option value="">Choose a category</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="wide">
                  What will neighbours do?
                  <textarea
                    required
                    minLength={20}
                    maxLength={2000}
                    value={draft.description}
                    onChange={(e) => patch('description', e.target.value)}
                  />
                </label>
                <label>
                  Meeting place in {town}
                  <input
                    required
                    minLength={4}
                    maxLength={150}
                    value={draft.location}
                    onChange={(e) => patch('location', e.target.value)}
                  />
                </label>
                <label>
                  Start date & time (Singapore)
                  <input
                    required
                    type="datetime-local"
                    value={draft.starts.slice(0, 16)}
                    onChange={(e) =>
                      patch(
                        'starts',
                        e.target.value ? e.target.value + ':00+08:00' : '',
                      )
                    }
                  />
                </label>
                <label>
                  Number of places
                  <input
                    required
                    type="number"
                    min={2}
                    max={50}
                    value={draft.capacity}
                    onChange={(e) => patch('capacity', Number(e.target.value))}
                  />
                </label>
                <label>
                  Duration (minutes)
                  <input
                    required
                    type="number"
                    min={30}
                    max={480}
                    value={draft.durationMinutes}
                    onChange={(e) =>
                      patch('durationMinutes', Number(e.target.value))
                    }
                  />
                </label>
                <label className="wide">
                  Safety, first aid & accessibility
                  <textarea
                    required
                    minLength={20}
                    maxLength={2000}
                    value={draft.safety}
                    onChange={(e) => patch('safety', e.target.value)}
                  />
                </label>
              </div>
              <label className="planner-confirm">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                I have reviewed the details, will confirm the venue, and have
                planned a safe local adult activity without cash or credit
                transfers.
              </label>
              {!draftReady(draft) && (
                <p className="muted">
                  Complete every field, including a future start time and a
                  safety plan.
                </p>
              )}
              <Button
                type="submit"
                className="primary-button"
                disabled={blocked || !agreed || !draftReady(draft)}
              >
                {actor === 'resident'
                  ? 'Submit proposal'
                  : 'Send proposal for publication'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <DialogContent>
          <DialogTitle>Start a new activity?</DialogTitle>
          <DialogDescription>
            This replaces the current planning conversation. Submitted proposals
            remain in your workspace.
          </DialogDescription>
          <div className="row-actions">
            <Button variant="outline" onClick={() => setResetConfirm(false)}>
              Keep planning
            </Button>
            <Button
              disabled={blocked}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await post({ action: 'reset' });
                  setText('');
                  setAttachments([]);
                  setResetConfirm(false);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Start new activity
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
