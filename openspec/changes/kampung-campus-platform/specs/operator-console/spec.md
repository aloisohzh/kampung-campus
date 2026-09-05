## ADDED Requirements

### Requirement: Mission funding configuration
The system SHALL allow operator to create, configure, and manage sponsored missions with bonus amounts, criteria, budgets, and date ranges.

#### Scenario: Create funded mission
- **WHEN** operator creates "Digital Literacy" mission with 5-credit bonus, S$100 budget, criteria "Attend digital skills workshop", active Sep 10-24
- **THEN** system creates mission, calculates max claims (200 = S$100/S$0.50), and publishes to residents

#### Scenario: Mission budget tracking
- **WHEN** operator views mission dashboard
- **THEN** system displays "Digital Literacy: 45/200 claims used (S$22.50/S$100 budget) - Active until Sep 24"

#### Scenario: Budget exhaustion auto-pause
- **WHEN** mission reaches 200 claims (full budget)
- **THEN** system automatically pauses mission, hides from residents, and notifies operator

### Requirement: Reward inventory management
The system SHALL allow operator to add, edit, and track inventory for rewards across all four pathways.

#### Scenario: Add merchant voucher inventory
- **WHEN** operator adds 100 units of "S$5 Cafe Voucher" at 50 credits each with partner "Community Cafe"
- **THEN** system creates reward listing with inventory=100 and makes available in catalogue

#### Scenario: Low inventory alert
- **WHEN** reward inventory drops below 10 units
- **THEN** system alerts operator "S$5 Cafe Voucher: 8 units remaining - consider restocking"

#### Scenario: Disable reward
- **WHEN** operator disables reward due to partner issue
- **THEN** system hides reward from catalogue and prevents new redemptions while honoring existing vouchers

### Requirement: Outstanding commitments tracking
The system SHALL display total outstanding credit liability (issued but unredeemed credits × max value) against remaining budget.

#### Scenario: View commitment dashboard
- **WHEN** operator views financial dashboard
- **THEN** system displays "Issued earned credits: 8,500 | Max liability: S$1,275 (8,500 × S$0.15) | Budget remaining: S$1,725 | Coverage: 135%"

#### Scenario: Over-commitment warning
- **WHEN** outstanding credit liability exceeds 80% of earned rewards budget
- **THEN** system displays warning "Approaching budget limit. Issued credits: S$2,400/S$3,000 backing. Consider pausing missions."

#### Scenario: Backing verification before mission
- **WHEN** operator attempts to create mission that would exceed remaining budget
- **THEN** system displays error "Insufficient budget. Mission requires S$200, only S$150 remaining."

### Requirement: Financial reconciliation
The system SHALL provide reconciliation view matching available funds, outstanding credits, reserved benefits, issued vouchers, and partner payments.

#### Scenario: Run reconciliation report
- **WHEN** operator generates weekly reconciliation report
- **THEN** system displays: "Total budget: S$5,000 | Credits issued: S$1,275 max value | Vouchers redeemed: S$850 | Grants disbursed: S$420 | Ops spent: S$150 | Reserved: S$200 | Available: S$2,105"

#### Scenario: Balance verification
- **WHEN** operator runs reconciliation
- **THEN** system verifies sum of all credit transactions equals total wallet balances across all residents and flags any discrepancy

### Requirement: Grant management
The system SHALL allow operator to review, approve, reject, and disburse organizer grant requests with budget tracking.

#### Scenario: Approve grant request
- **WHEN** operator reviews S$120 Make grant with valid budget breakdown and approves
- **THEN** system deducts S$120 from grant budget, notifies organizer, and creates disbursement record

#### Scenario: Reject grant with reason
- **WHEN** operator rejects grant request with reason "Budget exceeds activity scale - resubmit with reduced scope"
- **THEN** system notifies organizer with reason and allows resubmission

#### Scenario: Grant budget depletion
- **WHEN** approved grants total S$1,400 of S$1,500 grant budget
- **THEN** system displays "Grant budget: S$1,400/S$1,500 used" and warns on next large request

### Requirement: Resident onboarding
The system SHALL allow operator to onboard residents, issue starter credits, and provide assisted access for those without digital access.

#### Scenario: Onboard new resident
- **WHEN** operator creates resident account and confirms eligibility
- **THEN** system issues 50 starter credits, sends welcome email, and adds to pilot participant list

#### Scenario: Assisted onboarding
- **WHEN** operator onboards senior resident without email
- **THEN** system creates account with operator as contact, generates printable access instructions, and enables operator-assisted transactions

#### Scenario: Bulk onboarding
- **WHEN** operator uploads CSV of 20 pre-verified residents
- **THEN** system creates 20 accounts, issues starter credits to each, and generates onboarding report

### Requirement: Settlement records
The system SHALL maintain records of all voucher settlements with merchants including redemption details and payment status.

#### Scenario: View settlement queue
- **WHEN** operator views merchant settlements
- **THEN** system displays "Community Cafe: 15 vouchers redeemed (S$75) - Payment pending | Bookstore: 8 vouchers (S$40) - Paid Sep 12"

#### Scenario: Mark settlement paid
- **WHEN** operator processes S$75 payment to Community Cafe and marks settled
- **THEN** system records payment date, updates merchant balance to S$0, and generates settlement receipt

### Requirement: Activity approval
The system SHALL allow operator to review and approve/reject proposed activities before they become visible to residents.

#### Scenario: Approve activity proposal
- **WHEN** operator reviews study group proposal and approves
- **THEN** system sets activity status to "Open" and makes visible in discovery

#### Scenario: Reject with feedback
- **WHEN** operator rejects proposal with note "Venue not available that date - please reschedule"
- **THEN** system notifies organizer and returns proposal to draft for editing

### Requirement: Escalated review handling
The system SHALL provide operator queue for contributions escalated by reviewers and appeal cases.

#### Scenario: Handle escalated contribution
- **WHEN** operator opens escalation queue with reviewer-escalated ambiguous contribution
- **THEN** system displays full context, reviewer notes, and allows operator to make final approve/reject decision

#### Scenario: Resolve appeal
- **WHEN** operator reviews resident appeal with new evidence and approves
- **THEN** system issues original credits, updates contribution record, and notifies resident of appeal success

### Requirement: Budget dashboard
The system SHALL display real-time budget allocation across earned rewards (S$3,000), organizer grants (S$1,500), and operations (S$500).

#### Scenario: View budget breakdown
- **WHEN** operator views budget dashboard
- **THEN** system displays three budget bars: "Rewards: S$1,275/S$3,000 | Grants: S$420/S$1,500 | Ops: S$150/S$500"

#### Scenario: Budget category alert
- **WHEN** any budget category exceeds 90% utilization
- **THEN** system displays alert "Grant budget 92% used - S$120 remaining"

### Requirement: Emergency pause controls
The system SHALL allow operator to pause new rewarded opportunities while honoring existing commitments if backing becomes insufficient.

#### Scenario: Pause new rewards
- **WHEN** operator activates "Pause new rewards" due to budget concern
- **THEN** system stops new credit earning and mission claims but allows existing credit redemptions to continue

#### Scenario: Honor existing commitments during pause
- **WHEN** rewards paused but resident has 50 earned credits
- **THEN** system still allows resident to redeem existing credits for available rewards

### Requirement: Participant management
The system SHALL allow operator to view resident profiles, contribution history, credit balances, and flag accounts for review.

#### Scenario: View resident profile
- **WHEN** operator searches for resident by name
- **THEN** system displays profile with balances, contribution history, redemptions, role, and account status

#### Scenario: Flag account for review
- **WHEN** operator flags account showing suspicious redemption pattern
- **THEN** system marks account "Under review", pauses redemptions, and logs reason for audit

### Requirement: Self-targeting prevention
The system SHALL prevent operator from performing critical actions on their own account (self-deletion, self-role-change, self-credit-issuance).

#### Scenario: Self-deletion blocked
- **WHEN** operator attempts to delete their own account
- **THEN** system displays error "Cannot delete your own operator account. Another operator must perform this action."

#### Scenario: Self-credit-issuance blocked
- **WHEN** operator attempts to issue credits to their own resident account
- **THEN** system displays error "Cannot issue credits to yourself"

### Requirement: Merchant management
The system SHALL allow operator to add, configure, and manage participating merchants with categories and settlement terms.

#### Scenario: Add new merchant
- **WHEN** operator adds "Community Cafe" with category "Food", settlement terms "Monthly invoice"
- **THEN** system creates merchant account, generates merchant login credentials, and adds to merchant directory

### Requirement: Reporting and export
The system SHALL generate operator reports for participation, financials, and pilot metrics with export to CSV/PDF.

#### Scenario: Export financial report
- **WHEN** operator exports weekly financial report as PDF
- **THEN** system generates report with all transactions, budget status, settlements, and reconciliation summary

#### Scenario: Export participation report
- **WHEN** operator exports participation metrics
- **THEN** system generates report with active residents, contributions, redemptions, and role progression stats

### Requirement: Audit trail access
The system SHALL provide operator access to complete audit logs of all value movements, approvals, and administrative actions.

#### Scenario: View credit transaction audit
- **WHEN** operator investigates balance discrepancy for resident
- **THEN** system displays complete transaction log with timestamps, types, amounts, related entities, and reviewer/operator actions

### Requirement: Pilot period configuration
The system SHALL allow operator to configure pilot parameters including period dates, credit caps, deposit amounts, and conversion rates.

#### Scenario: Configure earning period
- **WHEN** operator sets Period 1 (Sep 10 - Oct 7) and Period 2 (Oct 8 - Nov 4) with 100-credit caps each
- **THEN** system applies period boundaries to all resident earning calculations

### Requirement: End-of-pilot handling
The system SHALL support operator tools to manage outstanding credits and commitments at pilot conclusion.

#### Scenario: View outstanding commitments at pilot end
- **WHEN** operator generates end-of-pilot report
- **THEN** system displays unredeemed credits, active vouchers, pending settlements, and recommended actions for wind-down

#### Scenario: Extend redemption window
- **WHEN** operator extends redemption window 60 days past pilot end
- **THEN** system maintains reward catalogue availability and voucher validity for extended period
