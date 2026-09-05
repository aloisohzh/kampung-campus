## ADDED Requirements

### Requirement: Age and consent verification
The system SHALL verify resident age and obtain appropriate consent for minors without exposing sensitive birthdate information publicly.

#### Scenario: Adult resident onboarding
- **WHEN** operator onboards resident aged 21+ with age confirmation
- **THEN** system records age_verified=true and age_bracket (not exact birthdate) without public display

#### Scenario: Minor requires guardian consent
- **WHEN** operator onboards resident under 18
- **THEN** system requires guardian consent record before activation and flags account for supervision requirements

#### Scenario: Age bracket privacy
- **WHEN** other residents view a resident's profile
- **THEN** system displays no birthdate or exact age (only role and contribution history)

### Requirement: Minor activity supervision
The system SHALL require appropriate supervision for activities involving minors.

#### Scenario: Minor-led activity supervision
- **WHEN** organizer under 18 proposes activity
- **THEN** system requires adult supervisor assignment before approval

#### Scenario: Activities with minors flagged
- **WHEN** activity has registered participants under 18
- **THEN** system displays supervision requirement to organizer and requires safeguarding checklist

### Requirement: Self-targeting prevention
The system SHALL prevent users from performing critical destructive actions on their own accounts.

#### Scenario: Self-account deletion blocked
- **WHEN** any user attempts to delete their own account
- **THEN** system displays error "Cannot delete your own account. Contact operator."

#### Scenario: Self-role-elevation blocked
- **WHEN** resident attempts to grant themselves operator role
- **THEN** system displays error "Cannot modify your own role"

#### Scenario: Operator self-demotion blocked
- **WHEN** sole operator attempts to remove their own operator role
- **THEN** system displays error "Cannot remove last operator. Assign another operator first."

### Requirement: Privacy protection
The system SHALL avoid requiring residents to publish home addresses, school details, employer information, or personal phone numbers.

#### Scenario: Minimal profile information
- **WHEN** resident creates profile
- **THEN** system requires only display name and general neighborhood (not full address, school, or employer)

#### Scenario: Private contact information
- **WHEN** resident provides contact info for account
- **THEN** system stores privately and never displays to other residents (organizer communication via platform only)

### Requirement: Proportionate verification
The system SHALL apply verification proportionate to activity risk and value without excessive documentation demands.

#### Scenario: Low-risk activity minimal verification
- **WHEN** resident joins online study group
- **THEN** system requires only account verification (no additional documentation)

#### Scenario: Higher-value contribution verification
- **WHEN** resident claims host contribution worth 20 credits
- **THEN** system requires delivery evidence and independent approval (proportionate to value)

### Requirement: Activity safety planning
The system SHALL require safety plans proportionate to activity risk level.

#### Scenario: Physical activity safety plan
- **WHEN** organizer proposes outdoor physical activity
- **THEN** system requires emergency contact, first aid provision, and risk assessment before approval

#### Scenario: Online activity no safety plan
- **WHEN** organizer proposes online discussion group
- **THEN** system skips physical safety requirements

### Requirement: Dispute resolution
The system SHALL provide dispute resolution pathways for contribution rejections, redemption failures, and other conflicts.

#### Scenario: Raise dispute
- **WHEN** resident disputes a rejected contribution or failed redemption
- **THEN** system creates dispute record, notifies operator, and provides resident tracking reference

#### Scenario: Dispute resolution tracking
- **WHEN** operator resolves dispute
- **THEN** system records resolution, notifies resident, and closes dispute with outcome documentation

### Requirement: No-show review with appeal
The system SHALL flag repeated no-shows for review while providing appeal routes for legitimate exceptions.

#### Scenario: Repeated no-show flagged
- **WHEN** resident has 3 no-shows without cancellation
- **THEN** system flags account for operator review

#### Scenario: No-show appeal for illness
- **WHEN** flagged resident appeals no-shows citing illness with explanation
- **THEN** system allows operator to accept appeal and clear no-show flags

#### Scenario: Accessibility exception
- **WHEN** resident with accessibility barrier requests exception to deposit forfeiture
- **THEN** system provides appeal route and operator can waive forfeiture

### Requirement: Data retention policy
The system SHALL apply defined data retention periods for personal data, contribution records, and transaction logs.

#### Scenario: Contribution record retention
- **WHEN** pilot concludes
- **THEN** system retains contribution records per stated retention policy and allows resident export

#### Scenario: Data deletion request
- **WHEN** resident requests account data deletion
- **THEN** system anonymizes personal data while preserving anonymized transaction integrity for reconciliation

### Requirement: Value movement control
The system SHALL ensure only published rules and authorized reviewers control credit value movement (AI assists but does not authorize).

#### Scenario: AI recommends but does not authorize
- **WHEN** AI suggests contribution likely valid based on evidence
- **THEN** system displays AI recommendation to reviewer but requires human reviewer approval for credit issuance

#### Scenario: Published rules govern awards
- **WHEN** credit is awarded
- **THEN** system applies published earning schedule (5/10/20 + missions) not arbitrary amounts

### Requirement: Assisted access provision
The system SHALL provide assisted onboarding, check-in, and redemption for residents without digital access.

#### Scenario: Operator-assisted check-in
- **WHEN** resident without smartphone arrives at activity
- **THEN** operator can check them in via operator interface on resident's behalf

#### Scenario: Operator-assisted redemption
- **WHEN** resident without digital access wants to redeem credits
- **THEN** operator can process redemption and print physical voucher for resident

### Requirement: Excluded activities
The system SHALL prevent activities involving overseas travel, personal cash withdrawals, resident-to-resident credit transfers, and fully automated enforcement.

#### Scenario: Cash withdrawal blocked
- **WHEN** resident attempts to convert credits to cash
- **THEN** system displays "Credits cannot be withdrawn as cash. Redeem for approved rewards only."

#### Scenario: Resident-to-resident transfer blocked
- **WHEN** resident attempts to transfer credits to another resident
- **THEN** system displays "Credits cannot be transferred between residents"

#### Scenario: Overseas travel activity blocked
- **WHEN** organizer proposes overseas travel activity
- **THEN** system displays "Overseas travel activities are outside pilot scope"

### Requirement: Governance role assignment
The system SHALL support assignment of governance owners for programme delivery, finance, safeguarding, partner fulfilment, and technical operations.

#### Scenario: Assign governance roles
- **WHEN** operator configures governance owners before pilot launch
- **THEN** system records owners for each domain (delivery, finance, safeguarding, fulfillment, technical) with contact info

#### Scenario: Launch readiness check
- **WHEN** operator attempts to launch pilot
- **THEN** system verifies all governance owners assigned and displays checklist of launch prerequisites

### Requirement: Incident handling
The system SHALL provide incident reporting and handling workflow for safety, fraud, or dispute incidents.

#### Scenario: Report incident
- **WHEN** organizer reports safety incident during activity
- **THEN** system creates incident record, notifies safeguarding owner, and tracks resolution

### Requirement: Human-in-the-loop enforcement
The system SHALL require human authorization for all value movements and prohibit fully automated enforcement.

#### Scenario: No automated credit deduction penalties
- **WHEN** resident violates activity rules
- **THEN** system flags for operator review rather than automatically deducting credits

#### Scenario: Human approval for all awards
- **WHEN** any earned credit is issued
- **THEN** system requires reviewer or operator human approval (no fully automatic issuance)

### Requirement: Consent for AI assistance
The system SHALL disclose AI assistance usage (plan drafting, translation, recommendations) transparently.

#### Scenario: AI assistance disclosure
- **WHEN** AI drafts activity plan or translates content
- **THEN** system labels output "AI-assisted draft - please review" and allows human editing

### Requirement: Launch condition verification
The system SHALL verify all launch conditions before enabling live pilot including eligibility rules, consent rules, partner commitments, published rates, and reconciliation setup.

#### Scenario: Pre-launch checklist
- **WHEN** operator initiates pilot launch
- **THEN** system displays checklist requiring confirmation of: eligibility rules, age/consent rules, partner fulfillment commitments, published credit rates/caps/expiry/cancellation/appeal terms, access permissions, data retention, funding reconciliation, incident handling, and end-of-pilot credit treatment

#### Scenario: Incomplete launch conditions block launch
- **WHEN** operator attempts launch with missing partner fulfillment commitments
- **THEN** system displays "Cannot launch - partner fulfillment commitments not confirmed" and lists incomplete items
