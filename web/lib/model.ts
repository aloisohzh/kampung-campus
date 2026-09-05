import type { ResidentProfile } from './profile.ts';
export type Actor =
  | 'resident'
  | 'organizer'
  | 'reviewer'
  | 'operator'
  | 'merchant';
export type ContributionRole =
  | 'Attend'
  | 'Helper'
  | 'Co-host'
  | 'Host'
  | 'Mentor';
export type Activity = {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  starts: string;
  ends: string;
  capacity: number;
  occupied: number;
  deposit: number;
  organizer: string;
  status: 'Open' | 'Completed' | 'Proposed' | 'Cancelled';
  image?: string;
  color: string;
  requirements: string;
  safety: string;
  bonus: number;
  interests: string[];
};
export type Registration = {
  id: string;
  activityId: string;
  resident: string;
  status: 'Confirmed' | 'Waitlisted' | 'Attended' | 'Cancelled';
  deposit: number;
  created: string;
  role: ContributionRole;
};
export type Contribution = {
  id: string;
  activityId: string;
  resident: string;
  role: ContributionRole;
  description: string;
  evidence: string[];
  status:
    | 'Pending'
    | 'Approved'
    | 'Rejected'
    | 'More evidence'
    | 'Appealed'
    | 'Cancelled';
  created: string;
  reviewed?: string;
  reviewer?: string;
  reason?: string;
  awarded?: number;
  appealed?: boolean;
};
export type Reward = {
  id: string;
  title: string;
  partner: string;
  pathway: 'Everyday' | 'Community' | 'Sport & culture' | 'Learning';
  cost: number;
  value: number;
  boost: number;
  stock: number;
  simulated: boolean;
  description: string;
  color: string;
  extra: number;
  merchant: string;
};
export type Voucher = {
  id: string;
  rewardId: string;
  resident: string;
  cost: number;
  creditType: 'starter' | 'earned';
  status: 'Active' | 'Used' | 'Refunded' | 'Pending';
  issued: string;
  expires: string;
  used?: string;
  merchant: string;
  idempotency: string;
};
export type Transaction = {
  id: string;
  type:
    | 'starter'
    | 'earned'
    | 'deposit'
    | 'refund'
    | 'redeem'
    | 'release'
    | 'forfeit';
  creditType: 'starter' | 'earned';
  available: number;
  reserved: number;
  description: string;
  created: string;
  reference: string;
  resident: string;
};
export type Grant = {
  id: string;
  activityId: string;
  applicant: string;
  tier: 'Meet' | 'Make' | 'Grow';
  amount: number;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
};
export type Incident = {
  id: string;
  resident: string;
  description: string;
  created: string;
  status: 'Open' | 'Resolved';
  resolution?: string;
};
export type PilotState = {
  profile?: ResidentProfile;
  version: 1;
  created: string;
  periodStart: string;
  paused: boolean;
  activities: Activity[];
  registrations: Registration[];
  contributions: Contribution[];
  rewards: Reward[];
  vouchers: Voucher[];
  transactions: Transaction[];
  grants: Grant[];
  incidents: Incident[];
  notices: { id: string; text: string; created: string }[];
  processed: string[];
};
export type Command = {
  type: string;
  actor: Actor;
  key: string;
  [key: string]: unknown;
};
export const actors: Record<
  Actor,
  { id: string; name: string; title: string }
> = {
  resident: { id: 'mei', name: 'Mei Lin', title: 'Resident' },
  organizer: { id: 'farah', name: 'Farah Ahmad', title: 'Organizer' },
  reviewer: { id: 'daniel', name: 'Daniel Tan', title: 'Reviewer' },
  operator: { id: 'priya', name: 'Priya Nair', title: 'Operator' },
  merchant: { id: 'pek-kio-kopi', name: 'Pek Kio Kopi', title: 'Merchant' },
};
export const rate: Record<ContributionRole, number> = {
  Attend: 5,
  Helper: 10,
  'Co-host': 10,
  Host: 20,
  Mentor: 20,
};
export function wallet(state: PilotState, resident = 'mei', now = Date.now()) {
  const tx = state.transactions.filter((t) => t.resident === resident);
  const sum = (type: string, field: 'available' | 'reserved') =>
    tx.filter((t) => t.creditType === type).reduce((n, t) => n + t[field], 0);
  const start = new Date(state.periodStart).getTime();
  const period = Math.min(
    1,
    Math.floor(Math.max(0, now - start) / (28 * 86400000)),
  );
  const periodStart = start + period * 28 * 86400000;
  const periodEarned = tx
    .filter(
      (t) =>
        t.type === 'earned' && new Date(t.created).getTime() >= periodStart,
    )
    .reduce((n, t) => n + t.available, 0);
  return {
    starter: sum('starter', 'available'),
    earned: sum('earned', 'available'),
    reserved: sum('starter', 'reserved') + sum('earned', 'reserved'),
    pending: state.contributions
      .filter(
        (c) =>
          c.resident === resident &&
          ['Pending', 'Appealed', 'More evidence'].includes(c.status),
      )
      .reduce(
        (n, c) =>
          n +
          rate[c.role] +
          (state.activities.find((a) => a.id === c.activityId)?.bonus || 0),
        0,
      ),
    periodEarned,
    period: period + 1,
    periodEnds: new Date(periodStart + 28 * 86400000).toISOString(),
  };
}
