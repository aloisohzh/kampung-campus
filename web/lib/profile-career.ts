import { ensure } from './rules.ts';
import type { ResidentProfile, LoginProvider } from './profile.ts';

export type CareerEntry = {
  title: string;
  organisation: string;
  period: string;
  description: string;
};
export type DocumentExtraction = {
  name: string;
  email: string;
  headline: string;
  summary: string;
  title: string;
  issuer: string;
  issued: string;
  expires: string;
  skills: string[];
  experience: CareerEntry[];
  education: CareerEntry[];
};
export type ProviderSnapshot = {
  name: string;
  email: string;
  headline: string;
  skills: string[];
  experience: CareerEntry[];
  education: CareerEntry[];
  syncedAt: string;
  mode: 'preview';
};
export const emptyExtraction = (): DocumentExtraction => ({
  name: '',
  email: '',
  headline: '',
  summary: '',
  title: '',
  issuer: '',
  issued: '',
  expires: '',
  skills: [],
  experience: [],
  education: [],
});
// Demonstration adapter: replace with approved provider responses before live onboarding.
// Basic LinkedIn OIDC does not grant full career-history access.
export function providerSnapshot(
  source: LoginProvider,
  stamp: string,
  includeCareer = false,
): ProviderSnapshot {
  return {
    name: 'Mei Lin',
    email: 'mei.lin@example.com',
    headline: source === 'linkedin' ? 'Community programmes coordinator' : '',
    skills:
      source === 'linkedin' && includeCareer
        ? ['Community facilitation', 'Project management', 'Digital mentoring']
        : [],
    experience:
      source === 'linkedin' && includeCareer
        ? [
            {
              title: 'Community programmes coordinator',
              organisation: 'Neighbourhood Learning Collective',
              period: '2023 – Present',
              description:
                'Coordinates learning circles, volunteer schedules and digital mentoring activities.',
            },
            {
              title: 'Programme executive',
              organisation: 'Community Learning Studio',
              period: '2020 – 2023',
              description:
                'Planned inclusive workshops and supported community volunteers.',
            },
          ]
        : [],
    education: [],
    syncedAt: stamp,
    mode: 'preview',
  };
}
export function cleanCareer(value: unknown): CareerEntry[] {
  ensure(
    Array.isArray(value) && value.length <= 12,
    'Keep up to 12 experience or education entries per document.',
  );
  return value.map((entry) => {
    ensure(
      entry && typeof entry === 'object',
      'Review the extracted experience details.',
    );
    const record = entry as Record<string, unknown>;
    const result = {} as CareerEntry;
    for (const key of [
      'title',
      'organisation',
      'period',
      'description',
    ] as const) {
      ensure(
        typeof record[key] === 'string' &&
          record[key].length <= (key === 'description' ? 1200 : 160),
        'Keep extracted details within the field limits.',
      );
      result[key] = record[key].trim();
    }
    ensure(
      result.title.length > 0,
      'Each experience or education entry needs a title.',
    );
    return result;
  });
}
export function cleanExtraction(value: unknown): DocumentExtraction {
  ensure(value && typeof value === 'object', 'Review the document details.');
  const record = value as Record<string, unknown>;
  const result = emptyExtraction();
  for (const key of [
    'name',
    'email',
    'headline',
    'summary',
    'title',
    'issuer',
    'issued',
    'expires',
  ] as const) {
    ensure(
      typeof record[key] === 'string' &&
        record[key].length <= (key === 'summary' ? 1200 : 160),
      'Keep extracted details within the field limits.',
    );
    result[key] = record[key].trim();
  }
  ensure(
    Array.isArray(record.skills) &&
      record.skills.length <= 30 &&
      record.skills.every(
        (s) => typeof s === 'string' && s.length > 0 && s.length <= 60,
      ),
    'Review the extracted skills.',
  );
  result.skills = [...new Set(record.skills as string[])];
  result.experience = cleanCareer(record.experience);
  result.education = cleanCareer(record.education);
  return result;
}
export function careerEntries(
  profile: ResidentProfile,
  kind: 'experience' | 'education',
) {
  const entries = [
    ...Object.entries(profile.providerProfiles ?? {}).flatMap(
      ([source, data]) =>
        (data?.[kind] ?? []).map((entry) => ({
          ...entry,
          source:
            source === 'linkedin'
              ? 'Imported professional profile'
              : 'Imported profile',
        })),
    ),
    ...(profile.documents ?? []).flatMap((doc) =>
      (doc.extraction?.[kind] ?? []).map((entry) => ({
        ...entry,
        source: doc.title,
      })),
    ),
  ];
  return [
    ...new Map(
      entries.map((entry) => [
        [entry.title, entry.organisation, entry.period].join('|').toLowerCase(),
        entry,
      ]),
    ).values(),
  ];
}
export function profileProgress(profile: ResidentProfile) {
  return [
    {
      label: 'Personal details',
      done: !!profile.name && !!profile.email,
      tab: 'personal',
    },
    { label: 'Profile photo', done: !!profile.photo, tab: 'personal' },
    { label: 'Introduction', done: !!profile.about, tab: 'skills' },
    {
      label: 'Skills & interests',
      done:
        !!profile.hobbies?.length &&
        (!!profile.selfSkills?.length ||
          !!Object.values(profile.providerProfiles ?? {}).some(
            (p) => p?.skills.length,
          ) ||
          !!profile.documents?.some((d) => d.skills.length)),
      tab: 'skills',
    },
    {
      label: 'CV or credentials',
      done: !!profile.documents?.length,
      tab: 'documents',
    },
  ];
}
