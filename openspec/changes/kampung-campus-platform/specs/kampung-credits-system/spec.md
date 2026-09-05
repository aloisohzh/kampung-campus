## ADDED Requirements

### Requirement: Three distinct credit types
The system SHALL maintain three independent credit instruments: starter credits (restricted to community bookings), earned credits (redeemable for rewards), and contribution records (permanent, non-monetary).

#### Scenario: Starter credits restricted to deposits
- **WHEN** resident with 50 starter credits and 0 earned credits attempts to redeem S$5 merchant voucher
- **THEN** system displays error "Starter credits cannot be redeemed for external rewards. Earn credits by contributing to activities."

#### Scenario: Earned credits redeemable for all rewards
- **WHEN** resident with 50 earned credits selects S$5 merchant voucher requiring 50 credits
- **THEN** system completes redemption and issues voucher

#### Scenario: Contribution record persists after credit spending
- **WHEN** resident redeems all 100 earned credits
- **THEN** system maintains complete contribution history showing all verified contributions with dates and roles

### Requirement: Starter credit allocation
The system SHALL issue 50 starter credits to each eligible pilot resident at onboarding, one-time only.

#### Scenario: New resident receives starter credits
- **WHEN** operator onboards new resident to pilot program
- **THEN** system credits wallet with 50 starter credits and displays welcome message explaining starter credit restrictions

#### Scenario: Duplicate onboarding blocked
- **WHEN** operator attempts to onboard resident who already received starter credits
- **THEN** system displays error "Resident already onboarded" and prevents duplicate issuance

### Requirement: Earned credit award rules
The system SHALL award earned credits only after verified contributions: Attend (5), Helper/Co-host (10), Host/Mentor (20), plus mission bonuses (up to 10).

#### Scenario: Attendance awards 5 earned credits
- **WHEN** reviewer approves attendance contribution
- **THEN** system adds 5 credits to earned balance with transaction record linking contribution ID

#### Scenario: Helper awards 10 earned credits
- **WHEN** reviewer approves helper contribution
- **THEN** system adds 10 credits to earned balance with transaction record

#### Scenario: Host awards 20 earned credits
- **WHEN** reviewer approves host contribution
- **THEN** system adds 20 credits to earned balance with transaction record

#### Scenario: Mission bonus stacks with base
- **WHEN** reviewer approves attendance at activity with 5-credit "Digital Literacy" mission bonus
- **THEN** system adds 10 total credits (5 base + 5 bonus) to earned balance

### Requirement: Highest base reward enforcement
The system SHALL award only the highest applicable base reward when a resident has multiple roles in the same activity.

#### Scenario: Host role supersedes attendance
- **WHEN** resident hosts activity and reviewer approves host contribution
- **THEN** system awards 20 credits only (not 20 + 5)

#### Scenario: Multiple contribution claims rejected
- **WHEN** resident submits both "Attend" and "Host" claims for same activity
- **THEN** system displays warning "Only highest role reward applies. Submit host claim only." and allows single claim

### Requirement: No duplicate credit awards
The system SHALL prevent duplicate credit issuance for the same contribution using idempotency keys.

#### Scenario: Duplicate approval attempt blocked
- **WHEN** reviewer approves contribution and clicks approve button again due to slow response
- **THEN** system detects duplicate (idempotency key = contribution_id + resident_id) and displays "Already approved" without issuing additional credits

#### Scenario: Database constraint prevents double-insert
- **WHEN** concurrent approval requests attempt to insert credits for same contribution
- **THEN** database unique constraint fails second transaction and system logs error without exposing to user

### Requirement: Credit earning caps
The system SHALL enforce cap of 100 earned credits per resident per 4-week period (200 total for 8-week pilot).

#### Scenario: Cap prevents excessive earnings
- **WHEN** resident has earned 95 credits in current 4-week period and submits 10-credit helper contribution
- **THEN** system awards only 5 credits and displays message "Period cap reached (100/100). Contribution recorded for next period."

#### Scenario: New period resets cap
- **WHEN** 4-week period ends and new period begins
- **THEN** system resets period earned counter to 0 and allows resident to earn up to 100 credits again

#### Scenario: Period cap dashboard visibility
- **WHEN** resident views wallet page
- **THEN** system displays "Period 1: 75/100 credits earned" with period end date

### Requirement: Transaction audit log
The system SHALL record every credit movement in append-only transaction log with timestamp, type, amount, related entity, and idempotency key.

#### Scenario: Credit award creates transaction record
- **WHEN** reviewer approves 10-credit helper contribution
- **THEN** system inserts transaction: type=earned, amount=10, credit_type=earned, related_entity_type=contribution, related_entity_id=<contribution_id>, idempotency_key=<key>, created_at=<now>

#### Scenario: Redemption creates debit transaction
- **WHEN** resident redeems 50 credits for reward
- **THEN** system inserts transaction: type=redeemed, amount=-50, related_entity_type=redemption, related_entity_id=<redemption_id>

#### Scenario: Refund creates credit transaction
- **WHEN** merchant fails to honor voucher and operator issues refund
- **THEN** system inserts transaction: type=refunded, amount=50, credit_type=earned, related_entity_type=refund, related_entity_id=<refund_id>

### Requirement: Balance reconciliation
The system SHALL provide operator tools to verify wallet balances match transaction log sums.

#### Scenario: Balance matches transaction sum
- **WHEN** operator runs reconciliation check for resident wallet
- **THEN** system calculates SUM(amount) from credit_transactions WHERE resident_id=X and confirms equals wallet available_balance + reserved_balance + redeemed_balance

#### Scenario: Balance mismatch flagged
- **WHEN** reconciliation check finds wallet.available_balance ≠ SUM(transactions)
- **THEN** system flags discrepancy, alerts operator, and provides transaction drill-down

### Requirement: Credit reservation for redemptions
The system SHALL reserve credits during redemption process to prevent double-spending until voucher issued or redemption fails.

#### Scenario: Redemption reserves credits atomically
- **WHEN** resident with 60 available credits starts redemption for 50-credit reward
- **THEN** system atomically moves 50 from available to reserved (10 available, 50 reserved) within single transaction

#### Scenario: Insufficient credits blocks redemption
- **WHEN** resident with 40 available credits attempts to redeem 50-credit reward
- **THEN** system displays error "Insufficient credits. Need 50, have 40." and prevents reservation

#### Scenario: Successful redemption moves reserved to redeemed
- **WHEN** voucher successfully issued for 50-credit redemption
- **THEN** system moves 50 from reserved to redeemed history and creates voucher record

#### Scenario: Failed redemption releases reserved credits
- **WHEN** voucher issuance fails due to partner API error
- **THEN** system returns 50 credits from reserved to available and displays error with retry option

### Requirement: Sponsor mission management
The system SHALL allow operator to configure mission bonuses with criteria, budget, start/end dates.

#### Scenario: Create new mission
- **WHEN** operator creates "Intergenerational Activities" mission with 5-credit bonus, S$100 budget (200 bonuses max), active 2026-09-10 to 2026-09-24
- **THEN** system displays mission on resident mission page and tracks budget usage

#### Scenario: Mission budget exhausted
- **WHEN** residents claim 200 mission bonuses (S$100 budget / S$0.50 per 5-credit bonus)
- **THEN** system hides mission from active list and displays "Budget claimed!" to operator

#### Scenario: Mission expiry
- **WHEN** mission end date passes
- **THEN** system removes mission from active list and rejects new claims with "Mission expired" message

### Requirement: Credit type restrictions at redemption
The system SHALL enforce that only earned credits can be redeemed for external rewards (merchant vouchers, partner benefits, learning sponsorship).

#### Scenario: Earned credits redeem successfully
- **WHEN** resident with 25 starter + 60 earned credits redeems 50-credit merchant voucher
- **THEN** system deducts from earned balance only (25 starter + 10 earned remaining)

#### Scenario: Starter-only wallet blocks external redemption
- **WHEN** resident with 50 starter + 0 earned credits attempts merchant voucher redemption
- **THEN** system displays "Earned credits required. Contribute to activities to earn redeemable credits." and blocks redemption

#### Scenario: Community benefits allow starter credits
- **WHEN** resident with 50 starter credits redeems for approved community workshop place
- **THEN** system allows redemption from starter balance (starter credits OK for community bookings)

### Requirement: No self-generated credits
The system SHALL prevent residents from earning credits through account creation, logins, registrations, or any action other than verified contributions.

#### Scenario: Registration does not award credits
- **WHEN** new resident completes registration and verifies email
- **THEN** system creates wallet with 0 earned credits (starter credits issued separately by operator)

#### Scenario: Daily login does not award credits
- **WHEN** resident logs in on day 5 of pilot
- **THEN** system does not award credits or create streak bonuses

### Requirement: Contribution record independence
The system SHALL maintain contribution records (dates, roles, activities, evidence) permanently and independently from credit balances.

#### Scenario: Zero-balance wallet shows full contribution history
- **WHEN** resident redeems all credits and wallet shows 0 earned credits
- **THEN** profile contribution tab displays complete history of all verified contributions with timestamps and evidence links

#### Scenario: Contribution record supports role progression
- **WHEN** resident has 3 verified helper contributions but 0 credits (all spent)
- **THEN** system still shows 3 helpers toward Co-host role unlock (progression uses records not balances)
