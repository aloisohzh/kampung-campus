import {
  providerSnapshot,
  cleanExtraction,
  type ProviderSnapshot,
} from './profile-career.ts';
import type { Command } from './model.ts';
import { ensure } from './rules.ts';
import { DEFAULT_TOWN, type Town } from './towns.ts';
import { cleanTags, type ProfileDocument } from './profile-details.ts';

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
  photo?: { id: string; name: string; addedAt: string };
  providerProfiles?: Partial<Record<LoginProvider, ProviderSnapshot>>;
  personalSource?: LoginProvider;
  townConfirmedAt?: string;
  accountStep?: number;
  about?: string;
  selfSkills?: string[];
  expertise?: string[];
  hobbies?: string[];
  documents?: ProfileDocument[];
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
    autoSync?: boolean;
    careerConsent?: boolean;
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
      'Preview a consented profile import with sample details. No external account is accessed. Live use requires Singpass onboarding and approved Myinfo attributes. Your town is chosen separately; skills and qualifications need their own checks.',
  },
  linkedin: {
    title: 'LinkedIn',
    description: 'Start with your name and email.',
    detail:
      'This preview uses sample details; no external account is accessed. Standard LinkedIn sign-in provides basic profile details, with email when available. It does not verify identity or provide general access to skills and certifications.',
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
      'Preview a resident-provided profile export, such as a LinkedIn export, using prepared records. No live LinkedIn API or uploaded file is connected. Skills remain self-reported.',
  },
  credentials: {
    title: 'Digital credentials',
    description: 'Import certificates and accreditations.',
    detail:
      'Sample issuer records show document integrity, issuer, holder and validity checks, as in an OpenCerts-style flow. All issuers, records and verification results here are fictional. A live verifier is not connected.',
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
  town: Town = DEFAULT_TOWN,
) {
  const profile = previous ? structuredClone(previous) : undefined;
  const source = command.source;
  if (command.type === 'profileLogin') {
    ensure(
      source === 'singpass' || source === 'linkedin' || source === 'email',
      'Choose a supported sign-in method.',
    );
    ensure(
      command.consent === true,
      'Review and accept the profile data consent first.',
    );
    const next: ResidentProfile = profile ?? {
      mode: 'demo',
      name: 'Mei Lin',
      email: 'mei.lin@example.com',
      neighbourhood: town,
      login: { provider: source, at: stamp },
      identity: { status: 'Unverified' },
      connections: [],
      records: [],
    };
    next.login = { provider: source, at: stamp };
    const previousConnection = next.connections.find(
      (c) => c.source === source,
    );
    next.neighbourhood = town;
    next.connections = next.connections.filter((c) => c.source !== source);
    next.connections.push({
      source,
      consentAt: stamp,
      lastSynced: stamp,
      revision: (previousConnection?.revision ?? 0) + 1,
      autoSync: command.autoSync === true,
      careerConsent: source === 'linkedin' && command.careerConsent === true,
    });
    next.providerProfiles ??= {};
    for (const connection of next.connections) {
      const id = connection.source;
      if (
        (id === 'singpass' || id === 'linkedin' || id === 'email') &&
        (id === source || connection.autoSync)
      ) {
        next.providerProfiles[id] = providerSnapshot(
          id,
          stamp,
          connection.careerConsent,
        );
        connection.lastSynced = stamp;
        if (id !== source) connection.revision++;
      }
    }
    const personalSource = next.providerProfiles.singpass
      ? 'singpass'
      : next.providerProfiles.linkedin
        ? 'linkedin'
        : 'email';
    const details = next.providerProfiles[personalSource];
    if (details) {
      next.name = details.name;
      next.email = details.email;
      next.personalSource = personalSource;
    }
    if (source === 'singpass')
      next.identity = { status: 'Verified · demo', checkedAt: stamp };
    return {
      profile: next,
      message: 'Your account details are ready. Profile sync completed.',
    };
  }
  ensure(profile, 'Start with a sign-in method.');
  if (command.type === 'profilePhoto') {
    if (command.remove === true) {
      delete profile.photo;
      return { profile, message: 'Profile photo removed.' };
    }
    const metadata = command.document as
      | { id: string; name: string; content_type: string }
      | undefined;
    ensure(
      metadata &&
        metadata.id === command.uploadId &&
        ['image/jpeg', 'image/png'].includes(metadata.content_type),
      'Choose a JPG or PNG from your account.',
    );
    profile.photo = { id: metadata.id, name: metadata.name, addedAt: stamp };
    return { profile, message: 'Your profile photo is updated everywhere.' };
  }
  if (command.type === 'profileUpdate') {
    ensure(
      typeof command.about === 'string' && command.about.length <= 1200,
      'Keep your introduction within 1,200 characters.',
    );
    profile.about = command.about.trim();
    profile.accountStep = 3;
    profile.selfSkills = cleanTags(command.selfSkills);
    profile.expertise = cleanTags(command.expertise);
    profile.hobbies = cleanTags(command.hobbies);
    return {
      profile,
      message: 'Your skills, expertise and interests are saved.',
    };
  }
  if (command.type === 'profileAttach') {
    const metadata = command.document as
      | { id: string; name: string; size: number; content_type: string }
      | undefined;
    ensure(
      metadata && metadata.id === command.uploadId,
      'Choose an uploaded document from your account.',
    );
    ensure(
      ['CV / résumé', 'Certification', 'Accreditation'].includes(
        String(command.kind),
      ),
      'Choose a document type.',
    );
    ensure(
      typeof command.title === 'string' &&
        command.title.trim().length >= 2 &&
        command.title.length <= 120,
      'Give your document a title of 2–120 characters.',
    );
    ensure(
      typeof command.issuer === 'string' && command.issuer.length <= 120,
      'Keep the issuer name within 120 characters.',
    );
    ensure(
      typeof command.expires === 'string' &&
        (!command.expires ||
          (/^\d{4}-\d{2}-\d{2}$/.test(command.expires) &&
            !Number.isNaN(Date.parse(command.expires)) &&
            new Date(command.expires).toISOString().slice(0, 10) ===
              command.expires)),
      'Choose a valid expiry date.',
    );
    profile.documents ??= [];
    if (profile.documents.some((document) => document.id === metadata.id))
      return { profile, message: 'This document is already in your profile.' };
    ensure(
      profile.documents.length < 20,
      'You can keep up to 20 documents in your profile.',
    );
    const kind = command.kind as ProfileDocument['kind'];
    profile.documents.push({
      id: metadata.id,
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.content_type,
      title: command.title.trim(),
      kind,
      issuer: command.issuer.trim(),
      expires: command.expires || undefined,
      addedAt: stamp,
      skills: cleanTags(command.skills ?? []),
      extraction: command.extraction
        ? cleanExtraction(command.extraction)
        : undefined,
      extractionMethod: command.extractionMethod === 'ai' ? 'ai' : 'text',
      status: kind === 'CV / résumé' ? 'Uploaded' : 'Awaiting verification',
    });
    const reviewed = profile.documents.at(-1)?.extraction;
    if (kind === 'CV / résumé' && reviewed?.summary && !profile.about)
      profile.about = reviewed.summary;
    return {
      profile,
      message:
        kind === 'CV / résumé'
          ? 'CV and reviewed skills saved to your profile.'
          : 'Document saved. Verification is still required.',
    };
  }
  if (command.type === 'profileRemoveDocument') {
    ensure(
      profile.documents?.some((document) => document.id === command.id),
      'This document is no longer in your profile.',
    );
    profile.documents = (profile.documents ?? []).filter(
      (document) => document.id !== command.id,
    );
    return { profile, message: 'Document removed from your profile.' };
  }
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
    if (
      profile.providerProfiles &&
      (source === 'linkedin' || source === 'singpass' || source === 'email')
    )
      delete profile.providerProfiles[source];
    if (source === 'singpass') profile.identity = { status: 'Unverified' };
    return {
      profile,
      message:
        'Source disconnected. Its imported records and consent were removed from your profile. The action audit remains.',
    };
  }
  ensure(command.type === 'profileComplete', 'Unknown profile action.');
  ensure(
    profile.townConfirmedAt || profile.completedAt,
    'Confirm your town before completing your account.',
  );
  ensure(command.confirm === true, 'Confirm your profile details first.');
  profile.completedAt = profile.completedAt ?? stamp;
  return {
    profile,
    message:
      'Your profile is ready. Explore your neighbourhood and share what you know.',
  };
}
