import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../lib/seed.ts';
import { execute } from '../lib/domain.ts';
import {
  accountRoute,
  upcomingBookings,
  recommendedActivities,
  neighbourhoodItems,
} from '../lib/dashboard.ts';
import { greeting } from '../lib/profile-details.ts';
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
void test('new residents finish account creation; returning sign-ins land at home', () => {
  assert.equal(accountRoute(undefined, 'discover'), 'welcome');
  const state = login();
  assert.equal(accountRoute(state.profile, 'dashboard'), 'account');
  const done = apply(
    apply(state, 'selectTown', { town: 'Bedok' }),
    'profileComplete',
    { confirm: true },
  );
  assert.equal(accountRoute(done.profile), 'dashboard');
  assert.equal(accountRoute(done.profile, 'profile'), 'profile');
  assert.equal(accountRoute(done.profile, 'welcome'), 'welcome');
});
void test('greetings follow Singapore time at morning, noon and evening boundaries', () => {
  assert.equal(greeting(Date.parse('2026-09-05T03:59:00Z')), 'Good morning');
  assert.equal(greeting(Date.parse('2026-09-05T04:00:00Z')), 'Good afternoon');
  assert.equal(greeting(Date.parse('2026-09-05T10:00:00Z')), 'Good evening');
});
void test('calendar shows confirmed future bookings and removes cancellations', () => {
  const seed = login();
  assert.equal(upcomingBookings(seed, now.getTime()).length, 0);
  const joined = apply(seed, 'join', { id: 'garden' });
  assert.equal(
    upcomingBookings(joined, now.getTime())[0].activity.id,
    'garden',
  );
  assert.ok(
    !recommendedActivities(joined, now.getTime()).some(
      ({ activity }) => activity.id === 'garden',
    ),
  );
  const registration = joined.registrations.find(
    (r) => r.activityId === 'garden',
  )!;
  const cancelled = apply(joined, 'cancelBooking', { id: registration.id });
  assert.equal(upcomingBookings(cancelled, now.getTime()).length, 0);
});
void test('recommendations use interests, respect location and never call another town nearby', () => {
  let state = apply(login(), 'profileUpdate', {
    about: '',
    selfSkills: [],
    expertise: [],
    hobbies: ['Arts & crafts'],
  });
  assert.equal(
    recommendedActivities(state, now.getTime())[0].activity.id,
    'clay',
  );
  state = apply(state, 'selectTown', { town: 'Woodlands' });
  assert.ok(
    recommendedActivities(state, now.getTime()).every((item) => !item.local),
  );
  assert.ok(
    neighbourhoodItems(state, now.getTime()).every(
      (item) => item.kind !== 'Nearby',
    ),
  );
});
void test('account audit entries never leak into the neighbourhood feed, including legacy saved notices', () => {
  const before = login();
  before.notices.push({
    id: 'old-town',
    text: 'Your town is now Bedok.',
    created: now.toISOString(),
  });
  const next = apply(before, 'selectTown', { town: 'Bishan' });
  assert.deepEqual(next.notices, before.notices);
  const feed = neighbourhoodItems(next, now.getTime());
  assert.ok(!JSON.stringify(feed).includes('Your town is now'));
  assert.ok(feed.some((item) => item.id === 'claims'));
});
