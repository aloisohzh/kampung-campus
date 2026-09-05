'use client';
import { X } from 'lucide-react';
import type { CareerEntry } from '@/lib/profile-career';
export function CareerEditor({
  title,
  entries,
  onChange,
}: {
  title: string;
  entries: CareerEntry[];
  onChange: (entries: CareerEntry[]) => void;
}) {
  if (!entries.length) return null;
  const update = (index: number, key: keyof CareerEntry, value: string) =>
    onChange(
      entries.map((entry, i) =>
        i === index ? { ...entry, [key]: value } : entry,
      ),
    );
  return (
    <fieldset className="career-editor">
      <legend>{title}</legend>
      {entries.map((entry, index) => (
        <div className="career-edit-row" key={index}>
          <button
            type="button"
            className="remove-entry"
            aria-label={'Remove ' + entry.title}
            onClick={() => onChange(entries.filter((_, i) => i !== index))}
          >
            <X size={16} />
          </button>
          <label>
            Role or qualification
            <input
              maxLength={160}
              value={entry.title}
              onChange={(e) => update(index, 'title', e.target.value)}
            />
          </label>
          <label>
            Organisation
            <input
              maxLength={160}
              value={entry.organisation}
              onChange={(e) => update(index, 'organisation', e.target.value)}
            />
          </label>
          <label>
            Period
            <input
              maxLength={160}
              value={entry.period}
              onChange={(e) => update(index, 'period', e.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              maxLength={1200}
              rows={2}
              value={entry.description}
              onChange={(e) => update(index, 'description', e.target.value)}
            />
          </label>
        </div>
      ))}
    </fieldset>
  );
}
