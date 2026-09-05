'use client';
import { useRef, useState } from 'react';
import { Upload, FileText, FileBadge, Check, Download, X } from 'lucide-react';
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
import { exampleCV, type ProfileDocument } from '@/lib/profile-details';
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
    if (selectedKind !== 'CV / résumé') return;
    setWorking(true);
    try {
      const result = await readCV(normalized);
      if (token !== generation.current) return;
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
          <h3>Your documents</h3>
          <p className="quiet-copy">
            Keep a CV, certificates and accreditations together.
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
            Add your own document or try the example CV to review suggested
            skills.
          </p>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => {
              reset();
              setKind('CV / résumé');
              setOpen(true);
              void selectFile(
                new File([exampleCV], 'Mei-Lin-example-CV.txt', {
                  type: 'text/plain',
                }),
                'CV / résumé',
              );
            }}
          >
            Try an example CV
          </Button>
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
          <DialogTitle>Bring your experience along</DialogTitle>
          <DialogDescription>
            Files are saved to your account after review. Skill suggestions are
            self-reported; certificate uploads await verification.
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
          {kind === 'CV / résumé' && !file && (
            <Button
              variant="outline"
              disabled={working || disabled}
              onClick={() =>
                void selectFile(
                  new File([exampleCV], 'Mei-Lin-example-CV.txt', {
                    type: 'text/plain',
                  }),
                )
              }
            >
              Use example CV
            </Button>
          )}
          {working && (
            <output className="quiet-copy">
              Reading the document for skill suggestions…
            </output>
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
