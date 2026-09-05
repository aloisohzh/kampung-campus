## Context

Kampung Campus is a greenfield platform for an 8-week Pek Kio pilot supporting ~100 residents. The system must handle concurrent credit transactions safely, prevent double-spending and duplicate approvals, maintain separate credit types (starter vs earned), generate single-use vouchers, and track financial reconciliation. The pilot requires rapid deployment, clear operational visibility, and the ability to scale if successful.

Key constraints:
- S$5,000 pilot budget (S$3K rewards + S$1.5K grants + S$500 ops)
- 8-week timeline with 2-week setup
- Must support residents without digital access (assisted onboarding)
- Partner integrations are simulated for pilot (ActiveSG, Culture Pass, SkillsFuture)
- Operator needs real-time visibility into commitments and financial backing

## Goals / Non-Goals

**Goals:**
- Demonstrate complete journey from contribution → verification → earning → redemption → reconciliation
- Ensure zero possibility of double-spend, duplicate credit awards, or voucher reuse
- Provide resident wallet visibility (starter, pending, available, reserved balances)
- Enable independent contribution review with evidence (no self-approval)
- Support role progression tracking separate from credit spending
- Deliver operator console with real-time financial backing visibility
- Deploy in 2 weeks for pilot launch

**Non-Goals:**
- Real partner API integrations (simulated for pilot)
- Mobile native apps (responsive web sufficient for pilot)
- Automated AI-based verification (human reviewers approve all contributions)
- Real-time chat or messaging between residents
- Multi-language support beyond English (defer to post-pilot)
- Production-scale infrastructure (pilot-scale acceptable)
- Cryptocurrency or blockchain (overkill for pilot scale)

## Decisions

### 1. Architecture: Monolithic Web Application

**Decision:** Single Next.js application with API routes, deployed on Vercel/Railway/similar PaaS.

**Rationale:**
- **Speed to pilot**: Single codebase, single deployment, no orchestration complexity
- **Team velocity**: Full-stack TypeScript, shared types between frontend/backend
- **Pilot scale**: 100 residents does not justify microservices operational overhead
- **Cost**: Single PaaS deployment fits within S$500 ops budget

**Alternatives considered:**
- Microservices (Spring Boot, FastAPI): Overkill for pilot scale, slower to build, higher ops cost
- Separate frontend/backend: Adds deployment complexity without material benefit at this scale

**Post-pilot path:** Can extract high-load services (e.g., voucher generation) if needed.

### 2. Database: PostgreSQL with ACID Transactions

**Decision:** PostgreSQL on managed service (Supabase, Neon, or PaaS-provided).

**Rationale:**
- **Transaction safety**: Credits system requires ACID guarantees to prevent double-spend
- **Relational integrity**: Foreign keys enforce credit type restrictions, balance reservations
- **Query flexibility**: Complex joins for contribution review, financial reconciliation, metrics
- **Row-level security**: Can delegate authorization to database policies
- **Cost**: Free tiers sufficient for pilot (Supabase: 500MB, Neon: 3GB free)

**Critical transaction patterns:**
```sql
-- Atomic credit award (no duplicates)
BEGIN;
  SELECT ... FROM contributions WHERE id = ? FOR UPDATE; -- Lock row
  INSERT INTO credit_transactions (...) 
    WHERE NOT EXISTS (SELECT 1 FROM credit_transactions WHERE contribution_id = ?);
  UPDATE resident_wallets SET available_balance = available_balance + ?;
COMMIT;

-- Atomic redemption (no double-spend)
BEGIN;
  UPDATE resident_wallets SET available_balance = available_balance - ?, reserved_balance = reserved_balance + ?
    WHERE resident_id = ? AND available_balance >= ?; -- Fails if insufficient
  INSERT INTO redemptions (...);
COMMIT;
```

**Alternatives considered:**
- MongoDB: No multi-document ACID transactions until v4.0+, weaker consistency guarantees
- DynamoDB: Conditional writes possible but more complex, harder to query for reconciliation
- Firebase Firestore: Transaction limits (500 documents), harder to enforce complex constraints

### 3. Credit Transaction System: Event Sourcing Lite

**Decision:** Append-only `credit_transactions` table with wallet balance materialization.

**Rationale:**
- **Auditability**: Every credit movement has immutable record (who, when, why, amount, type)
- **Reconciliation**: Sum transactions to verify wallet balances match expected state
- **Debugging**: Can replay transaction log to understand any discrepancies
- **Idempotency**: Transaction includes `idempotency_key` (e.g., `contribution_id` for awards, `redemption_id` for spends)

**Schema:**
```typescript
type CreditTransaction = {
  id: uuid;
  resident_id: uuid;
  transaction_type: 'starter_issued' | 'earned' | 'reserved' | 'redeemed' | 'refunded' | 'expired';
  amount: number; // Positive = credit, negative = debit
  credit_type: 'starter' | 'earned';
  balance_after: number; // Snapshot for fast verification
  related_entity_type: 'contribution' | 'redemption' | 'mission' | 'refund' | null;
  related_entity_id: uuid | null;
  idempotency_key: string; // Ensures no duplicate awards
  created_at: timestamp;
};
```

**Alternatives considered:**
- Direct balance updates only: No audit trail, impossible to debug discrepancies
- Full event sourcing (CQRS): Overkill for pilot, slows read queries

### 4. Authentication & Authorization: Email-based with Role Claims

**Decision:** NextAuth.js with email magic links, JWT with role claims.

**Rationale:**
- **No password friction**: Residents receive magic link via email, reduces signup friction
- **Role-based access**: JWT includes `role` claim (resident, organizer, reviewer, operator, merchant)
- **Self-targeting prevention**: Middleware checks `user.id !== target.id` for sensitive operations
- **Assisted access**: Operator can generate session links for residents without email

**Roles:**
- `resident`: Can join activities, submit contributions, redeem rewards
- `organizer`: Can propose activities, request grants (inherits resident)
- `reviewer`: Can approve/reject contributions (independent from organizers)
- `operator`: Full admin access to console, funding, mission config
- `merchant`: Can validate vouchers only

**Alternatives considered:**
- Username/password: Friction for seniors, password reset complexity
- OAuth (Google, Facebook): Excludes residents without accounts, privacy concerns
- SMS magic links: Higher cost (~S$0.05/SMS), harder to reach all residents

### 5. Voucher Generation: UUID v4 with Single-Use Flag

**Decision:** Vouchers are UUIDs stored in `vouchers` table with `redeemed_at` timestamp.

**Rationale:**
- **Uniqueness**: UUID collision probability negligible (2^122 space)
- **Single-use enforcement**: Database constraint + transaction prevents double-redemption
- **Merchant validation**: Simple GET `/api/vouchers/:id/validate` checks `redeemed_at IS NULL`
- **Audit trail**: Tracks merchant, location, timestamp of redemption

**Schema:**
```typescript
type Voucher = {
  id: uuid; // The voucher code shown to resident
  resident_id: uuid;
  reward_id: uuid;
  value_sgd: number;
  merchant_id: uuid | null;
  issued_at: timestamp;
  redeemed_at: timestamp | null;
  redeemed_by_merchant_id: uuid | null;
  expires_at: timestamp;
};
```

**Validation flow:**
1. Merchant scans QR code (contains voucher UUID)
2. GET `/api/vouchers/:id/validate` returns voucher details if `redeemed_at IS NULL`
3. Merchant confirms → POST `/api/vouchers/:id/redeem` sets `redeemed_at = NOW()` atomically
4. Subsequent scans return "Already redeemed"

**Alternatives considered:**
- Sequential codes (V-00001): Predictable, residents could guess valid codes
- QR payload encryption: Unnecessary complexity, harder to debug, still needs server validation
- Blockchain/NFT vouchers: Massive overkill, high cost, slow, poor UX

### 6. Partner Integration: Adapter Pattern with Simulation Flag

**Decision:** Create partner adapters with `simulation_mode` flag for pilot.

**Rationale:**
- **Pilot readiness**: Can demo partner flows without real API access
- **Future-proof**: Real implementation swaps adapter without changing business logic
- **Clear labeling**: UI shows "Simulated" badge on partner benefits during pilot
- **Testing**: Can verify flows end-to-end without external dependencies

**Adapter interface:**
```typescript
interface PartnerAdapter {
  name: string;
  simulation_mode: boolean;
  
  checkBalance(resident_id: string): Promise<{ balance: number, currency: string }>;
  createBooking(resident_id: string, activity_id: string): Promise<{ booking_id: string, success: boolean }>;
  confirmPayment(booking_id: string, amount: number): Promise<{ success: boolean, transaction_id?: string }>;
}
```

**Pilot adapters:**
- `ActiveSGAdapter`: Returns simulated credits, fake booking IDs
- `CulturePassAdapter`: Returns simulated balance, fake confirmation
- `SkillsFutureAdapter`: Returns simulated sponsorship approval

**Post-pilot:** Replace with real API clients once partnerships formalized.

**Alternatives considered:**
- Build real integrations for pilot: Blocked on partnership agreements, adds timeline risk
- Skip partner flows entirely: Loses key demonstration value for stakeholders

### 7. Evidence Storage: S3-Compatible Object Storage

**Decision:** Use Vercel Blob, Cloudflare R2, or Supabase Storage (S3-compatible).

**Rationale:**
- **Cost**: Free tiers cover pilot (Vercel Blob: 1GB free, R2: 10GB free)
- **Simplicity**: Direct upload from browser, signed URLs for download
- **Scalability**: No local disk management, automatic CDN distribution
- **Evidence types**: Photos (activity attendance), documents (delivery proof), receipts

**Upload flow:**
1. Resident/organizer requests signed upload URL from `/api/evidence/upload-url`
2. Browser uploads directly to object storage (bypasses app server)
3. After upload, POST `/api/contributions/:id/evidence` with storage key
4. Reviewer sees evidence via signed download URL

**Alternatives considered:**
- Database BLOB columns: Poor performance, inflates database costs, no CDN
- Local file system: Not portable, complicates horizontal scaling, no redundancy

### 8. Real-Time Updates: Polling (Pilot) → WebSockets (Post-Pilot)

**Decision:** Use polling for pilot (5-10s intervals), plan WebSockets for post-pilot.

**Rationale:**
- **Speed to launch**: Polling is simpler, no WebSocket infrastructure to manage
- **Pilot scale**: 100 residents × 10s polls = 10 req/s (trivial load)
- **Operator console**: Real-time balance updates not critical for pilot
- **Cost**: No additional infrastructure (WebSockets often need dedicated server)

**Post-pilot upgrade path:**
- Add WebSocket server (Socket.io, Pusher, or Supabase Realtime)
- Push updates for: credit awards, redemption confirmations, new activities

**Alternatives considered:**
- WebSockets from day 1: Adds deployment complexity (stateful connections), overkill for pilot
- Server-Sent Events (SSE): Better than polling but still requires connection management

### 9. Deployment: Vercel (Frontend + API Routes) + Supabase (DB + Storage)

**Decision:** Vercel for app, Supabase for database and file storage.

**Rationale:**
- **Speed**: Push to deploy, no infrastructure config
- **Cost**: Both have generous free tiers sufficient for pilot
- **Developer experience**: Excellent local dev, preview deployments, logs
- **Monitoring**: Built-in analytics, no separate APM needed for pilot

**Free tier limits:**
- Vercel: 100GB bandwidth, 100 serverless hours (sufficient for 100 users)
- Supabase: 500MB DB, 1GB storage, 2GB bandwidth (tight but manageable)

**Fallback:** If Supabase free tier insufficient, upgrade to Pro ($25/mo, fits ops budget).

**Alternatives considered:**
- Railway: Good alternative, similar pricing, slightly more ops flexibility
- AWS (Amplify + RDS): Higher cost, slower setup, more operational burden
- Self-hosted (Dokku, Coolify): Requires DevOps expertise, adds risk to timeline

## Risks / Trade-offs

### Risk 1: Database Free Tier Exhaustion → Upgrade to Paid Plan
- **Risk**: 500MB DB limit reached mid-pilot (images in evidence table, transaction log growth)
- **Mitigation**: 
  - Store evidence in object storage (not DB)
  - Monitor DB size weekly
  - Budget $25/mo Supabase Pro upgrade if needed (fits ops budget)
  - Implement data retention: Delete test data after pilot weeks 1-2

### Risk 2: Race Conditions in Credit Awards → Double-Spend
- **Risk**: Concurrent approval of same contribution issues duplicate credits
- **Mitigation**:
  - Use PostgreSQL `SELECT ... FOR UPDATE` row locks
  - Idempotency key on transactions (contribution_id + resident_id)
  - Database unique constraint on `(contribution_id, resident_id, transaction_type = 'earned')`
  - Integration tests verify concurrent scenarios

### Risk 3: Voucher Fraud → Residents Share Screenshots
- **Risk**: Residents screenshot voucher QR and share with friends
- **Mitigation**:
  - Single-use enforcement (first redemption wins)
  - Merchant validation flow shows resident name (merchant checks ID)
  - Vouchers expire in 30 days (reduces window)
  - Anomaly detection: Flag if multiple vouchers from same resident redeemed at same time/merchant
  - **Accept**: Some fraud risk acceptable for pilot scale (100 residents × S$5 avg = S$500 max exposure)

### Risk 4: Partner Integration Delays → Pilot Launch Blocked
- **Risk**: Real partner APIs not available by pilot start
- **Mitigation**:
  - Simulation mode for all partner adapters
  - Clear "Simulated" labels in UI
  - Focus pilot evaluation on core flows (credit earning, redemption)
  - Post-pilot: Real integrations based on demonstrated value

### Risk 5: Reviewer Bottleneck → Slow Credit Awards
- **Risk**: Single reviewer can't keep up with contribution submissions
- **Mitigation**:
  - Train 2-3 reviewers before pilot launch
  - Review queue prioritization (FIFO)
  - Target SLA: 24h review turnaround
  - Escalation path: Operator can override pending reviews if urgent
  - **Monitor**: Queue depth, avg review time (pilot metrics)

### Risk 6: Residents Without Digital Access → Excluded from Platform
- **Risk**: Seniors or low-tech residents can't onboard independently
- **Mitigation**:
  - Assisted onboarding: Operator creates accounts, generates session links
  - Paper-based alternative: Operator manually enters contributions, prints vouchers
  - Community club staff trained to help residents access platform
  - **Accept**: Full digital inclusion not achievable in 8-week pilot

### Risk 7: Financial Backing Mismatch → Issued Credits Exceed Budget
- **Risk**: Operator over-issues missions, residents earn more than S$3K backing
- **Mitigation**:
  - Real-time dashboard: Outstanding credits × S$0.15 max value vs remaining budget
  - Alerts when committed value >80% of budget
  - Mission approval gate: Operator must confirm budget before publishing
  - Hard cap: 100 credits per resident per 4-week period = max 20,000 credits
  - **Failsafe**: Pause new rewarded opportunities if backing exhausted (honor existing commitments)

### Risk 8: Redemption Fraud → Merchants Collude with Residents
- **Risk**: Merchant marks voucher redeemed without providing service, splits value with resident
- **Mitigation**:
  - Pilot uses small vouchers (S$5-15), limits fraud incentive
  - Select trusted pilot merchants (community club partners)
  - Post-redemption surveys: "Did you receive the voucher benefit?"
  - Audit sample: Operator spot-checks redemptions
  - **Accept**: Some fraud risk acceptable for pilot, detection over prevention

### Risk 9: Data Loss → Residents Lose Contribution Records
- **Risk**: Database failure loses transaction history, contribution records
- **Mitigation**:
  - Supabase automated daily backups (point-in-time recovery)
  - Weekly manual exports of critical tables (credit_transactions, contributions)
  - Contribution evidence stored in object storage (independent from DB)
  - **Post-pilot**: Multi-region replication if moving to production

### Risk 10: Scope Creep → Miss Pilot Launch Deadline
- **Risk**: Feature requests delay 2-week build timeline
- **Mitigation**:
  - Strict MVP scope: One complete journey only
  - Defer to post-pilot: Chat, mobile apps, multi-language, automated verification
  - Weekly milestone checklist (Week 1: Core flows, Week 2: Polish + training)
  - **Operator role**: Final decision on in-scope vs deferred

## Migration Plan

### Phase 1: Setup (Week -2 to Day 0)
1. Deploy empty application (Vercel + Supabase)
2. Create database schema (migrations via Prisma/Drizzle)
3. Seed initial data: Operator account, reward catalogue, test residents
4. Train reviewers on contribution approval flow
5. Onboard pilot merchants, provide merchant validation demo

### Phase 2: Soft Launch (Pilot Weeks 1-2)
1. Onboard first 20 residents (assisted)
2. Launch 2-3 low-risk activities (study groups, walks)
3. Process first contributions, award credits
4. Test redemption flow with 1-2 volunteer residents
5. Monitor for bugs, gather feedback

### Phase 3: Full Pilot (Pilot Weeks 3-6)
1. Onboard remaining 80 residents
2. Launch recurring activities, sponsor missions
3. Enable organizer grant requests
4. Daily monitoring: Credit issuance, redemptions, queue depth
5. Weekly financial reconciliation

### Phase 4: Evaluation (Pilot Weeks 7-8)
1. Pause new activities, focus on redemptions
2. Survey residents: Satisfaction, perceived value, return intent
3. Calculate metrics: Retention, cost per contributor, fulfillment time
4. Operator final reconciliation: Credits issued vs redeemed vs budget

### Phase 5: Post-Pilot (Weeks 9+)
1. Honor outstanding redemptions (60-day window)
2. Export data for analysis
3. Debrief with operator, community club, sponsors
4. Decision: Shutdown, continue as-is, or scale with enhancements

### Rollback Plan
- **Database migrations**: Reversible migrations (down scripts) for each release
- **Critical bug**: Revert Vercel deployment to previous version (instant)
- **Data corruption**: Restore from daily backup, lose <24h of transactions
- **Catastrophic failure**: Manual ledger (Excel) as fallback, paper vouchers

## Open Questions

1. **Merchant payment timing**: Do merchants invoice operator monthly for redeemed vouchers, or receive payment upfront and honor vouchers on trust? (Affects cash flow)

2. **Credit expiry policy**: Do earned credits expire after pilot ends? If so, how much notice do residents get? (Affects redemption rush)

3. **Appeal process**: Who handles contribution rejection appeals? Operator? Independent board? (Affects reviewer training)

4. **Sponsor mission criteria**: Which sponsors are pre-approved for pilot? What's the mission approval flow? (Affects operator workload)

5. **Age verification**: How are minors verified without exposing birthdates? Parent consent flow? (Affects safeguarding compliance)

6. **Data retention post-pilot**: If pilot shuts down, do we keep contribution records for residents? Export to PDF? (Affects resident trust)

7. **Multi-currency**: If a resident is overseas during pilot, can they redeem? Convert S$ to other currency? (Likely out of scope, but clarify)

8. **Organizer conflict of interest**: Can an organizer approve contributions for their own activity? (Likely no, but needs explicit rule)

9. **Refund policy**: If a merchant fails to honor a voucher, how do we refund credits? Restore original credit type (starter vs earned)? (Affects transaction schema)

10. **Partner integration success criteria**: What counts as "integration working"? Referral click? Booking completion? Attendance confirmation? (Affects post-pilot roadmap)
