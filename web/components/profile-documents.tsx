'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  FileBadge,
  Check,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { type ProfileDocument } from '@/lib/profile-details';
import { emptyExtraction, type DocumentExtraction } from '@/lib/profile-career';
import { CareerEditor } from './career-editor';
import { readCV } from '@/lib/document-reader';
import type { ResidentProfile } from '@/lib/profile';
import { date, type Run } from '@/lib/presentation';

const mimeTypes: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};
export function ProfileDocuments({
  profile,
  run,
  disabled,
}: {
  profile: ResidentProfile;
  run: Run;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ProfileDocument['kind']>('CV / résumé');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [expires, setExpires] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [extraction, setExtraction] =
    useState<DocumentExtraction>(emptyExtraction);
  const [text, setText] = useState('');
  const [aiAvailable, setAiAvailable] = useState(false);
  const [method, setMethod] = useState<'text' | 'ai'>('text');
  useEffect(() => {
    if (open)
      void fetch('/api/profile-extract')
        .then((response) => response.json())
        .then((data) =>
          setAiAvailable((data as { available?: boolean }).available === true),
        )
        .catch(() => setAiAvailable(false));
  }, [open]);
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const generation = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const selectFile = async (next: File, selectedKind = kind) => {
    const token = ++generation.current;
    const extension = next.name.split('.').at(-1)?.toLowerCase() ?? '';
    const type = mimeTypes[extension];
    if (
      !type ||
      next.size === 0 ||
      next.size > 5 * 1024 * 1024 ||
      (selectedKind === 'CV / résumé' &&
        !['pdf', 'docx', 'txt'].includes(extension))
    ) {
      setError(
        'Choose a supported file under 5 MB. CVs can be PDF, DOCX or TXT.',
      );
      return;
    }
    const normalized = new File([next], next.name, { type });
    setFile(normalized);
    setUploadId(null);
    setTitle(next.name.replace(/\.[^.]+$/, ''));
    setError('');
    setConsent(false);
    setSkills([]);
    setSuggestions([]);
    setNote('');
    setExtraction(emptyExtraction());
    setText('');
    setMethod('text');
    if (['jpg', 'jpeg', 'png'].includes(extension)) {
      setNote(
        'Use AI extraction to read a scanned document, or enter its details below.',
      );
      return;
    }
    setWorking(true);
    try {
      const result = await readCV(normalized);
      if (token !== generation.current) return;
      setText(result.text);
      setSuggestions(result.skills);
      setSkills(result.skills);
      setNote(result.note);
    } catch {
      if (token === generation.current)
        setNote(
          'We could not read text from this file. You can save it and add skills in Profile setup.',
        );
    } finally {
      if (token === generation.current) setWorking(false);
    }
  };
  const reset = () => {
    generation.current++;
    setExtraction(emptyExtraction());
    setText('');
    setMethod('text');
    setFile(null);
    setUploadId(null);
    setTitle('');
    setIssuer('');
    setExpires('');
    setSkills([]);
    setSuggestions([]);
    setNote('');
    setError('');
    setConsent(false);
    if (input.current) input.current.value = '';
  };
  return (
    <section className="document-manager">
      <div className="profile-section-heading">
        <div>
          <h2>CV & credentials</h2>
          <p className="quiet-copy">
            Upload once, review the details, and strengthen your profile.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          <Upload size={16} />
          Upload document
        </Button>
      </div>
      {!profile.documents?.length && (
        <div className="document-empty">
          <FileText size={28} />
          <p>
            Add a CV, résumé, certificate or accreditation. Review extracted
            skills and experience before they appear in your profile.
          </p>
        </div>
      )}
      <div className="document-list">
        {profile.documents?.map((document) => (
          <article className="document-row" key={document.id}>
            {document.kind === 'CV / résumé' ? (
              <FileText size={24} />
            ) : (
              <FileBadge size={24} />
            )}
            <div>
              <h4>{document.title}</h4>
              <p>
                {document.kind} · {document.issuer || document.name}
              </p>
              <small>
                Added {date(document.addedAt)}
                {document.expires ? ' · Expires ' + document.expires : ''}
              </small>
              <span className="record-status reported">{document.status}</span>
              {!!document.skills.length && (
                <p>{document.skills.length} reviewed skill suggestions</p>
              )}
            </div>
            <a
              className="document-download"
              href={'/api/evidence?id=' + encodeURIComponent(document.id)}
              aria-label={'Download ' + document.title}
            >
              <Download size={18} />
            </a>
          </article>
        ))}
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!working && !disabled) setOpen(value);
        }}
      >
        <DialogContent className="profile-connect-dialog">
          <DialogTitle>Upload, review & add to profile</DialogTitle>
          <DialogDescription>
            Review suggested details before saving. AI analysis reads your
            document to suggest skills, experience and education; it does not
            verify a qualification.
          </DialogDescription>
          <label className="field-label" htmlFor="document-type">
            Document type
          </label>
          <Select
            value={kind}
            disabled={working || disabled}
            onValueChange={(value) => {
              if (value) {
                reset();
                setKind(value as ProfileDocument['kind']);
              }
            }}
          >
            <SelectTrigger id="document-type" aria-label="Document type">
              <SelectValue>{kind}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {['CV / résumé', 'Certification', 'Accreditation'].map(
                (value) => (
                  <SelectItem value={value} key={value}>
                    {value}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <label className="upload-control">
            <Upload size={22} />
            <strong>{file?.name ?? 'Choose a document'}</strong>
            <span>
              {kind === 'CV / résumé'
                ? 'PDF, DOCX or TXT'
                : 'PDF, DOCX, TXT, JPG or PNG'}{' '}
              · up to 5 MB
            </span>
            <input
              ref={input}
              type="file"
              disabled={working || disabled}
              accept={
                kind === 'CV / résumé'
                  ? '.pdf,.docx,.txt'
                  : '.pdf,.docx,.txt,.jpg,.jpeg,.png'
              }
              onChange={(e) => {
                if (e.target.files?.[0]) void selectFile(e.target.files[0]);
              }}
            />
          </label>

          {working && (
            <output className="quiet-copy">Reading your document…</output>
          )}
          {file && (
            <div className="document-ai-action">
              <div>
                <strong>Let AI fill in the details</strong>
                <p className="quiet-copy">
                  Send this document to OpenAI to extract skills, experience,
                  education and certificate details for your review.
                </p>
              </div>
              <Button
                variant="outline"
                disabled={working || disabled || !aiAvailable}
                onClick={async () => {
                  if (!file) return;
                  setWorking(true);
                  setError('');
                  try {
                    const body = new FormData();
                    body.append('file', file);
                    body.append('text', text);
                    body.append('kind', kind);
                    body.append('consent', 'true');
                    const response = await fetch('/api/profile-extract', {
                      method: 'POST',
                      body,
                    });
                    const data = (await response.json()) as {
                      extraction?: DocumentExtraction;
                      error?: string;
                    };
                    if (!response.ok || !data.extraction)
                      throw new Error(
                        data.error ||
                          'Analysis could not finish. Please retry.',
                      );
                    const result = data.extraction;
                    setExtraction(result);
                    setTitle(result.title || title);
                    setIssuer(result.issuer);
                    setExpires(result.expires);
                    setSuggestions(result.skills);
                    setSkills(result.skills);
                    setMethod('ai');
                    setConsent(false);
                    setNote(
                      'AI-extracted suggestions. Review and correct them before saving.',
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setWorking(false);
                  }
                }}
              >
                <Sparkles size={16} />
                {working ? 'Reading…' : 'Extract with AI'}
              </Button>
              {!aiAvailable && (
                <small>
                  AI analysis is not available right now. Text-based suggestions
                  and uploads still work.
                </small>
              )}
            </div>
          )}
          {file && (
            <div className="details-form">
              <label>
                Document title
                <input
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              {kind !== 'CV / résumé' && (
                <>
                  <label>
                    Issuing organisation
                    <input
                      value={issuer}
                      maxLength={120}
                      onChange={(e) => setIssuer(e.target.value)}
                      placeholder="As shown on the certificate"
                    />
                  </label>
                  <label>
                    Expiry date, if any
                    <input
                      type="date"
                      value={expires}
                      onChange={(e) => setExpires(e.target.value)}
                    />
                  </label>
                </>
              )}
              {method === 'ai' && (
                <>
                  <div className="extracted-identity">
                    <strong>Found in this document</strong>
                    <p>
                      {[extraction.name, extraction.email]
                        .filter(Boolean)
                        .join(' · ') || 'No personal details found'}
                    </p>
                    <small>Your sign-in details stay unchanged.</small>
                  </div>
                  <label>
                    Professional headline
                    <input
                      maxLength={160}
                      value={extraction.headline}
                      onChange={(e) =>
                        setExtraction({
                          ...extraction,
                          headline: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Professional summary
                    <textarea
                      rows={3}
                      maxLength={1200}
                      value={extraction.summary}
                      onChange={(e) =>
                        setExtraction({
                          ...extraction,
                          summary: e.target.value,
                        })
                      }
                    />
                  </label>
                  <CareerEditor
                    title="Work & volunteering"
                    entries={extraction.experience}
                    onChange={(experience) =>
                      setExtraction({ ...extraction, experience })
                    }
                  />
                  <CareerEditor
                    title="Education"
                    entries={extraction.education}
                    onChange={(education) =>
                      setExtraction({ ...extraction, education })
                    }
                  />
                </>
              )}
              {!!suggestions.length && (
                <fieldset>
                  <legend>Review suggested skills</legend>
                  <div className="interest-options">
                    {suggestions.map((skill) => (
                      <label key={skill}>
                        <Checkbox
                          checked={skills.includes(skill)}
                          onCheckedChange={(checked) =>
                            setSkills((current) =>
                              checked
                                ? [...current, skill]
                                : current.filter((s) => s !== skill),
                            )
                          }
                        />
                        {skill}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              {note && <p className="quiet-copy">{note}</p>}
              <label className="profile-consent">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(value) => setConsent(value === true)}
                />
                <span>
                  I have reviewed this document and want to save it
                  {skills.length ? ' and the selected skills' : ''} to my
                  profile.
                </span>
              </label>
            </div>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <div className="connect-footer">
            <Button
              variant="outline"
              disabled={working || disabled}
              onClick={() => setOpen(false)}
            >
              <X size={16} />
              Cancel
            </Button>
            <Button
              className="primary-button"
              disabled={
                !file ||
                !consent ||
                title.trim().length < 2 ||
                working ||
                disabled
              }
              onClick={async () => {
                if (!file) return;
                setWorking(true);
                setError('');
                try {
                  let id = uploadId;
                  if (!id) {
                    const body = new FormData();
                    body.append('file', file);
                    const response = await fetch('/api/evidence', {
                      method: 'POST',
                      body,
                    });
                    const data = (await response.json()) as {
                      id?: string;
                      error?: string;
                    };
                    if (!response.ok || !data.id)
                      throw new Error(
                        data.error || 'Upload failed. Please try again.',
                      );
                    id = data.id;
                    setUploadId(id);
                  }
                  if (
                    await run('profileAttach', {
                      uploadId: id,
                      kind,
                      title,
                      issuer,
                      expires,
                      skills,
                      extraction:
                        method === 'ai'
                          ? { ...extraction, skills, title, issuer, expires }
                          : undefined,
                      extractionMethod: method,
                    })
                  )
                    setOpen(false);
                  else
                    setError(
                      'Your file uploaded, but the profile could not be saved. Try saving again.',
                    );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setWorking(false);
                }
              }}
            >
              <Check size={16} />
              {working ? 'Saving…' : 'Save to profile'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
