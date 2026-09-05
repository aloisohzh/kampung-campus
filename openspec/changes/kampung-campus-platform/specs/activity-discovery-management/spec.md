## ADDED Requirements

### Requirement: Browse activities by category
The system SHALL display activities organized by category (interest groups, workshops, missions, social gatherings).

#### Scenario: View activities in category
- **WHEN** resident selects a category from the browse page
- **THEN** system displays all active activities in that category with title, date, location, and available spots

### Requirement: Search activities
The system SHALL allow residents to search activities by keywords, location, date range, and category.

#### Scenario: Keyword search returns matching activities
- **WHEN** resident enters search term "study" in the search field
- **THEN** system displays activities with "study" in title, description, or tags

#### Scenario: No results shows helpful message
- **WHEN** resident searches for term with no matching activities
- **THEN** system displays "No activities found" with suggestion to check back later or propose an activity

### Requirement: View activity details
The system SHALL display full activity details including description, organizer, date/time, location, requirements, capacity, waitlist status, and commitment deposit.

#### Scenario: View complete activity information
- **WHEN** resident clicks on an activity card
- **THEN** system displays detail page with all activity information, organizer profile link, and join/waitlist button

### Requirement: Commitment deposit reservation
The system SHALL reserve starter credits as refundable commitment deposit when resident commits to attend an activity.

#### Scenario: Reserve deposit on commitment
- **WHEN** resident with 50 starter credits commits to activity requiring 2-credit deposit
- **THEN** system reserves 2 starter credits (48 available, 2 reserved) and confirms reservation

#### Scenario: Insufficient starter credits blocks commitment
- **WHEN** resident with 1 starter credit attempts to commit to activity requiring 2-credit deposit
- **THEN** system displays error "Insufficient starter credits. Need 2, have 1" and blocks commitment

### Requirement: Refund deposit on attendance
The system SHALL return commitment deposit to available balance when resident attends activity.

#### Scenario: Attended activity refunds deposit
- **WHEN** organizer marks resident as attended for activity with 2-credit deposit
- **THEN** system returns 2 credits to available starter balance

### Requirement: Refund deposit on timely cancellation
The system SHALL return commitment deposit when resident cancels within the published cancellation period.

#### Scenario: Early cancellation refunds deposit
- **WHEN** resident cancels 48 hours before activity with 24-hour cancellation deadline
- **THEN** system returns 2-credit deposit to available starter balance immediately

#### Scenario: Late cancellation forfeits deposit
- **WHEN** resident cancels 12 hours before activity with 24-hour cancellation deadline
- **THEN** system forfeits 2-credit deposit (not returned) and displays forfeit reason

### Requirement: Refund deposit on organizer cancellation
The system SHALL return commitment deposit when organizer cancels the activity.

#### Scenario: Organizer cancellation refunds all deposits
- **WHEN** organizer cancels activity with 10 committed residents
- **THEN** system refunds deposits to all 10 residents and sends cancellation notification

### Requirement: Waitlist management
The system SHALL allow residents to join waitlist when activity is at capacity and automatically notify when spots open.

#### Scenario: Join waitlist for full activity
- **WHEN** resident attempts to join activity at full capacity (20/20)
- **THEN** system offers waitlist option without deposit reservation

#### Scenario: Waitlist promotion when spot opens
- **WHEN** committed resident cancels activity with 5 residents on waitlist
- **THEN** system notifies first waitlist resident and gives 24-hour window to commit with deposit

### Requirement: Activity lifecycle tracking
The system SHALL track activity status through lifecycle: Proposed → Approved → Open → Full → In Progress → Completed → Cancelled.

#### Scenario: Activity progresses through lifecycle
- **WHEN** organizer proposes activity and operator approves it
- **THEN** system sets status to "Open" and makes visible to residents

#### Scenario: Activity auto-completes after end time
- **WHEN** activity end time passes and status is "In Progress"
- **THEN** system automatically sets status to "Completed" and prompts organizer to mark attendance

### Requirement: Interest groups
The system SHALL allow residents to express interest in proposed activities before they're scheduled to demonstrate demand.

#### Scenario: Express interest in proposal
- **WHEN** resident clicks "I'm interested" on proposed activity
- **THEN** system increments interest count and notifies organizer

#### Scenario: Interest threshold triggers scheduling
- **WHEN** proposed activity reaches 10 interest expressions
- **THEN** system notifies organizer to schedule dates and sends notification to interested residents

### Requirement: Sponsored missions
The system SHALL display sponsored missions with special credit bonuses and clear completion criteria.

#### Scenario: Browse active missions
- **WHEN** resident visits missions page
- **THEN** system displays all active missions with bonus credits, sponsor, criteria, and deadline

#### Scenario: Mission completion awards bonus
- **WHEN** resident completes activity tagged as mission and reviewer verifies
- **THEN** system awards base activity credits plus mission bonus (max 10 additional)
