import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../lib/seed.ts';
import { execute } from '../lib/domain.ts';
import { wallet } from '../lib/model.ts';
import type { Actor, PilotState } from '../lib/model.ts';
const now = new Date('2026-09-05T09:00:00Z');
const command = (
  type: string,
  actor: Actor,
  extra: Record<string, unknown> = {},
) => ({ type, actor, key: crypto.randomUUID(), ...extra });
const apply = (
  state: PilotState,
  type: string,
  actor: Actor,
  extra: Record<string, unknown> = {},
) => execute(state, command(type, actor, extra), now).state;
const approve = (s: PilotState) =>
  apply(s, 'review', 'reviewer', {
    id: 'claim-study',
    decision: 'approve',
    reason: 'Attendance and evidence confirmed.',
  });
const redeem = (s: PilotState) =>
  apply(s, 'redeem', 'resident', { id: 'kopi' });
void test('complete demo: 40 → independent helper approval → 50 → voucher → one use → settlement', () => {
  let s = createSeed(now);
  assert.equal(wallet(s, 'mei', now.getTime()).earned, 40);
  s = approve(s);
  assert.equal(wallet(s, 'mei', now.getTime()).earned, 50);
  s = redeem(s);
  assert.equal(wallet(s, 'mei', now.getTime()).earned, 0);
  assert.equal(s.vouchers.length, 1);
  s = apply(s, 'useVoucher', 'merchant', { id: s.vouchers[0].id });
  assert.equal(s.vouchers[0].status, 'Used');
  assert.throws(
    () => apply(s, 'useVoucher', 'merchant', { id: s.vouchers[0].id }),
    /Already used/,
  );
  assert.equal(
    s.contributions.filter((c) => c.status === 'Approved').length,
    5,
  );
});
void test('insufficient earned credits leave every balance and inventory unchanged', () => {
  const s = createSeed(now),
    before = JSON.stringify(s);
  assert.throws(() => redeem(s), /No credits were deducted/);
  assert.equal(JSON.stringify(s), before);
});
void test('starter cannot pay for external rewards or be mixed with earned', () => {
  const s = createSeed(now);
  assert.throws(
    () => apply(s, 'redeem', 'resident', { id: 'kopi', creditType: 'starter' }),
    /community benefits/,
  );
  assert.equal(wallet(s, 'mei', now.getTime()).starter, 50);
});
void test('community refund preserves starter credit type', () => {
  let s = apply(createSeed(now), 'redeem', 'resident', {
    id: 'materials',
    creditType: 'starter',
  });
  assert.equal(wallet(s, 'mei', now.getTime()).starter, 20);
  s = apply(s, 'refundVoucher', 'operator', {
    id: s.vouchers[0].id,
    reason: 'Workshop cannot supply materials.',
  });
  assert.equal(wallet(s, 'mei', now.getTime()).starter, 50);
  assert.equal(wallet(s, 'mei', now.getTime()).earned, 40);
  assert.equal(s.vouchers[0].status, 'Refunded');
  assert.equal(s.rewards.find((r) => r.id === 'materials')!.stock, 16);
});
void test('duplicate approval and replay key cannot double award', () => {
  const s = createSeed(now),
    c = command('review', 'reviewer', {
      id: 'claim-study',
      decision: 'approve',
      reason: 'Evidence checked.',
    });
  const a = execute(s, c, now).state;
  const b = execute(a, c, now).state;
  assert.deepEqual(a, b);
  assert.throws(() => approve(a), /already been reviewed/);
  assert.equal(wallet(b, 'mei', now.getTime()).earned, 50);
});
void test('replay redemption key does not allocate another voucher', () => {
  const s = approve(createSeed(now));
  const c = command('redeem', 'resident', { id: 'kopi' });
  const a = execute(s, c, now).state;
  const b = execute(a, c, now).state;
  assert.equal(b.vouchers.length, 1);
  assert.equal(b.rewards.find((r) => r.id === 'kopi')!.stock, 23);
});
void test('role guard rejects resident approval and organizer approval', () => {
  for (const actor of ['resident', 'organizer'] as Actor[])
    assert.throws(
      () =>
        apply(createSeed(now), 'review', actor, {
          id: 'claim-study',
          decision: 'approve',
          reason: 'Review checked',
        }),
      /requires/,
    );
});
void test('self and organizer conflict are independently rejected', () => {
  const own = createSeed(now);
  own.contributions[0].resident = 'daniel';
  assert.throws(() => approve(own), /cannot review your own/);
  const organizer = createSeed(now);
  organizer.activities.find((a) => a.id === 'study')!.organizer = 'daniel';
  assert.throws(() => approve(organizer), /cannot review your own/);
});
void test('period cap awards only remaining allowance and preserves contribution', () => {
  let s = createSeed(now);
  s.transactions.push({
    ...s.transactions[1],
    id: 'extra',
    available: 55,
    created: now.toISOString(),
  });
  s = approve(s);
  assert.equal(s.contributions[0].awarded, 5);
  assert.equal(wallet(s, 'mei', now.getTime()).periodEarned, 100);
});
void test('period cap resets after four weeks and pilot closes after eight', () => {
  const s = createSeed(now);
  const later = new Date(new Date(s.periodStart).getTime() + 29 * 86400000);
  assert.equal(wallet(s, 'mei', later.getTime()).periodEarned, 0);
  assert.equal(
    execute(
      s,
      command('review', 'reviewer', {
        id: 'claim-study',
        decision: 'approve',
        reason: 'Checked records.',
      }),
      later,
    ).state.contributions[0].awarded,
    10,
  );
  assert.throws(
    () =>
      execute(
        s,
        command('review', 'reviewer', {
          id: 'claim-study',
          decision: 'approve',
          reason: 'Checked records.',
        }),
        new Date(new Date(s.periodStart).getTime() + 57 * 86400000),
      ),
    /earning window/,
  );
});
void test('booking reserves only starter then timely cancellation releases it', () => {
  let s = apply(createSeed(now), 'join', 'resident', { id: 'garden' });
  assert.equal(wallet(s, 'mei', now.getTime()).starter, 48);
  assert.equal(wallet(s, 'mei', now.getTime()).reserved, 2);
  s = apply(s, 'cancelBooking', 'resident', { id: s.registrations.at(-1)!.id });
  assert.equal(wallet(s, 'mei', now.getTime()).starter, 50);
  assert.equal(wallet(s, 'mei', now.getTime()).reserved, 0);
});
void test('full gathering waitlist is deposit-free and can claim released place', () => {
  let s = apply(createSeed(now), 'join', 'resident', { id: 'digital' });
  assert.equal(s.registrations.at(-1)!.status, 'Waitlisted');
  assert.equal(wallet(s, 'mei', now.getTime()).starter, 50);
  s = apply(s, 'openSpot', 'organizer', { id: 'digital' });
  s = apply(s, 'join', 'resident', { id: 'digital' });
  assert.equal(s.registrations.at(-1)!.status, 'Confirmed');
  assert.equal(wallet(s, 'mei', now.getTime()).starter, 48);
});
void test('organizer completion and attendance enable claim without self award', () => {
  let s = apply(createSeed(now), 'join', 'resident', { id: 'garden' });
  const id = s.registrations.at(-1)!.id;
  assert.throws(
    () => apply(s, 'attendance', 'organizer', { id, role: 'Helper' }),
    /Complete the session/,
  );
  s = apply(s, 'completeActivity', 'organizer', { id: 'garden' });
  s = apply(s, 'attendance', 'organizer', { id, role: 'Helper' });
  assert.equal(wallet(s, 'mei', now.getTime()).starter, 50);
  s = apply(s, 'claim', 'resident', {
    id: 'garden',
    description: 'I set up tables and helped all neighbours plant their herbs.',
    evidence: [],
  });
  assert.equal(wallet(s, 'mei', now.getTime()).earned, 40);
  assert.throws(
    () =>
      apply(s, 'claim', 'resident', {
        id: 'garden',
        description: 'I was also an attendee and want more credits.',
      }),
    /Only one contribution/,
  );
});
void test('late cancellation forfeits and organizer cancellation refunds', () => {
  const s = createSeed(now);
  s.activities[0].starts = new Date(now.getTime() + 3600000).toISOString();
  let joined = apply(s, 'join', 'resident', { id: 'garden' });
  const late = apply(joined, 'cancelBooking', 'resident', {
    id: joined.registrations.at(-1)!.id,
  });
  assert.equal(wallet(late, 'mei', now.getTime()).starter, 48);
  assert.equal(wallet(late, 'mei', now.getTime()).reserved, 0);
  joined = apply(joined, 'cancelActivity', 'organizer', {
    id: 'garden',
    reason: 'Unsafe weather expected.',
  });
  assert.equal(wallet(joined, 'mei', now.getTime()).starter, 50);
});
void test('uncertain partner result remains pending; failed fulfilment releases value', () => {
  const s = createSeed(now);
  s.transactions.push({ ...s.transactions[1], id: 'extra', available: 60 });
  let p = apply(s, 'redeem', 'resident', { id: 'swim' });
  assert.equal(p.vouchers[0].status, 'Pending');
  assert.equal(wallet(p, 'mei', now.getTime()).reserved, 100);
  p = apply(p, 'fulfilPartner', 'operator', {
    id: p.vouchers[0].id,
    result: 'fail',
  });
  assert.equal(wallet(p, 'mei', now.getTime()).earned, 100);
  assert.equal(wallet(p, 'mei', now.getTime()).reserved, 0);
  assert.equal(p.rewards.find((r) => r.id === 'swim')!.stock, 12);
});
void test('wrong merchant and expired vouchers are not redeemable', () => {
  let s = apply(createSeed(now), 'redeem', 'resident', {
    id: 'materials',
    creditType: 'starter',
  });
  assert.throws(
    () => apply(s, 'useVoucher', 'merchant', { id: s.vouchers[0].id }),
    /different merchant/,
  );
  s = redeem(approve(createSeed(now)));
  s.vouchers[0].expires = new Date(now.getTime() - 1).toISOString();
  assert.throws(
    () => apply(s, 'useVoucher', 'merchant', { id: s.vouchers[0].id }),
    /expired/,
  );
});
void test('pause stops new commitments but honors existing vouchers and refunds', () => {
  let s = redeem(approve(createSeed(now)));
  s = apply(s, 'pause', 'operator', { paused: true });
  assert.throws(() => apply(s, 'join', 'resident', { id: 'garden' }), /paused/);
  assert.equal(
    apply(s, 'useVoucher', 'merchant', { id: s.vouchers[0].id }).vouchers[0]
      .status,
    'Used',
  );
  assert.equal(
    apply(s, 'refundVoucher', 'operator', {
      id: s.vouchers[0].id,
      reason: 'Unable to fulfil.',
    }).vouchers[0].status,
    'Refunded',
  );
});
void test('out of stock and unacknowledged extra spend cannot reserve credits', () => {
  const s = approve(createSeed(now));
  s.rewards[0].stock = 0;
  assert.throws(() => redeem(s), /out of stock/);
  assert.throws(
    () => apply(s, 'redeem', 'resident', { id: 'learn' }),
    /Acknowledge/,
  );
});
void test('appeal is operator-only, time-limited, and cannot be repeated', () => {
  let s = apply(createSeed(now), 'review', 'reviewer', {
    id: 'claim-study',
    decision: 'reject',
    reason: 'More independent detail is needed.',
  });
  s = apply(s, 'appeal', 'resident', {
    id: 'claim-study',
    reason:
      'The organizer confirmed my help and can supply the attendance sheet.',
  });
  assert.throws(() => approve(s), /Appeals require/);
  s = apply(s, 'review', 'operator', {
    id: 'claim-study',
    decision: 'reject',
    reason: 'The original decision stands after checking the record.',
  });
  assert.throws(
    () =>
      apply(s, 'appeal', 'resident', {
        id: 'claim-study',
        reason: 'Please look at the same record once more.',
      }),
    /cannot be appealed again/,
  );
});
void test('grant tiers and budget cannot be exceeded', () => {
  const s = createSeed(now);
  assert.throws(
    () =>
      apply(s, 'grant', 'organizer', {
        id: 'garden',
        tier: 'Make',
        amount: 151,
        description: 'Plants and pots for all neighbours in the workshop.',
      }),
    /0 to 150/,
  );
  let g = apply(s, 'grant', 'organizer', {
    id: 'garden',
    tier: 'Make',
    amount: 150,
    description: 'Plants and pots for all neighbours in the workshop.',
  });
  g = apply(g, 'reviewGrant', 'operator', {
    id: g.grants[0].id,
    decision: 'approve',
    reason: 'Eligible workshop materials verified.',
  });
  assert.equal(g.grants[0].status, 'Approved');
  assert.throws(
    () =>
      apply(g, 'reviewGrant', 'operator', {
        id: g.grants[0].id,
        decision: 'approve',
        reason: 'A duplicate attempt.',
      }),
    /already been reviewed/,
  );
});
