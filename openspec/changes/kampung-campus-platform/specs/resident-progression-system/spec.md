## ADDED Requirements

### Requirement: Track resident journey stages
The system SHALL track each resident's progression through the seven-stage journey: Discover → Commit → Contribute → Verify → Earn → Redeem → Return.

#### Scenario: First-time resident journey
- **WHEN** new resident browses activities (Discover), commits to one (Commit), attends (Contribute), gets verified (Verify), receives credits (Earn), redeems reward (Redeem), and joins another activity (Return)
- **THEN** system records completion timestamp for each stage in resident profile

#### Scenario: Journey metrics dashboard
- **WHEN** operator views resident journey analytics
- **THEN** system displays funnel visualization showing dropout rates at each stage

### Requirement: Role progression tracking
The system SHALL track resident role progression from Participant → Helper → Co-host → Organizer → Mentor with minimum contribution requirements.

#### Scenario: Participant completes first activity
- **WHEN** resident attends and completes their first activity
- **THEN** system awards "Participant" badge and records role progression

#### Scenario: Helper role unlocked after verified contributions
- **WHEN** resident completes 3 activities and helps at 1 activity with organizer confirmation
- **THEN** system awards "Helper" badge and displays on profile

#### Scenario: Co-host role unlocked after helping
- **WHEN** resident helps at 5 activities and co-hosts 1 activity with organizer confirmation
- **THEN** system awards "Co-host" badge and unlocks organizer proposal access

#### Scenario: Organizer role unlocked after co-hosting
- **WHEN** resident co-hosts 3 activities and proposes successful activity with 10+ attendees
- **THEN** system awards "Organizer" badge and unlocks grant request access

#### Scenario: Mentor role unlocked after teaching
- **WHEN** resident delivers 5 sessions as host with avg 4+ star rating and operator approval
- **THEN** system awards "Mentor" badge and displays on platform directory

### Requirement: Contribution verification workflow
The system SHALL require independent verification of contributions before credit issuance.

#### Scenario: Submit contribution evidence
- **WHEN** resident completes helper role at activity
- **THEN** system prompts to submit evidence (photos, description) and notifies reviewer

#### Scenario: Reviewer approves contribution
- **WHEN** reviewer validates evidence and approves contribution within 24 hours
- **THEN** system issues credits, updates contribution record, and notifies resident

#### Scenario: Reviewer rejects contribution with reason
- **WHEN** reviewer determines evidence insufficient and rejects with explanation
- **THEN** system marks contribution rejected, notifies resident with reason, and offers appeal option

### Requirement: Evidence submission types
The system SHALL accept multiple evidence types including photos, attendance lists, delivery artifacts, and participant feedback.

#### Scenario: Upload photo evidence
- **WHEN** resident uploads 3 photos of activity setup as helper evidence
- **THEN** system stores photos in object storage and attaches to contribution record

#### Scenario: Organizer confirmation as evidence
- **WHEN** organizer marks resident as "Helper" in attendance sheet with specific tasks completed
- **THEN** system pre-fills contribution claim with organizer confirmation

### Requirement: Contribution record permanence
The system SHALL maintain permanent contribution records independent of credit spending, including role, date, activity, evidence, and verification status.

#### Scenario: Spent credits preserve record
- **WHEN** resident redeems all 50 earned credits after 10 verified contributions
- **THEN** system maintains all 10 contribution records with timestamps, roles, and evidence links

#### Scenario: Contribution history export
- **WHEN** resident requests contribution history PDF
- **THEN** system generates document listing all verified contributions with dates, roles, activities, and earned credits

### Requirement: Independent approval enforcement
The system SHALL prevent residents from approving their own contributions or contributions from activities they organized.

#### Scenario: Self-approval blocked
- **WHEN** resident attempts to review their own contribution claim
- **THEN** system displays error "Cannot approve own contributions" and hides approve button

#### Scenario: Organizer cannot approve own activity contributions
- **WHEN** organizer of "Study Sprint" attempts to review helper contribution from their own activity
- **THEN** system displays error "Cannot approve contributions from your activities" and assigns to independent reviewer

### Requirement: Appeal process
The system SHALL allow residents to appeal rejected contributions with additional evidence within 7 days.

#### Scenario: Submit appeal with new evidence
- **WHEN** resident submits appeal for rejected contribution with additional photos and organizer statement
- **THEN** system creates appeal record, notifies operator, and sets 3-day review deadline

#### Scenario: Appeal approved restores credit award
- **WHEN** operator reviews appeal and determines contribution valid
- **THEN** system issues original credits, marks contribution verified, and updates contribution record

#### Scenario: Appeal denied is final
- **WHEN** operator reviews appeal and upholds rejection with detailed reason
- **THEN** system marks appeal denied, notifies resident, and prevents further appeals on same contribution

### Requirement: Role-based credit earning rates
The system SHALL award credits based on verified contribution role: Attend (5), Helper/Co-host (10), Host/Mentor (20), plus mission bonuses (up to 10).

#### Scenario: Attendance awards 5 credits
- **WHEN** resident attends activity and organizer confirms attendance
- **THEN** system awards 5 earned credits after reviewer approval

#### Scenario: Helper role awards 10 credits
- **WHEN** resident helps with setup/facilitation and organizer confirms helper tasks
- **THEN** system awards 10 earned credits after reviewer approval

#### Scenario: Host role awards 20 credits
- **WHEN** resident delivers full session as primary host and operator verifies delivery
- **THEN** system awards 20 earned credits after reviewer approval

#### Scenario: Mission bonus adds up to 10 credits
- **WHEN** resident completes activity tagged as "Healthy Ageing" mission (5-credit bonus)
- **THEN** system awards base credits (5/10/20) plus 5 mission bonus

### Requirement: Highest base reward only
The system SHALL award only the highest applicable base reward for a single resident at a single activity (no stacking attendance + helper + host).

#### Scenario: Host does not also collect attendance
- **WHEN** resident hosts activity and reviewer approves host contribution
- **THEN** system awards 20 host credits only (not 20 + 5 attendance)

#### Scenario: Mission bonus stacks with base
- **WHEN** resident hosts activity with 10-credit mission bonus
- **THEN** system awards 20 base + 10 mission = 30 total credits

### Requirement: Progression visibility
The system SHALL display resident's current role, next role requirements, and progress toward requirements on profile page.

#### Scenario: View progression dashboard
- **WHEN** resident views their profile progression tab
- **THEN** system displays current role badge, next role requirements (e.g., "3 more helps to unlock Co-host"), and progress bar

#### Scenario: Next role unlocked notification
- **WHEN** resident completes final requirement for next role
- **THEN** system displays celebration modal, awards badge, and sends congratulations notification
