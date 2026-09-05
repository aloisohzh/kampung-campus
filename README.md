# Kampung Campus

A resident-led platform that brings Singapore neighbours together through shared activities, skills and community contributions.

**[Open Kampung Campus](https://kampung-campus.aloisohzh.chatgpt.site/)** · Access currently requires the authorised site-owner account.

## What you can do

- Discover activities by Singapore town, interests and dates; reserve places and manage bookings.
- Use **Plan with AI** to shape an activity through conversation, document uploads or voice input. Review an editable proposal before an organiser publishes it.
- Build a profile with a photo, skills, interests, experience and AI-assisted extraction from CVs, certifications and accreditations.
- Record contributions, review supporting evidence and track starter, earned, pending and reserved credits.
- Switch between Resident, Organiser, Reviewer, Operator and Merchant workspaces, each with its own navigation and actions.
- Manage activity proposals, attendance, grants, reward inventory and support cases through the relevant workspace.

## Current availability

The hosted site is private. Conversations, profiles, documents and community activity are saved separately for each signed-in account; activities are not yet shared between accounts. Every account can explicitly switch between all workspace roles.

OpenAI powers activity planning, document extraction and voice transcription through server-side API calls. Singpass/Myinfo, LinkedIn, issuer verification and merchant/official-benefit integrations still require live setup. Unconnected providers and rewards show availability states; extracting a credential does not verify its issuer.

See the [application guide](web/README.md) for integration limits, data handling and the remaining requirements for public production use.

## Run locally

Use Node.js 24 and npm. The application lives in `web/`; the default repository branch is `main`.

```sh
git clone git@github.com:aloisohzh/kampung-campus.git
cd kampung-campus/web
npm ci
npx wrangler d1 migrations apply DB --local --config wrangler.local.json
npm run dev
```

Open the local URL printed by Vinext. Production OpenAI credentials belong in protected Sites runtime secrets. Keep credentials out of source control and browser code.

## Validation

Run from `web/`:

```sh
node --experimental-strip-types --test tests/*.test.ts
npm run lint
npm run build
```

For HTTP and database checks, start the built Worker with `npm run start -- --port 3001 --persist-to .wrangler/state`, then run `node tests/api.mjs` in another terminal. These checks use isolated local test accounts.

## Project structure

| Path | Contents |
| --- | --- |
| `web/` | React, Vinext and TypeScript application |
| `web/app/api/` | Account, platform, upload and AI endpoints |
| `web/db/` and `web/drizzle/` | D1 schema and migrations |
| `web/tests/` | Domain, profile, planner and HTTP checks |
| `openspec/changes/kampung-campus-platform/` | Platform proposal, design, requirements and implementation tasks |

Sites hosts the application with Cloudflare D1 for persistent data and R2 for private uploads.

## Design and specifications

- [OpenSpec proposal](openspec/changes/kampung-campus-platform/proposal.md)
- [Platform design](openspec/changes/kampung-campus-platform/design.md)
- [Implementation tasks](openspec/changes/kampung-campus-platform/tasks.md)
- [Brand direction](web/docs/brand.md)
- [Generated imagery and provenance](web/docs/generated-assets.md)
