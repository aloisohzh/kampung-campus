# Profile onboarding demonstration

Open `/#welcome` or **Try profile setup**. Start with Singpass, LinkedIn or email. Review the sample fields and consent; Singpass demonstrates an identity-verified profile, while LinkedIn/email demonstrate basic sign-in with unverified identity. No external authentication takes place. Actual access to the private Site continues to use Sites/ChatGPT authentication.

Choose **Professional profile import** and/or **Digital credentials**. Review the prepared records, deselect unwanted new items, and explicitly consent. The sample identity and contact details are prefilled; no real personal information, password, NRIC or identity document is required. Confirm the profile to open **My profile**.

In **My profile**, click **Check for updates**. The second skills snapshot adds Accessible workshop design; the second credential snapshot revokes the sample Community First Aid certificate. The Community Digital Mentor accreditation is already expired. Only valid demo credentials count in the summary. Existing records must be rechecked together to avoid hiding a revocation. Repeated syncs deduplicate by source record ID. This is a user-triggered fixture synchronization demonstration, not background polling of a provider.

Disconnect a source to remove its records and consent from the profile; disconnecting Singpass also clears the identity badge. Activity history, credit balances and the append-only pilot action audit remain. Reconnecting an import source starts its sample sequence again. Demo sign-in history remains visible and does not imply a currently connected source. The fixed sample name/email remain part of the demo actor.

## Integration boundaries

- **LinkedIn:** Standard OpenID Connect sign-in returns basic profile information and optional email. It does not verify user identity or provide general skills/certification access. The separate professional-profile importer uses prepared sample export records; no real file parser, scraping, LinkedIn skills API or full-profile permission is implemented. [Official sign-in documentation](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2).
- **Singpass/Myinfo:** Live identity verification and consented field prefilling require the approved Singpass integration, scopes and attributes. The demo shows name/neighbourhood and a simulated identity result. It does not claim Singpass verifies skills or qualifications. [Official Myinfo overview](https://docs.developer.singpass.gov.sg/docs/products/myinfo).
- **Credentials:** Prepared fictional issuer records demonstrate integrity, issuer identity, holder matching, validity and revocation outcomes. No real OpenCerts verification is performed. A live implementation must validate the document, issuer, holder binding and current status; a successfully imported document is not automatically a verified qualification. [OpenCerts verification documentation](https://docs.opencerts.io/docs/).
- **Production identity:** Before live external onboarding, confirm the supported Sites authentication architecture, register provider applications, implement validated OAuth/OIDC callbacks and account linking, and establish approved import sources and issuer verification. Current demo commands cannot authenticate a real resident, assign real privileges, or award credits.

## Persistence and checks

Profile data is an optional field on the existing D1 aggregate, so previously saved pilot data needs no destructive reset or schema change. Each mutation uses the same server-side role guards, authenticated owner scope, consent checks, compare-and-swap write and audit trail as existing actions. Verification results come from server-owned fixtures, never the client request. A stale import revision is rejected rather than overwriting newer validity results.

Run `node --experimental-strip-types --test tests/domain.test.ts tests/profile.test.ts`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. The local built-Worker API suite also checks consent, persisted profile state, concurrent imports, owner isolation and source removal (`PILOT_TEST_URL=http://127.0.0.1:3001 node tests/api.mjs`).
