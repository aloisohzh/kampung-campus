import type { Activity, PilotState } from './model.ts';
import type { ResidentProfile } from './profile.ts';
import { allSkills } from './profile-details.ts';
import { selectedTown, inTown } from './towns.ts';

export function accountRoute(
  profile: ResidentProfile | undefined,
  requested = 'dashboard',
) {
  if (!profile) return 'welcome';
  if (requested === 'welcome') return 'welcome';
  if (!profile.completedAt) return 'account';
  return requested || 'dashboard';
}
export function upcomingBookings(state: PilotState, now: number) {
  return state.registrations
    .filter((r) => r.resident === 'mei' && r.status === 'Confirmed')
    .flatMap((registration) => {
      const activity = state.activities.find(
        (a) => a.id === registration.activityId,
      );
      return activity &&
        activity.status === 'Open' &&
        Date.parse(activity.ends) > now
        ? [{ registration, activity }]
        : [];
    })
    .sort(
      (a, b) => Date.parse(a.activity.starts) - Date.parse(b.activity.starts),
    );
}
const interestCategories: Record<string, string> = {
  Gardening: 'Outdoors',
  'Arts & crafts': 'Arts & crafts',
  Cooking: 'Arts & crafts',
  Walking: 'Wellness',
  Fitness: 'Wellness',
  Photography: 'Arts & crafts',
  Reading: 'Learning',
  Music: 'Arts & crafts',
  Technology: 'Learning',
  Volunteering: 'Learning',
  'Board games': 'Interest groups',
  'Repair & making': 'Interest groups',
};
export function recommendedActivities(state: PilotState, now: number) {
  const town = selectedTown(state);
  const skills = [
    ...allSkills(state.profile),
    ...(state.profile?.expertise ?? []),
  ].map((s) => s.toLowerCase());
  const interests = state.profile?.hobbies ?? [];
  return state.activities
    .filter(
      (a) =>
        a.status === 'Open' &&
        Date.parse(a.starts) > now &&
        !state.registrations.some(
          (r) =>
            r.activityId === a.id &&
            r.resident === 'mei' &&
            ['Confirmed', 'Waitlisted', 'Attended'].includes(r.status),
        ),
    )
    .map((activity) => {
      const hobby = interests.find(
        (h) => interestCategories[h] === activity.category,
      );
      const skill = skills.find(
        (s) =>
          (activity.title + ' ' + activity.description)
            .toLowerCase()
            .includes(s) ||
          (s.includes('garden') && activity.category === 'Outdoors') ||
          ((s.includes('digital') || s.includes('teaching')) &&
            activity.category === 'Learning'),
      );
      const local = inTown(activity, town);
      return {
        activity,
        local,
        score: (local ? 4 : 0) + (hobby ? 3 : 0) + (skill ? 2 : 0),
        reason: hobby
          ? 'Because you enjoy ' + hobby.toLowerCase()
          : skill
            ? 'A chance to share your skills'
            : local
              ? 'In your town'
              : 'Elsewhere in Singapore',
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        Date.parse(a.activity.starts) - Date.parse(b.activity.starts),
    );
}
export type CommunityItem = {
  id: string;
  title: string;
  body: string;
  page: string;
  kind: 'Action needed' | 'Reminder' | 'Nearby';
  activity?: Activity;
};
export function neighbourhoodItems(
  state: PilotState,
  now: number,
): CommunityItem[] {
  const items: CommunityItem[] = [];
  for (const { activity } of upcomingBookings(state, now).slice(0, 3))
    items.push({
      id: 'booking-' + activity.id,
      title: 'Coming up: ' + activity.title,
      body: 'Your place is confirmed. Review the meeting place and what to bring.',
      page: 'activities',
      kind: 'Reminder',
      activity,
    });
  const pending = state.contributions.filter(
    (c) =>
      c.resident === 'mei' &&
      !['Approved', 'Rejected', 'Cancelled'].includes(c.status),
  );
  if (pending.length)
    items.push({
      id: 'claims',
      title:
        pending.length +
        ' contribution' +
        (pending.length === 1 ? '' : 's') +
        ' in progress',
      body: 'Check the latest status or respond to a request for evidence.',
      page: 'contributions',
      kind: pending.some((claim) => claim.status === 'More evidence')
        ? 'Action needed'
        : 'Reminder',
    });
  const attention =
    state.profile?.records.filter(
      (r) => r.kind !== 'Skill' && !r.status.startsWith('Verified'),
    ).length ?? 0;
  if (attention)
    items.push({
      id: 'credentials',
      title:
        'Review ' + attention + ' credential' + (attention === 1 ? '' : 's'),
      body: 'An expired or revoked credential needs your attention.',
      page: 'profile',
      kind: 'Action needed',
    });
  const documents =
    state.profile?.documents?.filter(
      (d) => d.status === 'Awaiting verification',
    ).length ?? 0;
  if (documents)
    items.push({
      id: 'documents',
      title: 'Your uploaded credentials are awaiting verification',
      body: 'Uploads are saved separately from verified issuer records.',
      page: 'profile',
      kind: 'Reminder',
    });
  for (const { activity } of recommendedActivities(state, now)
    .filter((item) => item.local)
    .slice(0, 3))
    items.push({
      id: 'nearby-' + activity.id,
      title: activity.title,
      body:
        'A gathering in ' + selectedTown(state) + ' is open for registration.',
      page: 'discover',
      kind: 'Nearby',
      activity,
    });
  return items;
}
