import { ensure } from './rules.ts';
import type { ResidentProfile } from './profile.ts';

export type ProfileDocument = {
  id: string;
  name: string;
  title: string;
  kind: 'CV / résumé' | 'Certification' | 'Accreditation';
  issuer?: string;
  expires?: string;
  size: number;
  contentType: string;
  addedAt: string;
  skills: string[];
  status: 'Uploaded' | 'Awaiting verification';
};
export function cleanTags(value: unknown): string[] {
  ensure(Array.isArray(value) && value.length <= 30, 'Choose up to 30 items.');
  ensure(
    value.every(
      (item) =>
        typeof item === 'string' &&
        item.trim().length > 0 &&
        item.trim().length <= 60,
    ),
    'Each item must contain 1–60 characters.',
  );
  const result: string[] = [];
  for (const item of value as string[]) {
    const trimmed = item.trim();
    if (!result.some((tag) => tag.toLowerCase() === trimmed.toLowerCase()))
      result.push(trimmed);
  }
  return result;
}
export const allSkills = (profile?: ResidentProfile): string[] => [
  ...new Map(
    [
      ...(profile?.records
        .filter((record) => record.kind === 'Skill')
        .map((record) => record.title) ?? []),
      ...(profile?.selfSkills ?? []),
      ...(profile?.documents?.flatMap((document) => document.skills) ?? []),
    ].map((skill) => [skill.toLowerCase(), skill]),
  ).values(),
];
export const hobbyOptions = [
  'Gardening',
  'Arts & crafts',
  'Cooking',
  'Walking',
  'Fitness',
  'Photography',
  'Reading',
  'Music',
  'Technology',
  'Volunteering',
  'Board games',
  'Repair & making',
];
const skillPatterns: [string, RegExp][] = [
  [
    'Community facilitation',
    /\b(community facilitation|facilitat(?:e|ion|or|ing))\b/i,
  ],
  ['Urban gardening', /\b(gardening|horticulture|urban farming)\b/i],
  [
    'Digital mentoring',
    /\b(digital mentoring|digital literacy|tech support)\b/i,
  ],
  ['Project management', /\bproject management\b/i],
  [
    'Event planning',
    /\b(event planning|event management|organis(?:e|ed|ing) events)\b/i,
  ],
  ['Teaching', /\b(teaching|tutoring|teacher)\b/i],
  ['First aid', /\bfirst aid\b/i],
  ['Communication', /\bcommunication\b/i],
  ['Leadership', /\bleadership\b/i],
  ['Data analysis', /\b(data analysis|data analytics)\b/i],
  ['Excel', /\bexcel\b/i],
  ['Python', /\bpython\b/i],
  ['Web development', /\b(web development|react|javascript)\b/i],
  ['Graphic design', /\b(graphic design|illustration)\b/i],
  ['Photography', /\bphotography\b/i],
  ['Cooking', /\b(cooking|culinary|chef)\b/i],
  ['Baking', /\bbaking\b/i],
  ['Sewing', /\b(sewing|tailoring)\b/i],
  ['Pottery', /\b(pottery|ceramics)\b/i],
  ['Woodworking', /\b(woodworking|carpentry)\b/i],
  ['Accounting', /\b(accounting|bookkeeping)\b/i],
  ['Marketing', /\bmarketing\b/i],
  ['Customer service', /\bcustomer service\b/i],
  ['Translation', /\b(translation|interpreter)\b/i],
  ['Music', /\b(piano|guitar|music)\b/i],
];
// Suggestions are explicit text matches. They are reviewed by the resident, never verification.
export const suggestSkills = (text: string) =>
  skillPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([skill]) => skill);
export const exampleCV = `Mei Lin — example CV
Community volunteer and digital mentor

Experience
Community facilitation: welcomed neighbours and helped small groups learn together.
Urban gardening: ran herb-potting activities and cared for community planters.
Digital mentoring: helped older residents use video calls and recognise online scams.
Event planning: coordinated workshop materials, schedules and accessible meeting places.

Skills
Teaching, communication, project management and Excel.

Interests
Gardening, photography, reading and volunteering.

This is a fictional example for the Kampung Campus account journey.
`;
export function greeting(now: number) {
  const hour = Number(
    new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(now),
  );
  return hour < 12
    ? 'Good morning'
    : hour < 18
      ? 'Good afternoon'
      : 'Good evening';
}
