import assert from 'node:assert/strict';
const base = process.env.PILOT_TEST_URL || 'http://127.0.0.1:3001';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('Local API tests only.');
const owner = 'integration-' + crypto.randomUUID();
const headers = {
  'oai-authenticated-user-id': owner,
  'oai-authenticated-user-email': 'resident@example.invalid',
  Origin: base,
};
let checks = 0;
async function req(path, options = {}) {
  const r = await fetch(base + path, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data };
}
async function post(type, actor, payload = {}) {
  return req('/api/pilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, actor, key: crypto.randomUUID(), ...payload }),
  });
}
function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.data));
  checks++;
  return result.data;
}
const first = ok(await req('/api/pilot'));
assert.equal(first.state.activities.length, 0);
ok(await post('selectTown', 'resident', { town: 'Bishan' }), 400);
ok(
  await post('profileLogin', 'resident', {
    source: 'singpass',
    name: 'Test Resident',
    consent: true,
  }),
  400,
);
const signed = ok(
  await post('profileLogin', 'resident', {
    source: 'email',
    name: 'Test Resident',
    email: 'forged@example.invalid',
    consent: true,
  }),
);
assert.equal(signed.state.profile.email, 'resident@example.invalid');
assert.equal(signed.state.profile.identity.status, 'Unverified');
ok(await post('selectTown', 'resident', { town: 'Bishan' }));
ok(await post('profileComplete', 'resident', { confirm: true }));
const chat = ok(await req('/api/activity-planner')).chat;
assert.equal(chat.messages.length, 0);
const draft = {
  title: 'Community herb gardening',
  description: 'Learn how to grow herbs in reused containers together.',
  category: 'Outdoors',
  location: 'Bishan Community Club',
  starts: new Date(Date.now() + 7 * 86400000).toISOString(),
  durationMinutes: 90,
  capacity: 12,
  safety: 'Step-free access, first aid kit, drinking water and a named host.',
  agreed: true,
  plannerId: chat.id,
};
const proposed = ok(await post('propose', 'resident', draft));
const id = proposed.state.activities[0].id;
ok(await post('propose', 'resident', draft), 400);
ok(await post('approveActivity', 'resident', { id }), 400);
ok(await post('approveActivity', 'organizer', { id }), 409);
ok(await post('switchRole', 'resident', { role: 'organizer' }));
assert.equal(ok(await req('/api/pilot')).state.activeRole, 'organizer');
ok(await post('approveActivity', 'organizer', { id }));
ok(await post('join', 'organizer', { id }), 400);
ok(
  await post('profileUpdate', 'organizer', {
    about: 'I enjoy sharing skills.',
    selfSkills: [],
    expertise: [],
    hobbies: [],
  }),
);
ok(await post('switchRole', 'organizer', { role: 'merchant' }));
ok(await req('/api/activity-planner'), 403);
ok(await req('/api/activity-voice', { method: 'POST' }), 403);
ok(await post('propose', 'merchant', draft), 400);
ok(await post('switchRole', 'merchant', { role: 'resident' }));
ok(await post('join', 'resident', { id }));
assert.equal(ok(await req('/api/activity-planner')).chat.submitted, true);
const other = ok(
  await req('/api/pilot', {
    headers: { 'oai-authenticated-user-id': owner + '-other' },
  }),
);
assert.equal(other.state.activities.length, 0);
assert.equal(other.state.profile, undefined);
ok(
  await post('profileImport', 'resident', { source: 'skills', consent: true }),
  400,
);
const reset = ok(
  await req('/api/activity-planner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset', revision: chat.revision }),
  }),
);
assert.notEqual(reset.chat.id, chat.id);
ok(
  await req('/api/activity-planner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset', revision: chat.revision }),
  }),
  409,
);
const form = new FormData();
form.set(
  'file',
  new File(['Gardening and teaching'], 'experience.txt', {
    type: 'text/plain',
  }),
);
const uploaded = ok(await req('/api/evidence', { method: 'POST', body: form }));
ok(await req('/api/evidence?id=' + uploaded.id));
ok(
  await req('/api/evidence?id=' + uploaded.id, {
    headers: { 'oai-authenticated-user-id': owner + '-other' },
  }),
  404,
);
ok(await req('/api/evidence?id=' + uploaded.id + '&view=photo'), 404);
ok(await post('profilePhoto', 'resident', { uploadId: uploaded.id }), 400);
const photo = new FormData();
photo.set(
  'file',
  new File([Uint8Array.from([137, 80, 78, 71])], 'photo.png', {
    type: 'image/png',
  }),
);
const photoFile = ok(
  await req('/api/evidence', { method: 'POST', body: photo }),
);
ok(await post('profilePhoto', 'resident', { uploadId: photoFile.id }));
ok(await req('/api/evidence?id=' + photoFile.id + '&view=photo'));
ok(await post('profilePhoto', 'resident', { remove: true }));
ok(
  await req('/api/pilot', {
    method: 'POST',
    headers: {
      Origin: 'https://wrong.invalid',
      'Content-Type': 'application/json',
    },
    body: '{}',
  }),
  403,
);
ok(
  await req('/api/pilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'bad json',
  }),
  400,
);
const missing = await fetch(base + '/api/pilot');
assert.equal(missing.status, 401);
await missing.text();
checks++;
console.log(
  'PASS: ' +
    checks +
    ' API assertions covering account identity, role persistence and guards, proposal publication, idempotency, private conversations, attachment ownership, photos, origin checks and malformed requests.',
);
