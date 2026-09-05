## ADDED Requirements

### Requirement: Partner adapter abstraction
The system SHALL implement a partner adapter interface allowing consistent interaction with external programs (ActiveSG, Culture Pass, SkillsFuture) with simulation and live modes.

#### Scenario: Adapter simulation mode
- **WHEN** partner adapter is configured with simulation_mode=true during pilot
- **THEN** system returns simulated responses (fake booking IDs, mock confirmations) without calling external APIs

#### Scenario: Adapter live mode
- **WHEN** partner adapter is configured with simulation_mode=false post-pilot
- **THEN** system calls real partner APIs and returns actual responses

### Requirement: Simulation labeling
The system SHALL clearly label all simulated partner integrations to residents and staff.

#### Scenario: Simulated benefit displays label
- **WHEN** resident views ActiveSG benefit in simulation mode
- **THEN** system displays prominent "SIMULATED FOR PILOT - Real integration coming soon" badge

#### Scenario: Simulation confirmation transparency
- **WHEN** resident completes simulated partner redemption
- **THEN** system displays "This is a simulated demonstration. In production, this would book your actual ActiveSG session."

### Requirement: Three integration mechanisms
The system SHALL distinguish three partner mechanisms with different product labels: Discovery/activation, Sponsored payment, and Direct conversion.

#### Scenario: Discovery mechanism labeled
- **WHEN** partner benefit helps resident use existing credits (e.g., find ActiveSG activities)
- **THEN** system labels as "Discover & Book" and does not imply credit transfer

#### Scenario: Sponsored payment labeled
- **WHEN** partner benefit funds an activity or portion of cost
- **THEN** system labels as "Sponsored Participation" with clear funding source

#### Scenario: Direct conversion labeled
- **WHEN** partner benefit would transfer value to external account (future capability)
- **THEN** system labels as "Credit Transfer" and marks as "Requires approved arrangement - not available in pilot"

### Requirement: ActiveSG discovery pathway
The system SHALL help residents discover relevant ActiveSG activities and use existing credits (discovery mode for pilot).

#### Scenario: Discover ActiveSG activities
- **WHEN** resident selects "Explore Sport" pathway
- **THEN** system displays curated list of ActiveSG activities with booking guidance (does not claim credit transfer)

#### Scenario: Simulated funded participation
- **WHEN** resident redeems credits for simulated ActiveSG sponsored session
- **THEN** system displays "Simulated: In production, this would sponsor your swimming session" with clear disclaimer

### Requirement: Culture Pass remaining-cost support
The system SHALL explore support for approved remaining costs with participating partners (not credit replenishment).

#### Scenario: Culture Pass remaining cost simulation
- **WHEN** resident redeems credits toward cultural event where Culture Pass covers partial cost
- **THEN** system displays "Simulated: Kampung would fund remaining S$5 after your Culture Pass credit" without claiming Culture Pass integration

#### Scenario: No Culture Pass replenishment claim
- **WHEN** resident views Culture Pass benefit
- **THEN** system explicitly states "This does not add credits to your Culture Pass account"

### Requirement: SkillsFuture learning sponsorship
The system SHALL support learning sponsorship with confirmed provider, fee breakdown, and payment arrangement (future capability, simulated in pilot).

#### Scenario: Learning sponsorship simulation
- **WHEN** resident redeems credits for course fee sponsorship
- **THEN** system displays "Simulated: Kampung would pay S$100 nett fee directly to provider" with third-party sponsorship framework note

#### Scenario: Funding source combination warning
- **WHEN** resident considers combining Kampung sponsorship with SkillsFuture Credit
- **THEN** system displays "Note: Personal SkillsFuture Credit cannot fund employer-sponsored training. Combinations must be verified."

### Requirement: Partner referral tracking
The system SHALL track partner referrals distinctly from bookings and confirmed attendance.

#### Scenario: Track referral click
- **WHEN** resident clicks external partner link
- **THEN** system records referral event (does not count as booking or attendance)

#### Scenario: Distinguish referral from attendance
- **WHEN** operator views partner metrics
- **THEN** system displays separate counts: "Referrals: 45 | Bookings: 12 | Confirmed attendance: 8" (not conflated)

### Requirement: Integration status transparency
The system SHALL clearly communicate which integrations are live vs simulated vs planned.

#### Scenario: View integration status page
- **WHEN** resident or operator views partner integrations page
- **THEN** system displays status table: "ActiveSG: Simulated | Culture Pass: Simulated | SkillsFuture: Simulated | Local Merchants: Live"

### Requirement: Partner agreement gating
The system SHALL prevent enabling live partner integration without recorded agreement confirmation.

#### Scenario: Live mode requires agreement flag
- **WHEN** operator attempts to switch ActiveSG adapter to live mode without agreement_confirmed flag
- **THEN** system displays "Cannot enable live integration - partner agreement must be recorded first"

### Requirement: Fee breakdown transparency
The system SHALL display complete fee breakdown for any sponsored payment showing what Kampung covers vs resident pays.

#### Scenario: Learning sponsorship fee breakdown
- **WHEN** resident views course sponsorship where course costs S$200, Kampung covers S$100
- **THEN** system displays "Total course fee: S$200 | Kampung sponsors: S$100 | You pay: S$100 | Provider: [Name]"

### Requirement: Simulated result handling
The system SHALL keep uncertain external results in pending state until reconciled, even in simulation.

#### Scenario: Simulated pending result
- **WHEN** resident completes simulated partner booking with uncertain confirmation
- **THEN** system displays "Pending confirmation" status and does not finalize until operator reconciles

### Requirement: Post-pilot integration roadmap
The system SHALL document integration requirements and prerequisites for each partner for post-pilot implementation.

#### Scenario: View integration requirements
- **WHEN** operator views partner integration roadmap
- **THEN** system displays prerequisites per partner (e.g., "ActiveSG: Requires API access agreement, sandbox testing, MCCY approval")
