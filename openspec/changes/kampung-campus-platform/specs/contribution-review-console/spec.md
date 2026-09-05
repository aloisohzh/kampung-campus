## ADDED Requirements

### Requirement: Evidence submission interface
The system SHALL provide residents an interface to submit contribution claims with role, activity, description, and supporting evidence (photos, documents, organizer confirmation).

#### Scenario: Submit helper contribution with photos
- **WHEN** resident submits helper claim for "Study Sprint" activity with 3 photos and description "Setup tables, welcomed participants, distributed materials"
- **THEN** system creates pending claim, uploads photos to object storage, and notifies assigned reviewer

#### Scenario: Organizer pre-confirmation
- **WHEN** organizer marks resident as "Helper" in activity attendance sheet
- **THEN** system pre-fills contribution claim form with activity, role, and organizer confirmation attached

### Requirement: Independent reviewer assignment
The system SHALL assign contributions to independent reviewers, preventing self-review and organizer-of-same-activity review.

#### Scenario: Self-review blocked
- **WHEN** resident who is also a reviewer attempts to review their own contribution claim
- **THEN** system hides claim from their review queue and displays "Cannot review own contributions"

#### Scenario: Organizer review blocked
- **WHEN** organizer of "Study Sprint" attempts to review helper contribution from their own activity
- **THEN** system hides claim from their review queue with message "Cannot review contributions from your activities"

#### Scenario: Valid reviewer sees claim
- **WHEN** independent reviewer (not claimant, not organizer) opens review queue
- **THEN** system displays pending claim in queue with priority ordering

### Requirement: Review queue prioritization
The system SHALL display pending contributions in First-In-First-Out (FIFO) order with age indicators.

#### Scenario: FIFO queue display
- **WHEN** reviewer opens review queue with 10 pending claims
- **THEN** system displays oldest claim first with "Submitted 3 days ago" age label

#### Scenario: Overdue claims highlighted
- **WHEN** claim has been pending for >48 hours beyond target 24h SLA
- **THEN** system displays claim with red "Overdue" badge at top of queue

### Requirement: Evidence display
The system SHALL display all submitted evidence with zoom, download, and caption capabilities for reviewer assessment.

#### Scenario: View photo evidence
- **WHEN** reviewer clicks on contribution claim with 3 photos
- **THEN** system displays photos in gallery view with zoom, download, and resident captions

#### Scenario: View organizer confirmation
- **WHEN** contribution includes organizer confirmation
- **THEN** system displays confirmation badge with organizer name, timestamp, and optional comments

### Requirement: Reward rule matching
The system SHALL display applicable reward rules and calculated credit amount based on role, activity type, and active missions.

#### Scenario: Helper role shows 10-credit award
- **WHEN** reviewer views helper contribution claim
- **THEN** system displays "Proposed award: 10 credits (Helper role - base rate)" in review panel

#### Scenario: Mission bonus included
- **WHEN** contribution is for activity tagged with "Healthy Ageing" mission (5-credit bonus)
- **THEN** system displays "Proposed award: 15 credits (10 base + 5 mission bonus)" with mission name

#### Scenario: Period cap warning
- **WHEN** resident has 95 credits earned in period and contribution awards 10 credits
- **THEN** system displays warning "Resident at 95/100 period cap. Only 5 credits will be awarded."

### Requirement: Approval workflow
The system SHALL allow reviewer to approve, reject, or request additional evidence with required explanation for rejection/request.

#### Scenario: Approve contribution
- **WHEN** reviewer verifies evidence matches claim and clicks "Approve"
- **THEN** system issues credits, moves claim to approved state, notifies resident, and updates wallet immediately

#### Scenario: Reject with reason required
- **WHEN** reviewer clicks "Reject" without providing reason
- **THEN** system displays error "Rejection reason required" and prevents submission

#### Scenario: Reject with clear reason
- **WHEN** reviewer rejects contribution with reason "Photos show different activity than claimed. Please resubmit with correct evidence."
- **THEN** system marks claim rejected, notifies resident with reason, and allows resident to appeal

#### Scenario: Request additional evidence
- **WHEN** reviewer selects "Request more evidence" with note "Please provide organizer confirmation"
- **THEN** system notifies resident, reopens claim for evidence addition, and pauses review timer

### Requirement: No duplicate approval
The system SHALL prevent duplicate credit issuance when reviewer clicks approve multiple times.

#### Scenario: Double-click protection
- **WHEN** reviewer clicks "Approve" button twice in quick succession
- **THEN** system processes first click only using idempotency key and displays "Already approved" on second click

#### Scenario: Concurrent approval blocked
- **WHEN** two reviewers somehow both attempt to approve same contribution
- **THEN** database transaction ensures only one approval succeeds and second receives "Already processed" error

### Requirement: Appeal handling
The system SHALL display appeal submissions from residents with new evidence for re-review.

#### Scenario: Appeal enters priority queue
- **WHEN** resident appeals rejected contribution with additional evidence
- **THEN** system adds appeal to high-priority review queue (before regular claims) and notifies operator

#### Scenario: Appeal review with history
- **WHEN** reviewer opens appealed contribution
- **THEN** system displays original claim, rejection reason, new evidence, and resident's appeal explanation in single view

### Requirement: Reviewer dashboard
The system SHALL provide reviewer dashboard showing queue depth, avg review time, approval rate, and personal review count.

#### Scenario: View reviewer metrics
- **WHEN** reviewer opens dashboard
- **THEN** system displays "Queue: 8 pending | Avg review time: 18 minutes | Your reviews: 45 (40 approved, 5 rejected) | Approval rate: 89%"

### Requirement: Review time tracking
The system SHALL track time from submission to review completion and flag slow reviews.

#### Scenario: Review duration recorded
- **WHEN** reviewer approves contribution 18 hours after submission
- **THEN** system records review_duration=18h in contribution record

#### Scenario: Slow review flagged
- **WHEN** contribution pending for 72 hours with no review action
- **THEN** system sends alert to operator "3 contributions pending >72h - reviewer bottleneck detected"

### Requirement: Batch review prevention
The system SHALL require reviewers to view evidence for each contribution individually (no bulk approve).

#### Scenario: No select-all approve
- **WHEN** reviewer views review queue
- **THEN** system does not provide "Approve all" checkbox option, enforcing individual evidence review

### Requirement: Contribution context
The system SHALL display activity details, organizer info, and expected role responsibilities for reviewer reference.

#### Scenario: View activity context
- **WHEN** reviewer opens contribution claim
- **THEN** system displays sidebar with activity name, date, organizer, description, and helper role expectations (e.g., "Setup, welcome, cleanup")

### Requirement: Evidence authenticity checks
The system SHALL flag suspicious evidence patterns for reviewer attention (duplicate photos across claims, timestamp mismatches, AI-generated images).

#### Scenario: Duplicate photo flagged
- **WHEN** reviewer views claim with photo matching another contribution's photo
- **THEN** system displays warning "Duplicate image detected in Contribution #123 - verify authenticity"

#### Scenario: Timestamp mismatch warning
- **WHEN** photo EXIF timestamp shows date different from activity date
- **THEN** system displays info banner "Photo taken 2 days before activity - may be incorrect evidence"

### Requirement: Reviewer notes
The system SHALL allow reviewers to add private notes visible to other reviewers and operator but not resident.

#### Scenario: Add reviewer note
- **WHEN** reviewer adds note "Organizer confirmed verbally - evidence sufficient despite incomplete photos"
- **THEN** system saves note visible only to reviewers and operator, not displayed to resident

### Requirement: Escalation path
The system SHALL allow reviewers to escalate unclear contributions to operator for final decision.

#### Scenario: Escalate ambiguous contribution
- **WHEN** reviewer clicks "Escalate to operator" with reason "Unclear if resident performed helper role or only attended"
- **THEN** system moves claim to operator review queue and notifies operator

### Requirement: Review audit log
The system SHALL maintain audit log of all reviewer actions (approvals, rejections, escalations) with timestamps and reasons.

#### Scenario: Audit log for contribution
- **WHEN** operator views contribution review history
- **THEN** system displays "Submitted 2026-09-12 14:30 | Reviewer assigned 14:31 | Reviewed by Jane Doe 2026-09-13 10:15 | Approved - 10 credits issued"

### Requirement: Contribution claim validation
The system SHALL validate that claimed activity exists, resident was registered, and activity is completed before allowing submission.

#### Scenario: Activity must be completed
- **WHEN** resident attempts to submit contribution for activity scheduled in future
- **THEN** system displays error "Cannot claim credits for future activity. Submit after activity ends."

#### Scenario: Registration verified
- **WHEN** resident attempts to claim contribution for activity they didn't register for
- **THEN** system displays error "You are not registered for this activity"
