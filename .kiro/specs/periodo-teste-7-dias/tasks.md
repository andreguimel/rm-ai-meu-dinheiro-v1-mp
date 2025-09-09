# Implementation Plan

## Phase 1: Core Trial Infrastructure

- [x] 1. Enhance database schema and functions for trial management

  - Create enhanced trial status calculation function in SQL
  - Add computed column for trial_active status
  - Create comprehensive user access status function
  - _Requirements: 1.1, 4.1, 4.3_

- [x] 2. Update start-trial Edge Function for automatic trial creation

  - Modify start-trial function to handle first-time user detection
  - Add logic to prevent duplicate trials for existing users
  - Implement proper error handling and logging
  - _Requirements: 1.1, 1.2, 5.1, 5.3_

- [x] 3. Enhance check-mercadopago-subscription Edge Function for trial integration

  - Integrate trial status checking with subscription verification
  - Add trial_active and trial_days_remaining to response
  - Implement access_level calculation (none/trial/premium)
  - Update caching logic to include trial data
  - _Requirements: 4.1, 4.2, 6.1, 6.2_

- [x] 4. Update useSubscription hook to handle trial data

  - Add trial-specific fields to SubscriptionData interface
  - Implement effective_subscription calculation (trial OR paid)
  - Add automatic trial creation check for new users
  - Update error handling for trial-related failures
  - _Requirements: 2.1, 4.1, 6.1_

- [x] 5. Enhance SubscriptionGuard component for trial access control

  - Update access logic to consider active trials as valid access
  - Implement hierarchical access checking (admin > paid > trial > none)
  - Add proper loading states during trial verification
  - _Requirements: 1.3, 3.1, 4.2, 6.2_

- [x] 6. Create TrialStatusBanner component for trial period display

  - Build banner component to show trial status and days remaining
  - Implement color-coded alerts based on days remaining (green/yellow/red)
  - Add upgrade button integration with existing checkout flow
  - Create responsive design for mobile and desktop
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Integrate TrialStatusBanner into Dashboard and main pages

  - Add TrialStatusBanner to Dashboard page layout
  - Conditionally show banner only for users with active trials
  - Ensure banner doesn't interfere with existing UI elements
  - _Requirements: 2.1, 2.4_

- [x] 8. Implement trial expiration handling and upgrade flow

  - Add modal component for trial expiration notification
  - Integrate expired trial detection with SubscriptionGuard
  - Create smooth transition from trial to subscription flow
  - Add fallback access for basic features when trial expires
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 9. Add automatic trial creation for new users

  - Integrate trial creation check in ProtectedRoute or useAuth hook
  - Implement first-login detection logic
  - Add error handling for trial creation failures
  - Ensure trial creation doesn't interfere with existing user flow
  - _Requirements: 1.1, 5.1, 6.3_

- [x] 10. Create comprehensive tests for trial functionality

  - Write unit tests for trial calculation functions
  - Create integration tests for trial creation and verification flow
  - Add frontend tests for TrialStatusBanner and SubscriptionGuard
  - Test edge cases like expired trials and subscription upgrades
  - _Requirements: 4.4, 6.4_

- [x] 11. Update existing components to handle trial states

  - Review and update any hardcoded subscription checks
  - Ensure all premium features work correctly with trial access
  - Update loading states and error messages to include trial context
  - _Requirements: 6.1, 6.2_

- [x] 12. Implement trial analytics and monitoring

  - Add logging for trial creation, usage, and conversion events
  - Create database queries for trial analytics
  - Implement monitoring for trial-related errors
  - _Requirements: 4.4_
