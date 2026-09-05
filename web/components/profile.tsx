'use client';
/* oxlint-disable next/no-img-element -- User-supplied local provider logo. */
/* oxlint-disable next/no-html-link-for-pages -- Sites owns the native top-level sign-in route. */
import { useState } from 'react';
import { Brand } from './brand';
import { greeting } from '@/lib/profile-details';
import type { Town } from '@/lib/towns';
import {
  ArrowRight,
  Mail,
  Fingerprint,
  Download,
  FileBadge,
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
  sourceInfo,
  type ProfileSource,
  type LoginProvider,
  type ResidentProfile,
} from '@/lib/profile';
import type { Run } from '@/lib/presentation';
export { ResidentProfilePage as ProfilePage } from './resident-profile';
type ProfileProps = {
  now?: number;
  profile?: ResidentProfile;
  town: Town;
  onTownChange: (town: Town) => void;
  run: Run;
  disabled: boolean;
  error: string;
  go: (page: string) => void;
};
const logins: LoginProvider[] = ['singpass', 'linkedin', 'email'];
export function SourceMark({ source }: { source: ProfileSource }) {
  if (source === 'singpass')
    return (
      <img
        className="source-mark singpass-logo"
        src="/brand/singpass.png"
        alt="Singpass"
        width={48}
        height={36}
      />
    );
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
export function Welcome({
  profile,
  run,
  disabled,
  error,
  go,
  now,
}: ProfileProps) {
  const [source, setSource] = useState<LoginProvider | null>(null);
  const [creating, setCreating] = useState(false);
  return (
    <main className="welcome-shell">
      <section className="welcome-story">
        <div className="welcome-brand">
          <Brand />
        </div>
        <div className="welcome-story-copy">
          <span className="eyebrow">A NEIGHBOURHOOD FULL OF POSSIBILITY</span>
          <h1>
            You bring the skills.
            <br />
            We bring the neighbours.
          </h1>
          <p>
            A little of what you know can mean
            <br />a whole lot to someone nearby.
          </p>
        </div>
        <div className="welcome-illustration" aria-hidden="true" />
        <div className="welcome-caption">
          <span className="live-dot" />
          GROWING TOGETHER ACROSS SINGAPORE
        </div>
      </section>
      <section className="welcome-form">
        <div className="welcome-top">
          <span>KAMPUNG CAMPUS</span>
        </div>
        <div className="welcome-inner login-inner">
          <span className="eyebrow">
            {creating ? 'A LITTLE CLOSER, EVERY DAY' : 'WELCOME BACK'}
          </span>
          <h2>
            {creating
              ? 'Make yourself at home.'
              : greeting(now ?? 0) +
                (profile ? ', ' + profile.name.split(' ')[0] : '') +
                '.'}
          </h2>
          <p className="welcome-intro">
            {creating
              ? 'Start with a few familiar details. Then choose your town and bring your experience along.'
              : 'Sign in for your gatherings, useful next steps and a little inspiration close to home.'}
          </p>
          <div className="provider-options">
            {logins.map((id) => (
              <Button
                key={id}
                className={'provider-button provider-' + id}
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
            <Fingerprint size={18} />
            Your town, skills and interests come after sign-in.
          </p>
          <div className="login-switch">
            <span>
              {creating
                ? 'Already have an account?'
                : 'New to the neighbourhood?'}
            </span>
            <button onClick={() => setCreating(!creating)}>
              {creating ? 'Sign in' : 'Create an account'}
              <ArrowRight size={16} />
            </button>
          </div>
          {disabled && !error && (
            <output className="quiet-copy">Opening your account…</output>
          )}
          {error && (
            <div className="notice error" role="alert">
              {error}
              {error.includes('Sign in with ChatGPT') && (
                <a
                  href="/signin-with-chatgpt?return_to=%2F%23welcome"
                  target="_top"
                >
                  Sign in to access Kampung Campus
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
          onSaved={() =>
            go(creating || !profile?.completedAt ? 'account' : 'dashboard')
          }
        />
      )}
    </main>
  );
}

export function ConnectDialog({
  source,
  profile,
  run,
  disabled,
  error,
  close,
  onSaved,
}: {
  source: LoginProvider;
  profile?: ResidentProfile;
  run: Run;
  disabled: boolean;
  error: string;
  close: () => void;
  onSaved?: () => void;
}) {
  const existing = profile?.connections.find((c) => c.source === source);
  const [consent, setConsent] = useState(false);
  const [autoSync, setAutoSync] = useState(existing?.autoSync ?? true);
  const [careerConsent, setCareerConsent] = useState(
    existing?.careerConsent ?? true,
  );
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
          <span className="pill">CONNECTION PREVIEW</span>
        </div>
        <DialogTitle>Continue with {sourceInfo[source].title}</DialogTitle>
        <DialogDescription>{sourceInfo[source].detail}</DialogDescription>
        <div className="consent-details">
          <span className="eyebrow">DETAILS READY TO PREFILL</span>
          <dl>
            <div>
              <dt>Full name</dt>
              <dd>Mei Lin</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>mei.lin@example.com</dd>
            </div>
            <div>
              <dt>Profile information</dt>
              <dd>
                {source === 'singpass'
                  ? 'Name, email and identity-check preview'
                  : source === 'linkedin'
                    ? 'Name, email and professional headline'
                    : 'Name and email'}
              </dd>
            </div>
          </dl>
        </div>
        {source === 'linkedin' && (
          <label className="profile-consent" htmlFor="career-consent">
            <Checkbox
              id="career-consent"
              checked={careerConsent}
              disabled={disabled}
              onCheckedChange={(value) => setCareerConsent(value === true)}
            />
            <span>
              Include skills & experience
              <small className="consent-subtext">
                Prepared career records demonstrate a richer integration.
                Standard LinkedIn sign-in does not provide this access.
              </small>
            </span>
          </label>
        )}
        {source !== 'email' && (
          <label className="profile-consent" htmlFor="auto-sync-consent">
            <Checkbox
              id="auto-sync-consent"
              checked={autoSync}
              disabled={disabled}
              onCheckedChange={(value) => setAutoSync(value === true)}
            />
            <span>
              Keep my profile up to date at sign-in
              <small className="consent-subtext">
                Refresh consented fields automatically when I sign in. My
                uploads and personal interests stay unchanged.
              </small>
            </span>
          </label>
        )}
        <label className="profile-consent" htmlFor="account-source-consent">
          <Checkbox
            id="account-source-consent"
            checked={consent}
            disabled={disabled}
            onCheckedChange={(value) => setConsent(value === true)}
          />
          <span>
            I agree to save these details and the selected sync preferences to
            my profile.
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
            disabled={disabled || !consent}
            onClick={async () => {
              if (
                await run('profileLogin', {
                  source,
                  consent,
                  autoSync: source !== 'email' && autoSync,
                  careerConsent: source === 'linkedin' && careerConsent,
                  key,
                })
              ) {
                onSaved?.();
                close();
              }
            }}
          >
            {disabled ? 'Syncing…' : 'Continue'}
            <ArrowRight size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
