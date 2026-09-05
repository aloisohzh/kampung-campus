'use client';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  FileBadge,
  MapPin,
  UserRound,
} from 'lucide-react';
import { Brand } from './brand';
import { TownSelector } from './town-selector';
import { SourceMark, ConnectDialog } from './profile';
import { ProfileDetails } from './profile-details';
import { ProfileAvatar } from './profile-avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { allSkills } from '@/lib/profile-details';
import {
  sourceInfo,
  type ResidentProfile,
  type LoginProvider,
} from '@/lib/profile';
import type { Town } from '@/lib/towns';
import type { Run } from '@/lib/presentation';

const steps = [
  'Your neighbourhood',
  'Account connections',
  'Skills & interests',
  'Review & finish',
];
export function AccountSetup({
  profile,
  town,
  run,
  disabled,
  error,
  go,
}: {
  profile: ResidentProfile;
  town: Town;
  run: Run;
  disabled: boolean;
  error: string;
  go: (page: string) => void;
}) {
  const [step, setStep] = useState(
    profile.accountStep ?? (profile.townConfirmedAt ? 1 : 0),
  );
  const [chosenTown, setChosenTown] = useState<Town>(town);
  const [source, setSource] = useState<LoginProvider | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <main className="account-shell">
      <header className="account-header">
        <Brand />
        <span>Your progress is saved as you go</span>
        {profile.completedAt && (
          <Button variant="outline" onClick={() => go('dashboard')}>
            Back to home
          </Button>
        )}
      </header>
      <div className="account-layout">
        <aside className="account-steps">
          <span className="eyebrow">LET’S GET TO KNOW YOU</span>
          <h1>
            A place for
            <br />
            what you bring.
          </h1>
          <p>
            A few details help connect you with neighbours and gatherings you’ll
            enjoy.
          </p>
          <ol>
            {steps.map((label, index) => (
              <li
                key={label}
                className={
                  index === step ? 'current' : index < step ? 'done' : ''
                }
              >
                <button
                  disabled={index > step || disabled}
                  onClick={() => setStep(index)}
                >
                  <span>{index < step ? <Check size={16} /> : index + 1}</span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
        </aside>
        <section className="account-panel">
          <div className="account-step-caption">STEP {step + 1} OF 4</div>
          <h2>{steps[step]}</h2>
          {step === 0 && (
            <>
              <p>
                Welcome, {profile.name.split(' ')[0]}. Your account details are
                ready. Now choose the town you want to be part of.
              </p>
              <div className="account-identity">
                <ProfileAvatar profile={profile} />
                <div>
                  <strong>{profile.name}</strong>
                  <small>{profile.email}</small>
                </div>
                <span className="record-status">
                  <ShieldCheck size={14} />
                  {profile.identity.status.startsWith('Verified')
                    ? 'Identity check preview'
                    : 'Not identity-verified'}
                </span>
              </div>
              <span className="town-label">
                Where would you like to connect?
              </span>
              <TownSelector
                value={chosenTown}
                disabled={disabled}
                onChange={setChosenTown}
                label="Choose your town after sign-in"
              />
              <p className="quiet-copy">
                Chosen by you. You can change this later in Profile setup.
              </p>
              <Button
                className="primary-button"
                disabled={disabled}
                onClick={async () => {
                  if (await run('selectTown', { town: chosenTown })) setStep(1);
                }}
              >
                Save town & continue
                <ArrowRight size={16} />
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <p>
                Connect your sign-in accounts and choose which details stay in
                sync. Your CV and supporting documents have their own space in
                Profile setup.
              </p>
              <div className="setup-imports">
                {(['singpass', 'linkedin'] as const).map((id) => (
                  <button
                    className="setup-import"
                    key={id}
                    disabled={disabled}
                    onClick={() => setSource(id)}
                  >
                    <SourceMark source={id} />
                    <span>
                      <strong>{sourceInfo[id].title}</strong>
                      <small>
                        {profile.connections.some((c) => c.source === id)
                          ? 'Connected · review sync preferences'
                          : sourceInfo[id].description}
                      </small>
                    </span>
                    {profile.connections.some((c) => c.source === id) ? (
                      <Check size={20} />
                    ) : (
                      <ArrowRight size={20} />
                    )}
                  </button>
                ))}
              </div>

              <div className="account-step-actions">
                <Button
                  variant="outline"
                  disabled={disabled}
                  onClick={() => setStep(0)}
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button
                  className="primary-button"
                  disabled={disabled}
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ArrowRight size={16} />
                </Button>
              </div>
              <p className="quiet-copy">
                Additional account connections are optional. Documents can be
                uploaded after account creation.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <p>
                Keep the useful suggestions, tell us what you can share, and
                choose what you enjoy.
              </p>
              <ProfileDetails
                profile={profile}
                run={run}
                disabled={disabled}
                onSaved={() => setStep(3)}
              />
              <button
                className="back-link"
                disabled={disabled}
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={15} />
                Back to account connections
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <p>
                Here’s your starting point. You can edit your profile whenever
                your skills or interests change.
              </p>
              <div className="account-review">
                <div>
                  <UserRound size={21} />
                  <span>
                    <strong>{profile.name}</strong>
                    <small>{profile.email}</small>
                  </span>
                  <button onClick={() => setStep(0)}>Review</button>
                </div>
                <div>
                  <MapPin size={21} />
                  <span>
                    <strong>{town}</strong>
                    <small>Your selected neighbourhood</small>
                  </span>
                  <button onClick={() => setStep(0)}>Edit</button>
                </div>
                <div>
                  <FileBadge size={21} />
                  <span>
                    <strong>
                      {allSkills(profile).length} skills ·{' '}
                      {profile.records.filter((r) => r.kind !== 'Skill').length}{' '}
                      imported credentials · {profile.documents?.length ?? 0}{' '}
                      uploads
                    </strong>
                    <small>Verification status stays with each source</small>
                  </span>
                  <button onClick={() => setStep(1)}>Review</button>
                </div>
                <div>
                  <Check size={21} />
                  <span>
                    <strong>
                      {profile.hobbies?.join(', ') ||
                        'Interests can be added later'}
                    </strong>
                    <small>
                      {profile.expertise?.join(', ') ||
                        'Expertise can be added later'}
                    </small>
                  </span>
                  <button onClick={() => setStep(2)}>Edit</button>
                </div>
              </div>
              <label className="profile-consent" htmlFor="account-confirm">
                <Checkbox
                  id="account-confirm"
                  checked={confirmed}
                  disabled={disabled}
                  onCheckedChange={(value) => setConfirmed(value === true)}
                />
                <span>
                  I have reviewed my details and the status of my imported
                  records.
                </span>
              </label>
              <Button
                className="primary-button"
                disabled={disabled || !confirmed}
                onClick={async () => {
                  if (await run('profileComplete', { confirm: true }))
                    go('dashboard');
                }}
              >
                Go to my dashboard
                <ArrowRight size={16} />
              </Button>
            </>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
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
    </main>
  );
}
