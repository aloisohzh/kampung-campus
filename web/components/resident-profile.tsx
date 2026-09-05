'use client';
import { useRef, useState } from 'react';
import {
  Camera,
  Check,
  FileBadge,
  BriefcaseBusiness,
  GraduationCap,
  Mail,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ProfileAvatar } from './profile-avatar';
import { ProfileDetails } from './profile-details';
import { ProfileDocuments } from './profile-documents';
import { TownSelector } from './town-selector';
import { allSkills } from '@/lib/profile-details';
import { careerEntries, profileProgress } from '@/lib/profile-career';
import { sourceInfo, type ResidentProfile } from '@/lib/profile';
import type { Town } from '@/lib/towns';
import { date, type Run } from '@/lib/presentation';

export function ResidentProfilePage({
  profile,
  town,
  onTownChange,
  run,
  disabled,
}: {
  profile?: ResidentProfile;
  town: Town;
  onTownChange: (town: Town) => void;
  run: Run;
  disabled: boolean;
  error?: string;
  go: (page: string) => void;
}) {
  const [tab, setTab] = useState('personal');
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);
  if (!profile) return null;
  const progress = profileProgress(profile);
  const completed = progress.filter((item) => item.done).length;
  const source = profile.personalSource ?? profile.login.provider;
  const details = profile.providerProfiles?.[source];
  const headline =
    profile.providerProfiles?.linkedin?.headline ||
    [...(profile.documents ?? [])]
      .reverse()
      .find((doc) => doc.extraction?.headline)?.extraction?.headline;
  const experiences = careerEntries(profile, 'experience');
  const education = careerEntries(profile, 'education');
  const photoUpload = async (file: File) => {
    setUploading(true);
    setPhotoError('');
    try {
      if (
        !['image/jpeg', 'image/png'].includes(file.type) ||
        !file.size ||
        file.size > 5 * 1024 * 1024
      )
        throw new Error('Choose a JPG or PNG photo under 5 MB.');
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/evidence', { method: 'POST', body });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id)
        throw new Error(result.error || 'Your photo could not be uploaded.');
      if (!(await run('profilePhoto', { uploadId: result.id })))
        throw new Error('Your photo could not be saved. Please try again.');
    } catch (e) {
      setPhotoError(
        e instanceof Error ? e.message : 'Choose a readable image.',
      );
    } finally {
      setUploading(false);
      if (photoInput.current) photoInput.current.value = '';
    }
  };
  return (
    <div className="profile-workspace">
      <section className="profile-summary-card">
        <ProfileAvatar profile={profile} className="profile-photo-large" />
        <div className="profile-summary-name">
          <span className="eyebrow">MY PROFILE</span>
          <h2>{profile.name}</h2>
          <p>{headline || 'Your skills. Your experience. Your community.'}</p>
          <span className="profile-meta">
            {town} · {profile.email}
          </span>
        </div>
        <div className="profile-completion">
          <strong>
            {completed} of {progress.length} sections ready
          </strong>
          <Progress
            value={(completed / progress.length) * 100}
            aria-label="Profile completeness"
          />
          <small>Build your profile at your own pace.</small>
        </div>
      </section>
      <Tabs value={tab} onValueChange={setTab} className="profile-tabs">
        <TabsList className="profile-tab-list" aria-label="Profile sections">
          <TabsTrigger value="personal">Personal details</TabsTrigger>
          <TabsTrigger value="experience">Experience & education</TabsTrigger>
          <TabsTrigger value="skills">Skills & interests</TabsTrigger>
          <TabsTrigger value="documents">CV & credentials</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <section className="profile-section">
            <div className="profile-section-heading">
              <div>
                <h2>Personal details</h2>
                <p className="quiet-copy">
                  Your account information, prefilled during sign-in.
                </p>
              </div>
              <UserRound size={24} />
            </div>
            <div className="personal-data-grid">
              <div>
                <span>Full name</span>
                <strong>{profile.name}</strong>
                <small>{sourceInfo[source].title} · connection preview</small>
              </div>
              <div>
                <span>Email address</span>
                <strong>{profile.email}</strong>
                <small>
                  <Mail size={14} /> Account contact
                </small>
              </div>
              <div>
                <span>Identity status</span>
                <strong>
                  {profile.identity.status.startsWith('Verified')
                    ? 'Identity check preview'
                    : 'Not identity-verified'}
                </strong>
                <small>
                  {profile.identity.checkedAt
                    ? 'Checked ' + date(profile.identity.checkedAt)
                    : 'Email and LinkedIn sign-in do not verify legal identity.'}
                </small>
              </div>
              <div>
                <span>Last account sync</span>
                <strong>{date(details?.syncedAt ?? profile.login.at)}</strong>
                <small>
                  <RefreshCw size={14} />{' '}
                  {profile.connections.some((c) => c.autoSync)
                    ? 'Auto-sync at sign-in enabled'
                    : 'Synced during sign-in'}
                </small>
              </div>
            </div>
            <div className="profile-photo-settings">
              <ProfileAvatar profile={profile} />
              <div>
                <h3>Profile photo</h3>
                <p className="quiet-copy">
                  Shown on your profile and in the top-right account icon.
                </p>
                <div className="photo-actions">
                  <Button
                    variant="outline"
                    disabled={disabled || uploading}
                    onClick={() => photoInput.current?.click()}
                  >
                    <Camera size={16} />
                    {uploading
                      ? 'Uploading…'
                      : profile.photo
                        ? 'Change photo'
                        : 'Add profile photo'}
                  </Button>
                  {profile.photo && (
                    <Button
                      variant="ghost"
                      disabled={disabled || uploading}
                      onClick={() => void run('profilePhoto', { remove: true })}
                    >
                      Remove photo
                    </Button>
                  )}
                </div>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/jpeg,image/png"
                  hidden
                  aria-label="Upload profile photo"
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      void photoUpload(e.target.files[0]);
                  }}
                />
                <small>JPG or PNG · up to 5 MB</small>
              </div>
            </div>
            {photoError && (
              <p role="alert" className="notice error">
                {photoError}
              </p>
            )}
            <div className="profile-town">
              <span className="town-label">Your neighbourhood</span>
              <TownSelector
                value={town}
                onChange={onTownChange}
                disabled={disabled}
                label="Your profile town"
              />
              <p className="quiet-copy">
                Choose where you’d like to join in. This preference is separate
                from your account details.
              </p>
            </div>
          </section>
          {completed < progress.length && (
            <section className="profile-section">
              <h3>Your next steps</h3>
              <div className="profile-next-steps">
                {progress
                  .filter((item) => !item.done)
                  .map((item) => (
                    <button key={item.label} onClick={() => setTab(item.tab)}>
                      <span>{item.label}</span>
                      <span>Add details →</span>
                    </button>
                  ))}
              </div>
            </section>
          )}
        </TabsContent>
        <TabsContent value="experience">
          {(['experience', 'education'] as const).map((kind) => {
            const entries = kind === 'experience' ? experiences : education;
            const Icon =
              kind === 'experience' ? BriefcaseBusiness : GraduationCap;
            return (
              <section className="profile-section" key={kind}>
                <div className="profile-section-heading">
                  <h2>
                    {kind === 'experience'
                      ? 'Work & volunteering'
                      : 'Education'}
                  </h2>
                  <Icon size={24} />
                </div>
                {entries.length ? (
                  <div className="career-timeline">
                    {entries.map((entry, i) => (
                      <article key={i}>
                        <span className="career-dot" />
                        <h3>{entry.title}</h3>
                        <p>
                          {entry.organisation}
                          {entry.period ? ' · ' + entry.period : ''}
                        </p>
                        {entry.description && (
                          <p className="quiet-copy">{entry.description}</p>
                        )}
                        <small>
                          From {entry.source} · reviewed profile information
                        </small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-inline">
                    <p>
                      {kind === 'experience'
                        ? 'Bring in your work and volunteering experience from a CV or résumé.'
                        : 'Education details from your reviewed CV will appear here.'}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setTab('documents')}
                    >
                      Upload a CV
                    </Button>
                  </div>
                )}
              </section>
            );
          })}
        </TabsContent>
        <TabsContent value="skills">
          <section className="profile-section">
            <div className="profile-section-heading">
              <div>
                <h2>What you bring</h2>
                <p className="quiet-copy">
                  {allSkills(profile).length} skills in your profile. Add what
                  you enjoy and how you’d like to contribute.
                </p>
              </div>
              <Check size={24} />
            </div>
            <ProfileDetails
              key={profile.about + JSON.stringify(profile.selfSkills)}
              profile={profile}
              run={run}
              disabled={disabled}
            />
          </section>
        </TabsContent>
        <TabsContent value="documents">
          <section className="profile-section">
            <ProfileDocuments profile={profile} run={run} disabled={disabled} />
          </section>
          {!!profile.records.filter((r) => r.kind !== 'Skill').length && (
            <section className="profile-section">
              <h3>Previously imported credentials</h3>
              <p className="quiet-copy">
                These records came from the credential-verification preview.
                Uploaded documents below are reviewed separately.
              </p>
              <div className="credential-list">
                {profile.records
                  .filter((r) => r.kind !== 'Skill')
                  .map((record) => (
                    <article className="credential-record" key={record.id}>
                      <FileBadge size={24} />
                      <div>
                        <h3>{record.title}</h3>
                        <p>{record.issuer}</p>
                        <small>
                          {record.status.replace(
                            ' · demo',
                            ' · verification preview',
                          )}
                          {record.expires ? ' · Expires ' + record.expires : ''}
                        </small>
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
