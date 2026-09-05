## 1. Project Setup & Infrastructure

- [ ] 1.1 Initialize Next.js project with TypeScript, App Router, and Tailwind CSS
- [ ] 1.2 Set up PostgreSQL database (Supabase) and configure connection
- [ ] 1.3 Install and configure ORM (Prisma or Drizzle) with migration tooling
- [ ] 1.4 Set up object storage (Vercel Blob / Cloudflare R2) for evidence uploads
- [ ] 1.5 Configure NextAuth.js with email magic link authentication
- [ ] 1.6 Set up deployment pipeline (Vercel) with preview deployments
- [ ] 1.7 Create environment variable management (.env.example, secrets)
- [ ] 1.8 Set up base UI component library and design tokens

## 2. Data Model & Schema

- [ ] 2.1 Create `residents` table with role, profile, age_bracket, account status
- [ ] 2.2 Create `resident_wallets` table with starter/available/reserved/redeemed balances
- [ ] 2.3 Create `credit_transactions` append-only table with idempotency_key, type, credit_type
- [ ] 2.4 Create `activities` table with lifecycle status, capacity, deposit, schedule
- [ ] 2.5 Create `activity_registrations` table with deposit reservation and attendance
- [ ] 2.6 Create `contributions` table with role, evidence, verification status
- [ ] 2.7 Create `contribution_evidence` table linking to object storage keys
- [ ] 2.8 Create `rewards` table with pathway, credit price, value, inventory, conditions
- [ ] 2.9 Create `redemptions` table with credit cost, status, voucher link
- [ ] 2.10 Create `vouchers` table with UUID, single-use flag, expiry, merchant redemption
- [ ] 2.11 Create `missions` table with bonus, budget, criteria, date range
- [ ] 2.12 Create `grants` table with tier, amount, status, spending reconciliation
- [ ] 2.13 Create `merchants` table with category, settlement terms, balance
- [ ] 2.14 Create `disputes` and `appeals` tables with resolution tracking
- [ ] 2.15 Create `earning_periods` table for 4-week period cap tracking
- [ ] 2.16 Create database constraints (unique idempotency, credit type checks)
- [ ] 2.17 Add row-level security policies for role-based data access

## 3. Authentication & Authorization

- [ ] 3.1 Implement email magic link sign-in flow
- [ ] 3.2 Implement JWT with role claims (resident, organizer, reviewer, operator, merchant)
- [ ] 3.3 Create role-based route middleware and permission guards
- [ ] 3.4 Implement self-targeting prevention middleware (assertNotSelf)
- [ ] 3.5 Create operator-assisted session generation for residents without email
- [ ] 3.6 Implement session revalidation and forced signout on role change

## 4. Kampung Credits System (Core Transaction Engine)

- [ ] 4.1 Implement atomic credit award with idempotency key and row locking
- [ ] 4.2 Implement atomic credit reservation for redemptions (available → reserved)
- [ ] 4.3 Implement atomic redemption completion (reserved → redeemed)
- [ ] 4.4 Implement failed redemption rollback (reserved → available)
- [ ] 4.5 Implement starter credit issuance (50 credits, one-time, duplicate-blocked)
- [ ] 4.6 Implement credit type restriction enforcement (starter vs earned at redemption)
- [ ] 4.7 Implement earning rate rules (5/10/20 credits + mission bonus up to 10)
- [ ] 4.8 Implement highest-base-reward-only rule (no stacking)
- [ ] 4.9 Implement 100-credit per-period cap with period reset logic
- [ ] 4.10 Implement transaction audit log (append-only with all fields)
- [ ] 4.11 Implement balance reconciliation verification (sum transactions = wallet)
- [ ] 4.12 Write integration tests for concurrent award/redemption (no double-spend)
- [ ] 4.13 Write tests for duplicate approval prevention

## 5. Resident Wallet

- [ ] 5.1 Build wallet overview page with four balance types and explanations
- [ ] 5.2 Build transaction history view with type filtering
- [ ] 5.3 Build pending claims section with status and estimated review time
- [ ] 5.4 Build redemption history with voucher status badges
- [ ] 5.5 Build period earning progress display with cap warnings
- [ ] 5.6 Build reserved balance breakdown (deposits, pending redemptions)
- [ ] 5.7 Implement real-time balance updates (polling)
- [ ] 5.8 Build wallet dashboard summary with suggested next action
- [ ] 5.9 Implement transaction history export (PDF/CSV)
- [ ] 5.10 Build link to contribution record independent of balances
- [ ] 5.11 Implement pending claim cancellation

## 6. Activity Discovery & Management

- [ ] 6.1 Build activity browse page with category organization
- [ ] 6.2 Implement activity search (keyword, location, date, category)
- [ ] 6.3 Build activity detail page with full information
- [ ] 6.4 Implement commitment deposit reservation flow
- [ ] 6.5 Implement deposit refund on attendance, timely cancellation, organizer cancellation
- [ ] 6.6 Implement late cancellation deposit forfeiture
- [ ] 6.7 Build waitlist management with auto-promotion notifications
- [ ] 6.8 Implement activity lifecycle state machine (Proposed→...→Completed/Cancelled)
- [ ] 6.9 Implement auto-completion after end time
- [ ] 6.10 Build interest groups with interest expression and threshold triggers
- [ ] 6.11 Build sponsored missions display with bonus and criteria

## 7. Contribution Review Console

- [ ] 7.1 Build contribution claim submission form with evidence upload
- [ ] 7.2 Implement organizer pre-confirmation flow from attendance sheet
- [ ] 7.3 Implement independent reviewer assignment (no self, no same-activity organizer)
- [ ] 7.4 Build review queue with FIFO ordering and age indicators
- [ ] 7.5 Build evidence display gallery with zoom/download
- [ ] 7.6 Implement reward rule matching with calculated credit display
- [ ] 7.7 Build approve/reject/request-evidence workflow with required reasons
- [ ] 7.8 Implement duplicate approval prevention (idempotency)
- [ ] 7.9 Build appeal handling with priority queue and history view
- [ ] 7.10 Build reviewer dashboard with queue depth and metrics
- [ ] 7.11 Implement review time tracking and slow-review flagging
- [ ] 7.12 Implement evidence authenticity checks (duplicate photos, timestamps)
- [ ] 7.13 Build reviewer notes (private) and escalation to operator
- [ ] 7.14 Implement review audit log
- [ ] 7.15 Implement contribution claim validation (activity exists, completed, registered)

## 8. Resident Progression System

- [ ] 8.1 Implement journey stage tracking (Discover→...→Return)
- [ ] 8.2 Implement role progression logic (Participant→Helper→Co-host→Organizer→Mentor)
- [ ] 8.3 Build progression dashboard with next-role requirements and progress
- [ ] 8.4 Implement role unlock notifications and badges
- [ ] 8.5 Implement contribution record permanence (independent of balances)
- [ ] 8.6 Build contribution history export as PDF
- [ ] 8.7 Implement progression using records not balances

## 9. Rewards Catalogue & Redemption

- [ ] 9.1 Build four-pathway catalogue (vouchers, community, sport/culture, learning)
- [ ] 9.2 Build reward detail modal with all required fields
- [ ] 9.3 Implement base conversion rate (10 credits = S$1)
- [ ] 9.4 Implement sponsor boost display with actual value
- [ ] 9.5 Implement inventory management with reservation during redemption
- [ ] 9.6 Implement redemption flow with credit reservation
- [ ] 9.7 Implement community benefit redemption (starter credits allowed)
- [ ] 9.8 Build merchant catalogue/directory
- [ ] 9.9 Implement discount transparency (fully-funded vs additional payment)
- [ ] 9.10 Implement minimum spend disclosures with acknowledgment
- [ ] 9.11 Build redemption confirmation screen and email
- [ ] 9.12 Implement redemption cancellation within window
- [ ] 9.13 Implement refund with original credit type preservation
- [ ] 9.14 Implement failed fulfillment reserved-credit release

## 10. Voucher Generation & Merchant Validation

- [ ] 10.1 Implement UUID voucher generation with QR codes
- [ ] 10.2 Implement voucher expiry (30-day) enforcement
- [ ] 10.3 Build merchant validation interface (scan/manual entry)
- [ ] 10.4 Implement single-use validation (redeemed_at check)
- [ ] 10.5 Implement atomic redemption confirmation (race-condition safe)
- [ ] 10.6 Implement cross-merchant and same-merchant duplicate prevention
- [ ] 10.7 Build redemption receipt for merchant and resident notification
- [ ] 10.8 Implement resident name display for identity verification
- [ ] 10.9 Build merchant transaction history and daily summary
- [ ] 10.10 Implement merchant authentication and merchant-only permissions
- [ ] 10.11 Implement settlement balance tracking per merchant
- [ ] 10.12 Implement redemption reversal within window
- [ ] 10.13 Write concurrent redemption tests (single-use guarantee)

## 11. Organizer Tools

- [ ] 11.1 Build activity proposal form builder with validation
- [ ] 11.2 Implement voice-based proposal with transcription and field suggestion
- [ ] 11.3 Build co-host recruitment and invitation flow
- [ ] 11.4 Build demand demonstration (interest count and list)
- [ ] 11.5 Build grant request submission with tier limits (Meet/Make/Grow)
- [ ] 11.6 Implement activity edit/cancel/reschedule
- [ ] 11.7 Build attendance marking with role assignment
- [ ] 11.8 Implement no-show handling with deposit forfeiture
- [ ] 11.9 Build delivery evidence submission
- [ ] 11.10 Build activity templates and duplication
- [ ] 11.11 Build scheduling assistant with conflict warnings
- [ ] 11.12 Build participant communication (announcements)
- [ ] 11.13 Build organizer dashboard
- [ ] 11.14 Implement recurring activity series
- [ ] 11.15 Build safety planning checklist for physical activities
- [ ] 11.16 Build grant spending reports with receipts

## 12. Operator Console

- [ ] 12.1 Build mission funding configuration with budget tracking and auto-pause
- [ ] 12.2 Build reward inventory management with low-inventory alerts
- [ ] 12.3 Build outstanding commitments dashboard (liability vs budget)
- [ ] 12.4 Build financial reconciliation view
- [ ] 12.5 Build grant review/approve/reject/disburse with budget tracking
- [ ] 12.6 Build resident onboarding (single, assisted, bulk CSV)
- [ ] 12.7 Build settlement records and mark-paid workflow
- [ ] 12.8 Build activity approval workflow
- [ ] 12.9 Build escalated review and appeal resolution queue
- [ ] 12.10 Build budget dashboard (rewards/grants/ops allocation)
- [ ] 12.11 Implement emergency pause controls (honor existing commitments)
- [ ] 12.12 Build participant management with account flagging
- [ ] 12.13 Implement operator self-targeting prevention
- [ ] 12.14 Build merchant management
- [ ] 12.15 Build reporting and export (financial, participation)
- [ ] 12.16 Build audit trail access
- [ ] 12.17 Build pilot period configuration
- [ ] 12.18 Build end-of-pilot handling and redemption window extension

## 13. Partner Integration Framework

- [ ] 13.1 Implement partner adapter interface with simulation/live modes
- [ ] 13.2 Implement simulation labeling throughout UI
- [ ] 13.3 Implement three mechanism labels (discovery, sponsored, conversion)
- [ ] 13.4 Build ActiveSG discovery pathway (simulated)
- [ ] 13.5 Build Culture Pass remaining-cost support (simulated)
- [ ] 13.6 Build SkillsFuture learning sponsorship (simulated) with funding warnings
- [ ] 13.7 Implement partner referral tracking (distinct from bookings/attendance)
- [ ] 13.8 Build integration status transparency page
- [ ] 13.9 Implement partner agreement gating for live mode
- [ ] 13.10 Implement fee breakdown transparency
- [ ] 13.11 Implement pending state for uncertain external results

## 14. Governance & Safety

- [ ] 14.1 Implement age and consent verification with birthdate privacy
- [ ] 14.2 Implement minor activity supervision requirements
- [ ] 14.3 Implement privacy protection (minimal profile, private contacts)
- [ ] 14.4 Implement proportionate verification by risk/value
- [ ] 14.5 Implement dispute resolution workflow
- [ ] 14.6 Implement no-show review with appeal routes
- [ ] 14.7 Implement data retention policy and deletion requests
- [ ] 14.8 Implement value movement control (AI recommends, human authorizes)
- [ ] 14.9 Implement assisted access (check-in, redemption)
- [ ] 14.10 Implement excluded activity blocks (cash, transfers, overseas)
- [ ] 14.11 Build governance role assignment and launch readiness check
- [ ] 14.12 Implement incident handling workflow
- [ ] 14.13 Implement human-in-the-loop enforcement (no automated penalties)
- [ ] 14.14 Implement AI assistance disclosure labeling
- [ ] 14.15 Build launch condition verification checklist

## 15. Pilot Evaluation Metrics

- [ ] 15.1 Implement first contribution tracking (14-day metric)
- [ ] 15.2 Implement repeat contribution tracking (60-day metric)
- [ ] 15.3 Implement role progression rate tracking
- [ ] 15.4 Implement reward fulfillment metrics (reliability, time)
- [ ] 15.5 Implement post-redemption participation tracking
- [ ] 15.6 Implement cost per retained contributor calculation
- [ ] 15.7 Implement participation gap analysis by resident group
- [ ] 15.8 Implement dispute and failure tracking
- [ ] 15.9 Build journey funnel analytics with dropout analysis
- [ ] 15.10 Build unused credits analysis with categorization
- [ ] 15.11 Implement referral vs attendance distinction
- [ ] 15.12 Implement late participant follow-up flagging
- [ ] 15.13 Build metrics export with all categories
- [ ] 15.14 Implement baseline comparison support with causation caveats
- [ ] 15.15 Build real-time metrics dashboard
- [ ] 15.16 Implement weekly evaluation snapshots with trend visualization

## 16. AI Assistance Features

- [ ] 16.1 Implement AI activity plan drafting with human-review labels
- [ ] 16.2 Implement AI translation for multilingual content
- [ ] 16.3 Implement AI reward recommendations based on resident interests
- [ ] 16.4 Implement AI evidence summarization for reviewers (advisory only)

## 17. Demonstration & Seed Data

- [ ] 17.1 Create seed script: operator account, reward catalogue, test merchants
- [ ] 17.2 Create demo resident with 40 pre-earned test credits
- [ ] 17.3 Create demo activity with helper contribution worth 10 credits
- [ ] 17.4 Create demo S$5 voucher reward requiring 50 credits
- [ ] 17.5 Verify complete demo journey: approve helper → 50 balance → redeem → single-use voucher
- [ ] 17.6 Create separate partner pathway demo (simulated sport/culture/learning)

## 18. Testing & Verification

- [ ] 18.1 Write unit tests for credit calculation rules
- [ ] 18.2 Write integration tests for duplicate approval prevention
- [ ] 18.3 Write integration tests for concurrent redemption (no double-spend)
- [ ] 18.4 Write test for starter credits cannot purchase external rewards
- [ ] 18.5 Write test for self-approval prevention
- [ ] 18.6 Write test for failed fulfillment releases reserved value
- [ ] 18.7 Write test for uncertain external results remain pending
- [ ] 18.8 Write test for refunds preserve original funding/credit restrictions
- [ ] 18.9 Write test for voucher single-use validation
- [ ] 18.10 Write test for period cap enforcement
- [ ] 18.11 Perform end-to-end UI testing of complete journey in browser
- [ ] 18.12 Perform accessibility testing for assisted-access scenarios

## 19. Deployment & Launch Preparation

- [ ] 19.1 Configure production database with automated backups
- [ ] 19.2 Set up monitoring and error alerting
- [ ] 19.3 Deploy to production environment
- [ ] 19.4 Configure reward catalogue with real pilot merchants
- [ ] 19.5 Create reviewer training materials and onboard 2-3 reviewers
- [ ] 19.6 Create operator runbook (reconciliation, disputes, pause controls)
- [ ] 19.7 Complete launch condition verification checklist
- [ ] 19.8 Prepare resident onboarding materials (assisted and self-service)
- [ ] 19.9 Prepare merchant validation demo and onboard pilot merchants
- [ ] 19.10 Conduct soft launch with 20 residents (pilot weeks 1-2)
