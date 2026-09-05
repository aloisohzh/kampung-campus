'use client';
/* oxlint-disable next/no-img-element -- User-supplied local provider logo. */
/* oxlint-disable next/no-html-link-for-pages -- Sites owns the native top-level sign-in route. */
import { useEffect, useState } from 'react';
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
                disabled={disabled || id !== 'email'}
                onClick={() => setSource(id)}
              >
                <SourceMark source={id} />
                <span>
                  <strong>
                    Continue with{' '}
                    {id === 'email'
                      ? 'your account'
                      : sourceInfo[id].title.split(' /')[0]}
                  </strong>
                  <small>
                    {id === 'email'
                      ? 'Use your signed-in account details'
                      : 'Connection not available yet'}
                  </small>
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
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [consent, setConsent] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let cancelled = false;
    void fetch('/api/account')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const account = data as { name?: string; email?: string };
        if (account.name) setName(account.name);
        if (account.email) setEmail(account.email);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <Dialog open onOpenChange={(open) => !open && !disabled && close()}>
      <DialogContent className="profile-connect-dialog">
        <DialogTitle>Welcome to Kampung Campus</DialogTitle>
        <DialogDescription>
          Use your signed-in account details, then choose your town and set up
          your profile.
        </DialogDescription>
        <div className="planner-review-grid">
          <label>
            Full name
            <input
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Account email
            <input value={email} readOnly aria-label="Account email" />
          </label>
        </div>
        <label className="profile-consent" htmlFor="account-source-consent">
          <Checkbox
            id="account-source-consent"
            checked={consent}
            onCheckedChange={(value) => setConsent(value === true)}
          />
          <span>
            I agree to save these account details in my Kampung Campus profile.
          </span>
        </label>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="connect-footer">
          <Button variant="outline" onClick={close} disabled={disabled}>
            Cancel
          </Button>
          <Button
            className="primary-button"
            disabled={
              disabled ||
              !consent ||
              name.trim().length < 2 ||
              source !== 'email'
            }
            onClick={async () => {
              if (
                await run('profileLogin', {
                  source: 'email',
                  name,
                  consent,
                  key,
                })
              ) {
                close();
                onSaved?.();
              }
            }}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
