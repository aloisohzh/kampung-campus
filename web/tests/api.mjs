import assert from 'node:assert/strict';
const base = process.env.PILOT_TEST_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('Run this test only against a local development server.');
const owner = `test-${crypto.randomUUID()}`;
const headers = {
  'oai-authenticated-user-id': owner,
  'oai-authenticated-user-email': 'pilot-test@example.invalid',
  Origin: base,
  'Content-Type': 'application/json',
};
async function get(user = owner) {
  const r = await fetch(`${base}/api/pilot`, {
    headers: { ...headers, 'oai-authenticated-user-id': user },
  });
  assert.equal(r.status, 200);
  return r.json();
}
async function post(type, actor, payload = {}) {
  const r = await fetch(`${base}/api/pilot`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type, actor, key: crypto.randomUUID(), ...payload }),
  });
  return { status: r.status, ...(await r.json()) };
}
const first = await get();
assert.equal(first.state.town, 'Kallang/Whampoa');
assert.equal(
  (await post('selectTown', 'resident', { town: 'Tampines' })).status,
  400,
);
assert.equal(
  (
    await post('profileLogin', 'resident', {
      source: 'singpass',
      consent: false,
    })
  ).status,
  400,
);
assert.equal(
  (
    await post('profileLogin', 'resident', {
      source: 'singpass',
      consent: true,
    })
  ).status,
  200,
);
assert.equal((await get()).state.profile.identity.status, 'Verified · demo');
assert.equal(
  (await post('selectTown', 'resident', { town: 'Tampines' })).status,
  200,
);
assert.equal((await get()).state.town, 'Tampines');
assert.equal((await get(`${owner}-other`)).state.town, 'Kallang/Whampoa');
assert.equal(
  (await post('selectTown', 'resident', { town: 'unsupported' })).status,
  400,
);
assert.equal((await get()).state.profile.neighbourhood, 'Tampines');
assert.equal(
  (await post('selectTown', 'resident', { town: 'Bedok' })).status,
  200,
);
assert.equal((await get()).state.profile.neighbourhood, 'Bedok');
assert.deepEqual((await get()).state.transactions, first.state.transactions);
console.log(
  'PASS: town selection persists, remains owner-isolated, validates input and updates profiles',
);
assert.equal(
  (
    await post('profileImport', 'resident', {
      source: 'skills',
      consent: true,
      revision: 1,
      selected: ['skill-1', 'skill-2', 'skill-3'],
    })
  ).status,
  200,
);
const profileSyncs = await Promise.all(
  Array.from({ length: 8 }, () =>
    post('profileImport', 'resident', {
      source: 'skills',
      consent: true,
      revision: 2,
      selected: ['skill-1', 'skill-2', 'skill-3', 'skill-4'],
    }),
  ),
);
assert.ok(profileSyncs.some((r) => r.status === 200));
assert.equal((await get()).state.profile.records.length, 4);
assert.equal((await get(`${owner}-other`)).state.profile, undefined);
assert.equal(
  (await post('profileDisconnect', 'resident', { source: 'skills' })).status,
  200,
);
assert.equal((await get()).state.profile.records.length, 0);
console.log(
  'PASS: profile consent, persistence, concurrent sync deduplication, owner isolation and disconnect',
);
await new Promise((r) => setTimeout(r, 10));
const second = await get(`${owner}-other`);
assert.notEqual(
  first.state.created,
  second.state.created,
  'Test owners must be isolated before any mutation.',
);
const approvals = await Promise.all(
  Array.from({ length: 8 }, () =>
    post('review', 'reviewer', {
      id: 'claim-study',
      decision: 'approve',
      reason: 'Independent reviewer checked organizer evidence.',
    }),
  ),
);
assert.equal(approvals.filter((r) => r.status === 200).length, 1);
assert.equal(
  (await get()).state.transactions.filter((t) => t.reference === 'claim-study')
    .length,
  1,
);
console.log('PASS: eight concurrent approvals award credits exactly once');
const redemptions = await Promise.all(
  Array.from({ length: 8 }, () => post('redeem', 'resident', { id: 'kopi' })),
);
assert.equal(redemptions.filter((r) => r.status === 200).length, 1);
const state = (await get()).state;
assert.equal(state.vouchers.length, 1);
assert.equal(
  state.transactions
    .filter((t) => t.creditType === 'earned')
    .reduce((n, t) => n + t.available, 0),
  0,
);
console.log(
  'PASS: eight concurrent redemptions cannot double-spend or over-allocate inventory',
);
const uses = await Promise.all(
  Array.from({ length: 8 }, () =>
    post('useVoucher', 'merchant', { id: state.vouchers[0].id }),
  ),
);
assert.equal(uses.filter((r) => r.status === 200).length, 1);
assert.equal((await get()).state.vouchers[0].status, 'Used');
console.log(
  'PASS: eight concurrent merchant confirmations consume the voucher only once',
);
assert.equal((await get(`${owner}-other`)).state.vouchers.length, 0);
console.log('PASS: signed-in sandbox ownership is isolated');
const invalid = await fetch(`${base}/api/pilot`, {
  method: 'POST',
  headers: { ...headers, Origin: 'https://unrelated.example' },
  body: JSON.stringify({
    type: 'pause',
    actor: 'operator',
    paused: true,
    key: crypto.randomUUID(),
  }),
});
assert.equal(invalid.status, 403);
console.log('PASS: cross-origin mutations are rejected');
const badrole = await post('pause', 'resident', { paused: true });
assert.equal(badrole.status, 400);
console.log('PASS: role authorization is enforced by the server');
const ownerTwoHeaders = {
  ...headers,
  'oai-authenticated-user-id': `${owner}-other`,
};
const data = new FormData();
data.append(
  'file',
  new Blob(['%PDF-1.4\nSample evidence for API integration test.'], {
    type: 'application/pdf',
  }),
  'sample-evidence.pdf',
);
const up = await fetch(`${base}/api/evidence`, {
  method: 'POST',
  headers: {
    'oai-authenticated-user-id': owner,
    'oai-authenticated-user-email': 'pilot-test@example.invalid',
    Origin: base,
  },
  body: data,
});
assert.equal(up.status, 200);
const file = await up.json();
const ownFile = await fetch(`${base}/api/evidence?id=${file.id}`, { headers });
assert.equal(ownFile.status, 200);
assert.match(ownFile.headers.get('content-disposition'), /attachment/);
const otherFile = await fetch(`${base}/api/evidence?id=${file.id}`, {
  headers: ownerTwoHeaders,
});
assert.equal(otherFile.status, 404);
console.log(
  'PASS: evidence persists in R2 and is inaccessible from another sandbox',
);

const cvData = new FormData();
cvData.append(
  'file',
  new Blob(['Mei Lin\nProject management, teaching and gardening.'], {
    type: 'text/plain',
  }),
  'my-cv.txt',
);
const cvUpload = await fetch(`${base}/api/evidence`, {
  method: 'POST',
  headers: { 'oai-authenticated-user-id': owner, Origin: base },
  body: cvData,
});
assert.equal(cvUpload.status, 200);
const cvFile = await cvUpload.json();
const attach = {
  uploadId: cvFile.id,
  kind: 'CV / résumé',
  title: 'My CV',
  issuer: '',
  expires: '',
  skills: ['Project management', 'Teaching'],
  status: 'Verified',
};
assert.equal((await post('profileAttach', 'resident', attach)).status, 200);
assert.equal((await post('profileAttach', 'resident', attach)).status, 200);
const savedDocument = (await get()).state.profile.documents[0];
assert.equal(savedDocument.name, 'my-cv.txt');
assert.equal(savedDocument.status, 'Uploaded');
assert.equal((await get()).state.profile.documents.length, 1);
assert.equal(
  await (
    await fetch(`${base}/api/evidence?id=${cvFile.id}`, { headers })
  ).text(),
  'Mei Lin\nProject management, teaching and gardening.',
);
const stolen = await fetch(`${base}/api/pilot`, {
  method: 'POST',
  headers: ownerTwoHeaders,
  body: JSON.stringify({
    type: 'profileAttach',
    actor: 'resident',
    key: crypto.randomUUID(),
    ...attach,
    document: { id: cvFile.id, name: 'forged.txt', status: 'Verified' },
  }),
});
assert.equal(stolen.status, 400);
assert.equal(
  (
    await post('profileAttach', 'resident', {
      ...attach,
      uploadId: file.id,
      kind: 'Certification',
      title: 'First aid certificate',
      issuer: 'Uploaded issuer',
      expires: '2027-12-31',
    })
  ).status,
  200,
);
assert.equal(
  (await get()).state.profile.documents[1].status,
  'Awaiting verification',
);
assert.equal(
  (
    await post('profileUpdate', 'resident', {
      about: 'Happy to help neighbours learn.',
      selfSkills: ['Baking'],
      expertise: ['Workshop facilitation'],
      hobbies: ['Gardening', 'Reading'],
    })
  ).status,
  200,
);
assert.deepEqual((await get()).state.profile.hobbies, ['Gardening', 'Reading']);
assert.equal(
  (await post('profileComplete', 'resident', { confirm: true })).status,
  200,
);
assert.ok((await get()).state.profile.completedAt);
assert.ok(
  !(await get()).state.notices.some((notice) =>
    notice.text.startsWith('Your town is now'),
  ),
);
console.log(
  'PASS: CV files and reviewed skills persist; document ownership, deduplication, verification status and account completion are enforced',
);
console.log(
  'All API integration checks passed. Test records are isolated from the preview user.',
);
