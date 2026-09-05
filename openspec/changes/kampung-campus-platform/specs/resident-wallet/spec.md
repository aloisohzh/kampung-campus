## ADDED Requirements

### Requirement: Display four balance types
The system SHALL display Starter, Pending, Available (earned), and Reserved balances with clear explanations.

#### Scenario: Wallet overview displays all balances
- **WHEN** resident views wallet page
- **THEN** system displays "Starter: 48 | Pending: 10 | Available: 85 | Reserved: 15" with tooltip explaining each type

#### Scenario: Balance type explanations
- **WHEN** resident taps info icon next to "Starter" balance
- **THEN** system displays "Starter credits: For activity deposits only. Cannot be redeemed for rewards."

### Requirement: Transaction history
The system SHALL display chronological transaction history with type, amount, description, timestamp, and resulting balance.

#### Scenario: View complete transaction history
- **WHEN** resident navigates to transaction history tab
- **THEN** system displays all transactions sorted newest-first with clear labels (e.g., "Earned +10 | Helper at Study Sprint | 2026-09-12 14:30")

#### Scenario: Filter transactions by type
- **WHEN** resident selects "Earned credits only" filter
- **THEN** system displays only credit award transactions excluding redemptions, deposits, refunds

### Requirement: Pending claims visibility
The system SHALL display pending contribution claims with submission date, status, and estimated review time.

#### Scenario: View pending claims
- **WHEN** resident views wallet pending section
- **THEN** system displays "2 pending claims: Helper at Workshop (Submitted 2 days ago - Under review), Attendance at Walk (Submitted 1 hour ago - In queue)"

#### Scenario: Pending claim approved notification
- **WHEN** reviewer approves pending claim
- **THEN** system moves 10 credits from Pending to Available, sends notification, and updates pending claims list

### Requirement: Redemption history
The system SHALL display all redemptions with reward name, credit cost, redemption date, voucher status, and expiry date.

#### Scenario: View redemption history
- **WHEN** resident navigates to redemption history tab
- **THEN** system displays all redeemed rewards with status badges (Active, Redeemed, Expired)

#### Scenario: Active vouchers highlighted
- **WHEN** resident has unredeemed vouchers
- **THEN** system displays "You have 2 active vouchers" banner at top of wallet with quick-access buttons

### Requirement: Credit earning progress
The system SHALL display progress toward period earning cap (100 credits per 4-week period).

#### Scenario: Period progress visible
- **WHEN** resident views wallet
- **THEN** system displays "Period 1 (Sep 10 - Oct 7): 73/100 credits earned" with progress bar

#### Scenario: Near cap warning
- **WHEN** resident has earned 95 credits in current period
- **THEN** system displays warning banner "Approaching period cap (95/100). 5 credits remaining this period."

#### Scenario: Cap reached notification
- **WHEN** resident reaches 100-credit period cap
- **THEN** system displays "Period cap reached! New period starts Oct 8. Contributions still count toward role progression."

### Requirement: Reserved balance explanation
The system SHALL show reserved balances with explanations for each reservation (pending redemptions, activity deposits).

#### Scenario: View reserved credit details
- **WHEN** resident taps on "Reserved: 15" balance
- **THEN** system displays breakdown: "5 - Pending redemption (Culture Pass) | 10 - Activity deposits (2 upcoming activities)"

### Requirement: Deposit refund tracking
The system SHALL display upcoming deposit refunds linked to confirmed activities.

#### Scenario: View future deposit refunds
- **WHEN** resident views reserved balance details
- **THEN** system displays "You'll receive 10 starter credits back after attending 2 activities (Study Sprint on Sep 15, Walk on Sep 18)"

### Requirement: Balance safety indicators
The system SHALL display warnings when balances are low or approaching important thresholds.

#### Scenario: Low starter credits warning
- **WHEN** resident has 3 starter credits and views activity requiring 5-credit deposit
- **THEN** system displays "Not enough starter credits for deposit. Earn more by completing your first contribution!"

#### Scenario: Zero earned credits prompt
- **WHEN** resident with 0 earned credits views rewards catalogue
- **THEN** system displays "Complete your first activity to start earning redeemable credits" with link to activity discovery

### Requirement: Transaction explanations
The system SHALL provide clear explanations for each transaction including source, reason, and related activity.

#### Scenario: Credit award shows source
- **WHEN** transaction history shows "+10 earned credits"
- **THEN** system displays full description "Helper at Study Sprint (Sep 12) - Verified by Reviewer Name on Sep 13"

#### Scenario: Refund shows reason
- **WHEN** transaction history shows "+50 refund"
- **THEN** system displays "Refund: Merchant unable to fulfill voucher #V-12345 - Operator approved Sep 14"

### Requirement: Wallet dashboard summary
The system SHALL display wallet dashboard with total credits, available to redeem, active vouchers, and suggested next action.

#### Scenario: Wallet dashboard view
- **WHEN** resident lands on wallet page
- **THEN** system displays summary card: "Total credits: 123 (85 available to redeem) | 2 active vouchers | Next: You can redeem for S$5 merchant voucher"

### Requirement: Export transaction history
The system SHALL allow residents to export transaction history as PDF or CSV for personal records.

#### Scenario: Export wallet history
- **WHEN** resident clicks "Export" button and selects PDF
- **THEN** system generates PDF with resident name, date range, all transactions, and final balances

### Requirement: Real-time balance updates
The system SHALL update wallet balances immediately when credits are earned, reserved, or redeemed.

#### Scenario: Instant credit award reflection
- **WHEN** reviewer approves contribution while resident has wallet page open
- **THEN** system updates available balance within 5 seconds without page refresh (via polling or WebSocket)

### Requirement: Contribution record access
The system SHALL provide direct link from wallet to complete contribution history independent of credit balances.

#### Scenario: View contribution record from wallet
- **WHEN** resident clicks "View contribution history" from wallet page
- **THEN** system navigates to contributions tab showing all verified contributions with dates, roles, activities, and evidence

### Requirement: Period transition handling
The system SHALL clearly communicate when period caps reset and how many credits resident can earn in new period.

#### Scenario: Period transition notification
- **WHEN** 4-week period ends and new period begins
- **THEN** system displays "New earning period started! You can now earn up to 100 more credits" banner on next wallet visit

### Requirement: Multi-balance redemption prevention
The system SHALL prevent redemptions that would mix starter and earned credits.

#### Scenario: Earned credits fully deducted first
- **WHEN** resident with 45 earned + 50 starter credits redeems 50-credit reward
- **THEN** system deducts 45 earned credits, then displays error "Need 5 more earned credits. Starter credits cannot be used for this reward."

### Requirement: Pending claim management
The system SHALL allow residents to cancel pending claims before review if evidence was incorrect.

#### Scenario: Cancel pending claim
- **WHEN** resident realizes submitted wrong evidence and clicks "Cancel claim" on pending contribution
- **THEN** system cancels claim, removes from pending list, and allows resident to resubmit with correct evidence
