import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspace } from '../lib/seed.ts';
import { execute } from '../lib/domain.ts';
import { actors, type Actor } from '../lib/model.ts';
import { roleHome, roleRoute, canPlan } from '../lib/access.ts';
import {
  emptyDraft,
  parseActivityResponse,
  planActivity,
  draftReady,
  type PlannerChat,
} from '../lib/activity-ai.ts';
const now = new Date('2026-09-05T09:00:00Z');
const draft = {
  ...emptyDraft(),
  title: 'Neighbourhood gardening circle',
  description: 'Learn to plant herbs in reused containers together.',
  category: 'Outdoors',
  location: 'Bishan Community Club',
  starts: '2026-09-12T09:00:00+08:00',
  capacity: 12,
  durationMinutes: 90,
  safety: 'Confirm a step-free venue, drinking water and a first aid kit.',
};
const response = (draftValue: unknown = draft) => ({
  status: 'completed',
  output: [
    {
      type: 'message',
      content: [
        {
          type: 'output_text',
          text: JSON.stringify({
            message: 'Here is your draft. Please confirm the venue.',
            draft: draftValue,
          }),
        },
      ],
    },
  ],
});
void test('active role controls every route; profile and support preserve the role', () => {
  for (const role of Object.keys(actors) as Actor[]) {
    for (const other of Object.keys(actors) as Actor[])
      assert.equal(
        roleRoute(role, roleHome(other)),
        role === other ? roleHome(other) : roleHome(role),
      );
    for (const page of ['profile', 'help', 'updates'])
      assert.equal(roleRoute(role, page), page);
    assert.equal(
      roleRoute(role, 'planner'),
      canPlan(role) ? 'planner' : roleHome(role),
    );
    assert.equal(roleRoute(role, 'unknown'), roleHome(role));
  }
});
void test('new accounts contain no fictitious activity or earned-credit history', () => {
  const s = createWorkspace(now);
  assert.equal(s.activities.length, 0);
  assert.equal(s.contributions.length, 0);
  assert.ok(s.rewards.every((r) => r.enabled === false));
  assert.ok(s.transactions.every((t) => t.type === 'starter'));
});
void test('residents propose, organisers publish, reviewers and merchants cannot create', () => {
  const state = createWorkspace(now);
  const command = {
    type: 'propose',
    actor: 'resident' as const,
    key: 'proposal-0001',
    plannerId: 'chat-0001',
    ...draft,
    agreed: true,
  };
  const proposed = execute(state, command, now).state;
  assert.equal(proposed.activities[0].status, 'Proposed');
  assert.equal(proposed.activities[0].organizer, 'mei');
  assert.equal(
    (new Date(proposed.activities[0].ends).getTime() -
      new Date(proposed.activities[0].starts).getTime()) /
      60000,
    90,
  );
  assert.throws(
    () => execute(proposed, { ...command, key: 'proposal-0002' }, now),
    /already been submitted/,
  );
  assert.throws(() =>
    execute(
      proposed,
      {
        type: 'approveActivity',
        actor: 'resident',
        key: 'publish-001',
        id: proposed.activities[0].id,
      },
      now,
    ),
  );
  const published = execute(
    proposed,
    {
      type: 'approveActivity',
      actor: 'organizer',
      key: 'publish-002',
      id: proposed.activities[0].id,
    },
    now,
  ).state;
  assert.equal(published.activities[0].status, 'Open');
  assert.equal(published.activities[0].organizer, 'farah');
  for (const actor of ['reviewer', 'merchant'] as const)
    assert.throws(() => execute(state, { ...command, actor }, now));
  assert.throws(
    () => execute(state, { ...command, durationMinutes: 600 }, now),
    /Duration/,
  );
});
void test('role switching is explicit, persisted and preserves balances and neighbourhood feed', () => {
  const before = createWorkspace(now);
  const after = execute(
    before,
    {
      type: 'switchRole',
      actor: 'resident',
      role: 'merchant',
      key: 'switch-0001',
    },
    now,
  ).state;
  assert.equal(after.activeRole, 'merchant');
  assert.deepEqual(after.transactions, before.transactions);
  assert.deepEqual(after.notices, before.notices);
  assert.throws(
    () =>
      execute(
        before,
        {
          type: 'switchRole',
          actor: 'resident',
          role: 'root',
          key: 'switch-0002',
        },
        now,
      ),
    /valid role/,
  );
});
void test('AI output requires complete structured data and valid dates and limits', () => {
  assert.deepEqual(parseActivityResponse(response()).draft, draft);
  assert.ok(draftReady(draft, now.getTime()));
  assert.ok(!draftReady({ ...draft, starts: '' }, now.getTime()));
  for (const value of [
    { status: 'incomplete' },
    response({ ...draft, starts: 'tomorrow' }),
    response({ ...draft, capacity: 500 }),
    response({ ...draft, category: 'Travel' }),
    response({ ...draft, safety: null }),
  ])
    assert.throws(() => parseActivityResponse(value));
});
void test('planner sends bounded history, separates document data, disables storage and cannot publish', async () => {
  const chat: PlannerChat = {
    id: 'chat',
    revision: 0,
    draft: emptyDraft(),
    messages: Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      role: i % 2 ? 'assistant' : 'user',
      text: 'message ' + i,
    })),
  };
  let body: Record<string, unknown> = {};
  const mock: typeof fetch = async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    body = JSON.parse(init?.body as string);
    return Response.json(response());
  };
  const answer = await planActivity(
    'test-only',
    'gpt-4.1-mini',
    chat,
    'Help plan a workshop',
    'Bishan',
    [{ type: 'input_text', text: 'UNTRUSTED UPLOAD' }],
    mock,
    now,
  );
  assert.ok(answer.message.length > 0);
  assert.equal(body.store, false);
  assert.equal((body.input as unknown[]).length, 13);
  assert.equal(body.tools, undefined);
  assert.ok(String(body.instructions).includes('you cannot publish'));
  assert.ok(!String(body.instructions).includes('UNTRUSTED UPLOAD'));
  assert.equal(
    (body.text as { format: { strict: boolean } }).format.strict,
    true,
  );
});
void test('provider failures never leak upstream response contents', async () => {
  const chat: PlannerChat = {
    id: 'chat',
    revision: 0,
    draft: emptyDraft(),
    messages: [],
  };
  await assert.rejects(
    () =>
      planActivity(
        'test-only',
        'gpt-4.1-mini',
        chat,
        'Hello',
        'Bishan',
        [],
        async () => new Response('private upstream detail', { status: 429 }),
      ),
    /usage limit/,
  );
});
