# Kampung Campus

A neighbourhood activity platform built with React, Vinext, Sites, Cloudflare D1 and R2.

## Activity planner

Resident and Organiser workspaces include **Plan with AI**: natural-language chat, PDF/DOCX/TXT/image attachments, microphone recording with a reviewable transcript, optional read-aloud and a structured draft editor. Residents submit proposals; organisers review the venue, schedule and safety plan before publishing.

The current conversation and draft persist per account. New activity replaces the current conversation after confirmation; submitted proposals remain. D1 revision checks and a request lease prevent concurrent replies. Proposal IDs prevent duplicate submissions. Limits: 20 replies per conversation; last 12 messages plus current draft sent as context; three files per message, 5 MB each and 10 MB total; voice recordings up to 60 seconds. Reference-document facts are summarised into replies for later turns.

## Roles and accounts

Sites authenticates users. Account email is supplied by trusted dispatch headers. Profile setup, uploads, photos and support work across all roles. The active workspace role is stored server-side and checked on commands. Navigation never silently changes it.

Every account may explicitly switch to every role, as requested. This is workflow separation, not privileged role assignment. Each account currently owns an isolated community workspace; published activities do not reach other accounts. Public community use requires shared community storage and assigned permissions with account-level separation of duties.

New accounts have no fictitious activity or earned-credit history and receive the configured 50 starter credits. Existing saved data is preserved.

## Integrations

Configure OPENAI_API_KEY as a protected Sites runtime secret; OPENAI_MODEL defaults to gpt-4.1-mini. Voice uses gpt-4o-mini-transcribe. Keys never reach the browser. Responses use store:false; the application does not retain recorded audio. Documents remain in private R2 storage with ownership checks. Hourly limits per account: 30 chat requests, 15 transcriptions, 20 profile extractions, including failed provider attempts.

Singpass/Myinfo, LinkedIn, issuer verification, merchant contracts, payments and official benefits are not connected. Provider sign-in and fixture-import API actions are disabled. Unconnected rewards cannot be redeemed or marked fulfilled; refunds and failed-request recovery remain available. Document extraction does not establish issuer verification.

The site remains owner-private. Shared community storage, assigned permissions, operational monitoring, notification delivery, retention policies and real partner integrations remain necessary for a public production service.

## Development and validation

Use Node 24. Run npm ci, apply local migrations with npx wrangler d1 migrations apply DB --local --config wrangler.local.json, then npm run dev.

Run node --experimental-strip-types --test tests/*.test.ts, npm run lint and npm run build. For HTTP tests, run npm run start -- --port 3001 --persist-to .wrangler/state, then node tests/api.mjs. The API tests create isolated local accounts and exercise identity, role guards, proposal publication, idempotency, conversations, upload ownership and origin protection.

Applied migrations are immutable; generate additions with npm run db:generate. The versioned D1 aggregate and append-only event audit use optimistic compare-and-swap for atomic ledger/inventory updates. See docs/generated-assets.md for artwork provenance and OpenSpec for the full specification.
