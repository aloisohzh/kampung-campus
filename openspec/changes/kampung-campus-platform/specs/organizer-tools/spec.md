## ADDED Requirements

### Requirement: Activity proposal builder
The system SHALL provide form-based and voice-based interfaces for organizers to propose new activities with title, description, category, capacity, location, schedule, requirements, and deposit amount.

#### Scenario: Create activity via form
- **WHEN** organizer completes activity proposal form with all required fields
- **THEN** system creates draft proposal and routes to operator for approval

#### Scenario: Voice-based proposal
- **WHEN** organizer uses voice interface to describe activity "I want to organize a weekly study group for secondary students, Tuesdays 6-8pm, at community center"
- **THEN** system transcribes, suggests structured fields (title, category, schedule), and allows organizer to confirm or edit before submitting

#### Scenario: Required fields validation
- **WHEN** organizer attempts to submit proposal without capacity or date
- **THEN** system highlights missing required fields and prevents submission

### Requirement: Co-host recruitment
The system SHALL allow organizers to recruit co-hosts from community with role descriptions and responsibility sharing.

#### Scenario: Add co-host to activity
- **WHEN** organizer adds resident as co-host to "Study Sprint" with role "Materials coordinator"
- **THEN** system sends co-host invitation, and if accepted, displays both organizer and co-host on activity page

#### Scenario: Co-host accepts invitation
- **WHEN** invited co-host clicks "Accept" on invitation
- **THEN** system grants co-host permissions (mark attendance, submit evidence) and notifies organizer

#### Scenario: Co-host contribution tracking
- **WHEN** co-host delivers co-hosting responsibilities and activity completes
- **THEN** system allows co-host to submit 10-credit co-host contribution claim with organizer confirmation

### Requirement: Demand demonstration
The system SHALL display interest expression count and interested residents list to help organizers gauge demand before finalizing dates.

#### Scenario: View interest count
- **WHEN** organizer views their proposed activity dashboard
- **THEN** system displays "12 residents interested" with list of names and option to message interested group

#### Scenario: Interest threshold notification
- **WHEN** proposed activity reaches 10 interested residents (threshold)
- **THEN** system notifies organizer "Your activity reached interest threshold! Schedule dates to confirm."

### Requirement: Grant request submission
The system SHALL allow organizers to request grants in three tiers (Meet: S$0, Make: up to S$150, Grow: up to S$750) with justification and budget breakdown.

#### Scenario: Submit Make-tier grant request
- **WHEN** organizer requests S$120 grant for workshop materials with itemized budget (S$80 supplies, S$40 refreshments)
- **THEN** system creates grant request for operator review and displays "Under review" status

#### Scenario: Grant tier limits enforced
- **WHEN** organizer selects Make tier but requests S$200
- **THEN** system displays error "Make tier maximum is S$150. Select Grow tier or reduce budget."

#### Scenario: Meet tier no-grant confirmation
- **WHEN** organizer selects Meet tier (S$0 grant)
- **THEN** system displays "No funding requested - activity approved automatically" and skips grant review

### Requirement: Activity lifecycle management
The system SHALL allow organizers to edit proposals, cancel activities, reschedule, and mark activities complete.

#### Scenario: Edit pending proposal
- **WHEN** organizer edits activity description before operator approval
- **THEN** system updates proposal and resets to "Pending review" status

#### Scenario: Cancel activity with notice
- **WHEN** organizer cancels activity 48 hours before start time
- **THEN** system refunds all resident deposits, sends cancellation emails, and marks activity cancelled

#### Scenario: Late cancellation warning
- **WHEN** organizer attempts to cancel activity 6 hours before start
- **THEN** system displays warning "Late cancellation may forfeit deposits. Provide reason." and requires explanation

### Requirement: Attendance marking
The system SHALL allow organizers and co-hosts to mark resident attendance and assign contribution roles (Attended, Helper, Co-host).

#### Scenario: Mark attendance list
- **WHEN** organizer opens attendance sheet for completed activity with 15 registered residents
- **THEN** system displays checklist with each resident name and attendance status dropdown (Attended, No-show, Cancelled)

#### Scenario: Assign helper roles
- **WHEN** organizer marks 3 residents as "Helper" with task descriptions
- **THEN** system creates pre-filled contribution claims for those residents with helper role and organizer confirmation

#### Scenario: No-show handling
- **WHEN** organizer marks resident as "No-show" without cancellation
- **THEN** system forfeits resident's deposit and records no-show in resident profile for review

### Requirement: Delivery evidence submission
The system SHALL allow organizers to submit activity completion evidence (photos, attendance sheet, participant feedback summary) for operator records.

#### Scenario: Submit completion evidence
- **WHEN** organizer uploads 5 photos and participant feedback summary after activity
- **THEN** system attaches evidence to activity record and notifies operator of completion

#### Scenario: Grant reconciliation evidence
- **WHEN** organizer with S$150 Make grant submits receipts totaling S$142
- **THEN** system stores receipts for operator financial reconciliation and flags S$8 unspent

### Requirement: Activity templates
The system SHALL provide templates for common activity types (study groups, walks, workshops) to streamline proposal creation.

#### Scenario: Use study group template
- **WHEN** organizer selects "Study Group" template
- **THEN** system pre-fills typical capacity (10-15), duration (2 hours), requirements (bring materials), and deposit (2 credits)

### Requirement: Scheduling assistant
The system SHALL suggest optimal activity times based on community availability patterns and avoid conflicts with other activities.

#### Scenario: Suggest popular times
- **WHEN** organizer opens scheduling assistant
- **THEN** system displays "Most residents available: Weekday evenings 6-9pm, Saturday mornings 9am-12pm"

#### Scenario: Conflict warning
- **WHEN** organizer schedules activity at same time as popular existing activity
- **THEN** system displays warning "3 other activities scheduled at this time - may reduce attendance"

### Requirement: Participant communication
The system SHALL allow organizers to send announcements to registered residents and waitlist via platform messaging.

#### Scenario: Send activity update
- **WHEN** organizer sends message "Reminder: Bring laptop tomorrow!" to registered residents
- **THEN** system delivers message via in-platform notification and email to 12 registered residents

#### Scenario: Waitlist notification
- **WHEN** organizer increases activity capacity from 10 to 15
- **THEN** system automatically notifies first 5 waitlist residents of opening

### Requirement: Organizer activity dashboard
The system SHALL provide organizers dashboard showing their proposed, upcoming, completed activities, co-host invitations, and grant requests.

#### Scenario: View organizer dashboard
- **WHEN** organizer navigates to dashboard
- **THEN** system displays "2 upcoming activities | 5 completed | 1 pending proposal | 1 grant request under review"

### Requirement: Recurring activity setup
The system SHALL allow organizers to create recurring activity series with consistent schedule and auto-registration from previous sessions.

#### Scenario: Create weekly recurring activity
- **WHEN** organizer creates "Study Sprint" recurring weekly on Tuesdays for 6 weeks
- **THEN** system generates 6 separate activity instances and allows bulk registration from session 1 attendees

#### Scenario: Series modification
- **WHEN** organizer cancels week 3 of recurring series
- **THEN** system cancels only that instance, maintains other 5 sessions, and notifies affected residents

### Requirement: Safety planning checklist
The system SHALL require organizers to complete safety checklist for physical activities including emergency contact, first aid, supervision ratio, and risk assessment.

#### Scenario: Physical activity requires safety plan
- **WHEN** organizer proposes outdoor hiking activity
- **THEN** system displays required safety checklist and blocks submission until completed

#### Scenario: Low-risk activity skips checklist
- **WHEN** organizer proposes online study group
- **THEN** system skips safety checklist requirement

### Requirement: Grant spending reports
The system SHALL require organizers who receive grants to submit spending report with receipts showing actual expenditure.

#### Scenario: Submit grant report
- **WHEN** organizer with approved S$150 grant uploads receipts totaling S$148
- **THEN** system creates reconciliation record for operator review and marks grant "Pending closure"

#### Scenario: Overdue grant report flagged
- **WHEN** activity completed 14 days ago with grant but no spending report
- **THEN** system sends reminder to organizer and flags for operator attention

### Requirement: Activity duplication
The system SHALL allow organizers to duplicate successful activities to reduce re-entry effort.

#### Scenario: Duplicate past activity
- **WHEN** organizer clicks "Run again" on completed "Study Sprint" activity
- **THEN** system creates new proposal with same title, description, capacity, but clears date and registration
