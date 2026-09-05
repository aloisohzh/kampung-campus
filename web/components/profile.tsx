'use client';
/* oxlint-disable next/no-html-link-for-pages -- Sites owns the native top-level sign-in route. */
import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Sprout,
  Check,
  RefreshCw,
  FileBadge,
  Fingerprint,
  Download,
  Link2,
  Unplug,
  CircleAlert,
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  sourceInfo,
  sampleRecords,
  recordChange,
  type ProfileSource,
  type ImportSource,
  type ResidentProfile,
  type ProfileRecord,
} from '@/lib/profile';
import { date, time, type Run } from '@/lib/presentation';

type ProfileProps = {
  profile?: ResidentProfile;
  run: Run;
  disabled: boolean;
  error: string;
  go: (page: string) => void;
};
const sources: ProfileSource[] = [
  'singpass',
  'linkedin',
  'email',
  'skills',
  'credentials',
];
const logins: ProfileSource[] = ['singpass', 'linkedin', 'email'];
function SourceMark({ source }: { source: ProfileSource }) {
  if (source === 'singpass')
    return <span className="source-mark singpass-mark">S</span>;
  if (source === 'linkedin')
    return <span className="source-mark linkedin-mark">in</span>;
  return (
    <span className="source-mark">
      {source === 'email' ? (
        <Mail size={22} />
      ) : source === 'skills' ? (
        <Download size={22} />
      ) : (
        <FileBadge size={22} />
      )}
    </span>
  );
}
function DemoNote() {
  return (
    <p className="profile-demo-note">
      <ShieldCheck size={17} />
      <span>
        Private pilot demonstration · All provider connections, personal details
        and credentials are samples. No external account is accessed.
      </span>
    </p>
  );
}
function Status({ record }: { record: ProfileRecord }) {
  return (
    <span
      className={`record-status ${record.status.startsWith('Verified') ? 'verified' : record.status === 'Self-reported' ? 'reported' : 'attention'}`}
    >
      {record.status.startsWith('Verified') ? (
        <ShieldCheck size={13} />
      ) : record.status === 'Self-reported' ? (
        <Link2 size={13} />
      ) : (
        <CircleAlert size={13} />
      )}
      {record.status}
    </span>
  );
}

export function Welcome({ profile, run, disabled, error, go }: ProfileProps) {
  const [stage, setStage] = useState<'login' | 'import'>('login');
  const [source, setSource] = useState<ProfileSource | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <main className="welcome-shell">
      <section className="welcome-story">
        <div className="welcome-brand">
          <Sprout size={31} />
          kampung campus.
        </div>
        <div className="welcome-story-copy">
          <span className="eyebrow">A NEIGHBOURHOOD FULL OF POSSIBILITY</span>
          <h1>
            You bring the skills.
            <br />
            We bring the
            <br />
            neighbours.
          </h1>
          <p>
            A little of what you know can mean
            <br />a whole lot to someone nearby.
          </p>
        </div>
        <div className="welcome-caption">
          <span className="live-dot" /> GROWING TOGETHER IN PEK KIO
        </div>
      </section>
      <section className="welcome-form">
        <div className="welcome-top">
          <span>PEK KIO · PRIVATE PILOT</span>
          <button onClick={() => go('discover')}>
            Explore the demo <ArrowRight size={16} />
          </button>
        </div>
        <div className="welcome-inner">
          <ol className="onboarding-steps" aria-label="Profile creation steps">
            <li className={stage === 'login' ? 'current' : 'done'}>
              <span>{stage === 'import' ? <Check size={14} /> : '1'}</span> Sign
              in
            </li>
            <li className={stage === 'import' ? 'current' : ''}>
              <span>2</span> Bring your skills
            </li>
            <li>
              <span>3</span> Your community
            </li>
          </ol>
          {stage === 'login' ? (
            <>
              <span className="eyebrow">GOOD TO HAVE YOU HERE</span>
              <h2>
                Your next chapter
                <br />
                starts with hello.
              </h2>
              <p className="welcome-intro">
                Create a profile with the details you already have. Less form
                filling. More getting involved.
              </p>
              <div className="provider-options">
                {logins.map((id) => (
                  <Button
                    key={id}
                    className={`provider-button provider-${id}`}
                    variant="outline"
                    disabled={disabled}
                    onClick={() => setSource(id)}
                  >
                    <SourceMark source={id} />
                    <span>
                      <strong>
                        Continue with{' '}
                        {id === 'email'
                          ? 'email'
                          : sourceInfo[id].title.split(' /')[0]}
                      </strong>
                      <small>{sourceInfo[id].description}</small>
                    </span>
                    <ArrowRight size={18} />
                  </Button>
                ))}
              </div>
              <p className="welcome-reassurance">
                <Fingerprint size={18} /> Singpass can establish identity.
                Skills and qualifications are checked separately.
              </p>
              <DemoNote />
            </>
          ) : (
            <>
              <button className="back-link" onClick={() => setStage('login')}>
                <ArrowLeft size={15} /> Sign-in methods
              </button>
              <span className="eyebrow">A HEAD START, JUST FOR YOU</span>
              <h2>
                Hello, Mei.
                <br />
                Bring what you know.
              </h2>
              <p className="welcome-intro">
                Your sample profile is filled in. Choose what to bring across,
                then review it before joining in.
              </p>
              <div className="prefilled-profile">
                <span className="avatar">ML</span>
                <div>
                  <strong>{profile?.name}</strong>
                  <small>
                    {profile?.email} · {profile?.neighbourhood}
                  </small>
                </div>
                <span className="record-status">
                  {profile?.identity.status === 'Verified · demo'
                    ? 'Identity verified · demo'
                    : 'Identity unverified'}
                </span>
              </div>
              <div className="setup-imports">
                {(['skills', 'credentials'] as ImportSource[]).map((id) => (
                  <button
                    key={id}
                    className="setup-import"
                    disabled={disabled}
                    onClick={() => setSource(id)}
                  >
                    <SourceMark source={id} />
                    <span>
                      <strong>{sourceInfo[id].title}</strong>
                      <small>
                        {profile?.connections.some((c) => c.source === id)
                          ? `${profile.records.filter((r) => r.source === id).length} records imported · review updates`
                          : sourceInfo[id].description}
                      </small>
                    </span>
                    {profile?.connections.some((c) => c.source === id) ? (
                      <Check size={20} />
                    ) : (
                      <ArrowRight size={20} />
                    )}
                  </button>
                ))}
              </div>
              <label className="profile-consent" htmlFor="profile-confirm">
                <Checkbox
                  id="profile-confirm"
                  checked={confirmed}
                  onCheckedChange={(value) => setConfirmed(value === true)}
                />
                <span>
                  I have reviewed these sample details. I can manage imported
                  records in My profile.
                </span>
              </label>
              <Button
                className="primary-button finish-profile"
                disabled={disabled || !confirmed}
                onClick={async () => {
                  if (await run('profileComplete', { confirm: confirmed }))
                    go('profile');
                }}
              >
                Create my demo profile <ArrowRight size={18} />
              </Button>
              <p className="quiet-copy">
                Imports are optional. You can connect more sources later.
              </p>
              <DemoNote />
            </>
          )}
          {disabled && !error && (
            <output className="quiet-copy">
              Loading or saving your private sandbox…
            </output>
          )}
          {error && (
            <div className="notice error" role="alert">
              {error}
              {error.includes('Sign in with ChatGPT') && (
                <a
                  href="/signin-with-chatgpt?return_to=%2F%23welcome"
                  target="_top"
                >
                  Open private pilot access
                </a>
              )}
            </div>
          )}
        </div>
      </section>
      {source && (
        <ConnectDialog
          key={source}
          source={source}
          profile={profile}
          run={run}
          disabled={disabled}
          error={error}
          close={() => setSource(null)}
          onSaved={() => {
            if (logins.includes(source)) setStage('import');
          }}
        />
      )}
    </main>
  );
}

export function ProfilePage({
  profile,
  run,
  disabled,
  error,
  go,
}: ProfileProps) {
  const [source, setSource] = useState<ProfileSource | null>(null);
  const [disconnect, setDisconnect] = useState<ProfileSource | null>(null);
  if (!profile)
    return (
      <section className="profile-empty">
        <Fingerprint size={42} />
        <h2>A profile that starts with you.</h2>
        <p>
          Try Singpass or LinkedIn sign-in, then bring in sample skills,
          certifications and accreditations with a few clicks.
        </p>
        <Button
          className="primary-button"
          disabled={disabled}
          onClick={() => go('welcome')}
        >
          Create your demo profile <ArrowRight size={17} />
        </Button>
        <DemoNote />
      </section>
    );
  const skills = profile.records.filter((r) => r.kind === 'Skill');
  const credentials = profile.records.filter((r) => r.kind !== 'Skill');
  const verified = credentials.filter(
    (r) => r.status === 'Verified · demo',
  ).length;
  return (
    <div className="profile-layout">
      <div className="profile-main-column">
        <section className="resident-profile-card">
          <div className="profile-cover">
            <Sprout size={58} strokeWidth={1} />
            <span>EVERY NEIGHBOUR HAS SOMETHING TO GIVE.</span>
          </div>
          <div className="resident-profile-body">
            <span className="avatar profile-avatar">ML</span>
            <div className="resident-profile-heading">
              <div>
                <h2>{profile.name}</h2>
                <p>
                  {profile.neighbourhood} neighbour · {profile.email}
                </p>
              </div>
              <span
                className={`record-status ${profile.identity.status === 'Verified · demo' ? 'verified' : 'reported'}`}
              >
                <ShieldCheck size={15} />
                Identity {profile.identity.status.toLowerCase()}
              </span>
            </div>
            <p className="quiet-copy">
              Prefilled sample details · Last demo sign-in with{' '}
              {sourceInfo[profile.login.provider].title}.{' '}
              {profile.identity.checkedAt
                ? `Identity checked ${date(profile.identity.checkedAt)}.`
                : 'Connect Singpass to demonstrate identity verification.'}
            </p>
            <div className="profile-stats">
              <div>
                <b>{skills.length}</b>
                <span>skills to share</span>
              </div>
              <div>
                <b>{verified}</b>
                <span>valid demo credentials</span>
              </div>
              <div>
                <b>{profile.connections.length}</b>
                <span>connected sources</span>
              </div>
            </div>
          </div>
        </section>
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <span className="eyebrow">WHAT YOU BRING</span>
              <h2>Skills worth sharing</h2>
            </div>
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => setSource('skills')}
            >
              <Download size={16} />
              {skills.length ? 'Review import' : 'Import skills'}
            </Button>
          </div>
          {skills.length ? (
            <>
              <div className="skill-chips">
                {skills.map((r) => (
                  <span key={r.id}>
                    <Sprout size={15} />
                    {r.title}
                  </span>
                ))}
              </div>
              <p className="quiet-copy">
                Imported from a sample professional profile export ·
                Self-reported, not verified qualifications.
              </p>
            </>
          ) : (
            <p className="quiet-copy">
              Bring in several skills together. There’s no need to type each
              one.
            </p>
          )}
        </section>
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <span className="eyebrow">A LITTLE MORE CONFIDENCE</span>
              <h2>Credentials & accreditations</h2>
            </div>
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => setSource('credentials')}
            >
              <FileBadge size={16} />
              {credentials.length
                ? 'Recheck credentials'
                : 'Import credentials'}
            </Button>
          </div>
          {credentials.length ? (
            <div className="credential-list">
              {credentials.map((r) => (
                <article className="credential-record" key={r.id}>
                  <span className="credential-icon">
                    <FileBadge size={23} />
                  </span>
                  <div>
                    <span className="credential-kind">{r.kind}</span>
                    <h3>{r.title}</h3>
                    <p>{r.issuer}</p>
                    <small>
                      {r.reference} · Expires {r.expires}
                    </small>
                    <p className="credential-check">
                      {r.status === 'Verified · demo'
                        ? 'Sample checks passed: document integrity, issuer, holder match and validity.'
                        : r.status === 'Revoked · demo'
                          ? 'Sample issuer has revoked this credential. It no longer counts as valid.'
                          : 'Sample credential has expired. It does not count as valid.'}
                    </p>
                  </div>
                  <Status record={r} />
                </article>
              ))}
            </div>
          ) : (
            <p className="quiet-copy">
              Import sample issuer records and see which are valid, expired or
              revoked.
            </p>
          )}
        </section>
        <section className="profile-next">
          <Sprout size={29} />
          <div>
            <h3>Put your skills to good use.</h3>
            <p>Find a gathering where a little of what you know can help.</p>
          </div>
          <Button className="primary-button" onClick={() => go('discover')}>
            Explore activities <ArrowRight size={16} />
          </Button>
        </section>
      </div>
      <aside className="profile-source-column">
        <section className="profile-section">
          <span className="eyebrow">LESS TYPING. MORE YOU.</span>
          <h2>Your connected sources</h2>
          <p className="quiet-copy">
            Review each import. Keep control of what is shared.
          </p>
          <div className="source-list">
            {sources.map((id) => {
              const connection = profile.connections.find(
                (c) => c.source === id,
              );
              return (
                <div className="connected-source" key={id}>
                  <div className="source-title">
                    <SourceMark source={id} />
                    <div>
                      <h3>{sourceInfo[id].title}</h3>
                      <small>
                        {connection
                          ? `Last synced ${date(connection.lastSynced)}, ${time(connection.lastSynced)}`
                          : sourceInfo[id].description}
                      </small>
                    </div>
                  </div>
                  <div className="source-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      onClick={() => setSource(id)}
                    >
                      {connection ? (
                        <RefreshCw size={14} />
                      ) : (
                        <Link2 size={14} />
                      )}
                      {connection
                        ? id === 'skills' || id === 'credentials'
                          ? 'Check for updates'
                          : 'Review connection'
                        : 'Connect sample'}
                    </Button>
                    {connection && (
                      <button
                        className="disconnect-button"
                        disabled={disabled}
                        aria-label={`Disconnect ${sourceInfo[id].title}`}
                        onClick={() => setDisconnect(id)}
                      >
                        <Unplug size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="quiet-copy sync-explainer">
            Try a second sync: the skills sample adds a new skill; the
            credential sample revokes one certificate. Repeated syncs do not
            create duplicates.
          </p>
        </section>
        <section className="profile-trust">
          <ShieldCheck size={27} />
          <h3>Know what “verified” means.</h3>
          <p>
            Identity, self-reported skills and issuer-backed qualifications are
            different signals. Every badge here shows its source and demo
            status.
          </p>
          <p>
            Imported credentials do not automatically grant community roles or
            credits.
          </p>
        </section>
        <Button variant="outline" onClick={() => go('welcome')}>
          Try another sign-in method <ArrowRight size={15} />
        </Button>
        <DemoNote />
      </aside>
      {source && (
        <ConnectDialog
          key={source}
          source={source}
          profile={profile}
          run={run}
          disabled={disabled}
          error={error}
          close={() => setSource(null)}
        />
      )}
      <AlertDialog
        open={!!disconnect}
        onOpenChange={(open) => {
          if (!open && !disabled) setDisconnect(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect {disconnect ? sourceInfo[disconnect].title : 'source'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the connection, its consent and imported records from
              this profile. Disconnecting Singpass also removes the demo
              identity badge. Your activity history and pilot action audit
              remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="notice error">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disabled}>
              Keep connected
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={disabled}
              onClick={async () => {
                if (
                  disconnect &&
                  (await run('profileDisconnect', { source: disconnect }))
                )
                  setDisconnect(null);
              }}
            >
              Disconnect and remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ConnectDialog({
  source,
  profile,
  run,
  disabled,
  error,
  close,
  onSaved,
}: Omit<ProfileProps, 'go'> & {
  source: ProfileSource;
  close: () => void;
  onSaved?: () => void;
}) {
  const importing = source === 'skills' || source === 'credentials';
  const revision = profile?.connections.some((c) => c.source === source)
    ? 2
    : 1;
  const records = importing ? sampleRecords(source, revision) : [];
  const [selected, setSelected] = useState<string[]>(() =>
    records.map((r) => r.id),
  );
  const [consent, setConsent] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !disabled) close();
      }}
    >
      <DialogContent className="profile-connect-dialog">
        <div className="connect-heading">
          <SourceMark source={source} />
          <span className="pill">SAMPLE CONNECTION</span>
        </div>
        <DialogTitle>
          {importing
            ? 'Review before you import'
            : `Continue with ${sourceInfo[source].title}`}
        </DialogTitle>
        <DialogDescription>{sourceInfo[source].detail}</DialogDescription>
        {importing ? (
          <>
            <div className="import-preview">
              {records.map((r) => {
                const previous = profile?.records.find((p) => p.id === r.id);
                return (
                  <label
                    className="import-preview-row"
                    key={r.id}
                    htmlFor={`import-${r.id}`}
                  >
                    <Checkbox
                      id={`import-${r.id}`}
                      checked={selected.includes(r.id)}
                      disabled={disabled || !!previous}
                      onCheckedChange={(checked) =>
                        setSelected((ids) =>
                          checked
                            ? [...ids, r.id]
                            : ids.filter((id) => id !== r.id),
                        )
                      }
                    />
                    <span>
                      <span className="credential-kind">
                        {r.kind} · {recordChange(r, previous)}
                      </span>
                      <strong>{r.title}</strong>
                      <small>{r.issuer}</small>
                      <Status record={r} />
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="quiet-copy">
              {profile?.records.some((r) => r.source === source)
                ? 'Existing records stay selected so changes to their validity are always included.'
                : 'Choose the records you want to keep. You can disconnect this source later.'}
            </p>
          </>
        ) : (
          <div className="consent-details">
            <span className="eyebrow">DETAILS READY TO PREFILL</span>
            <dl>
              <div>
                <dt>Name</dt>
                <dd>Mei Lin</dd>
              </div>
              <div>
                <dt>{source === 'singpass' ? 'Neighbourhood' : 'Email'}</dt>
                <dd>
                  {source === 'singpass' ? 'Pek Kio' : 'mei.lin@example.com'}
                </dd>
              </div>
              <div>
                <dt>Identity</dt>
                <dd>
                  {source === 'singpass'
                    ? 'Verified · simulated result'
                    : 'Not verified by this method'}
                </dd>
              </div>
            </dl>
            <p>
              {source === 'singpass'
                ? 'No NRIC, birth date, Singpass password or real identity document is collected.'
                : source === 'linkedin'
                  ? 'Skills and credentials can be brought in separately after sign-in.'
                  : 'Use the sample email link result. No address or code entry is needed in this demo.'}
            </p>
          </div>
        )}
        <label className="profile-consent" htmlFor="source-consent">
          <Checkbox
            id="source-consent"
            checked={consent}
            disabled={disabled}
            onCheckedChange={(checked) => setConsent(checked === true)}
          />
          <span>
            {importing
              ? 'I consent to saving and rechecking these selected sample records in my private pilot profile.'
              : 'I consent to using these sample details to create or connect my demo profile.'}
          </span>
        </label>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <div className="connect-footer">
          <Button variant="outline" disabled={disabled} onClick={close}>
            Cancel
          </Button>
          <Button
            className="primary-button"
            disabled={
              disabled || !consent || (importing && selected.length === 0)
            }
            onClick={async () => {
              const ok = await run(
                importing ? 'profileImport' : 'profileLogin',
                { source, consent, selected, revision, key },
              );
              if (ok) {
                onSaved?.();
                close();
              }
            }}
          >
            {disabled
              ? 'Saving…'
              : importing
                ? `Save ${selected.length} selected records`
                : source === 'email'
                  ? 'Use sample email link'
                  : 'Confirm demo connection'}
            <ArrowRight size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
