## ADDED Requirements

### Requirement: Four reward pathways
The system SHALL organize rewards into four categories: Everyday vouchers, Community activities, Sport & culture, and Further learning.

#### Scenario: Browse rewards by pathway
- **WHEN** resident navigates to rewards catalogue
- **THEN** system displays four pathway tabs with reward count per category

#### Scenario: Filter rewards within pathway
- **WHEN** resident selects "Everyday vouchers" pathway
- **THEN** system displays merchant vouchers with prices, merchant names, and availability status

### Requirement: Base conversion rate
The system SHALL apply base conversion rate of 10 earned credits = S$1 reward value for standard rewards.

#### Scenario: 50-credit voucher equals S$5 value
- **WHEN** resident redeems 50 credits for merchant voucher
- **THEN** system issues voucher worth S$5 at participating merchant

#### Scenario: 100-credit culture pass equals S$10 value
- **WHEN** resident redeems 100 credits for culture experience
- **THEN** system issues benefit worth S$10 toward eligible cultural activity

### Requirement: Sponsor boost display
The system SHALL clearly display when a reward includes sponsor-funded boost beyond base conversion rate.

#### Scenario: Boosted reward shows actual value
- **WHEN** resident views 100-credit sport benefit with S$5 sponsor boost
- **THEN** system displays "100 credits + S$5 sponsor boost = S$15 total value" with sponsor name

#### Scenario: Non-boosted reward shows standard conversion
- **WHEN** resident views 50-credit merchant voucher with no boost
- **THEN** system displays "50 credits = S$5 value"

### Requirement: Clear reward information
The system SHALL display credit price, actual benefit value, merchant/partner name, funding source, availability, eligibility requirements, validity period, and cancellation terms for each reward.

#### Scenario: Complete reward details visible
- **WHEN** resident clicks on reward card to view details
- **THEN** system displays modal with all required information fields populated

#### Scenario: Eligibility requirements highlighted
- **WHEN** reward requires age 60+ for senior wellness program
- **THEN** system displays "Eligibility: Age 60+" in bold and checks resident profile before allowing redemption

### Requirement: Inventory management
The system SHALL track available inventory for each reward and prevent over-commitment.

#### Scenario: Limited inventory displayed
- **WHEN** reward has 5 vouchers remaining
- **THEN** system displays "5 left" badge on reward card

#### Scenario: Out of stock prevents redemption
- **WHEN** resident attempts to redeem reward with 0 inventory
- **THEN** system displays "Currently unavailable. Check back later." and disables redeem button

#### Scenario: Reserved inventory during redemption
- **WHEN** resident starts redemption process for limited-inventory reward
- **THEN** system reserves 1 inventory unit for 10 minutes or until redemption completes

### Requirement: Voucher generation
The system SHALL generate unique UUID vouchers with QR codes, issue/expiry dates, and redemption instructions.

#### Scenario: Successful redemption issues voucher
- **WHEN** resident completes 50-credit redemption for merchant voucher
- **THEN** system generates UUID voucher, displays QR code, and sends email with redemption instructions

#### Scenario: Voucher expiry date enforced
- **WHEN** merchant scans voucher after 30-day expiry
- **THEN** system displays "Voucher expired on YYYY-MM-DD" and rejects redemption

### Requirement: Single-use enforcement
The system SHALL prevent voucher reuse by recording redemption timestamp and merchant ID.

#### Scenario: First scan validates successfully
- **WHEN** merchant scans unredeemed voucher
- **THEN** system displays voucher details (value, resident name) and prompts merchant to confirm redemption

#### Scenario: Duplicate scan rejected
- **WHEN** merchant scans voucher already redeemed
- **THEN** system displays "Already redeemed on YYYY-MM-DD at [Merchant Name]" and plays rejection sound/visual

#### Scenario: Screenshot sharing blocked
- **WHEN** resident shares voucher screenshot and both attempt redemption at different merchants
- **THEN** system allows first redemption only; second merchant receives "Already redeemed" error

### Requirement: Merchant catalogue
The system SHALL display participating merchant locations, categories, accepted voucher types, and redemption instructions.

#### Scenario: Browse merchant directory
- **WHEN** resident clicks "Where to use vouchers"
- **THEN** system displays map and list of participating merchants with categories (food, stationery, services)

### Requirement: Community activity benefits
The system SHALL allow redemption of credits for approved community workshop materials, equipment access, and activity deposits using starter or earned credits.

#### Scenario: Workshop materials redemption
- **WHEN** resident redeems 30 credits for woodworking workshop materials
- **THEN** system issues materials voucher redeemable with organizer (accepts starter credits)

#### Scenario: Equipment access pass
- **WHEN** resident redeems 20 credits for community kitchen access pass
- **THEN** system issues digital pass with QR code for equipment room entry

### Requirement: Sport and culture benefits
The system SHALL provide pathways to approved sport experiences and cultural activities, including partner-funded boosts.

#### Scenario: ActiveSG benefit simulation
- **WHEN** resident redeems 100 credits for ActiveSG swimming session
- **THEN** system displays "Simulated for pilot" and provides booking instructions (real integration post-pilot)

#### Scenario: Culture Pass benefit simulation
- **WHEN** resident redeems 100 credits for museum entry
- **THEN** system displays "Simulated for pilot" and provides partner contact for assisted booking

### Requirement: Learning sponsorship
The system SHALL support course fee sponsorship redemptions with provider approval flow.

#### Scenario: Course sponsorship request
- **WHEN** resident redeems 500 credits for approved course fee sponsorship
- **THEN** system initiates approval workflow with course provider and sends confirmation timeline

#### Scenario: Partial fee sponsorship
- **WHEN** course costs S$200 and resident redeems 1000 credits (S$100 value)
- **THEN** system clearly displays "Kampung covers S$100. You pay S$100." before confirming redemption

### Requirement: Discount transparency
The system SHALL distinguish between fully-funded vouchers and discounts requiring additional resident payment.

#### Scenario: Fully-funded voucher labeled
- **WHEN** reward is S$5 voucher requiring 50 credits with no additional payment
- **THEN** system displays "Fully funded - no extra payment required"

#### Scenario: Discount with additional payment labeled
- **WHEN** reward is "S$10 off S$50 purchase" requiring 100 credits
- **THEN** system displays "Requires S$40 additional spend at merchant" in bold before redemption

### Requirement: Redemption confirmation
The system SHALL provide immediate confirmation with voucher code, instructions, validity period, and merchant contact.

#### Scenario: Post-redemption confirmation screen
- **WHEN** resident completes redemption
- **THEN** system displays success screen with voucher QR code, expiry date, merchant list, and "Email sent" confirmation

#### Scenario: Redemption email
- **WHEN** redemption completes
- **THEN** system sends email within 60 seconds with voucher code, QR image, redemption instructions, merchant contact, and support email

### Requirement: Redemption history
The system SHALL maintain complete redemption history with voucher details, redemption dates, and usage status.

#### Scenario: View past redemptions
- **WHEN** resident navigates to redemption history page
- **THEN** system displays all redeemed vouchers with status (Active, Redeemed at [Merchant], Expired)

#### Scenario: Unredeemed vouchers highlighted
- **WHEN** resident has 3 active unredeemed vouchers expiring soon
- **THEN** system displays "You have 3 active vouchers - use before YYYY-MM-DD" banner on wallet page

### Requirement: Cancellation and refunds
The system SHALL process refunds when redemption fails or merchant cannot fulfill, restoring original credit type (starter vs earned).

#### Scenario: Merchant non-fulfillment refund
- **WHEN** resident reports merchant refused valid voucher and operator verifies
- **THEN** system refunds 50 earned credits to wallet and voids voucher

#### Scenario: Accidental redemption cancellation
- **WHEN** resident cancels redemption within 5 minutes before voucher sent
- **THEN** system returns reserved credits to available balance and cancels voucher generation

#### Scenario: Refund preserves credit type
- **WHEN** community activity benefit (paid with starter credits) is cancelled
- **THEN** system refunds to starter balance (not earned balance)

### Requirement: Partner benefit labeling
The system SHALL clearly label simulated vs live partner integrations with explanations.

#### Scenario: Simulated benefit labeled
- **WHEN** resident views ActiveSG benefit during pilot
- **THEN** system displays "SIMULATED FOR PILOT" badge and explanation "Real integration coming post-pilot"

#### Scenario: Live benefit labeled
- **WHEN** resident views merchant voucher with real fulfillment
- **THEN** system displays "LIVE - Redeemable now" badge

### Requirement: Minimum spend disclosures
The system SHALL clearly display minimum purchase requirements before redemption confirmation.

#### Scenario: No minimum spend reward
- **WHEN** S$5 voucher has no minimum spend requirement
- **THEN** system displays "No minimum spend required"

#### Scenario: Minimum spend requirement disclosed
- **WHEN** S$10 voucher requires S$50 minimum purchase
- **THEN** system displays "Requires minimum S$50 purchase at merchant" and requires resident to check acknowledgment box before redeeming
