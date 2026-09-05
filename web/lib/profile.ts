import type { Command } from './model.ts';
import { ensure } from './rules.ts';

export type LoginProvider = 'singpass' | 'linkedin' | 'email';
export type ImportSource = 'skills' | 'credentials';
export type ProfileSource = LoginProvider | ImportSource;
export type ProfileRecord = {
  id: string;
  kind: 'Skill' | 'Certification' | 'Accreditation';
  title: string;
  issuer: string;
  source: ImportSource;
  status:
    | 'Self-reported'
    | 'Verified · demo'
    | 'Expired · demo'
    | 'Revoked · demo';
  reference?: string;
  issued?: string;
  expires?: string;
  syncedAt?: string;
};
export type ResidentProfile = {
  mode: 'demo';
  name: string;
  email: string;
  neighbourhood: string;
  login: { provider: LoginProvider; at: string };
  identity: { status: 'Unverified' | 'Verified · demo'; checkedAt?: string };
  connections: {
    source: ProfileSource;
    consentAt: string;
    lastSynced: string;
    revision: number;
  }[];
  records: ProfileRecord[];
  completedAt?: string;
};

export const sourceInfo: Record<
  ProfileSource,
  { title: string; description: string; detail: string }
> = {
  singpass: {
    title: 'Singpass / Myinfo',
    description: 'Verify identity and prefill your profile.',
    detail:
      'Demonstrates a consented name and neighbourhood import. Live use requires Singpass onboarding and approved Myinfo attributes. It does not verify your skills or qualifications.',
  },
  linkedin: {
    title: 'LinkedIn',
    description: 'Start with your name and email.',
    detail:
      'Standard LinkedIn sign-in provides basic profile details, with email when available. It does not verify your identity or provide general access to skills and certifications.',
  },
  email: {
    title: 'Email link',
    description: 'A simple alternative to get started.',
    detail:
      'This sample email-link journey uses mei.lin@example.com. No email is sent. Email access alone does not establish verified identity.',
  },
  skills: {
    title: 'Professional profile import',
    description: 'Bring your skills in together.',
    detail:
      'Sample of a resident-provided profile export, such as a LinkedIn export. This demo uses prepared records, not a live LinkedIn API or an uploaded file. Skills remain self-reported.',
  },
  credentials: {
    title: 'Digital credentials',
    description: 'Import certificates and accreditations.',
    detail:
      'Sample issuer records demonstrate document integrity, issuer, holder and validity checks, as in an OpenCerts-style flow. All issuers, records and verification results here are fictional. A live verifier is not connected.',
  },
};

// Fixed, server-owned fixtures. Never accept a verification result from a client.
export function sampleRecords(
  source: ImportSource,
  revision: number,
): ProfileRecord[] {
  if (source === 'skills') {
    const skills = [
      'Community facilitation',
      'Urban gardening',
      'Digital mentoring',
    ];
    if (revision >= 2) skills.push('Accessible workshop design');
    return skills.map((title, i) => ({
      id: `skill-${i + 1}`,
      title,
      kind: 'Skill',
      issuer: 'Sample professional profile export',
      source,
      status: 'Self-reported',
    }));
  }
  return [
    {
      id: 'credential-first-aid',
      kind: 'Certification',
      title: 'Community First Aid',
      issuer: 'Kampung Learning Lab · fictional issuer',
      source,
      status: revision >= 2 ? 'Revoked · demo' : 'Verified · demo',
      reference: 'DEMO-FA-2041',
      issued: '2026-01-10',
      expires: '2028-01-10',
    },
    {
      id: 'credential-facilitation',
      kind: 'Certification',
      title: 'Inclusive Workshop Facilitation',
      issuer: 'Neighbourhood Academy · fictional issuer',
      source,
      status: 'Verified · demo',
      reference: 'DEMO-IWF-082',
      issued: '2026-04-12',
      expires: '2028-04-12',
    },
    {
      id: 'credential-mentor',
      kind: 'Accreditation',
      title: 'Community Digital Mentor',
      issuer: 'Neighbourhood Academy · fictional issuer',
      source,
      status: 'Expired · demo',
      reference: 'DEMO-CDM-015',
      issued: '2024-06-01',
      expires: '2025-06-01',
    },
  ];
}

export function recordChange(record: ProfileRecord, previous?: ProfileRecord) {
  if (!previous) return 'New';
  return record.status === previous.status && record.title === previous.title
    ? 'Unchanged'
    : 'Updated';
}

export function updateProfile(
  previous: ResidentProfile | undefined,
  command: Command,
  stamp: string,
) {
  const profile = previous ? structuredClone(previous) : undefined;
  const source = command.source;
  if (command.type === 'profileLogin') {
    ensure(
      source === 'singpass' || source === 'linkedin' || source === 'email',
      'Choose a supported demo sign-in method.',
    );
    ensure(
      command.consent === true,
      'Review and accept the sample data consent first.',
    );
    const next: ResidentProfile = profile ?? {
      mode: 'demo',
      name: 'Mei Lin',
      email: 'mei.lin@example.com',
      neighbourhood: 'Pek Kio',
      login: { provider: source, at: stamp },
      identity: { status: 'Unverified' },
      connections: [],
      records: [],
    };
    next.login = { provider: source, at: stamp };
    next.connections = next.connections.filter((c) => c.source !== source);
    next.connections.push({
      source,
      consentAt: stamp,
      lastSynced: stamp,
      revision: 1,
    });
    if (source === 'singpass')
      next.identity = { status: 'Verified · demo', checkedAt: stamp };
    return {
      profile: next,
      message: `${sourceInfo[source].title} demo completed. Sample profile details are ready.`,
    };
  }
  ensure(profile, 'Start with a demo sign-in method.');
  if (command.type === 'profileImport') {
    ensure(
      source === 'skills' || source === 'credentials',
      'Choose a supported import source.',
    );
    ensure(command.consent === true, 'Consent is required for this import.');
    const connection = profile.connections.find((c) => c.source === source);
    const expectedRevision = connection ? 2 : 1;
    ensure(
      command.revision === expectedRevision,
      'This import preview is out of date. Close it and check for updates again.',
    );
    const records = sampleRecords(source, expectedRevision);
    const selected = command.selected;
    ensure(
      Array.isArray(selected) &&
        selected.length > 0 &&
        selected.length <= records.length &&
        new Set(selected).size === selected.length &&
        selected.every(
          (id) => typeof id === 'string' && records.some((r) => r.id === id),
        ),
      'Select valid sample records to import.',
    );
    ensure(
      profile.records
        .filter((r) => r.source === source)
        .every((r) => selected.includes(r.id)),
      'Existing records must be rechecked together so validity changes are not missed.',
    );
    const incoming = records.filter((r) => selected.includes(r.id));
    const added = incoming.filter(
      (r) => !profile.records.some((p) => p.id === r.id),
    ).length;
    const updated = incoming.filter(
      (r) =>
        recordChange(
          r,
          profile.records.find((p) => p.id === r.id),
        ) === 'Updated',
    ).length;
    profile.records = [
      ...profile.records.filter((r) => r.source !== source),
      ...incoming.map((r) => ({ ...r, syncedAt: stamp })),
    ];
    profile.connections = profile.connections.filter(
      (c) => c.source !== source,
    );
    profile.connections.push({
      source,
      consentAt: connection?.consentAt ?? stamp,
      lastSynced: stamp,
      revision: expectedRevision,
    });
    return {
      profile,
      message: `${added} added, ${updated} updated. ${sourceInfo[source].title} saved without duplicate records.`,
    };
  }
  if (command.type === 'profileDisconnect') {
    ensure(
      typeof source === 'string' &&
        profile.connections.some((c) => c.source === source),
      'This source is not connected.',
    );
    profile.connections = profile.connections.filter(
      (c) => c.source !== source,
    );
    profile.records = profile.records.filter((r) => r.source !== source);
    if (source === 'singpass') profile.identity = { status: 'Unverified' };
    return {
      profile,
      message:
        'Source disconnected. Its imported records and consent were removed from your profile. The pilot action audit remains.',
    };
  }
  ensure(command.type === 'profileComplete', 'Unknown profile action.');
  ensure(
    command.confirm === true,
    'Confirm your sample profile details first.',
  );
  profile.completedAt = profile.completedAt ?? stamp;
  return {
    profile,
    message:
      'Your demo profile is ready. Explore your neighbourhood and share what you know.',
  };
}
