## ADDED Requirements

### Requirement: First contribution tracking
The system SHALL track time from resident onboarding to first verified contribution.

#### Scenario: Track first contribution timing
- **WHEN** resident completes first verified contribution 8 days after onboarding
- **THEN** system records days_to_first_contribution=8 for the resident

#### Scenario: 14-day contribution metric
- **WHEN** operator views engagement metrics
- **THEN** system displays "% residents with first contribution within 14 days: 65% (65/100)"

### Requirement: Repeat contribution tracking
The system SHALL track residents who make repeat contributions within 60 days.

#### Scenario: Track repeat contribution
- **WHEN** resident makes second verified contribution 25 days after first
- **THEN** system records repeat_contribution=true with 25-day interval

#### Scenario: 60-day repeat metric
- **WHEN** operator views retention metrics
- **THEN** system displays "% residents with repeat contribution within 60 days: 45% (45/100)"

### Requirement: Role progression tracking
The system SHALL measure progression from attendee to helper, host, or mentor roles.

#### Scenario: Track role progression
- **WHEN** resident progresses from Participant to Helper role
- **THEN** system records progression event with timestamp and previous/new role

#### Scenario: Progression rate metric
- **WHEN** operator views progression metrics
- **THEN** system displays "Progression rates: Participant→Helper: 30% | Helper→Co-host: 15% | Co-host→Organizer: 8%"

### Requirement: Reward fulfillment metrics
The system SHALL track reward fulfillment reliability and time from redemption to voucher use.

#### Scenario: Track fulfillment time
- **WHEN** resident redeems voucher and uses at merchant 3 days later
- **THEN** system records fulfillment_time=3 days and fulfillment_success=true

#### Scenario: Fulfillment reliability metric
- **WHEN** operator views fulfillment metrics
- **THEN** system displays "Fulfillment reliability: 96% | Avg time to use: 4.2 days | Failed fulfillments: 2"

### Requirement: Post-redemption participation
The system SHALL track whether residents continue participating after redeeming rewards.

#### Scenario: Track post-redemption activity
- **WHEN** resident redeems reward then participates in another activity within 30 days
- **THEN** system records post_redemption_return=true

#### Scenario: Return rate metric
- **WHEN** operator views retention metrics
- **THEN** system displays "% residents active after redemption: 58%"

### Requirement: Cost per retained contributor
The system SHALL calculate cost per retained contributor combining rewards, grants, and operations.

#### Scenario: Calculate cost per contributor
- **WHEN** operator views cost metrics with 45 retained contributors and S$2,250 total spend
- **THEN** system displays "Cost per retained contributor: S$50"

#### Scenario: Cost breakdown
- **WHEN** operator views cost analysis
- **THEN** system displays breakdown: "Rewards: S$1,275 | Grants: S$420 | Ops: S$150 | Total: S$1,845 | Retained: 40 | Cost/contributor: S$46"

### Requirement: Participation gap analysis
The system SHALL measure participation and fulfillment gaps between resident groups (age, first-language, digital access).

#### Scenario: Track participation by group
- **WHEN** operator views equity metrics
- **THEN** system displays participation rates by group: "Seniors (60+): 40% | Adults: 65% | Youth: 70%" flagging significant gaps

#### Scenario: Fulfillment gap detection
- **WHEN** analysis shows assisted-access residents have lower redemption rate
- **THEN** system flags "Assisted-access residents redeem 30% less - review support adequacy"

### Requirement: Dispute and failure tracking
The system SHALL track disputes, failed redemptions, and unreconciled balances.

#### Scenario: Track disputes
- **WHEN** resident raises contribution dispute
- **THEN** system increments dispute counter and categorizes (contribution rejection, redemption failure, other)

#### Scenario: Disputes dashboard
- **WHEN** operator views dispute metrics
- **THEN** system displays "Total disputes: 8 | Resolved: 6 | Pending: 2 | Failed redemptions: 3 | Unreconciled balances: 0"

### Requirement: Journey funnel analytics
The system SHALL provide funnel visualization of resident journey stages with dropout analysis.

#### Scenario: View journey funnel
- **WHEN** operator views journey analytics
- **THEN** system displays funnel: "Discover: 100 | Commit: 85 | Contribute: 70 | Verify: 68 | Earn: 68 | Redeem: 45 | Return: 30"

#### Scenario: Identify dropout points
- **WHEN** operator analyzes funnel
- **THEN** system highlights largest dropout stage "Biggest dropout: Earn→Redeem (34% don't redeem earned credits)"

### Requirement: Unused credits analysis
The system SHALL identify residents with unredeemed earned credits to inform discovery/support interventions.

#### Scenario: Identify unused credits
- **WHEN** operator views unused credit report
- **THEN** system displays "23 residents have earned credits but never redeemed - total 850 credits unredeemed"

#### Scenario: Unused credit categorization
- **WHEN** operator analyzes unused credits
- **THEN** system suggests possible causes: "Discovery gap (never viewed catalogue): 8 | Insufficient balance for desired reward: 10 | Booking friction: 5"

### Requirement: Referral vs attendance distinction
The system SHALL measure external program engagement distinguishing referrals, bookings, and confirmed attendance.

#### Scenario: Distinguish engagement levels
- **WHEN** operator views partner engagement metrics
- **THEN** system displays distinct counts "Referral clicks: 45 | Bookings: 12 | Confirmed attendance: 8" without conflating

#### Scenario: Avoid false causation
- **WHEN** report generated for external programs
- **THEN** system notes "Referral clicks do not prove increased participation - attendance confirmation required"

### Requirement: Late participant follow-up
The system SHALL flag late pilot participants requiring post-pilot follow-up for 60-day retention measurement.

#### Scenario: Flag late joiners
- **WHEN** resident joins in pilot week 7
- **THEN** system flags for follow-up "60-day window extends past pilot end - schedule follow-up"

#### Scenario: Retention window tracking
- **WHEN** operator views retention tracking
- **THEN** system displays "12 residents joined weeks 7-8 - 60-day retention data available by [date]"

### Requirement: Metrics export
The system SHALL export all pilot metrics as structured reports for evaluation and stakeholder reporting.

#### Scenario: Export pilot metrics report
- **WHEN** operator exports comprehensive metrics report
- **THEN** system generates report with all 12 metric categories, time series data, and equity breakdowns

### Requirement: Baseline comparison support
The system SHALL support comparison against baseline or phased introduction to avoid presenting simple before-after as causal.

#### Scenario: Phased comparison
- **WHEN** operator configures phased introduction (Group A week 1, Group B week 4)
- **THEN** system tracks groups separately for comparison

#### Scenario: Causation caveat
- **WHEN** metrics report generated
- **THEN** system includes note "Results are observational. Avoid presenting before-after differences as causal proof without controls."

### Requirement: Real-time metrics dashboard
The system SHALL provide operator real-time dashboard of key pilot metrics for ongoing monitoring.

#### Scenario: View live metrics
- **WHEN** operator opens metrics dashboard
- **THEN** system displays live counts of active residents, contributions today, redemptions, queue depth, and budget utilization

### Requirement: Weekly evaluation snapshots
The system SHALL capture weekly metric snapshots for trend analysis across the 8-week pilot.

#### Scenario: Weekly snapshot capture
- **WHEN** each pilot week concludes
- **THEN** system captures snapshot of all metrics for time-series trend analysis

#### Scenario: Trend visualization
- **WHEN** operator views trends
- **THEN** system displays week-over-week charts for contributions, redemptions, and active residents
