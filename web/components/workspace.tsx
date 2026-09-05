'use client';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  HeartHandshake,
  Wallet,
  Gift,
  Sprout,
  Coffee,
  GraduationCap,
  Waves,
  Download,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Pause,
  Play,
  CircleHelp,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  type PilotState,
  type Actor,
  type Activity,
  type Reward,
  type Voucher,
  rate,
  wallet,
  actors,
} from '@/lib/model';
import { date, time, type Run } from '@/lib/presentation';
import VoucherCode from './voucher-code';
import ActionDialog, { type Action, type Field } from './action-dialog';

const note: Field = {
  name: 'reason',
  label: 'Your explanation',
  type: 'textarea',
  min: 5,
};
const roles = Object.keys(rate);
function Status({ value }: { value: string }) {
  return (
    <span className={`status ${value.toLowerCase().replaceAll(' ', '-')}`}>
      {value}
    </span>
  );
}
function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <Sprout />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
function csv(name: string, rows: (string | number | null | undefined)[][]) {
  const content = rows
    .map((row) =>
      row
        .map((cell) => {
          let v = String(cell ?? '');
          if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
          return `"${v.replaceAll('"', '""')}"`;
        })
        .join(','),
    )
    .join('\r\n');
  const url = URL.createObjectURL(
    new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Workspace({
  state,
  page,
  actor,
  now,
  run,
  error,
  busy,
  go,
  chooseActor,
  onActivity,
}: {
  state: PilotState;
  page: string;
  actor: Actor;
  now: number;
  run: Run;
  error: string;
  busy: boolean;
  go: (page: string) => void;
  chooseActor: (actor: string) => void;
  onActivity: (a: Activity) => void;
}) {
  const [action, setAction] = useState<Action | null>(null),
    [tab, setTab] = useState('All'),
    [voucherCode, setVoucherCode] = useState(''),
    [checkedCode, setCheckedCode] = useState(''),
    [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const b = wallet(state, 'mei', now),
    pending = state.contributions.filter((c) =>
      ['Pending', 'Appealed'].includes(c.status),
    ),
    approved = state.contributions.filter((c) => c.status === 'Approved');
  const title = (id: string) =>
    state.activities.find((a) => a.id === id)?.title || 'Community gathering';
  const ask = (
    type: string,
    title: string,
    description: string,
    payload: Record<string, unknown> = {},
    fields: Field[] = [],
    submit = 'Confirm',
  ) => setAction({ type, title, description, payload, fields, submit });
  const review = (id: string, decision: string) =>
    ask(
      'review',
      decision === 'approve'
        ? 'Approve this contribution?'
        : decision === 'reject'
          ? 'Explain your decision'
          : 'Ask for more evidence',
      'Your decision is recorded with your name. Credits are awarded only after approval.',
      { id, decision },
      [
        {
          ...note,
          value:
            decision === 'approve'
              ? 'Organizer attendance and contribution description verified.'
              : '',
        },
      ],
      decision === 'approve' ? 'Approve & award credits' : 'Save decision',
    );
  const openReward = (r: Reward) =>
    ask(
      'redeem',
      r.title,
      `${r.description} ${r.cost} credits = S$${r.cost / 10}${r.boost ? ` + S$${r.boost} sponsor boost` : ''}. Funded by the sample pilot reward allocation. ${r.stock} available. Adult pilot residents only. Valid 30 days. No minimum spend. Unused vouchers can be refunded by the operator if fulfilment fails. ${r.simulated ? 'SIMULATED FOR PILOT — no real booking or credit conversion.' : 'DEMO VOUCHER — no real monetary value.'}`,
      { id: r.id },
      [
        ...(r.pathway === 'Community'
          ? [
              {
                name: 'creditType',
                label: 'Pay with',
                type: 'select' as const,
                options: ['starter', 'earned'],
                value: 'starter',
              },
            ]
          : []),
        ...(r.extra
          ? [
              {
                name: 'acknowledged',
                label: `I understand that I would pay an additional S$${r.extra}.`,
                type: 'checkbox' as const,
              },
            ]
          : []),
      ],
      r.simulated ? 'Request sample benefit' : `Redeem ${r.cost} credits`,
    );
  const ownRegistrations = state.registrations.filter(
    (r) => r.resident === 'mei',
  );
  const used = state.vouchers.filter((v) => v.status === 'Used');
  const grants = state.grants
    .filter((g) => g.status === 'Approved')
    .reduce((n, g) => n + g.amount, 0);
  const exportLedger = () =>
    csv('kampung-credit-history.csv', [
      [
        'Date',
        'Type',
        'Credit type',
        'Available change',
        'Reserved change',
        'Description',
        'Reference',
      ],
      ...state.transactions.map((t) => [
        t.created,
        t.type,
        t.creditType,
        t.available,
        t.reserved,
        t.description,
        t.reference,
      ]),
    ]);
  const voucherList = (list: Voucher[]) =>
    list.length ? (
      list.map((v) => {
        const r = state.rewards.find((r) => r.id === v.rewardId)!;
        const expired = new Date(v.expires).getTime() < now;
        return (
          <div className="voucher" key={v.id}>
            <div className="voucher-top">
              <div>
                <h3>{r.title}</h3>
                <p>
                  {r.partner} · S${r.value} sample value
                </p>
              </div>
              <Status
                value={v.status === 'Active' && expired ? 'Expired' : v.status}
              />
            </div>
            <code>{v.id}</code>
            <p>
              {v.cost} {v.creditType} credits · expires {date(v.expires)}
            </p>
            <div className="row-actions">
              <Button variant="outline" onClick={() => setSelectedVoucher(v)}>
                <Gift size={15} />
                View voucher
              </Button>
              {actor === 'operator' &&
                ['Active', 'Pending'].includes(v.status) && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      ask(
                        'refundVoucher',
                        'Refund this voucher?',
                        'The unused voucher will be voided. Its original credit type and available stock will be restored.',
                        { id: v.id },
                        [note],
                        'Refund voucher',
                      )
                    }
                  >
                    Refund
                  </Button>
                )}
              {actor === 'operator' && v.status === 'Pending' && (
                <>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      ask(
                        'fulfilPartner',
                        'Confirm simulated fulfilment?',
                        'This completes only the sample request; it does not contact an external partner.',
                        { id: v.id, result: 'confirm' },
                        [],
                        'Confirm simulation',
                      )
                    }
                  >
                    Simulate success
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      ask(
                        'fulfilPartner',
                        'Simulate fulfilment failure?',
                        'Reserved credits will be returned to the original balance.',
                        { id: v.id, result: 'fail' },
                        [],
                        'Release credits',
                      )
                    }
                  >
                    Simulate failure
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })
    ) : (
      <Empty
        title="Your next little reward is waiting"
        description="Redeem a reward and your voucher will appear here."
      />
    );
  const rolePage = ['organizer', 'reviewer', 'operator', 'merchant'].includes(
    page,
  );
  const wrongRole = rolePage && actor !== page;
  let content;
  if (wrongRole)
    content = (
      <div className="panel">
        <h2>Open the {page} demonstration</h2>
        <p className="muted">
          Each view uses a separate sample actor in your private sandbox.
        </p>
        <Button className="mt-5" onClick={() => chooseActor(page)}>
          Switch to {page} view
        </Button>
      </div>
    );
  else if (page === 'wallet')
    content = (
      <>
        <div className="stats-grid">
          {[
            {
              label: 'Available earned',
              value: b.earned,
              desc: 'Ready for everyday rewards',
              icon: Wallet,
            },
            {
              label: 'Starter credits',
              value: b.starter,
              desc: 'Deposits & community benefits',
              icon: Sprout,
            },
            {
              label: 'Pending approval',
              value: b.pending,
              desc: 'Estimated, subject to the period cap',
              icon: Clock3,
            },
            {
              label: 'Safely reserved',
              value: b.reserved,
              desc: 'Bookings & pending partner requests',
              icon: ShieldCheck,
            },
          ].map((x) => (
            <div className="stat-card" key={x.label}>
              <span className="label">
                <x.icon size={17} />
                {x.label}
              </span>
              <strong>{x.value}</strong>
              <p>{x.desc}</p>
            </div>
          ))}
        </div>
        <div className="two-columns">
          <div>
            <section className="panel">
              <div className="section-actions">
                <h2>Your credit history</h2>
                <Button variant="outline" onClick={exportLedger}>
                  <Download size={15} />
                  Export CSV
                </Button>
              </div>
              <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
                <TabsList className="category-tabs">
                  {['All', 'Earned', 'Deposits', 'Rewards'].map((t) => (
                    <TabsTrigger key={t} value={t}>
                      {t}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Moment</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...state.transactions]
                    .reverse()
                    .filter(
                      (t) =>
                        tab === 'All' ||
                        !['Earned', 'Deposits', 'Rewards'].includes(tab) ||
                        (tab === 'Earned' && t.type === 'earned') ||
                        (tab === 'Deposits' &&
                          ['deposit', 'release', 'forfeit'].includes(t.type)) ||
                        (tab === 'Rewards' &&
                          ['redeem', 'refund'].includes(t.type)),
                    )
                    .map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <strong>{t.description}</strong>
                          <p className="caption">
                            {date(t.created)} · {time(t.created)}
                          </p>
                        </TableCell>
                        <TableCell className="big-value">
                          {t.available > 0 ? '+' : ''}
                          {t.available}
                          {t.reserved !== 0 && (
                            <p className="caption">
                              {t.reserved > 0 ? '+' : ''}
                              {t.reserved} reserved
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Status value={t.creditType} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </section>
            <section className="panel">
              <h2>Your vouchers & requests</h2>
              {voucherList(state.vouchers)}
            </section>
          </div>
          <aside>
            <section className="panel">
              <h2>A little each time adds up</h2>
              <p className="muted">
                Period {b.period} · resets {date(b.periodEnds)}
              </p>
              <p className="big-value my-5">
                {b.periodEarned}{' '}
                <span className="caption">/ 100 earned credits</span>
              </p>
              <Progress value={b.periodEarned} className="campus-progress" />
              <p className="caption mt-4">
                {b.periodEarned >= 100
                  ? 'You’ve reached this period’s cap. Contributions still count toward your permanent record.'
                  : `${100 - b.periodEarned} credits left to earn this period.`}
              </p>
              <Button
                className="mt-5"
                variant="outline"
                onClick={() => go('contributions')}
              >
                View contribution record
                <ArrowRight size={15} />
              </Button>
            </section>
            <section className="panel">
              <h2>What’s reserved?</h2>
              {ownRegistrations
                .filter((r) => r.status === 'Confirmed' && r.deposit > 0)
                .map((r) => (
                  <div className="row" key={r.id}>
                    <div className="row-main">
                      <h3>{title(r.activityId)}</h3>
                      <p>Returned after attendance or timely cancellation</p>
                    </div>
                    <strong>{r.deposit}</strong>
                  </div>
                ))}
              {state.vouchers
                .filter((v) => v.status === 'Pending')
                .map((v) => (
                  <div className="row" key={v.id}>
                    <div className="row-main">
                      <h3>
                        {
                          state.rewards.find((r) => r.id === v.rewardId)
                            ?.partner
                        }
                      </h3>
                      <p>Awaiting sample fulfilment</p>
                    </div>
                    <strong>{v.cost}</strong>
                  </div>
                ))}
              {!b.reserved && (
                <p className="muted">Nothing reserved at the moment.</p>
              )}
            </section>
            <div className="info-box">
              <strong>50 credits = S$5</strong>
              <p>
                Starter credits are for deposits and approved community
                benefits. Earned credits can be redeemed across all four reward
                pathways.
              </p>
              <Button className="mt-4" onClick={() => go('rewards')}>
                Explore rewards
                <ArrowRight size={15} />
              </Button>
            </div>
          </aside>
        </div>
      </>
    );
  else if (page === 'activities')
    content = (
      <>
        <div className="section-actions">
          <h2>
            {ownRegistrations.filter((r) => r.status === 'Confirmed').length}{' '}
            upcoming plans
          </h2>
          <Button onClick={() => go('discover')}>
            Find a gathering
            <ArrowUpRight size={16} />
          </Button>
        </div>
        <section className="panel">
          {ownRegistrations.length ? (
            ownRegistrations.map((r) => {
              const a = state.activities.find((a) => a.id === r.activityId)!;
              const existing = state.contributions.find(
                (c) => c.activityId === a.id && c.status !== 'Cancelled',
              );
              return (
                <div className="row" key={r.id}>
                  <span className={`mini-icon ${a.color}`}>
                    <CalendarDays />
                  </span>
                  <div className="row-main">
                    <h3>{a.title}</h3>
                    <p>
                      {date(a.starts)} · {a.location}
                    </p>
                    <p>
                      {r.status === 'Confirmed'
                        ? `${r.deposit} starter credits reserved`
                        : r.status === 'Attended'
                          ? 'Attendance confirmed · your contribution makes a difference'
                          : r.status === 'Waitlisted'
                            ? 'No deposit reserved. We’ll let you know when a spot opens.'
                            : 'Booking cancelled'}
                    </p>
                  </div>
                  <Status value={r.status} />
                  <div className="row-actions">
                    <Button variant="outline" onClick={() => onActivity(a)}>
                      Details
                    </Button>
                    {['Confirmed', 'Waitlisted'].includes(r.status) && (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          ask(
                            'cancelBooking',
                            'Cancel your place?',
                            'Deposits are returned when you cancel at least 24 hours before the gathering. Later cancellations forfeit the deposit. You can ask the operator for an exception in Help.',
                            { id: r.id },
                            [],
                            'Cancel booking',
                          )
                        }
                      >
                        Cancel booking
                      </Button>
                    )}
                    {r.status === 'Waitlisted' && (
                      <Button
                        disabled={busy}
                        onClick={() => run('join', { id: a.id })}
                      >
                        Check for a place
                      </Button>
                    )}
                    {r.status === 'Attended' && !existing && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          ask(
                            'claim',
                            'Tell us how you contributed',
                            `Farah confirmed your ${r.role.toLowerCase()} role. The published reward is ${rate[r.role]} credits${a.bonus ? ` + ${a.bonus} mission credits` : ''}, subject to the period cap. An independent reviewer will check your claim.`,
                            { id: a.id },
                            [
                              {
                                name: 'description',
                                label: 'What did you do?',
                                type: 'textarea',
                                min: 20,
                              },
                              {
                                name: 'evidence',
                                label:
                                  'Evidence (optional with organizer confirmation)',
                                type: 'file',
                              },
                            ],
                            'Submit contribution',
                          )
                        }
                      >
                        Submit contribution
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <Empty
              title="Make your first plan"
              description="Find a gathering that interests you and reserve your place."
            />
          )}
        </section>
      </>
    );
  else if (page === 'contributions') {
    const helps = approved.filter((c) => c.role === 'Helper').length,
      cohosts = approved.filter((c) => c.role === 'Co-host').length;
    content = (
      <>
        <div className="two-columns">
          <section className="panel">
            <div className="section-actions">
              <h2>Your contribution story</h2>
              <Button
                variant="outline"
                onClick={() =>
                  csv('kampung-contributions.csv', [
                    [
                      'Activity',
                      'Role',
                      'Status',
                      'Awarded',
                      'Date',
                      'Reviewer',
                    ],
                    ...state.contributions.map((c) => [
                      title(c.activityId),
                      c.role,
                      c.status,
                      c.awarded || 0,
                      c.created,
                      c.reviewer || '',
                    ]),
                  ])
                }
              >
                <Download size={15} />
                Export
              </Button>
            </div>
            <div className="timeline">
              {[
                'Discover',
                'Commit',
                'Contribute',
                'Verify',
                'Earn',
                'Redeem',
                'Return',
              ].map((s, i) => (
                <span
                  key={s}
                  className={
                    i < 5 ||
                    (i === 5 && state.vouchers.length > 0) ||
                    (i === 6 &&
                      ownRegistrations.some(
                        (r) =>
                          new Date(r.created) >
                          new Date(state.vouchers[0]?.issued || '2999-01-01'),
                      ))
                      ? 'done'
                      : ''
                  }
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="muted">
              {approved.length} verified contributions. Every one stays in your
              record, whatever your credit balance.
            </p>
          </section>
          <section className="panel">
            <h2>Your next chapter: Co-host</h2>
            <p className="muted">
              {Math.min(helps, 5)} / 5 verified helps · {Math.min(cohosts, 1)} /
              1 co-host contribution
            </p>
            <Progress
              value={
                (Math.min(helps, 5) / 6) * 100 +
                (Math.min(cohosts, 1) / 6) * 100
              }
              className="campus-progress my-5"
            />
            <p className="caption">
              Roles are earned through your contribution history. Spending
              credits never reduces your progress.
            </p>
          </section>
        </div>
        <section className="panel">
          <h2>Contributions & claims</h2>
          {[...state.contributions]
            .sort((a, b) => b.created.localeCompare(a.created))
            .map((c) => (
              <div className="row" key={c.id}>
                <span className="mini-icon green">
                  <HeartHandshake />
                </span>
                <div className="row-main">
                  <h3>{title(c.activityId)}</h3>
                  <p>
                    {c.role} · {date(c.created)} ·{' '}
                    {c.status === 'Approved'
                      ? `${c.awarded} credits awarded`
                      : 'Usually reviewed within 24 hours'}
                  </p>
                  <p>{c.description}</p>
                  {c.reason && (
                    <p>
                      <strong>Reviewer’s note:</strong> {c.reason}
                    </p>
                  )}
                </div>
                <Status value={c.status} />
                <div className="row-actions">
                  {['Pending', 'More evidence'].includes(c.status) && (
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        ask(
                          'cancelClaim',
                          'Cancel this claim?',
                          'Your unreviewed claim will be cancelled. You can submit a corrected one from My activities.',
                          { id: c.id },
                          [],
                          'Cancel claim',
                        )
                      }
                    >
                      Cancel claim
                    </Button>
                  )}
                  {c.status === 'Rejected' && !c.appealed && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        ask(
                          'appeal',
                          'Ask for a second look',
                          'Add new information within seven days of the decision. An operator will review your appeal.',
                          { id: c.id },
                          [{ ...note, min: 20 }],
                          'Submit appeal',
                        )
                      }
                    >
                      Appeal
                    </Button>
                  )}
                  {c.status === 'More evidence' && (
                    <Button
                      disabled={busy}
                      onClick={() =>
                        ask(
                          'resubmit',
                          'Add the missing detail',
                          'Your update will go back into the review queue.',
                          { id: c.id },
                          [{ ...note, min: 20 }],
                          'Send update',
                        )
                      }
                    >
                      Add evidence
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </section>
      </>
    );
  } else if (page === 'rewards')
    content = (
      <>
        <div className="section-actions">
          <p className="muted">
            <strong>{b.earned} earned credits</strong> available · 10 credits =
            S$1
          </p>
          <Button variant="outline" onClick={() => go('wallet')}>
            My vouchers
            <ArrowRight size={15} />
          </Button>
        </div>
        <div className="demo-warning">
          All rewards use sample pilot credits. Partner pathways are
          simulations; no real purchases, bookings, or official credit transfers
          occur.
        </div>
        <Tabs
          value={
            [
              'All',
              'Everyday',
              'Community',
              'Sport & culture',
              'Learning',
            ].includes(tab)
              ? tab
              : 'All'
          }
          onValueChange={(v) => setTab(String(v))}
        >
          <TabsList className="category-tabs">
            {[
              'All',
              'Everyday',
              'Community',
              'Sport & culture',
              'Learning',
            ].map((t) => (
              <TabsTrigger key={t} value={t}>
                {t === 'All' ? 'All rewards' : t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="reward-grid">
          {state.rewards
            .filter(
              (r) =>
                ![
                  'Everyday',
                  'Community',
                  'Sport & culture',
                  'Learning',
                ].includes(tab) || r.pathway === tab,
            )
            .map((r) => {
              const Icon =
                r.pathway === 'Everyday'
                  ? Coffee
                  : r.pathway === 'Community'
                    ? Sprout
                    : r.pathway === 'Learning'
                      ? GraduationCap
                      : Waves;
              return (
                <article className="reward-card" key={r.id}>
                  <div className={`reward-art ${r.color}`}>
                    <Icon />
                    <strong>
                      {r.pathway === 'Everyday'
                        ? 'A little everyday joy.'
                        : r.pathway === 'Community'
                          ? 'Made by you.'
                          : r.pathway === 'Learning'
                            ? 'Stay curious.'
                            : 'Find your next good thing.'}
                    </strong>
                  </div>
                  <div className="reward-content">
                    <Status
                      value={
                        r.simulated ? 'Simulated for pilot' : 'Sample voucher'
                      }
                    />
                    <h3>{r.title}</h3>
                    <p>
                      {r.partner} · S${r.value} value
                      {r.boost ? ` including S$${r.boost} sponsor boost` : ''}
                    </p>
                    <p>
                      {r.extra
                        ? `S$${r.extra} additional payment required`
                        : 'Fully funded · no extra payment'}
                      {r.pathway === 'Community'
                        ? ' · starter credits welcome'
                        : ''}
                    </p>
                    <div className="reward-price">
                      <strong>{r.cost} credits</strong>
                      <span>{r.stock} left</span>
                    </div>
                    <Button
                      disabled={busy || r.stock === 0}
                      onClick={() => openReward(r)}
                    >
                      {r.stock ? 'See reward details' : 'Currently unavailable'}
                      <ArrowUpRight size={16} />
                    </Button>
                  </div>
                </article>
              );
            })}
        </div>
      </>
    );
  else if (page === 'reviewer')
    content = (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="label">Awaiting review</span>
            <strong>{pending.length}</strong>
            <p>Oldest submissions first</p>
          </div>
          <div className="stat-card">
            <span className="label">Verified contributions</span>
            <strong>{approved.length}</strong>
            <p>Human decisions, published rules</p>
          </div>
          <div className="stat-card">
            <span className="label">Review target</span>
            <strong>24h</strong>
            <p>Appeals go to the operator</p>
          </div>
          <div className="stat-card">
            <span className="label">Earning schedule</span>
            <strong>5–20</strong>
            <p>Plus up to 10 mission credits</p>
          </div>
        </div>
        <div className="info-box mb-6">
          <strong>Independent review · Daniel Tan</strong>
          <p>
            You can’t approve your own contributions or those from gatherings
            you organized. Only the highest confirmed role receives a base
            reward.
          </p>
        </div>
        <section className="panel">
          <h2>Contribution review queue</h2>
          {pending.length ? (
            pending
              .sort((a, b) => a.created.localeCompare(b.created))
              .map((c) => (
                <div className="review-card" key={c.id}>
                  <div className="section-actions">
                    <div>
                      <span className="eyebrow">
                        MEI LIN · {c.role.toUpperCase()}
                      </span>
                      <h3>{title(c.activityId)}</h3>
                    </div>
                    <Status value={c.status} />
                  </div>
                  <p className="muted">{c.description}</p>
                  <div className="evidence-list mt-3">
                    {c.evidence.length ? (
                      c.evidence.map((e, i) => (
                        <a
                          href={`/api/evidence?id=${e}`}
                          target="_blank"
                          rel="noreferrer"
                          key={e}
                        >
                          Evidence {i + 1}
                          <ExternalLink size={13} />
                        </a>
                      ))
                    ) : (
                      <span className="caption">
                        Evidence: organizer attendance confirmation and resident
                        description
                      </span>
                    )}
                  </div>
                  <div className="info-box my-4">
                    <strong>
                      {Math.min(
                        rate[c.role] +
                          (state.activities.find((a) => a.id === c.activityId)
                            ?.bonus || 0),
                        100 - b.periodEarned,
                      )}{' '}
                      credits if approved
                    </strong>
                    <p>
                      {rate[c.role]} base ·{' '}
                      {state.activities.find((a) => a.id === c.activityId)
                        ?.bonus || 0}{' '}
                      mission bonus · {100 - b.periodEarned} remaining under the
                      period cap
                    </p>
                  </div>
                  <p className="caption mb-4">
                    Submitted {date(c.created)} ·{' '}
                    {Math.floor(
                      (now - new Date(c.created).getTime()) / 3600000,
                    )}{' '}
                    hours in queue
                  </p>
                  {c.status === 'Appealed' ? (
                    <Button
                      variant="outline"
                      onClick={() => chooseActor('operator')}
                    >
                      Open operator appeal review
                    </Button>
                  ) : (
                    <div className="row-actions">
                      <Button
                        disabled={busy}
                        onClick={() => review(c.id, 'approve')}
                      >
                        <CheckCircle2 size={16} />
                        Approve contribution
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => review(c.id, 'more')}
                      >
                        Request evidence
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => review(c.id, 'reject')}
                      >
                        Reject with reason
                      </Button>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <Empty
              title="You’re all caught up"
              description="New contribution claims will appear here for independent review."
            />
          )}
        </section>
      </>
    );
  else if (page === 'organizer')
    content = (
      <>
        <div className="section-actions">
          <p className="muted">
            Hosted by Farah Ahmad · demonstration organizer
          </p>
          <Button
            disabled={busy}
            onClick={() =>
              ask(
                'propose',
                'Make room for a good idea',
                'Start small. Your proposal will go to the operator before neighbours can join.',
                {},
                [
                  { name: 'title', label: 'Activity name', min: 5 },
                  {
                    name: 'description',
                    label: 'What will neighbours do?',
                    type: 'textarea',
                    min: 20,
                  },
                  {
                    name: 'category',
                    label: 'Category',
                    type: 'select',
                    options: [
                      'Outdoors',
                      'Arts & crafts',
                      'Wellness',
                      'Learning',
                      'Interest groups',
                    ],
                    value: 'Arts & crafts',
                  },
                  {
                    name: 'location',
                    label: 'Meeting place',
                    value: 'Pek Kio Community Centre',
                  },
                  {
                    name: 'starts',
                    label: 'Start date & time (your local time)',
                    type: 'datetime-local',
                  },
                  {
                    name: 'capacity',
                    label: 'Places available',
                    type: 'number',
                    value: '12',
                    min: 2,
                    max: 50,
                  },
                  {
                    name: 'safety',
                    label: 'Safety, first aid & accessibility plan',
                    type: 'textarea',
                    min: 20,
                  },
                  {
                    name: 'agreed',
                    label:
                      'This is a local adult activity with no cash withdrawals, credit transfers, or overseas travel.',
                    type: 'checkbox',
                  },
                ],
                'Send for review',
              )
            }
          >
            <Plus size={16} />
            Propose a gathering
          </Button>
        </div>
        <section className="panel">
          <h2>Your gatherings</h2>
          {state.activities
            .filter((a) => a.organizer === 'farah' && !a.id.startsWith('past-'))
            .map((a) => (
              <div className="row" key={a.id}>
                <span className={`mini-icon ${a.color}`}>
                  <CalendarDays />
                </span>
                <div className="row-main">
                  <h3>{a.title}</h3>
                  <p>
                    {date(a.starts)} · {a.interests.length} expressions of
                    interest
                  </p>
                  <p>
                    {a.occupied +
                      state.registrations.filter(
                        (r) =>
                          r.activityId === a.id &&
                          ['Confirmed', 'Attended'].includes(r.status),
                      ).length}
                    /{a.capacity} places
                  </p>
                </div>
                <Status value={a.status} />
                <div className="row-actions">
                  {a.status === 'Open' && (
                    <>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          ask(
                            'completeActivity',
                            'Simulate session completion?',
                            'This moves the sample gathering to Completed so you can practise attendance and contribution submission. It brings this demo event’s end time forward to now.',
                            { id: a.id },
                            [],
                            'Complete demo session',
                          )
                        }
                      >
                        Complete demo session
                      </Button>
                      {a.occupied > 0 && (
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => run('openSpot', { id: a.id })}
                        >
                          Release sample place
                        </Button>
                      )}
                    </>
                  )}
                  {['Open', 'Proposed'].includes(a.status) && (
                    <>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          ask(
                            'grant',
                            'A little support for your gathering',
                            'Meet: S$0; Make: up to S$150; Grow: up to S$750. The operator reviews each request against the S$1,500 grant budget.',
                            { id: a.id },
                            [
                              {
                                name: 'tier',
                                label: 'Grant tier',
                                type: 'select',
                                options: ['Meet', 'Make', 'Grow'],
                                value: 'Make',
                              },
                              {
                                name: 'amount',
                                label: 'Amount requested (S$)',
                                type: 'number',
                                min: 0,
                                max: 750,
                                value: '150',
                              },
                              {
                                name: 'description',
                                label: 'What will the grant cover?',
                                type: 'textarea',
                                min: 20,
                              },
                            ],
                            'Request support',
                          )
                        }
                      >
                        Request grant
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          ask(
                            'cancelActivity',
                            'Cancel this gathering?',
                            'All confirmed participants will receive their deposit back.',
                            { id: a.id },
                            [note],
                            'Cancel gathering',
                          )
                        }
                      >
                        Cancel gathering
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
        </section>
        <section className="panel">
          <h2>Attendance & contribution roles</h2>
          {ownRegistrations
            .filter((r) => r.status === 'Confirmed' || r.status === 'Attended')
            .map((r) => (
              <div className="row" key={r.id}>
                <span className="avatar">ML</span>
                <div className="row-main">
                  <h3>Mei Lin · {title(r.activityId)}</h3>
                  <p>
                    {r.role} · {r.deposit} starter-credit deposit
                  </p>
                </div>
                <Status value={r.status} />
                {r.status === 'Confirmed' && (
                  <Button
                    disabled={
                      busy ||
                      state.activities.find((a) => a.id === r.activityId)
                        ?.status !== 'Completed'
                    }
                    onClick={() =>
                      ask(
                        'attendance',
                        'Confirm attendance & contribution',
                        'Choose the highest role the resident actually fulfilled. The deposit is returned now; earned credits require an independent review.',
                        { id: r.id },
                        [
                          {
                            name: 'role',
                            label: 'Confirmed role',
                            type: 'select',
                            options: roles,
                            value: 'Helper',
                          },
                        ],
                        'Confirm attendance',
                      )
                    }
                  >
                    Confirm attendance
                  </Button>
                )}
              </div>
            ))}
          <p className="caption mt-4">
            Complete the demo session before marking attendance. A resident can
            then submit a claim from My activities.
          </p>
        </section>
        <section className="panel">
          <h2>Your grant requests</h2>
          {state.grants.length ? (
            state.grants.map((g) => (
              <div className="row" key={g.id}>
                <div className="row-main">
                  <h3>{title(g.activityId)}</h3>
                  <p>
                    {g.tier} · S${g.amount} · {g.description}
                  </p>
                  {g.reason && <p>{g.reason}</p>}
                </div>
                <Status value={g.status} />
              </div>
            ))
          ) : (
            <p className="muted">
              No support requested yet. Start with a Meet gathering or request a
              Make or Grow grant.
            </p>
          )}
        </section>
      </>
    );
  else if (page === 'operator')
    content = (
      <>
        <div className="section-actions">
          <p className="muted">S$5,000 sample budget · 8-week Pek Kio pilot</p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              ask(
                'pause',
                state.paused
                  ? 'Resume new commitments?'
                  : 'Pause new commitments?',
                state.paused
                  ? 'Residents will be able to book, earn, and redeem again.'
                  : 'New awards, bookings and redemptions will stop. Existing voucher use and refunds stay available.',
                { paused: !state.paused },
                [],
                state.paused ? 'Resume pilot' : 'Pause commitments',
              )
            }
          >
            {state.paused ? <Play size={16} /> : <Pause size={16} />}{' '}
            {state.paused ? 'Resume' : 'Pause'} commitments
          </Button>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="label">Reward backing</span>
            <strong>S$3,000</strong>
            <p>20,000-credit pilot issuance ceiling</p>
          </div>
          <div className="stat-card">
            <span className="label">Unspent earned value</span>
            <strong>
              S$
              {(
                (b.earned +
                  state.vouchers
                    .filter(
                      (v) =>
                        v.status === 'Pending' && v.creditType === 'earned',
                    )
                    .reduce((n, v) => n + v.cost, 0)) /
                10
              ).toFixed(2)}
            </strong>
            <p>Available and reserved earned credits</p>
          </div>
          <div className="stat-card">
            <span className="label">Grant commitments</span>
            <strong>S${grants}</strong>
            <p>S${1500 - grants} still available</p>
          </div>
          <div className="stat-card">
            <span className="label">Merchant settlement</span>
            <strong>
              S$
              {used
                .reduce(
                  (n, v) =>
                    n +
                    (state.rewards.find((r) => r.id === v.rewardId)?.value ||
                      0),
                  0,
                )
                .toFixed(2)}
            </strong>
            <p>Sample vouchers accepted</p>
          </div>
        </div>
        <div className="two-columns">
          <section className="panel">
            <h2>Every dollar has a place</h2>
            <div className="budget-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="budget-legend">
              <span>Rewards · S$3,000</span>
              <span>Grants · S$1,500</span>
              <span>Operations · S$500</span>
            </div>
            <div className="row">
              <div className="row-main">
                <h3>Wallet & ledger</h3>
                <p>Balances are calculated from the saved credit ledger.</p>
              </div>
              <Status
                value={
                  b.earned >= 0 && b.starter >= 0 && b.reserved >= 0
                    ? 'Reconciled'
                    : 'Review required'
                }
              />
            </div>
            <div className="row">
              <div className="row-main">
                <h3>Issued sample credits</h3>
                <p>
                  {state.transactions
                    .filter((t) => t.type === 'earned')
                    .reduce((n, t) => n + t.available, 0)}{' '}
                  earned ·{' '}
                  {state.transactions
                    .filter((t) => t.type === 'starter')
                    .reduce((n, t) => n + t.available, 0)}{' '}
                  starter
                </p>
              </div>
              <Button variant="outline" onClick={exportLedger}>
                <Download size={15} />
                Ledger CSV
              </Button>
            </div>
            <div className="row">
              <div className="row-main">
                <h3>Outstanding sample vouchers</h3>
                <p>
                  {state.vouchers.filter((v) => v.status === 'Active').length}{' '}
                  active · S$
                  {state.vouchers
                    .filter((v) => v.status === 'Active')
                    .reduce(
                      (n, v) =>
                        n +
                        (state.rewards.find((r) => r.id === v.rewardId)
                          ?.value || 0),
                      0,
                    )
                    .toFixed(2)}{' '}
                  face value
                </p>
              </div>
            </div>
          </section>
          <section className="panel">
            <h2>Pilot participation</h2>
            <div className="row">
              <div className="row-main">
                <h3>Verified contributions</h3>
                <p>Resident sample: Mei Lin</p>
              </div>
              <strong className="big-value">{approved.length}</strong>
            </div>
            <div className="row">
              <div className="row-main">
                <h3>Awaiting verification</h3>
                <p>Keep reviews within 24 hours</p>
              </div>
              <strong className="big-value">{pending.length}</strong>
            </div>
            <div className="row">
              <div className="row-main">
                <h3>Vouchers fulfilled</h3>
                <p>Accepted once by the merchant</p>
              </div>
              <strong className="big-value">{used.length}</strong>
            </div>
            <p className="caption">
              Demo counts are not population-level evaluation results. Retention
              and participation gaps require a real pilot cohort.
            </p>
          </section>
        </div>
        <section className="panel">
          <h2>Activity proposals</h2>
          {state.activities
            .filter((a) => a.status === 'Proposed')
            .map((a) => (
              <div className="row" key={a.id}>
                <div className="row-main">
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  <p>
                    <strong>Safety & access:</strong> {a.safety}
                  </p>
                </div>
                <Button
                  disabled={busy}
                  onClick={() =>
                    ask(
                      'approveActivity',
                      'Approve this gathering?',
                      'Confirm the plan, local meeting place, and safety arrangements. Approval opens the gathering for bookings.',
                      { id: a.id },
                      [],
                      'Approve gathering',
                    )
                  }
                >
                  Review & approve
                </Button>
              </div>
            ))}
          {!state.activities.some((a) => a.status === 'Proposed') && (
            <p className="muted">No proposals waiting for review.</p>
          )}
        </section>
        <section className="panel">
          <h2>Organizer support</h2>
          {state.grants
            .filter((g) => g.status === 'Pending')
            .map((g) => (
              <div className="row" key={g.id}>
                <div className="row-main">
                  <h3>
                    {title(g.activityId)} · {g.tier}
                  </h3>
                  <p>
                    S${g.amount} · {g.description}
                  </p>
                </div>
                <div className="row-actions">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      ask(
                        'reviewGrant',
                        'Approve this grant?',
                        'This reserves part of the S$1,500 pilot grant budget.',
                        { id: g.id, decision: 'approve' },
                        [note],
                        'Approve grant',
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      ask(
                        'reviewGrant',
                        'Decline this grant',
                        'Explain the changes the organizer would need to make.',
                        { id: g.id, decision: 'reject' },
                        [note],
                        'Decline grant',
                      )
                    }
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          {!state.grants.some((g) => g.status === 'Pending') && (
            <p className="muted">No pending grant requests.</p>
          )}
        </section>
        <section className="panel">
          <h2>Reward inventory</h2>
          {state.rewards.map((r) => (
            <div className="row" key={r.id}>
              <div className="row-main">
                <h3>{r.title}</h3>
                <p>
                  {r.pathway} · {r.cost} credits ·{' '}
                  {r.stock < 5 ? 'Low availability' : 'Available'}
                </p>
              </div>
              <strong>{r.stock} left</strong>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  ask(
                    'stock',
                    'Update available stock',
                    'Enter the number of additional uncommitted rewards currently available. Existing vouchers keep their commitment.',
                    { id: r.id },
                    [
                      {
                        name: 'stock',
                        label: 'Available stock',
                        type: 'number',
                        min: 0,
                        max: 1000,
                        value: String(r.stock),
                      },
                    ],
                    'Update inventory',
                  )
                }
              >
                Manage
              </Button>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Fulfilment & refunds</h2>
          {voucherList(state.vouchers)}
        </section>
        <section className="panel">
          <h2>Appeals & concerns</h2>
          {state.contributions
            .filter((c) => c.status === 'Appealed')
            .map((c) => (
              <div className="row" key={c.id}>
                <div className="row-main">
                  <h3>{title(c.activityId)}</h3>
                  <p>{c.description}</p>
                </div>
                <div className="row-actions">
                  <Button
                    disabled={busy}
                    onClick={() => review(c.id, 'approve')}
                  >
                    Approve appeal
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => review(c.id, 'reject')}
                  >
                    Uphold rejection
                  </Button>
                </div>
              </div>
            ))}
          {state.incidents.map((i) => (
            <div className="row" key={i.id}>
              <div className="row-main">
                <h3>Concern · {date(i.created)}</h3>
                <p>{i.description}</p>
                {i.resolution && <p>{i.resolution}</p>}
              </div>
              <Status value={i.status} />
              {i.status === 'Open' && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    ask(
                      'resolve',
                      'Record a resolution',
                      'Provide a clear explanation and any follow-up arrangements.',
                      { id: i.id },
                      [{ ...note, min: 10 }],
                      'Resolve concern',
                    )
                  }
                >
                  Resolve
                </Button>
              )}
            </div>
          ))}
          {!state.incidents.length &&
            !state.contributions.some((c) => c.status === 'Appealed') && (
              <p className="muted">No appeals or concerns to review.</p>
            )}
        </section>
      </>
    );
  else if (page === 'merchant') {
    const found = state.vouchers.find((v) => v.id === checkedCode.trim());
    const reward = found && state.rewards.find((r) => r.id === found.rewardId);
    const valid =
      found &&
      found.status === 'Active' &&
      found.merchant === actors.merchant.id &&
      new Date(found.expires).getTime() > now;
    content = (
      <div className="two-columns">
        <section className="panel">
          <span className="eyebrow">PEK KIO KOPI · SAMPLE MERCHANT</span>
          <h2 className="mt-3">A voucher, a kopi, a good day.</h2>
          <p className="muted mb-6">
            Enter the complete voucher code. Check the resident’s name before
            confirming.
          </p>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              setCheckedCode(voucherCode);
            }}
          >
            <label>
              Voucher code
              <input
                required
                value={voucherCode}
                placeholder="Paste the voucher code from My wallet"
                onChange={(e) => setVoucherCode(e.target.value)}
              />
            </label>
            <Button type="submit">
              <Search size={16} />
              Check voucher
            </Button>
          </form>
          {checkedCode && (
            <div className="voucher mt-6">
              <h3>
                {!found
                  ? 'Voucher not found'
                  : found.merchant !== actors.merchant.id
                    ? 'Voucher for a different merchant'
                    : found.status === 'Used'
                      ? 'Already used — do not accept again'
                      : new Date(found.expires).getTime() < now
                        ? 'Voucher expired'
                        : found.status === 'Active'
                          ? 'Ready to redeem'
                          : `Voucher ${found.status.toLowerCase()}`}
              </h3>
              {found && found.merchant === actors.merchant.id && (
                <>
                  <p>Resident: Mei Lin · {reward?.partner}</p>
                  <p>
                    Value: S${reward?.value} · expires {date(found.expires)}
                  </p>
                  {found.used && (
                    <p>
                      Accepted {date(found.used)} at {time(found.used)}
                    </p>
                  )}
                </>
              )}
              {valid && (
                <Button
                  disabled={busy}
                  className="mt-4"
                  onClick={() =>
                    ask(
                      'useVoucher',
                      'Accept this sample voucher?',
                      'Confirm that the resident is Mei Lin. This permanently marks the voucher used and records the sample merchant settlement.',
                      { id: found.id },
                      [],
                      'Confirm one-time use',
                    )
                  }
                >
                  Confirm redemption
                </Button>
              )}
            </div>
          )}
        </section>
        <section className="panel">
          <h2>Your counter so far</h2>
          <div className="row">
            <div className="row-main">
              <p>Accepted vouchers</p>
            </div>
            <strong className="big-value">
              {used.filter((v) => v.merchant === actors.merchant.id).length}
            </strong>
          </div>
          <div className="row">
            <div className="row-main">
              <p>Sample settlement value</p>
            </div>
            <strong className="big-value">
              S$
              {used
                .filter((v) => v.merchant === actors.merchant.id)
                .reduce(
                  (n, v) =>
                    n +
                    (state.rewards.find((r) => r.id === v.rewardId)?.value ||
                      0),
                  0,
                )
                .toFixed(2)}
            </strong>
          </div>
          {used
            .filter((v) => v.merchant === actors.merchant.id)
            .map((v) => (
              <div className="row" key={v.id}>
                <div className="row-main">
                  <h3>Mei Lin · S$5</h3>
                  <p>
                    {date(v.used!)} · {time(v.used!)}
                  </p>
                  <p className="caption">{v.id}</p>
                </div>
                <Status value="Used" />
              </div>
            ))}
          <p className="caption mt-5">
            Demo only. These vouchers do not authorize a real purchase or
            merchant payment.
          </p>
        </section>
      </div>
    );
  } else if (page === 'updates')
    content = (
      <section className="panel">
        <h2>Your neighbourhood updates</h2>
        {state.notices.slice(0, 30).map((n) => (
          <div className="row" key={n.id}>
            <span className="mini-icon green">
              <CheckCircle2 />
            </span>
            <div className="row-main">
              <h3>{n.text}</h3>
              <p>
                {date(n.created)} · {time(n.created)}
              </p>
            </div>
          </div>
        ))}
      </section>
    );
  else
    content = (
      <div className="two-columns">
        <section className="panel help-copy">
          <h2>Your private pilot, step by step</h2>
          <p>
            This is a working demonstration with sample residents, merchants,
            credits and activities. Your signed-in sandbox is saved separately
            from everyone else’s.
          </p>
          <div className="steps">
            <div>
              <h3>1. Give the contribution a second pair of eyes</h3>
              <p>
                Mei Lin starts with 40 earned credits and a pending 10-credit
                helper claim.
              </p>
              <Button variant="outline" onClick={() => chooseActor('reviewer')}>
                Open reviewer view
                <ArrowRight size={15} />
              </Button>
            </div>
            <div>
              <h3>2. Turn verified help into a little reward</h3>
              <p>
                Approve the helper claim, then redeem the 50-credit kopi
                voucher.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  chooseActor('resident');
                  go('rewards');
                }}
              >
                Explore rewards
                <ArrowRight size={15} />
              </Button>
            </div>
            <div>
              <h3>3. Try the voucher at the counter</h3>
              <p>
                Copy its code from My wallet, check it as the merchant, and
                confirm use. A second attempt is rejected.
              </p>
              <Button variant="outline" onClick={() => chooseActor('merchant')}>
                Open merchant view
                <ArrowRight size={15} />
              </Button>
            </div>
            <div>
              <h3>4. Follow the funding</h3>
              <p>
                The operator can inspect the ledger, outstanding commitments,
                and sample merchant settlement.
              </p>
              <Button variant="outline" onClick={() => chooseActor('operator')}>
                Open operator view
                <ArrowRight size={15} />
              </Button>
            </div>
          </div>
          <h3>What earns credits?</h3>
          <p>
            Attend: 5. Help or co-host: 10. Host or mentor: 20. Missions add up
            to 10. Only the highest verified role counts once per gathering. The
            cap is 100 earned credits in each four-week period.
          </p>
          <h3>What are starter credits for?</h3>
          <p>
            Residents receive 50 once for refundable deposits and approved
            community benefits. They cannot buy external merchant rewards and
            cannot be transferred or withdrawn as cash.
          </p>
          <h3>What happens to bookings and claims?</h3>
          <p>
            Cancel at least 24 hours before to receive your deposit back. Late
            cancellations forfeit the deposit; ask the operator if an exception
            is needed. Appeal a rejected contribution within seven days.
          </p>
          <h3>What is simulated?</h3>
          <p>
            ActiveSG, Culture Pass, and learning sponsorships demonstrate
            possible pathways. No official credits are converted. Every activity
            photo and named merchant here is illustrative. This sandbox is
            restricted to adult sample residents.
          </p>
          <h3>Your information</h3>
          <p>
            Only upload evidence you are comfortable including in your private
            pilot. The demo stores your files and history until the site owner
            removes them; a live pilot needs an agreed retention policy and
            resident onboarding process.
          </p>
        </section>
        <aside>
          <section className="panel">
            <h2>Something not quite right?</h2>
            <p className="muted mb-5">
              Record a contribution issue, voucher problem, accessibility
              exception, or safety concern for the sample operator.
            </p>
            <Button
              disabled={busy}
              onClick={() =>
                ask(
                  'report',
                  'Tell the operator what happened',
                  'This creates an in-app case in your private sandbox. No email or message is sent outside this demonstration.',
                  {},
                  [
                    {
                      name: 'description',
                      label: 'Your concern and the outcome you need',
                      type: 'textarea',
                      min: 20,
                    },
                  ],
                  'Record concern',
                )
              }
            >
              Raise a concern
              <CircleHelp size={16} />
            </Button>
            {state.incidents.map((i) => (
              <div className="row" key={i.id}>
                <div className="row-main">
                  <h3>Case {i.id.slice(0, 8)}</h3>
                  <p>{i.description}</p>
                  {i.resolution && <p>{i.resolution}</p>}
                </div>
                <Status value={i.status} />
              </div>
            ))}
          </section>
          <div className="info-box">
            <strong>Keep the neighbourhood in the loop</strong>
            <p>
              Switch roles using Pilot workspace in the sidebar. These are
              sample actors for testing the process, not live account
              permissions.
            </p>
          </div>
        </aside>
      </div>
    );
  return (
    <>
      {content}
      {action && (
        <ActionDialog
          key={action.type + JSON.stringify(action.payload?.id || '')}
          action={action}
          close={() => setAction(null)}
          run={run}
          busy={busy}
          serverError={error}
        />
      )}
      <Dialog
        open={!!selectedVoucher}
        onOpenChange={(open) => !open && setSelectedVoucher(null)}
      >
        <DialogContent className="campus-dialog voucher-dialog">
          {selectedVoucher && (
            <>
              <DialogTitle>Your neighbourhood voucher</DialogTitle>
              <DialogDescription>
                Demo only · no monetary value. Show this code to the sample
                merchant or enter it in Merchant view.
              </DialogDescription>
              <div className="voucher">
                <h3>
                  {
                    state.rewards.find((r) => r.id === selectedVoucher.rewardId)
                      ?.title
                  }
                </h3>
                <p>Resident: Mei Lin</p>
                <strong className="big-value">
                  S$
                  {
                    state.rewards.find((r) => r.id === selectedVoucher.rewardId)
                      ?.value
                  }
                </strong>
                <code>{selectedVoucher.id}</code>
                <Status value={selectedVoucher.status} />
                <p className="mt-3">
                  Expires {date(selectedVoucher.expires)} · one-time use
                </p>
              </div>
              <VoucherCode code={selectedVoucher.id} />
              <Button variant="outline" onClick={() => window.print()}>
                <Printer size={16} />
                Print voucher
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
