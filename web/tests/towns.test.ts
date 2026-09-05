import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../lib/seed.ts';
import { execute } from '../lib/domain.ts';
import {
  selectedTown,
  activityTown,
  inTown,
  DEFAULT_TOWN,
} from '../lib/towns.ts';
import type { PilotState } from '../lib/model.ts';

const now = new Date('2026-09-05T09:00:00Z');
const signedIn = () =>
  apply(createSeed(now), 'profileLogin', { source: 'singpass', consent: true });
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

void test('old saved activity venues stay in Kallang/Whampoa when choosing another town', () => {
  const old = signedIn();
  delete old.town;
  for (const activity of old.activities) delete activity.town;
  assert.equal(selectedTown(old), DEFAULT_TOWN);
  assert.ok(
    old.activities.every((activity) => activityTown(activity) === DEFAULT_TOWN),
  );
  const next = apply(old, 'selectTown', { town: 'Woodlands' });
  assert.equal(selectedTown(next), 'Woodlands');
  assert.equal(
    next.activities.filter((activity) => inTown(activity, 'Woodlands')).length,
    0,
  );
  assert.deepEqual(next.activities, old.activities);
});

void test('town chosen after sign-in is retained on repeat sign-in', () => {
  let state = apply(signedIn(), 'selectTown', { town: 'Tampines' });
  state = apply(state, 'profileLogin', { source: 'singpass', consent: true });
  assert.equal(state.profile?.neighbourhood, 'Tampines');
  state = apply(state, 'profileLogin', { source: 'linkedin', consent: true });
  assert.equal(state.profile?.neighbourhood, 'Tampines');
  assert.equal(selectedTown(state), 'Tampines');
});

void test('town changes preserve wallet, bookings, contributions and imported verification records', () => {
  let state = apply(createSeed(now), 'profileLogin', {
    source: 'singpass',
    consent: true,
  });
  state = apply(state, 'profileImport', {
    source: 'credentials',
    consent: true,
    revision: 1,
    selected: ['credential-first-aid', 'credential-facilitation'],
  });
  state = apply(state, 'join', { id: 'garden' });
  state = apply(state, 'selectTown', { town: DEFAULT_TOWN });
  state = apply(state, 'profileComplete', { confirm: true });
  const next = apply(state, 'selectTown', { town: 'Bedok' });
  assert.equal(next.profile?.neighbourhood, 'Bedok');
  assert.deepEqual(next.profile, { ...state.profile, neighbourhood: 'Bedok' });
  assert.deepEqual(next.transactions, state.transactions);
  assert.deepEqual(next.registrations, state.registrations);
  assert.deepEqual(next.contributions, state.contributions);
  assert.equal(state.profile?.neighbourhood, DEFAULT_TOWN);
});

void test('town validation rejects unsupported input and works while awards are paused', () => {
  const state = signedIn();
  for (const town of ['', 'Pek Kio', 'Paris', null, 42]) {
    assert.throws(() => apply(state, 'selectTown', { town }), /Singapore list/);
  }
  state.paused = true;
  assert.equal(
    selectedTown(apply(state, 'selectTown', { town: 'Tengah' })),
    'Tengah',
  );
});

void test('new proposals use the selected town without relabelling earlier gatherings', () => {
  const state = apply(signedIn(), 'selectTown', { town: 'Bishan' });
  const next = apply(state, 'propose', {
    actor: 'organizer',
    title: 'Neighbourhood knitting circle',
    description:
      'Learn to knit together with neighbours over a shared afternoon.',
    category: 'Arts & crafts',
    location: 'Bishan Community Club',
    starts: '2026-09-12T06:00:00Z',
    capacity: 12,
    safety: 'Step-free room, first aid kit and an accessible toilet available.',
    agreed: true,
  });
  const proposal = next.activities.at(-1)!;
  assert.equal(proposal.town, 'Bishan');
  assert.equal(proposal.location, 'Bishan Community Club');
  assert.equal(proposal.status, 'Proposed');
  assert.equal(
    next.activities.filter((activity) => inTown(activity, 'Bishan')).length,
    1,
  );
  assert.deepEqual(next.activities.slice(0, -1), state.activities);
});
