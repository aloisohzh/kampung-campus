# Account and profile journey

Account connections are made only in the sign-in / account creation flow. The welcome screen has no route into activities. Account creation confirms a Singapore town after sign-in, offers optional provider connections, captures interests, and opens the dashboard. Returning users open the dashboard; Profile setup is its own tabbed workspace.

Profile setup includes personal details, a private uploaded profile photo, experience and education, skills and interests, and CV / credentials uploads. The same profile photo appears in the header and sidebar. Its owner is checked when attaching and serving the image. The header photo opens Profile setup.

## Provider adapters

Singpass, LinkedIn and email still use the private demonstration's server-owned responses, explicitly identified in the connection consent dialog. They are not real external authentication or identity verification. The Sites owner identity secures persisted data.

LinkedIn basic sign-in prefills name, email and headline. Career preview data is separately consented; standard OIDC does not grant skills or career history. Singpass prefills the identity preview and does not supply arbitrary skills. Approved live provider access is required before replacing these adapters.

Auto-sync is a saved opt-in to refresh already consented provider snapshots on subsequent sign-ins. It is not an unattended connection to external accounts. Refreshes deduplicate career entries, preserve uploaded documents, custom introductions and hobbies, and prefer the Singpass snapshot for identity fields. Profile setup cannot create new provider connections.

## Document extraction

PDF, DOCX and TXT are read locally for text-based skill suggestions. Certificates may also be JPG or PNG. Each file is limited to 5 MB. PDF text reading covers the first 15 pages / 60,000 characters.

The optional AI action sends document text (or a scanned PDF/image) to OpenAI Responses. Configure OPENAI_API_KEY as a Sites secret; OPENAI_MODEL defaults to gpt-4.1-mini. No API key is exposed to the browser. Without a configured key, uploads and text-based suggestions remain available and the AI action states that it is unavailable.

AI output uses a strict schema, bounded field lengths, no tools, a 45-second timeout and store:false. Document instructions are untrusted. The resident reviews and can edit extracted details before saving. Name/email found in a document never replace account identity. CV summary fills an empty introduction; existing introductions are preserved. Experience and education retain document provenance. Uploaded certifications and accreditations remain awaiting verification.

## Navigation

Home, Discover, activities, contributions, wallet, rewards and Profile setup are resident modules. Organiser, reviewer, merchant and operator views have direct sidebar entries. Selecting a module closes the mobile menu. Help contains FAQs and in-app support cases only. Neighbourhood updates derive from relevant activities, bookings and follow-ups, never settings or town-change audit events.

## Validation

Run lint, the domain/profile/town/onboarding/dashboard/profile-sync tests, the production build and tests/api.mjs against the local built Worker. Integration tests use isolated test owners and cover owner separation, concurrent balances, file/photo access, provider sync, and AI-unavailable / request-origin behavior. Live AI requires a separately configured key and an end-to-end extraction check.
