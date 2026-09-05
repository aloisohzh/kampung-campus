# Kampung Campus

A working private pilot demonstration of the Pek Kio community platform described in the parent repository’s OpenSpec. Built with React, Vinext, Cloudflare D1 and R2 through Sites.

## Try the complete journey

1. Start in **Resident** view: Mei Lin has 50 starter credits, 40 earned credits, and a pending helper contribution worth 10 credits.
2. Choose **Reviewer** in the sidebar. Approve the study sprint contribution with a review note.
3. Return to **Rewards**, open the kopi reward, and redeem 50 earned credits.
4. Open **My wallet** and copy the voucher code. It also has a QR code and print view.
5. Choose **Merchant**, validate the code, and confirm one-time use. Re-entering it reports that it was already used.
6. Choose **Operator** to inspect outstanding commitments, the ledger, grants, inventory, refunds and merchant settlement value.

For a new contribution, reserve an activity as the resident, switch to Organizer, choose **Complete demo session**, confirm attendance and a role, then submit the claim from My activities. The explicit completion action advances the sample event so the whole process can be tested immediately.

## What is implemented

- Activity search by keyword/location, categories and date horizon; details, bookings, refundable deposits, late cancellation, waitlists, release of sample places and interest lists.
- Activity proposals, safety/access plans, operator approval, organizer cancellation, attendance confirmation and Meet/Make/Grow grant requests and decisions.
- Contribution descriptions and R2 evidence uploads; independent approval, rejection, requests for additional detail, cancellation and one-time operator appeals.
- Separate starter, available earned, pending and reserved balances; a permanent contribution record, a four-week earning cap, five-second refresh and CSV history export.
- Four reward pathways, inventory, full reward terms, sponsor boost/additional payment disclosure, source-preserving refunds, pending partner simulations and failure recovery.
- UUID/QR vouchers, expiry, merchant ownership, one-time use, merchant history and settlement value.
- Operator budget and commitment views, reward inventory, pause/resume and concern resolution.
- Responsive layout, accessible component primitives, keyboard-accessible controls, reduced-motion support, printable vouchers and generated activity imagery.

## Demo boundary

This is **not a live resident or merchant system**. Every signed-in Site visitor owns a separate saved sandbox. The role selector switches between fixed sample actors within that sandbox; it is deliberately not a mechanism for assigning real production roles. The platform dispatcher authenticates the visitor; the server separately enforces permitted actions for each sample actor. No email, real merchant payment, official partner API call, cash withdrawal, or credit transfer is performed.

Deferred live-pilot work includes resident magic links/assisted onboarding, genuine role provisioning, merchant agreements and payments, live notifications, minor/guardian workflows, finalized retention and post-pilot policies, broader cohort analytics, recurring activity automation, camera scanning, voice/AI assistance and real partner integrations. The original OpenSpec task list remains unmodified so this demonstration is not mistaken for completion of the full production backlog.

## Persistence and concurrency

D1 stores each small demo sandbox as a versioned aggregate. Commands validate against a fresh snapshot, calculate a candidate result, then commit it using an optimistic compare-and-swap on its revision. The state update and an append-only audit event execute in one D1 batch. Conflicting writes retry against the new revision; unsuccessful commands change nothing. This serializes credit awards, balances, stock and single-use voucher transitions together. It is suitable for the bounded demonstration; the production relational model remains in OpenSpec.

The credit ledger is the source of wallet balances. No authoritative data lives in localStorage. Action idempotency keys prevent replay, contribution uniqueness prevents role stacking, and voucher status prevents reuse. Audit events have a unique owner/revision index and database triggers preventing updates or deletes. R2 attachments have D1 ownership metadata and can only be retrieved by their sandbox owner.

Sites controls physical D1/R2 resources and authenticated headers. `.openai/hosting.json` contains logical bindings only. `wrangler.local.json` contains placeholder local resources and is never used for cloud provisioning.

## Development

Use Node 24 or a compatible Node release supported by the dependency versions.

```sh
npm ci
npx wrangler d1 migrations apply DB --local --config wrangler.local.json
npm run dev
```

Development runs at the address printed by Vinext. The Sites development middleware supplies a local sample sign-in. Hosted requests require the platform’s authenticated user header and are isolated by that identity. No API keys or runtime secrets are required for this demonstration.

```sh
node --experimental-strip-types --test tests/domain.test.ts
npx tsc --noEmit
npm run build
```

For HTTP/D1/R2 concurrency tests, run the built Worker locally (rather than the development authentication middleware, which intentionally uses one sample identity):

```sh
npm run start -- --port 3001
# In another terminal, set PILOT_TEST_URL=http://localhost:3001
node tests/api.mjs
```

The API test refuses non-local URLs and creates isolated test owners. It checks concurrent approval, redemption, merchant use, ownership, cross-origin protection and evidence access. New schema migrations are generated with `npm run db:generate`; applied migrations are immutable.

## Design and generated assets

The visual direction combines forest green, lively garden tones, generous whitespace and documentary-style sample activity photography. The working discovery board is the primary surface, with credit visibility and contribution progression alongside it.

Both photographs were created using **built-in image_gen**, not the API/CLI fallback. They depict fictional sample activities, not actual events. Asset paths and exact generation prompts are recorded in [docs/generated-assets.md](docs/generated-assets.md).

## Spec clarifications applied

- Starter credits may cover approved community benefits as well as deposits, following the credits and rewards specs; one wallet tooltip conflicts with this rule.
- Insufficient funds reject the entire redemption without a partial debit, following atomicity requirements; one wallet scenario describes an unsafe partial deduction.
- Credit caps limit awards, never the recording of a valid contribution. Spending credits does not reduce role progression.
- Unknown simulated partner outcomes remain pending until a human operator explicitly confirms or fails them.
