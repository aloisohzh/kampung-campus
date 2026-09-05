import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../lib/seed.ts';
import { execute } from '../lib/domain.ts';
import { allSkills, suggestSkills, exampleCV } from '../lib/profile-details.ts';
import type { PilotState } from '../lib/model.ts';
const now = new Date('2026-09-05T09:00:00Z');
const apply = (
  state: PilotState,
  type: string,
  extra: Record<string, unknown> = {},
) =>
  execute(
    state,
    { type, actor: 'resident', key: crypto.randomUUID(), ...extra },
    now,
  ).state;
const login = () =>
  apply(createSeed(now), 'profileLogin', { source: 'singpass', consent: true });
const upload = (kind = 'CV / résumé') => ({
  uploadId: 'owned-file-1',
  document: {
    id: 'owned-file-1',
    name: 'experience.txt',
    size: 1024,
    content_type: 'text/plain',
  },
  kind,
  title: 'My experience',
  issuer: '',
  expires: '',
  skills: ['Project management', 'Teaching'],
});

void test('account creation requires sign-in, then town confirmation; optional imports can be skipped', () => {
  assert.throws(
    () => apply(createSeed(now), 'selectTown', { town: 'Bedok' }),
    /Sign in/,
  );
  assert.throws(
    () => apply(login(), 'profileComplete', { confirm: true }),
    /Confirm your town/,
  );
  const town = apply(login(), 'selectTown', { town: 'Bedok' });
  const complete = apply(town, 'profileComplete', { confirm: true });
  assert.equal(complete.profile?.neighbourhood, 'Bedok');
  assert.ok(complete.profile?.completedAt);
  assert.deepEqual(complete.transactions, town.transactions);
});
void test('skills and interests persist without changing identity, credits or community notices', () => {
  const before = login();
  const next = apply(before, 'profileUpdate', {
    about: ' I enjoy helping neighbours. ',
    selfSkills: ['Baking', 'baking'],
    expertise: ['Event planning'],
    hobbies: ['Gardening', 'Reading'],
  });
  assert.deepEqual(next.profile?.selfSkills, ['Baking']);
  assert.equal(next.profile?.about, 'I enjoy helping neighbours.');
  assert.deepEqual(next.profile?.identity, before.profile?.identity);
  assert.deepEqual(next.transactions, before.transactions);
  assert.deepEqual(next.notices, before.notices);
});
void test('profile validation rejects unsupported tags and role impersonation', () => {
  for (const extra of [
    { hobbies: Array(31).fill('Reading') },
    { expertise: [42] },
    { selfSkills: [''] },
    { actor: 'organizer' },
  ])
    assert.throws(() =>
      apply(login(), 'profileUpdate', {
        about: '',
        selfSkills: [],
        expertise: [],
        hobbies: [],
        ...extra,
      }),
    );
});
void test('reviewed CV skills attach once and keep their document provenance', () => {
  const attached = apply(login(), 'profileAttach', upload());
  const again = apply(attached, 'profileAttach', upload());
  assert.equal(again.profile?.documents?.length, 1);
  assert.deepEqual(allSkills(again.profile), [
    'Project management',
    'Teaching',
  ]);
  assert.equal(again.profile?.documents?.[0].status, 'Uploaded');
  const removed = apply(again, 'profileRemoveDocument', { id: 'owned-file-1' });
  assert.equal(removed.profile?.documents?.length, 0);
  assert.deepEqual(allSkills(removed.profile), []);
});
void test('uploaded accreditation skills remain self-reported and cannot claim verified qualifications', () => {
  const result = apply(login(), 'profileAttach', {
    ...upload('Accreditation'),
    status: 'Verified',
    expires: '2027-12-31',
  });
  assert.equal(result.profile?.documents?.[0].status, 'Awaiting verification');
  assert.deepEqual(result.profile?.documents?.[0].skills, [
    'Project management',
    'Teaching',
  ]);
  assert.equal(result.profile?.records.length, 0);
  assert.throws(
    () =>
      apply(login(), 'profileAttach', {
        ...upload('Certification'),
        expires: '2026-02-30',
      }),
    /expiry date/,
  );
});
void test('CV suggestions match actual text, tolerate case, and never infer qualifications', () => {
  assert.ok(suggestSkills(exampleCV).includes('Digital mentoring'));
  assert.ok(
    suggestSkills('Experience: PYTHON and PROJECT MANAGEMENT.').includes(
      'Python',
    ),
  );
  assert.deepEqual(
    suggestSkills('I love spending time with my neighbours.'),
    [],
  );
  assert.deepEqual(suggestSkills('Not a certification record.'), []);
});
