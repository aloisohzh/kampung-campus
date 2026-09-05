'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import type { Run } from '@/lib/presentation';
export type Field = {
  name: string;
  label: string;
  type?:
    | 'text'
    | 'textarea'
    | 'number'
    | 'datetime-local'
    | 'select'
    | 'checkbox'
    | 'file';
  options?: string[];
  value?: string | boolean;
  min?: number;
  max?: number;
};
export type Action = {
  type: string;
  title: string;
  description: string;
  fields?: Field[];
  payload?: Record<string, unknown>;
  submit?: string;
};
export default function ActionDialog({
  action,
  close,
  run,
  busy,
  serverError,
}: {
  action: Action;
  close: () => void;
  run: Run;
  busy: boolean;
  serverError: string;
}) {
  const [actionKey] = useState(() => crypto.randomUUID());
  const destructive = [
    'cancelBooking',
    'cancelClaim',
    'cancelActivity',
    'refundVoucher',
    'pause',
  ].includes(action.type);
  const Root = destructive ? AlertDialog : Dialog;
  const Content = destructive ? AlertDialogContent : DialogContent;
  const Title = destructive ? AlertDialogTitle : DialogTitle;
  const Description = destructive ? AlertDialogDescription : DialogDescription;
  const [values, setValues] = useState<Record<string, unknown>>(
    Object.fromEntries(
      (action.fields || []).map((f) => [
        f.name,
        f.value ?? (f.type === 'checkbox' ? false : ''),
      ]),
    ),
  );
  const [uploads, setUploads] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const set = (key: string, value: unknown) =>
    setValues((v) => ({ ...v, [key]: value }));
  async function upload(files: FileList | null) {
    if (!files) return;
    setError('');
    if (files.length + uploads.length > 3) {
      setError('Attach up to three evidence files.');
      return;
    }
    setUploading(true);
    try {
      const next: { id: string; name: string }[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append('file', file);
        const r = await fetch('/api/evidence', { method: 'POST', body });
        const data = (await r.json()) as {
          id: string;
          name: string;
          error?: string;
        };
        if (!r.ok) throw new Error(data.error);
        next.push(data);
      }
      setUploads((p) => [...p, ...next]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <Root open onOpenChange={(open) => !open && !busy && !uploading && close()}>
      <Content className="campus-dialog">
        <Title>{action.title}</Title>
        <Description>{action.description}</Description>
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            const payload: Record<string, unknown> = {
              ...action.payload,
              ...values,
              key: actionKey,
            };
            if (typeof payload.starts === 'string' && payload.starts)
              payload.starts = new Date(payload.starts).toISOString();
            if (action.type === 'claim')
              payload.evidence = uploads.map((f) => f.id);
            if (await run(action.type, payload)) close();
            else
              setError(
                'The action could not be completed. Check the message on the page for details.',
              );
          }}
        >
          {action.fields?.map((f) =>
            f.type === 'checkbox' ? (
              <label className="checkbox-label" key={f.name}>
                <Checkbox
                  checked={values[f.name] === true}
                  onCheckedChange={(v) => set(f.name, v)}
                />
                {f.label}
              </label>
            ) : (
              <label key={f.name}>
                {f.label}
                {f.type === 'select' ? (
                  <Select
                    value={String(values[f.name])}
                    onValueChange={(v) => set(f.name, v)}
                  >
                    <SelectTrigger aria-label={f.label}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    required
                    value={String(values[f.name])}
                    minLength={f.min || 5}
                    maxLength={f.max || 2000}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                ) : f.type === 'file' ? (
                  <>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      multiple
                      disabled={uploading}
                      onChange={(e) => upload(e.target.files)}
                    />
                    <span className="caption">
                      JPG, PNG, or PDF · up to 3 files · 5 MB each
                    </span>
                    {uploads.map((u) => (
                      <span className="caption" key={u.id}>
                        {u.name} · attached
                      </span>
                    ))}
                  </>
                ) : (
                  <input
                    required
                    type={f.type || 'text'}
                    value={String(values[f.name])}
                    min={f.type === 'number' ? f.min : undefined}
                    max={f.type === 'number' ? f.max : undefined}
                    minLength={f.type === 'text' ? f.min : undefined}
                    maxLength={f.type === 'text' ? f.max || 200 : undefined}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                )}
              </label>
            ),
          )}
          {(error || serverError) && (
            <p role="alert" className="notice error">
              {serverError || error}
            </p>
          )}
          <Button type="submit" disabled={busy || uploading}>
            {uploading
              ? 'Attaching evidence…'
              : busy
                ? 'Saving…'
                : action.submit || 'Confirm'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy || uploading}
            onClick={close}
          >
            Back
          </Button>
        </form>
      </Content>
    </Root>
  );
}
