import { actors, rate, wallet } from './model.ts';
import { ensure } from './rules.ts';
import { updateProfile } from './profile.ts';
import { isTown, selectedTown } from './towns.ts';
export { RuleError } from './rules.ts';
import { RuleError } from './rules.ts';
import type {
  PilotState,
  Command,
  Actor,
  ContributionRole,
  Transaction,
} from './model.ts';

const textValue = (value: unknown, label: string, min = 1, max = 2000) => {
  ensure(
    typeof value === 'string' &&
      value.trim().length >= min &&
      value.length <= max,
    `${label} must contain ${min}–${max} characters.`,
  );
  return value.trim();
};
const numberValue = (
  value: unknown,
  label: string,
  min: number,
  max: number,
) => {
  const n = Number(value);
  ensure(
    Number.isInteger(n) && n >= min && n <= max,
    `${label} must be a whole number from ${min} to ${max}.`,
  );
  return n;
};
export function execute(
  source: PilotState,
  command: Command,
  now = new Date(),
): { state: PilotState; message: string } {
  ensure(
    command &&
      typeof command.type === 'string' &&
      Object.hasOwn(actors, command.actor),
    'Choose a valid workspace view.',
  );
  ensure(
    typeof command.key === 'string' &&
      command.key.length >= 8 &&
      command.key.length <= 100,
    'A valid action reference is required.',
  );
  if (source.processed.includes(command.key))
    return { state: source, message: 'This action has already been saved.' };
  const s = structuredClone(source);
  const actor = actors[command.actor];
  const stamp = now.toISOString();
  const resident = 'mei';
  const allow = (...roles: Actor[]) =>
    ensure(
      roles.includes(command.actor),
      `This action requires the ${roles.join(' or ')} view.`,
    );
  const active = () =>
    ensure(
      !s.paused,
      'New commitments are paused. Existing vouchers and refunds are still supported.',
    );
  const activity = () => {
    const a = s.activities.find((a) => a.id === command.id);
    ensure(a, 'Activity not found.');
    return a;
  };
  const contribution = () => {
    const c = s.contributions.find((c) => c.id === command.id);
    ensure(c, 'Contribution not found.');
    return c;
  };
  const voucher = () => {
    const v = s.vouchers.find((v) => v.id === command.id);
    ensure(v, 'Voucher not found. Check the complete code.');
    return v;
  };
  const ledger = (
    type: Transaction['type'],
    creditType: Transaction['creditType'],
    available: number,
    reserved: number,
    description: string,
    reference: string,
  ) =>
    s.transactions.push({
      id: crypto.randomUUID(),
      resident,
      type,
      creditType,
      available,
      reserved,
      description,
      reference,
      created: stamp,
    });
  const notify = (message: string) => {
    s.notices.unshift({
      id: crypto.randomUUID(),
      text: message,
      created: stamp,
    });
  };
  let message = 'Saved to your workspace.';
  switch (command.type) {
    case 'switchRole': {
      ensure(
        typeof command.role === 'string' && Object.hasOwn(actors, command.role),
        'Choose a valid role.',
      );
      s.activeRole = command.role as Actor;
      message = actors[s.activeRole].title + ' workspace selected.';
      break;
    }
    case 'selectTown': {
      ensure(s.profile, 'Sign in before choosing your town.');
      ensure(isTown(command.town), 'Choose a town from the Singapore list.');
      s.town = command.town;
      s.profile.neighbourhood = command.town;
      s.profile.townConfirmedAt = stamp;
      message = `Your town is now ${command.town}.`;
      break;
    }
    case 'profileLogin':
    case 'profileImport':
    case 'profileDisconnect':
    case 'profileUpdate':
    case 'profilePhoto':
    case 'profileAttach':
    case 'profileRemoveDocument':
    case 'profileComplete': {
      const result = updateProfile(s.profile, command, stamp, selectedTown(s));
      s.profile = result.profile;
      message = result.message;
      break;
    }
    case 'join': {
      allow('resident');
      active();
      const a = activity();
      ensure(
        a.status === 'Open' && new Date(a.starts) > now,
        'This gathering is no longer accepting bookings.',
      );
      const existing = s.registrations.find(
        (r) =>
          r.activityId === a.id &&
          r.resident === resident &&
          r.status !== 'Cancelled',
      );
      ensure(
        !existing || existing.status === 'Waitlisted',
        'You already have a place at this gathering.',
      );
      const full =
        a.occupied +
          s.registrations.filter(
            (r) =>
              r.activityId === a.id &&
              ['Confirmed', 'Attended'].includes(r.status),
          ).length >=
        a.capacity;
      ensure(!existing || !full, 'You are already on the waitlist.');
      const b = wallet(s, resident, now.getTime());
      ensure(
        full || b.starter >= a.deposit,
        `You need ${a.deposit} starter credits for this deposit. You have ${b.starter}.`,
      );
      const r = existing || {
        id: crypto.randomUUID(),
        activityId: a.id,
        resident,
        created: stamp,
        role: 'Attend' as ContributionRole,
        status: 'Confirmed' as const,
        deposit: 0,
      };
      r.status = full ? 'Waitlisted' : 'Confirmed';
      r.deposit = full ? 0 : a.deposit;
      if (!existing) s.registrations.push(r);
      if (!full)
        ledger(
          'deposit',
          'starter',
          -a.deposit,
          a.deposit,
          `Place reserved · ${a.title}`,
          r.id,
        );
      message = full
        ? 'You’re on the waitlist. No credits have been reserved.'
        : `Your place is saved. ${a.deposit} starter credits are safely reserved.`;
      break;
    }
    case 'cancelBooking': {
      allow('resident');
      const r = s.registrations.find(
        (r) => r.id === command.id && r.resident === resident,
      );
      ensure(
        r && ['Confirmed', 'Waitlisted'].includes(r.status),
        'This booking cannot be cancelled.',
      );
      const a = s.activities.find((a) => a.id === r.activityId)!;
      const timely = new Date(a.starts).getTime() - now.getTime() >= 86400000;
      if (r.deposit)
        ledger(
          timely ? 'release' : 'forfeit',
          'starter',
          timely ? r.deposit : 0,
          -r.deposit,
          `${timely ? 'Booking cancelled · deposit returned' : 'Late cancellation · deposit forfeited'} · ${a.title}`,
          r.id,
        );
      r.status = 'Cancelled';
      message = timely
        ? 'Booking cancelled. Your deposit has been returned.'
        : 'Booking cancelled. The 24-hour deadline passed; the deposit was forfeited. You can request an exception in Help.';
      notify(
        `A place has opened at ${a.title}. Waitlisted neighbours can reserve it.`,
      );
      break;
    }
    case 'interest': {
      allow('resident');
      const a = activity();
      ensure(a.status === 'Proposed', 'This activity is already scheduled.');
      ensure(
        !a.interests.includes(resident),
        'Your interest is already recorded.',
      );
      a.interests.push(resident);
      message = 'You’re on the interest list. We’ll keep you in the loop.';
      if (a.interests.length >= 10)
        notify(`${a.title} has enough interest to start planning.`);
      break;
    }
    case 'propose': {
      allow('resident', 'organizer');
      active();
      if (command.plannerId)
        ensure(
          typeof command.plannerId === 'string' &&
            command.plannerId.length <= 80 &&
            !s.activities.some((a) => a.plannerId === command.plannerId),
          'This proposal has already been submitted.',
        );
      const title = textValue(command.title, 'Title', 5, 100);
      const starts = new Date(textValue(command.starts, 'Start date'));
      ensure(
        Number.isFinite(starts.getTime()) && starts > now,
        'Choose a future date and time.',
      );
      const category = textValue(command.category, 'Category');
      ensure(
        [
          'Outdoors',
          'Arts & crafts',
          'Wellness',
          'Learning',
          'Interest groups',
        ].includes(category),
        'Choose a supported category.',
      );
      const safety = textValue(
        command.safety,
        'Safety and access plan',
        20,
        2000,
      );
      ensure(
        command.agreed === true,
        'Confirm that the activity is local, safe, and does not involve cash transfers.',
      );
      s.activities.push({
        id: crypto.randomUUID(),
        town: selectedTown(s),
        plannerId:
          typeof command.plannerId === 'string' ? command.plannerId : undefined,
        title,
        category,
        description: textValue(command.description, 'Description', 20),
        location: textValue(command.location, 'Meeting place', 4, 150),
        starts: starts.toISOString(),
        ends: new Date(
          starts.getTime() +
            numberValue(
              command.durationMinutes ?? 120,
              'Duration in minutes',
              30,
              480,
            ) *
              60000,
        ).toISOString(),
        capacity: numberValue(command.capacity, 'Capacity', 2, 50),
        occupied: 0,
        deposit: 2,
        organizer: actor.id,
        status: 'Proposed',
        color: 'green',
        requirements:
          'Adult residents. Beginners welcome. Please share access needs with the organizer.',
        safety,
        bonus: 0,
        interests: [],
      });
      message =
        'Your proposal is ready for an organiser to review and publish.';
      break;
    }
    case 'approveActivity': {
      allow('organizer', 'operator');
      active();
      const a = activity();

      ensure(
        a.status === 'Proposed',
        'This proposal has already been reviewed.',
      );
      ensure(
        a.safety.length >= 20 && new Date(a.starts) > now,
        'A future date and safety plan are required.',
      );
      a.status = 'Open';
      if (command.actor === 'organizer') a.organizer = actor.id;
      message = 'The gathering is approved and open for bookings.';
      break;
    }
    case 'cancelActivity': {
      allow('organizer', 'operator');
      const a = activity();
      ensure(
        command.actor === 'operator' || a.organizer === actor.id,
        'Only the organizer can cancel this activity.',
      );
      ensure(
        ['Open', 'Proposed'].includes(a.status),
        'This activity cannot be cancelled.',
      );
      const reason = textValue(command.reason, 'Cancellation reason', 5);
      a.status = 'Cancelled';
      for (const r of s.registrations.filter(
        (r) =>
          r.activityId === a.id &&
          ['Confirmed', 'Waitlisted'].includes(r.status),
      )) {
        if (r.deposit)
          ledger(
            'release',
            'starter',
            r.deposit,
            -r.deposit,
            `Organizer cancelled · ${a.title}`,
            r.id,
          );
        r.status = 'Cancelled';
      }
      message = `Activity cancelled and all deposits returned. ${reason}`;
      break;
    }
    case 'completeActivity': {
      allow('organizer');
      const a = activity();
      ensure(
        a.organizer === actor.id && a.status === 'Open',
        'Only the organizer can complete an open gathering.',
      );
      a.status = 'Completed';
      a.ends = stamp;
      if (new Date(a.starts) > now)
        a.starts = new Date(now.getTime() - 7200000).toISOString();
      message = 'Session completed. You can now confirm attendance.';
      break;
    }
    case 'openSpot': {
      allow('organizer');
      const a = activity();
      ensure(
        a.organizer === actor.id && a.status === 'Open' && a.occupied > 0,
        'No held place is available to release.',
      );
      a.occupied--;
      notify(
        `A place has opened at ${a.title}. The waitlisted resident can now reserve it.`,
      );
      message = 'One held place has been released. A place is now available.';
      break;
    }
    case 'attendance': {
      allow('organizer', 'operator');
      const r = s.registrations.find((r) => r.id === command.id);
      ensure(
        r && r.status === 'Confirmed',
        'Attendance has already been handled or the booking is not confirmed.',
      );
      const a = s.activities.find((a) => a.id === r.activityId)!;
      ensure(
        command.actor === 'operator' || a.organizer === actor.id,
        'Only the activity organizer can mark attendance.',
      );
      ensure(
        a.status === 'Completed',
        'Complete the session before marking attendance.',
      );
      const role = command.role as ContributionRole;
      ensure(Object.hasOwn(rate, role), 'Choose a valid contribution role.');
      r.role = role;
      r.status = 'Attended';
      if (r.deposit)
        ledger(
          'release',
          'starter',
          r.deposit,
          -r.deposit,
          `Attendance confirmed · ${a.title}`,
          r.id,
        );
      message =
        'Attendance confirmed and deposit returned. The resident can submit a contribution.';
      break;
    }
    case 'claim': {
      allow('resident');
      const a = activity();
      ensure(
        a.status === 'Completed',
        'Contributions can only be submitted after a completed activity.',
      );
      const r = s.registrations.find(
        (r) =>
          r.activityId === a.id &&
          r.resident === resident &&
          r.status === 'Attended',
      );
      ensure(r, 'The organizer must confirm your attendance first.');
      ensure(
        !s.contributions.some(
          (c) =>
            c.activityId === a.id &&
            c.resident === resident &&
            c.status !== 'Cancelled',
        ),
        'Only one contribution per gathering is allowed. Use the existing claim.',
      );
      const evidence = (command.evidence as string[]) || [];
      ensure(
        Array.isArray(evidence) &&
          evidence.length <= 3 &&
          evidence.every((e) => typeof e === 'string' && e.length < 200),
        'Attach up to three evidence files.',
      );
      s.contributions.push({
        id: crypto.randomUUID(),
        activityId: a.id,
        resident,
        role: r.role,
        description: textValue(
          command.description,
          'Contribution description',
          20,
        ),
        evidence,
        status: 'Pending',
        created: stamp,
      });
      message =
        'Your contribution is in the independent review queue. Allow about 24 hours.';
      break;
    }
    case 'cancelClaim': {
      allow('resident');
      const c = contribution();
      ensure(
        c.resident === resident &&
          ['Pending', 'More evidence'].includes(c.status),
        'Only an unreviewed claim can be cancelled.',
      );
      c.status = 'Cancelled';
      message = 'Claim cancelled. You can submit a corrected contribution.';
      break;
    }
    case 'appeal': {
      allow('resident');
      const c = contribution();
      ensure(
        c.resident === resident && c.status === 'Rejected' && !c.appealed,
        'This contribution cannot be appealed again.',
      );
      ensure(
        now.getTime() - new Date(c.reviewed!).getTime() <= 7 * 86400000,
        'The seven-day appeal window has ended. Contact the operator.',
      );
      c.description += `\n\nAppeal: ${textValue(command.reason, 'Appeal explanation', 20)}`;
      c.appealed = true;
      c.status = 'Appealed';
      message = 'Your appeal is with the operator. Allow up to three days.';
      break;
    }
    case 'resubmit': {
      allow('resident');
      const c = contribution();
      ensure(
        c.resident === resident && c.status === 'More evidence',
        'This claim is not waiting for more evidence.',
      );
      c.description += `\n\nAdditional evidence: ${textValue(command.reason, 'Additional evidence', 20)}`;
      c.status = 'Pending';
      message = 'Your additional evidence has been sent for review.';
      break;
    }
    case 'review': {
      allow('reviewer', 'operator');
      const c = contribution();
      const a = s.activities.find((a) => a.id === c.activityId)!;
      ensure(
        c.resident !== actor.id && a.organizer !== actor.id,
        'You cannot review your own contribution or an activity you organized.',
      );
      ensure(
        ['Pending', 'Appealed'].includes(c.status),
        'This claim has already been reviewed.',
      );
      ensure(
        c.status !== 'Appealed' || command.actor === 'operator',
        'Appeals require the operator.',
      );
      const decision = command.decision;
      ensure(
        ['approve', 'reject', 'more'].includes(String(decision)),
        'Choose a review decision.',
      );
      c.reviewed = stamp;
      c.reviewer = actor.id;
      c.reason = textValue(command.reason, 'Review note', 5);
      if (decision === 'approve') {
        active();
        const b = wallet(s, c.resident, now.getTime());
        ensure(
          now.getTime() < new Date(s.periodStart).getTime() + 56 * 86400000,
          'The eight-week programme earning window has ended.',
        );
        const amount = Math.min(
          rate[c.role] + Math.min(a.bonus, 10),
          Math.max(0, 100 - b.periodEarned),
        );
        c.status = 'Approved';
        c.awarded = amount;
        if (amount)
          ledger(
            'earned',
            'earned',
            amount,
            0,
            `${c.role} · ${a.title} · verified by ${actor.name}`,
            c.id,
          );
        message = `Contribution approved. ${amount} earned credits awarded${amount < rate[c.role] + a.bonus ? ' within the period cap' : ''}.`;
      } else {
        c.status = decision === 'reject' ? 'Rejected' : 'More evidence';
        message =
          decision === 'reject'
            ? 'Contribution rejected with your explanation.'
            : 'The resident has been asked for more evidence.';
      }
      break;
    }
    case 'redeem': {
      allow('resident');
      active();
      const r = s.rewards.find((r) => r.id === command.id);
      ensure(r, 'Reward not found.');
      ensure(r.stock > 0, 'This reward is out of stock.');
      ensure(
        !r.extra || command.acknowledged === true,
        `Acknowledge the S$${r.extra} additional payment first.`,
      );
      const creditType =
        command.creditType === 'starter' ? 'starter' : 'earned';
      ensure(
        creditType === 'earned' || r.pathway === 'Community',
        'Starter credits can only pay for approved community benefits.',
      );
      const b = wallet(s, resident, now.getTime());
      ensure(
        b[creditType] >= r.cost,
        `You need ${r.cost} ${creditType} credits; you have ${b[creditType]}. No credits were deducted.`,
      );
      const id = crypto.randomUUID();
      r.stock--;
      ledger(
        'redeem',
        creditType,
        -r.cost,
        r.simulated ? r.cost : 0,
        `${r.simulated ? 'Awaiting partner fulfilment' : 'Voucher issued'} · ${r.title}`,
        id,
      );
      s.vouchers.unshift({
        id,
        rewardId: r.id,
        resident,
        cost: r.cost,
        creditType,
        status: r.simulated ? 'Pending' : 'Active',
        issued: stamp,
        expires: new Date(now.getTime() + 30 * 86400000).toISOString(),
        merchant: r.merchant,
        idempotency: command.key,
      });
      message = r.simulated
        ? 'Your request is pending. Credits are reserved until fulfilment is confirmed or the request is released.'
        : 'Your voucher is ready in your wallet. It is valid for 30 days and can be used once.';
      break;
    }
    case 'fulfilPartner': {
      allow('operator');
      const v = voucher();
      ensure(v.status === 'Pending', 'This request is no longer pending.');
      ensure(
        command.result === 'confirm' || command.result === 'fail',
        'Choose confirmed or failed fulfilment.',
      );
      if (command.result === 'confirm') {
        ledger(
          'redeem',
          v.creditType,
          0,
          -v.cost,
          'Partner fulfilment confirmed',
          v.id,
        );
        v.status = 'Active';
        message = 'Partner fulfilment recorded.';
      } else {
        ledger(
          'refund',
          v.creditType,
          v.cost,
          -v.cost,
          'Partner fulfilment failed · credits released',
          v.id,
        );
        v.status = 'Refunded';
        s.rewards.find((r) => r.id === v.rewardId)!.stock++;
        message =
          'The request was released. Reserved credits have been returned to their original balance.';
      }
      break;
    }
    case 'useVoucher': {
      allow('merchant');
      const v = voucher();
      ensure(
        v.merchant === actor.id,
        'This voucher belongs to a different merchant.',
      );
      ensure(
        v.status === 'Active',
        v.status === 'Used'
          ? `Already used on ${v.used}. A voucher can only be used once.`
          : 'This voucher is not active.',
      );
      ensure(
        new Date(v.expires) > now,
        'This voucher has expired. Contact the operator.',
      );
      v.status = 'Used';
      v.used = stamp;
      message = 'Voucher accepted and recorded for settlement.';
      break;
    }
    case 'refundVoucher': {
      allow('operator');
      const v = voucher();
      ensure(
        ['Active', 'Pending'].includes(v.status),
        'Only unused or pending vouchers can be refunded.',
      );
      const reason = textValue(command.reason, 'Refund reason', 5);
      ledger(
        'refund',
        v.creditType,
        v.cost,
        v.status === 'Pending' ? -v.cost : 0,
        `Voucher refunded · ${reason}`,
        v.id,
      );
      v.status = 'Refunded';
      s.rewards.find((r) => r.id === v.rewardId)!.stock++;
      message = 'Voucher voided. Credits returned to the original credit type.';
      break;
    }
    case 'grant': {
      allow('organizer');
      active();
      const a = activity();
      ensure(
        a.organizer === actor.id,
        'You can request support only for your own activity.',
      );
      const tier = command.tier;
      ensure(
        tier === 'Meet' || tier === 'Make' || tier === 'Grow',
        'Choose a grant tier.',
      );
      ensure(
        !s.grants.some((g) => g.activityId === a.id && g.status !== 'Rejected'),
        'A grant request already exists for this activity.',
      );
      const max = tier === 'Meet' ? 0 : tier === 'Make' ? 150 : 750;
      const amount = numberValue(command.amount, 'Grant amount', 0, max);
      s.grants.push({
        id: crypto.randomUUID(),
        activityId: a.id,
        applicant: actor.id,
        tier,
        amount,
        description: textValue(command.description, 'Spending plan', 20),
        status: 'Pending',
      });
      message = 'Your grant request is ready for operator review.';
      break;
    }
    case 'reviewGrant': {
      allow('operator');
      const g = s.grants.find((g) => g.id === command.id);
      ensure(
        g && g.status === 'Pending',
        'This grant has already been reviewed.',
      );
      ensure(g.applicant !== actor.id, 'You cannot approve your own grant.');
      ensure(
        command.decision === 'approve' || command.decision === 'reject',
        'Choose approve or reject.',
      );
      g.reason = textValue(command.reason, 'Grant decision reason', 5);
      if (command.decision === 'approve') {
        active();
        ensure(
          s.grants
            .filter((g) => g.status === 'Approved')
            .reduce((n, g) => n + g.amount, 0) +
            g.amount <=
            1500,
          'The S$1,500 grant budget would be exceeded.',
        );
        g.status = 'Approved';
      } else g.status = 'Rejected';
      message = `Grant ${g.status.toLowerCase()}.`;
      break;
    }
    case 'stock': {
      allow('operator');
      const r = s.rewards.find((r) => r.id === command.id);
      ensure(r, 'Reward not found.');
      r.stock = numberValue(command.stock, 'Available stock', 0, 1000);
      message = 'Reward availability updated.';
      break;
    }
    case 'pause': {
      allow('operator');
      ensure(typeof command.paused === 'boolean', 'Choose pause or resume.');
      s.paused = command.paused;
      message = s.paused
        ? 'New commitments paused. Existing benefits remain supported.'
        : 'New commitments resumed.';
      break;
    }
    case 'report': {
      allow('resident', 'organizer');
      s.incidents.unshift({
        id: crypto.randomUUID(),
        resident: actor.id,
        description: textValue(command.description, 'Your concern', 20),
        created: stamp,
        status: 'Open',
      });
      message =
        'Your concern is recorded for the operator. You can track it here.';
      break;
    }
    case 'resolve': {
      allow('operator');
      const i = s.incidents.find((i) => i.id === command.id);
      ensure(i && i.status === 'Open', 'This concern is already resolved.');
      i.resolution = textValue(command.reason, 'Resolution', 10);
      i.status = 'Resolved';
      message = 'Concern resolved with a recorded explanation.';
      break;
    }
    default:
      throw new RuleError('Unknown action.');
  }
  const b = wallet(s, resident, now.getTime());
  ensure(
    b.earned >= 0 && b.starter >= 0 && b.reserved >= 0,
    'This action would create an invalid credit balance.',
  );
  ensure(
    s.rewards.every((r) => r.stock >= 0),
    'This action would over-allocate a reward.',
  );
  s.processed.push(command.key);
  // Account preferences remain in the private event audit, not the community feed.
  if (
    !['selectTown', 'switchRole'].includes(command.type) &&
    !command.type.startsWith('profile')
  )
    notify(message);
  return { state: s, message };
}
