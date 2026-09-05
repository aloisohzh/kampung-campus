import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../lib/seed.ts';
import { execute } from '../lib/domain.ts';
import { sampleRecords } from '../lib/profile.ts';
import type { PilotState } from '../lib/model.ts';
const now = new Date('2026-09-05T09:00:00Z');
const apply = (
  state: PilotState,
  type: string,
  payload: Record<string, unknown> = {},
) =>
  execute(
    state,
    {
      type,
      actor: 'resident',
      key: crypto.randomUUID(),
      name: 'Mei Lin',
      email: 'mei@example.invalid',
      ...payload,
    },
    now,
  ).state;
const login = (source = 'email') =>
  apply(
    apply(createSeed(now), 'profileLogin', { source, consent: true }),
    'selectTown',
    { town: 'Kallang/Whampoa' },
  );
const importFrom = (
  state: PilotState,
  source: 'skills' | 'credentials',
  revision: number,
) =>
  apply(state, 'profileImport', {
    source,
    revision,
    consent: true,
    selected: sampleRecords(source, revision).map((r) => r.id),
  });

void test('account creation preserves previous community history and uses account details', () => {
  const old = createSeed(now);
  const next = apply(old, 'profileLogin', { source: 'email', consent: true });
  assert.equal(next.profile?.mode, 'account');
  assert.equal(next.profile?.identity.status, 'Unverified');
  assert.equal(next.profile?.name, 'Mei Lin');
  assert.deepEqual(next.transactions, old.transactions);
  assert.deepEqual(next.registrations, old.registrations);
});
void test('unconnected providers cannot assert verified identity or import qualifications', () => {
  for (const source of ['singpass', 'linkedin'])
    assert.throws(() => login(source), /not connected/);
  const state = login();
  assert.equal(state.profile?.identity.status, 'Unverified');
  assert.equal(state.profile?.records.length, 0);
});
void test('account consent and valid fields are required', () => {
  for (const payload of [
    { source: 'email', consent: false },
    { source: 'unknown', consent: true },
    { source: 'email', consent: true, name: '' },
    { source: 'email', consent: true, email: '' },
  ])
    assert.throws(() => apply(createSeed(now), 'profileLogin', payload));
});
void test('only selected server-owned records import; client cannot forge verified skills', () => {
  const state = apply(login(), 'profileImport', {
    source: 'skills',
    consent: true,
    revision: 1,
    selected: ['skill-2'],
    records: [{ id: 'skill-2', status: 'Verified' }],
    verified: true,
  });
  assert.equal(state.profile?.records.length, 1);
  assert.equal(state.profile?.records[0].title, 'Urban gardening');
  assert.equal(state.profile?.records[0].status, 'Self-reported');
  for (const selected of [['invented'], ['skill-1', 'skill-1'], []]) {
    assert.throws(
      () =>
        apply(login(), 'profileImport', {
          source: 'skills',
          consent: true,
          revision: 1,
          selected,
        }),
      /valid sample records/,
    );
  }
});
void test('skills sync adds one record; repeated sync and idempotent replay never duplicate it', () => {
  let state = importFrom(login(), 'skills', 1);
  assert.equal(state.profile?.records.length, 3);
  state = importFrom(state, 'skills', 2);
  assert.equal(state.profile?.records.length, 4);
  state = importFrom(state, 'skills', 2);
  assert.equal(state.profile?.records.length, 4);
  const command = {
    type: 'profileImport',
    actor: 'resident' as const,
    key: crypto.randomUUID(),
    source: 'skills',
    revision: 2,
    consent: true,
    selected: sampleRecords('skills', 2).map((r) => r.id),
  };
  const once = execute(state, command, now).state;
  const twice = execute(once, command, now).state;
  assert.deepEqual(once, twice);
  assert.equal(
    twice.profile?.connections.filter((c) => c.source === 'skills').length,
    1,
  );
});
void test('credential recheck propagates revocation and preserves expiry; validity cannot be selectively skipped', () => {
  let state = importFrom(login(), 'credentials', 1);
  assert.equal(
    state.profile?.records.filter((r) => r.status === 'Verified · demo').length,
    2,
  );
  assert.equal(
    state.profile?.records.find((r) => r.kind === 'Accreditation')?.status,
    'Expired · demo',
  );
  assert.throws(
    () =>
      apply(state, 'profileImport', {
        source: 'credentials',
        consent: true,
        revision: 2,
        selected: ['credential-facilitation'],
      }),
    /rechecked together/,
  );
  state = importFrom(state, 'credentials', 2);
  assert.equal(
    state.profile?.records.filter((r) => r.status === 'Verified · demo').length,
    1,
  );
  assert.equal(
    state.profile?.records.find((r) => r.id === 'credential-first-aid')?.status,
    'Revoked · demo',
  );
  assert.throws(() => importFrom(state, 'credentials', 1), /out of date/);
});
void test('disconnect revokes consent, removes that source’s records and clears identity badge', () => {
  let state = importFrom(importFrom(login(), 'skills', 1), 'credentials', 1);
  state = apply(state, 'profileDisconnect', { source: 'credentials' });
  assert.equal(state.profile?.records.length, 3);
  assert.equal(
    state.profile?.connections.some((c) => c.source === 'credentials'),
    false,
  );
  assert.throws(
    () => apply(state, 'profileDisconnect', { source: 'singpass' }),
    /not connected/,
  );
  assert.equal(state.profile?.identity.status, 'Unverified');
  assert.equal(state.profile?.identity.checkedAt, undefined);
  assert.equal(state.profile?.records.length, 3);
});
void test('profile completion needs confirmation and awards no additional starter credits', () => {
  const state = login('email');
  assert.throws(() => apply(state, 'profileComplete'), /Confirm/);
  const complete = apply(state, 'profileComplete', { confirm: true });
  assert.equal(complete.profile?.completedAt, now.toISOString());
  assert.deepEqual(complete.transactions, state.transactions);
  assert.equal(complete.profile?.identity.status, 'Unverified');
});
