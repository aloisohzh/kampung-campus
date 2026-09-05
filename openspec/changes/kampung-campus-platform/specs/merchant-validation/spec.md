## ADDED Requirements

### Requirement: Voucher validation interface
The system SHALL provide merchants a simple interface to scan/enter voucher codes and view voucher details for validation.

#### Scenario: Scan voucher QR code
- **WHEN** merchant scans resident's voucher QR code
- **THEN** system displays voucher value, resident name, expiry date, and validity status

#### Scenario: Manual code entry
- **WHEN** merchant manually enters voucher code (QR scan unavailable)
- **THEN** system looks up voucher and displays same validation details

#### Scenario: Invalid code handling
- **WHEN** merchant enters non-existent voucher code
- **THEN** system displays "Voucher not found. Please check code." with rejection indicator

### Requirement: Single-use validation
The system SHALL validate that voucher has not been previously redeemed before allowing merchant confirmation.

#### Scenario: Valid unredeemed voucher
- **WHEN** merchant scans voucher with redeemed_at=NULL and not expired
- **THEN** system displays green "Valid - Ready to redeem" with confirm button

#### Scenario: Already redeemed voucher
- **WHEN** merchant scans voucher with redeemed_at timestamp set
- **THEN** system displays red "Already redeemed on [date] at [merchant]" and disables confirm button

### Requirement: Atomic redemption confirmation
The system SHALL atomically mark voucher redeemed when merchant confirms, preventing race conditions.

#### Scenario: Confirm redemption
- **WHEN** merchant clicks "Confirm redemption" for valid voucher
- **THEN** system atomically sets redeemed_at=NOW(), redeemed_by_merchant_id=<merchant>, and displays "Redemption successful"

#### Scenario: Concurrent redemption prevention
- **WHEN** two merchants somehow scan same voucher and both click confirm simultaneously
- **THEN** database transaction ensures only first confirmation succeeds; second receives "Already redeemed" error

### Requirement: Duplicate prevention
The system SHALL prevent the same voucher from being redeemed more than once across all merchants.

#### Scenario: Cross-merchant duplicate blocked
- **WHEN** voucher redeemed at Merchant A, then resident presents same voucher at Merchant B
- **THEN** system displays "Already redeemed at Merchant A on [date]" to Merchant B

#### Scenario: Same-merchant duplicate blocked
- **WHEN** resident presents already-redeemed voucher at same merchant again
- **THEN** system displays "This voucher was already redeemed on [date]"

### Requirement: Expiry enforcement
The system SHALL reject vouchers presented after their expiry date.

#### Scenario: Expired voucher rejected
- **WHEN** merchant scans voucher past 30-day expiry
- **THEN** system displays "Voucher expired on [date]. Cannot redeem." and disables confirm button

#### Scenario: Valid voucher near expiry
- **WHEN** merchant scans voucher expiring tomorrow
- **THEN** system displays "Valid - expires tomorrow" with confirm button enabled

### Requirement: Redemption receipt
The system SHALL generate redemption confirmation for both merchant and resident records.

#### Scenario: Merchant receives confirmation
- **WHEN** merchant confirms voucher redemption
- **THEN** system displays confirmation screen with voucher value, resident name, timestamp, and confirmation number

#### Scenario: Resident notified of redemption
- **WHEN** voucher successfully redeemed by merchant
- **THEN** system updates resident's redemption history to "Redeemed at [merchant] on [date]" and sends notification

### Requirement: Merchant identity verification
The system SHALL display resident name to enable merchant identity verification and prevent voucher theft.

#### Scenario: Display resident name for verification
- **WHEN** merchant scans voucher
- **THEN** system displays "Voucher holder: [First Name L.]" prompting merchant to verify against resident ID if needed

### Requirement: Merchant transaction history
The system SHALL provide merchants a history of redeemed vouchers for their reconciliation.

#### Scenario: View merchant redemption history
- **WHEN** merchant views their transaction history
- **THEN** system displays list of redeemed vouchers with values, dates, and running total for settlement

#### Scenario: Daily redemption summary
- **WHEN** merchant views today's summary
- **THEN** system displays "Today: 5 vouchers redeemed, S$25 total value"

### Requirement: Merchant authentication
The system SHALL require merchant authentication before allowing voucher validation.

#### Scenario: Merchant login required
- **WHEN** unauthenticated user attempts to access merchant validation
- **THEN** system redirects to merchant login and blocks validation access

#### Scenario: Merchant-only permissions
- **WHEN** merchant attempts to access resident wallet or operator console
- **THEN** system displays "Access denied - merchant accounts can only validate vouchers"

### Requirement: Offline resilience
The system SHALL handle temporary connectivity issues gracefully during voucher validation.

#### Scenario: Connection lost during validation
- **WHEN** merchant loses internet during voucher scan
- **THEN** system displays "Connection lost - please retry" and does not mark voucher redeemed until confirmed online

### Requirement: Settlement tracking
The system SHALL track redeemed voucher values per merchant for operator settlement.

#### Scenario: Merchant balance accumulation
- **WHEN** merchant redeems 10 vouchers worth S$50 total
- **THEN** system accumulates merchant settlement balance to S$50 pending operator payment

#### Scenario: Settlement reset after payment
- **WHEN** operator marks merchant settlement paid
- **THEN** system resets merchant pending balance to S$0 and records settlement date

### Requirement: Voucher detail display
The system SHALL display complete voucher information for merchant reference during redemption.

#### Scenario: Full voucher details shown
- **WHEN** merchant scans voucher
- **THEN** system displays voucher value, reward name, issue date, expiry date, resident name, and any special conditions (minimum spend)

### Requirement: Minimum spend enforcement display
The system SHALL clearly display minimum spend requirements to merchant during validation.

#### Scenario: Minimum spend voucher validation
- **WHEN** merchant scans "S$10 off S$50 purchase" voucher
- **THEN** system displays "Requires minimum S$50 purchase before applying S$10 discount" prominently

### Requirement: Redemption reversal
The system SHALL allow merchant to reverse an accidental redemption within a short window with operator notification.

#### Scenario: Reverse accidental redemption
- **WHEN** merchant reverses redemption within 5 minutes of confirmation
- **THEN** system sets voucher back to valid state, notifies operator, and logs reversal reason
