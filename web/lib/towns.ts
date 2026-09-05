import type { Activity, PilotState } from './model.ts';

// HDB's 24 towns and 3 estates, checked against its published town design guide.
// https://www.hdb.gov.sg/-/media/about-us/our-role/plan-and-design-towns/town-design-guides/Bukit-Merah-Town-Design-Guide.pdf
export const towns = [
  'Ang Mo Kio',
  'Bedok',
  'Bishan',
  'Bukit Batok',
  'Bukit Merah',
  'Bukit Panjang',
  'Bukit Timah',
  'Central Area',
  'Choa Chu Kang',
  'Clementi',
  'Geylang',
  'Hougang',
  'Jurong East',
  'Jurong West',
  'Kallang/Whampoa',
  'Marine Parade',
  'Pasir Ris',
  'Punggol',
  'Queenstown',
  'Sembawang',
  'Sengkang',
  'Serangoon',
  'Tampines',
  'Tengah',
  'Toa Payoh',
  'Woodlands',
  'Yishun',
] as const;
export type Town = (typeof towns)[number];
export const DEFAULT_TOWN: Town = 'Kallang/Whampoa';
export const isTown = (value: unknown): value is Town =>
  typeof value === 'string' && (towns as readonly string[]).includes(value);
export const selectedTown = (state: PilotState): Town =>
  state.town ??
  (isTown(state.profile?.neighbourhood)
    ? state.profile.neighbourhood
    : DEFAULT_TOWN);
// Existing saved activities all belong to Pek Kio, within Kallang/Whampoa.
export const activityTown = (activity: Activity): Town =>
  activity.town ?? DEFAULT_TOWN;
export const inTown = (activity: Activity, town: Town): boolean =>
  activityTown(activity) === town;
