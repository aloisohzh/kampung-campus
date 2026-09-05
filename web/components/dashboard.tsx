'use client';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  HeartHandshake,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sprout,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  upcomingBookings,
  recommendedActivities,
  neighbourhoodItems,
} from '@/lib/dashboard';
import { selectedTown, activityTown } from '@/lib/towns';
import { date, time } from '@/lib/presentation';
import { wallet, type Activity, type PilotState } from '@/lib/model';
const dayKey = (value: number) =>
  new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Singapore',
  }).format(value);

const calendarDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day));
function CalendarWidget({
  state,
  now,
  onActivity,
}: {
  state: PilotState;
  now: number;
  onActivity: (activity: Activity) => void;
}) {
  const [offset, setOffset] = useState(0);
  const parts = new Intl.DateTimeFormat('en-SG', {
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Singapore',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value) - 1;
  const first = calendarDate(year, month + offset, 1);
  const days = calendarDate(
    first.getUTCFullYear(),
    first.getUTCMonth() + 1,
    0,
  ).getUTCDate();
  const padding = (first.getUTCDay() + 6) % 7;
  const bookings = upcomingBookings(state, now);
  return (
    <section className="dashboard-card calendar-widget">
      <div className="widget-heading">
        <h2>Your calendar</h2>
        <CalendarDays size={21} />
      </div>
      <div className="calendar-month">
        <button
          aria-label="Previous month"
          onClick={() => setOffset(offset - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <strong>
          {first.toLocaleDateString('en-SG', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })}
        </strong>
        <button aria-label="Next month" onClick={() => setOffset(offset + 1)}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-grid">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => (
          <span key={'day-' + i} className="calendar-day-name">
            {label}
          </span>
        ))}
        {Array.from({ length: padding }, (_, i) => (
          <span key={'space-' + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const stamp = calendarDate(
            first.getUTCFullYear(),
            first.getUTCMonth(),
            i + 1,
          ).getTime();
          const key = dayKey(stamp);
          const entries = bookings.filter(
            ({ activity }) => dayKey(Date.parse(activity.starts)) === key,
          );
          return entries.length ? (
            <button
              className="calendar-event"
              key={i}
              aria-label={
                date(new Date(stamp).toISOString()) +
                ': ' +
                entries.map(({ activity }) => activity.title).join(', ')
              }
              onClick={() => onActivity(entries[0].activity)}
            >
              {i + 1}
              <i />
            </button>
          ) : (
            <span
              key={i}
              className={key === dayKey(now) ? 'calendar-today' : ''}
            >
              {i + 1}
            </span>
          );
        })}
      </div>
      <p className="quiet-copy">
        <span className="calendar-legend" />
        Confirmed gatherings
      </p>
    </section>
  );
}
function GatheringLink({
  activity,
  reason,
  onActivity,
}: {
  activity: Activity;
  reason: string;
  onActivity: (a: Activity) => void;
}) {
  return (
    <button
      className="dashboard-gathering"
      onClick={() => onActivity(activity)}
    >
      <span className="gathering-date">
        <b>
          {new Date(activity.starts).toLocaleDateString('en-SG', {
            day: 'numeric',
            timeZone: 'Asia/Singapore',
          })}
        </b>
        <small>
          {new Date(activity.starts).toLocaleDateString('en-SG', {
            month: 'short',
            timeZone: 'Asia/Singapore',
          })}
        </small>
      </span>
      <span>
        <span className="gathering-reason">{reason}</span>
        <strong>{activity.title}</strong>
        <small>
          {time(activity.starts)} · {activity.location}
        </small>
        <small>{activityTown(activity)}</small>
      </span>
      <ArrowUpRight size={18} />
    </button>
  );
}
export function Dashboard({
  state,
  now,
  go,
  onActivity,
}: {
  state: PilotState;
  now: number;
  go: (page: string) => void;
  onActivity: (a: Activity) => void;
}) {
  const booked = upcomingBookings(state, now);
  const recommendations = recommendedActivities(state, now);
  const nearby = recommendations.filter((entry) => entry.local);
  const feed = neighbourhoodItems(state, now);
  const actions = feed.filter((item) => item.kind !== 'Nearby').slice(0, 3);
  const balance = wallet(state, 'mei', now);
  return (
    <div className="dashboard-layout">
      <div className="dashboard-overview">
        <span>
          <MapPin size={17} />
          {selectedTown(state)}
        </span>
        <span>
          {new Date(now).toLocaleDateString('en-SG', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: 'Asia/Singapore',
          })}
        </span>
      </div>
      <div className="dashboard-metrics">
        <button onClick={() => go('activities')}>
          <CalendarDays />
          <span>
            <b>{booked.length}</b>
            <small>upcoming gatherings</small>
          </span>
          <ArrowUpRight size={17} />
        </button>
        <button onClick={() => go('wallet')}>
          <Wallet />
          <span>
            <b>{balance.earned}</b>
            <small>earned credits</small>
          </span>
          <ArrowUpRight size={17} />
        </button>
        <button onClick={() => go('contributions')}>
          <HeartHandshake />
          <span>
            <b>{balance.pending}</b>
            <small>credits awaiting review</small>
          </span>
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="dashboard-grid">
        <section className="dashboard-card upcoming-widget">
          <div className="widget-heading">
            <h2>Your next gatherings</h2>
            <button onClick={() => go('activities')}>
              View all
              <ArrowRight size={16} />
            </button>
          </div>
          {booked.length ? (
            booked
              .slice(0, 3)
              .map(({ activity }) => (
                <GatheringLink
                  key={activity.id}
                  activity={activity}
                  reason="Your place is confirmed"
                  onActivity={onActivity}
                />
              ))
          ) : (
            <div className="widget-empty">
              <CalendarDays size={30} />
              <h3>Your calendar has room for something good.</h3>
              <p>Reserve a place and your next gathering will appear here.</p>
              <Button onClick={() => go('discover')}>
                Find a gathering
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </section>
        <CalendarWidget state={state} now={now} onActivity={onActivity} />
        <section className="dashboard-card">
          <div className="widget-heading">
            <h2>A few useful next steps</h2>
            <Check size={21} />
          </div>
          {actions.length ? (
            actions.map((item) => (
              <button
                className="dashboard-action"
                key={item.id}
                onClick={() => go(item.page)}
              >
                <span>
                  <small>{item.kind}</small>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </span>
                <ArrowRight size={17} />
              </button>
            ))
          ) : (
            <div className="widget-empty">
              <Check size={28} />
              <h3>You’re all caught up.</h3>
              <p>
                We’ll surface booking reminders and things that need your
                attention here.
              </p>
            </div>
          )}
          <button className="widget-link" onClick={() => go('profile')}>
            Update skills & interests
            <ArrowRight size={16} />
          </button>
        </section>
        <section className="dashboard-card">
          <div className="widget-heading">
            <h2>You may be interested</h2>
            <Sprout size={21} />
          </div>
          {recommendations.length ? (
            recommendations
              .slice(0, 3)
              .map(({ activity, reason }) => (
                <GatheringLink
                  key={activity.id}
                  activity={activity}
                  reason={reason}
                  onActivity={onActivity}
                />
              ))
          ) : (
            <div className="widget-empty">
              <p>More suggestions will appear as new gatherings are added.</p>
            </div>
          )}
          <button className="widget-link" onClick={() => go('discover')}>
            Explore all gatherings
            <ArrowRight size={16} />
          </button>
        </section>
        <section className="dashboard-card nearby-widget">
          <div className="widget-heading">
            <h2>Nearby in {selectedTown(state)}</h2>
            <MapPin size={21} />
          </div>
          {nearby.length ? (
            nearby
              .slice(0, 2)
              .map(({ activity }) => (
                <GatheringLink
                  key={activity.id}
                  activity={activity}
                  reason={activity.category}
                  onActivity={onActivity}
                />
              ))
          ) : (
            <div className="widget-empty">
              <p>
                No new gatherings are listed in your town yet. Explore other
                towns or help start one.
              </p>
              <Button variant="outline" onClick={() => go('discover')}>
                Explore gatherings
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
export function CommunityUpdates({
  state,
  now,
  go,
  onActivity,
}: {
  state: PilotState;
  now: number;
  go: (page: string) => void;
  onActivity: (a: Activity) => void;
}) {
  const items = neighbourhoodItems(state, now);
  return (
    <section className="updates-list">
      {items.length ? (
        items.map((item) => (
          <button
            className="community-update"
            key={item.id}
            onClick={() =>
              item.activity ? onActivity(item.activity) : go(item.page)
            }
          >
            <span className="mini-icon">
              {item.kind === 'Nearby' ? (
                <Sprout />
              ) : item.kind === 'Reminder' ? (
                <CalendarDays />
              ) : (
                <Bell />
              )}
            </span>
            <span>
              <small>{item.kind}</small>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              {item.activity && (
                <small>
                  {date(item.activity.starts)} · {time(item.activity.starts)}
                </small>
              )}
            </span>
            <ArrowRight size={18} />
          </button>
        ))
      ) : (
        <div className="dashboard-card widget-empty">
          <Check size={32} />
          <h2>You’re all caught up.</h2>
          <p>
            Relevant gatherings, reminders and items needing your attention will
            appear here.
          </p>
          <Button onClick={() => go('discover')}>Explore gatherings</Button>
        </div>
      )}
    </section>
  );
}
