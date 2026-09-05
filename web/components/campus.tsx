'use client';
/* oxlint-disable next/no-img-element -- Local illustrative assets use fixed CSS dimensions; no remote image optimization is needed. */
/* oxlint-disable next/no-html-link-for-pages -- Sites owns the native top-level sign-in route. */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Search,
  Sprout,
  Compass,
  Wallet,
  HeartHandshake,
  Gift,
  CalendarDays,
  Users,
  Bell,
  Plus,
  Leaf,
  CircleHelp,
  Check,
  UserRound,
} from 'lucide-react';
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  type PilotState,
  type Activity,
  type Actor,
  type Command,
  actors,
  wallet,
} from '@/lib/model';
import { Workspace } from './workspace';
import { Welcome, ProfilePage } from './profile';
import { date, time, type Run } from '@/lib/presentation';

const nav = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'activities', label: 'My activities', icon: CalendarDays },
  { id: 'contributions', label: 'My contributions', icon: HeartHandshake },
  { id: 'wallet', label: 'My wallet', icon: Wallet },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'profile', label: 'My profile', icon: UserRound },
];
export default function Campus({ initial }: { initial: PilotState }) {
  const [state, setState] = useState(initial);
  const [page, setPage] = useState('discover');
  const [category, setCategory] = useState('All activities');
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Activity | null>(null);
  const [actor, setActor] = useState<Actor>('resident');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dateFilter, setDateFilter] = useState('any');
  const [clock, setClock] = useState(() => new Date(initial.created).getTime());
  const latestRevision = useRef(-1);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/pilot');
      if (!r.ok) {
        if (r.status === 401)
          throw new Error('Sign in with ChatGPT to save your pilot sandbox.');
        throw new Error('Your sandbox could not be loaded. Please try again.');
      }
      const data = (await r.json()) as {
        state: PilotState;
        revision: number;
        message: string;
        error?: string;
      };
      if (data.revision >= latestRevision.current) {
        if (
          latestRevision.current === -1 &&
          !location.hash &&
          !data.state.profile?.completedAt
        ) {
          setPage('welcome');
        }
        latestRevision.current = data.revision;
        setState(data.state);
      }
      setReady(true);
      setClock(Date.now());
      setError((previous) =>
        /sandbox could not be loaded|Sign in with ChatGPT|Failed to fetch/.test(
          previous,
        )
          ? ''
          : previous,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void refresh();
    }, 0);
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 5000);
    return () => {
      clearInterval(timer);
      clearTimeout(initialLoad);
    };
  }, [refresh]);
  useEffect(() => {
    const read = () => {
      const key = location.hash.slice(1);
      if (key) setPage(key);
    };
    const initialHash = setTimeout(read, 0);
    window.addEventListener('hashchange', read);
    return () => {
      clearTimeout(initialHash);
      window.removeEventListener('hashchange', read);
    };
  }, []);
  const go = (next: string) => {
    setPage(next);
    window.history.replaceState(null, '', `#${next}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const run: Run = async (type, payload = {}) => {
    if (!ready || busy) return false;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const command: Command = {
        ...payload,
        type,
        actor,
        key:
          typeof payload.key === 'string' ? payload.key : crypto.randomUUID(),
      };
      const r = await fetch('/api/pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });
      const data = (await r.json()) as {
        state: PilotState;
        revision: number;
        message: string;
        error?: string;
      };
      if (!r.ok)
        throw new Error(data.error || 'That action could not be completed.');
      if (data.revision >= latestRevision.current) {
        latestRevision.current = data.revision;
        setState(data.state);
      }
      setMessage(data.message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const balance = wallet(state, 'mei', clock);
  const approved = state.contributions.filter(
    (c) => c.resident === 'mei' && c.status === 'Approved',
  );
  const helps = approved.filter((c) => c.role === 'Helper').length;
  const cohosts = approved.filter((c) => c.role === 'Co-host').length;
  const role =
    helps >= 5 && cohosts >= 1
      ? 'Co-host'
      : approved.length >= 3 && helps >= 1
        ? 'Helper'
        : 'Participant';
  const visible = state.activities.filter(
    (a) =>
      a.status === 'Open' &&
      (category === 'All activities' || a.category === category) &&
      `${a.title} ${a.location} ${a.description}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (dateFilter === 'any' ||
        new Date(a.starts).getTime() <= clock + Number(dateFilter) * 86400000),
  );
  const registration =
    detail &&
    state.registrations.find(
      (r) =>
        r.activityId === detail.id &&
        r.resident === 'mei' &&
        r.status !== 'Cancelled',
    );
  const title =
    (
      {
        discover: 'Find your kind of together.',
        activities: 'Your next shared moment.',
        contributions: 'Every little contribution counts.',
        wallet: 'Good things come back around.',
        rewards: 'You’ve earned a little good.',
        organizer: 'Bring your neighbours together.',
        reviewer: 'Give good contributions their due.',
        operator: 'A healthy, happy neighbourhood.',
        merchant: 'A warm welcome. A simple reward.',
        help: 'A little help goes a long way.',
        updates: 'The latest from your neighbourhood.',
        profile: 'There’s more to you. Bring it along.',
      } as Record<string, string>
    )[page] || 'Welcome to your neighbourhood.';
  const descriptions: Record<string, string> = {
    discover:
      'Small moments. Shared interests. A neighbourhood that feels like home.',
    activities:
      'Your plans, your places, and the people you’ll meet along the way.',
    contributions:
      'Your time and care stay part of your story, even after you spend your credits.',
    wallet:
      'A clear view of what you’ve earned, what’s waiting, and what comes next.',
    rewards: 'Turn the things you give into little things you’ll love.',
    organizer:
      'Plan a gathering, welcome people, and make space for something good.',
    reviewer:
      'Check the evidence, apply the published rules, and record your decision.',
    operator:
      'Keep an eye on funding, commitments, and the people behind the pilot.',
    merchant: 'Validate a sample voucher and confirm its one-time use.',
    help: 'How the Pek Kio pilot works, and where to go if something isn’t right.',
    profile:
      'Your skills, your credentials, and the connections that help tell your story.',
  };
  const chooseActor = (v: string | null) => {
    if (v && v in actors) {
      setActor(v as Actor);
      go(v === 'resident' ? 'discover' : v);
      setMessage('');
      setError('');
    }
  };
  if (page === 'welcome')
    return (
      <Welcome
        profile={state.profile}
        run={run}
        disabled={busy || !ready}
        error={error}
        go={(next) => {
          setActor('resident');
          go(next);
        }}
      />
    );
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '15.5rem' } as React.CSSProperties}
    >
      <Sidebar className="campus-sidebar">
        <SidebarHeader>
          <a className="brand" href="/">
            <span className="brand-symbol">
              <Sprout />
            </span>
            <span>
              kampung
              <br />
              campus<span className="brand-dot">.</span>
            </span>
          </a>
          <div className="neighbourhood">
            <MapPin size={15} /> Pek Kio, Singapore{' '}
            <span className="live-dot" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="nav-caption">YOUR NEIGHBOURHOOD</div>
          <SidebarMenu>
            {nav.map((n) => (
              <SidebarMenuItem key={n.id}>
                <SidebarMenuButton
                  className="nav-button"
                  isActive={page === n.id}
                  onClick={() => {
                    setActor('resident');
                    go(n.id);
                  }}
                >
                  <n.icon />
                  <span>{n.label}</span>
                  {n.id === 'contributions' && balance.pending > 0 && (
                    <span className="nav-count">
                      {
                        state.contributions.filter(
                          (c) => c.status === 'Pending',
                        ).length
                      }
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="sidebar-invite">
            <span className="mini-icon">
              <Users />
            </span>
            <h3>
              Good at something?
              <br />
              Pass it on.
            </h3>
            <p>Every great gathering starts with a neighbour like you.</p>
            <button onClick={() => chooseActor('organizer')}>
              Start an activity <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="nav-caption">PILOT WORKSPACE</div>
          <Select value={actor} onValueChange={chooseActor}>
            <SelectTrigger
              className="role-select"
              aria-label="Choose demonstration role"
            >
              <SelectValue>{actors[actor].title} view</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(actors).map(([id, a]) => (
                <SelectItem key={id} value={id}>
                  {a.title} · {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="role-hint">Try each role in your own saved demo.</p>
        </SidebarContent>
        <SidebarFooter>
          <button className="help-button" onClick={() => go('help')}>
            <CircleHelp size={18} /> A little help?
          </button>
          <button
            className="help-button"
            onClick={() => {
              setActor('resident');
              go('welcome');
            }}
          >
            <UserRound size={18} /> Try profile setup
          </button>
          <div className="profile">
            <span className="avatar">
              {actors[actor].name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div>
              <strong>{actors[actor].name}</strong>
              <small>{actors[actor].title} · Pek Kio pilot</small>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="campus-main">
        <header className="topbar">
          <div className="mobile-brand">
            <SidebarTrigger />
            <strong>kampung campus.</strong>
          </div>
          <span className="breadcrumb">
            Your neighbourhood <span>/</span>{' '}
            {nav.find((n) => n.id === page)?.label || actors[actor].title}
          </span>
          <div className="top-actions">
            <span className="pilot-label">
              <span className="live-dot" /> PEK KIO PILOT
            </span>
            <button
              aria-label="View updates"
              onClick={() => go('updates')}
              className="notification-button"
            >
              <Bell size={19} />
              <i />
            </button>
            <span className="avatar small">
              {actors[actor].name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </span>
          </div>
        </header>
        <div className="page-content">
          <div className="heading">
            <div>
              <div className="eyebrow">A LITTLE CLOSER, EVERY DAY</div>
              <h1>{title}</h1>
              <p>{descriptions[page]}</p>
            </div>
            {page === 'discover' && (
              <Button
                className="outline-button"
                onClick={() => chooseActor('organizer')}
              >
                <Plus size={17} /> Start an activity
              </Button>
            )}
          </div>
          {error && (
            <div className="notice error" role="alert">
              {error} <button onClick={refresh}>Try again</button>
              {!ready && (
                <a href="/signin-with-chatgpt?return_to=%2F" target="_top">
                  Sign in with ChatGPT
                </a>
              )}
            </div>
          )}
          {message && (
            <output className="notice success">
              <Check size={18} />
              {message}
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage('')}
              >
                ×
              </button>
            </output>
          )}
          {state.paused && (
            <div className="notice">
              New awards and bookings are paused. Existing vouchers and deposit
              refunds remain available.
            </div>
          )}
          {!ready && !error && (
            <output className="loading-line">
              Opening your saved pilot sandbox…
            </output>
          )}
          {page === 'profile' ? (
            <ProfilePage
              profile={state.profile}
              run={run}
              disabled={busy || !ready}
              error={error}
              go={go}
            />
          ) : page === 'discover' ? (
            <div className="discover-layout">
              <section>
                <div className="feature-banner">
                  <div>
                    <span className="pill light">
                      <Sprout size={14} /> YOUR NEIGHBOURHOOD IS GROWING
                    </span>
                    <h2>
                      Come for the activity.
                      <br />
                      Stay for the people.
                    </h2>
                    <p>
                      There’s a place for you here, whether you’re
                      <br className="desktop-break" /> trying something new or
                      sharing what you know.
                    </p>
                    <button
                      onClick={() =>
                        document
                          .getElementById('activities-list')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }
                    >
                      Find your next gathering <ArrowRight size={18} />
                    </button>
                  </div>
                  <div className="banner-mark" aria-hidden="true">
                    <Users strokeWidth={1} />
                    <span>
                      Made of
                      <br />
                      <b>neighbours.</b>
                    </span>
                    <i>PEK KIO · SG</i>
                  </div>
                </div>
                <div id="activities-list" className="section-heading">
                  <h2>What’s happening around you</h2>
                  <span>{visible.length} gatherings to explore</span>
                </div>
                <div className="search-row">
                  <label className="search-box">
                    <Search size={19} />
                    <input
                      aria-label="Search activities"
                      placeholder="Try pottery, gardening, or a place nearby…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <Select
                    value={dateFilter}
                    onValueChange={(v) => v && setDateFilter(v)}
                  >
                    <SelectTrigger
                      className="date-filter"
                      aria-label="Filter by date"
                    >
                      <CalendarDays size={16} />
                      <SelectValue>
                        {dateFilter === 'any'
                          ? 'Any date'
                          : `Next ${dateFilter} days`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any date</SelectItem>
                      <SelectItem value="7">Next 7 days</SelectItem>
                      <SelectItem value="14">Next 14 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Tabs
                  value={category}
                  onValueChange={(v) => setCategory(String(v))}
                >
                  <TabsList className="category-tabs">
                    {[
                      'All activities',
                      'Outdoors',
                      'Arts & crafts',
                      'Wellness',
                      'Learning',
                    ].map((c) => (
                      <TabsTrigger key={c} value={c}>
                        {c}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="activity-grid">
                  {visible.map((a) => (
                    <button
                      key={a.id}
                      className="activity-card"
                      onClick={() => setDetail(a)}
                    >
                      <div className={`activity-image ${a.color}`}>
                        {a.image ? (
                          <img
                            src={a.image}
                            alt={
                              a.category === 'Outdoors'
                                ? 'Neighbours planting herbs together at a community workshop'
                                : 'Neighbours shaping clay at an arts workshop'
                            }
                          />
                        ) : (
                          <div className="activity-type-art">
                            {a.category === 'Wellness' ? (
                              <Leaf />
                            ) : (
                              <HeartHandshake />
                            )}
                            <span>
                              {a.category === 'Wellness'
                                ? 'A fresh start, together.'
                                : 'A little help goes a long way.'}
                            </span>
                          </div>
                        )}
                        <span className="image-category">{a.category}</span>
                        <span className="image-arrow">
                          <ArrowUpRight size={18} />
                        </span>
                      </div>
                      <div className="activity-body">
                        <span className="activity-date">
                          {date(a.starts)} · {time(a.starts)}
                        </span>
                        <h3>{a.title}</h3>
                        <p>
                          <MapPin size={14} />
                          {a.location}
                        </p>
                        <div className="activity-footer">
                          <div className="neighbour-avatars">
                            <i>FA</i>
                            <i>JT</i>
                            <i>SL</i>
                            <span>
                              {a.occupied +
                                state.registrations.filter(
                                  (r) =>
                                    r.activityId === a.id &&
                                    ['Confirmed', 'Attended'].includes(
                                      r.status,
                                    ),
                                ).length}{' '}
                              joining
                            </span>
                          </div>
                          <span className="spots">
                            {Math.max(
                              0,
                              a.capacity -
                                a.occupied -
                                state.registrations.filter(
                                  (r) =>
                                    r.activityId === a.id &&
                                    ['Confirmed', 'Attended'].includes(
                                      r.status,
                                    ),
                                ).length,
                            ) || 'No'}{' '}
                            spots left
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {!visible.length && (
                  <div className="empty-state">
                    <Search />
                    <h3>No gatherings found</h3>
                    <p>Try a different search or choose another category.</p>
                    <Button
                      onClick={() => {
                        setQuery('');
                        setCategory('All activities');
                        setDateFilter('any');
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
                <div className="section-heading">
                  <h2>A good idea starts with interest</h2>
                </div>
                {state.activities
                  .filter((a) => a.status === 'Proposed')
                  .map((a) => (
                    <div className="interest-row" key={a.id}>
                      <span className="mini-icon peach">
                        <Users />
                      </span>
                      <div>
                        <h3>{a.title}</h3>
                        <p>
                          {a.interests.length} neighbours interested · 10 to get
                          started
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        disabled={busy || !ready || a.interests.includes('mei')}
                        onClick={() => run('interest', { id: a.id })}
                      >
                        {a.interests.includes('mei')
                          ? 'You’re on the list'
                          : 'I’m interested'}
                      </Button>
                    </div>
                  ))}
              </section>
              <aside className="right-rail">
                <section className="wallet-card">
                  <div className="card-top">
                    <span className="mini-icon green">
                      <Wallet size={19} />
                    </span>
                    <span>Your Kampung Credits</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <div className="credit-number">
                    {balance.earned}
                    <span>earned credits</span>
                  </div>
                  <p>Little contributions. Real possibilities.</p>
                  <div className="wallet-mini">
                    <div>
                      <span>{balance.starter}</span>
                      <small>Starter</small>
                    </div>
                    <div>
                      <span>{balance.pending}</span>
                      <small>Pending</small>
                    </div>
                    <div>
                      <span>{balance.reserved}</span>
                      <small>Reserved</small>
                    </div>
                  </div>
                  <button onClick={() => go('wallet')}>
                    Take a look at your wallet <ArrowRight size={17} />
                  </button>
                </section>
                <section className="journey-card">
                  <div className="card-top">
                    <span className="mini-icon peach">
                      <HeartHandshake size={19} />
                    </span>
                    <h3>A little more involved</h3>
                  </div>
                  <p>
                    You’re a <b>{role}</b>. And your neighbourhood is better for
                    it.
                  </p>
                  <div className="journey-progress">
                    <span>On your way to Co-host</span>
                    <strong>{Math.min(helps, 5)} / 5 helps</strong>
                  </div>
                  <Progress
                    value={Math.min((helps / 5) * 100, 100)}
                    className="campus-progress"
                  />
                  <div className="journey-next">
                    <span>
                      <Check size={13} />
                    </span>
                    <p>
                      {helps < 5
                        ? `${5 - helps} more helping ${5 - helps === 1 ? 'hand' : 'hands'}, then try co-hosting your first gathering.`
                        : cohosts < 1
                          ? 'You’re ready to try co-hosting your first gathering.'
                          : 'Your co-host contribution is part of your story.'}
                    </p>
                  </div>
                  <button onClick={() => go('contributions')}>
                    See your journey <ArrowRight size={16} />
                  </button>
                </section>
                <section className="community-note">
                  <span className="eyebrow">THE KAMPUNG WAY</span>
                  <h3>
                    Everyone has
                    <br />
                    something to give.
                  </h3>
                  <p>
                    A skill. A story. A little of your time.
                    <br />
                    It all makes a difference here.
                  </p>
                  <span className="note-signature">
                    Let’s build this together. <HeartHandshake size={20} />
                  </span>
                </section>
              </aside>
            </div>
          ) : (
            <Workspace
              state={state}
              page={page}
              actor={actor}
              now={clock}
              run={run}
              error={error}
              busy={busy || !ready}
              go={go}
              chooseActor={chooseActor}
              onActivity={setDetail}
            />
          )}
          <footer className="site-footer">
            <span>
              <Sprout size={15} /> Rooted in Pek Kio. Grown by neighbours.
            </span>
            <span>Private pilot sandbox · sample people & credits</span>
          </footer>
        </div>
      </main>
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="campus-dialog">
          {detail && (
            <>
              {detail.image && (
                <img
                  className="dialog-image"
                  src={detail.image}
                  alt="Illustrative community workshop"
                />
              )}
              <span className="eyebrow">
                {detail.category} · {detail.status}
              </span>
              <DialogTitle>{detail.title}</DialogTitle>
              <DialogDescription>{detail.description}</DialogDescription>
              <div className="detail-facts">
                <p>
                  <CalendarDays size={17} />
                  {date(detail.starts)} · {time(detail.starts)}–
                  {time(detail.ends)}
                </p>
                <p>
                  <MapPin size={17} />
                  {detail.location}
                </p>
                <p>
                  <Users size={17} />
                  Hosted by Farah Ahmad
                </p>
              </div>
              <p>{detail.requirements}</p>
              <div className="info-box">
                <strong>
                  {detail.deposit} starter credits · refundable deposit
                </strong>
                <p>
                  Returned when you attend or cancel at least 24 hours before.
                  Late cancellations forfeit the deposit, with an appeal route
                  for exceptional circumstances.
                </p>
              </div>
              <p className="muted">{detail.safety}</p>
              {detail.bonus > 0 && (
                <p className="pill green">
                  +{detail.bonus} mission credits after independent approval
                </p>
              )}
              <Button
                disabled={
                  busy || !ready || !!registration || detail.status !== 'Open'
                }
                onClick={async () => {
                  if (await run('join', { id: detail.id })) setDetail(null);
                }}
              >
                {registration
                  ? `You’re ${registration.status.toLowerCase()}`
                  : detail.capacity <=
                      detail.occupied +
                        state.registrations.filter(
                          (r) =>
                            r.activityId === detail.id &&
                            ['Confirmed', 'Attended'].includes(r.status),
                        ).length
                    ? 'Join the waitlist · no deposit'
                    : 'Reserve my place'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
