# Requirements Document: Super Admin Management System

## Introduction

The Super Admin Management System provides comprehensive tools for managing administrative users, securing initial setup, and enhancing the admin dashboard for the UrbanNEST real estate platform. The system addresses the critical need for secure admin account creation, role-based access control, audit logging, and an intuitive management interface. This feature enables secure bootstrap of the first admin user and provides ongoing admin user lifecycle management capabilities.

## Glossary

- **System**: The Super Admin Management System component of UrbanNEST
- **Setup_Script**: A one-time executable script for creating the first admin user
- **Admin_User**: A user with role 'admin' and elevated platform privileges
- **Super_Admin**: The first or primary admin user with highest privileges
- **Admin_Dashboard**: The web interface for administrative operations
- **Auth_Service**: The authentication and authorization service
- **Admin_Controller**: Backend controller handling admin management operations
- **Audit_Log**: A persistent record of all administrative actions
- **Session**: An authenticated user connection with timeout management
- **Password_Policy**: Rules governing password strength requirements
- **Role**: User access level (seeker, owner, agent, admin)
- **Two_Factor_Auth**: Optional secondary authentication mechanism
- **Activity_Record**: A single logged administrative action
- **Admin_Routes**: Protected API endpoints for admin operations
- **Environment_Config**: Configuration values stored in .env file
- **Prisma_Client**: Database ORM client for data operations
- **JWT_Token**: JSON Web Token for authentication
- **Permission_Check**: Middleware validation of user authorization
- **Strong_Password**: A password meeting minimum security requirements (8+ chars, uppercase, lowercase, number, special character)

## Requirements

### Requirement 1: Secure Initial Admin Creation

**User Story:** As a platform administrator, I want to securely create the first admin user through a one-time setup process, so that I can bootstrap the admin system without security vulnerabilities.

#### Acceptance Criteria

1. THE Setup_Script SHALL read admin credentials from Environment_Config variables (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_PHONE)
2. WHEN the Setup_Script is executed, THE System SHALL check if any Admin_User already exists in the database
3. IF an Admin_User already exists, THEN THE Setup_Script SHALL terminate with an error message and exit code 1
4. WHEN creating the first Admin_User, THE System SHALL validate that the password meets Strong_Password requirements
5. WHEN creating the first Admin_User, THE System SHALL validate that the email is a valid email format
6. WHEN creating the first Admin_User, THE System SHALL validate that the phone number contains only digits and optional + prefix
7. WHEN the password validation succeeds, THE System SHALL hash the password using bcrypt with salt rounds >= 10
8. WHEN all validations pass, THE Setup_Script SHALL create an Admin_User record with is_verified=true, verification_status='approved', role='admin', and is_active=true
9. WHEN the Admin_User creation succeeds, THE Setup_Script SHALL log a success message and exit with code 0
10. IF any validation fails, THEN THE Setup_Script SHALL log the specific validation error and exit with code 1

### Requirement 2: Admin User Creation from Dashboard

**User Story:** As a Super_Admin, I want to create additional admin users from the Admin_Dashboard, so that I can delegate administrative responsibilities to trusted team members.

#### Acceptance Criteria

1. WHEN an authenticated Admin_User accesses the admin management section, THE Admin_Dashboard SHALL display a "Create Admin" form
2. THE Admin_Dashboard SHALL require input fields for email, phone, password, first_name, and last_name
3. WHEN the Admin_User submits the create form, THE System SHALL validate that the password meets Strong_Password requirements
4. WHEN the Admin_User submits the create form, THE System SHALL validate that the email is unique in the database
5. WHEN the Admin_User submits the create form, THE System SHALL validate that the phone is unique in the database
6. WHEN all validations pass, THE Admin_Controller SHALL hash the password using bcrypt
7. WHEN the password is hashed, THE Admin_Controller SHALL create an Admin_User record with role='admin', is_verified=true, is_active=true
8. WHEN the Admin_User creation succeeds, THE System SHALL log the action to Audit_Log with the creator's ID and timestamp
9. WHEN the Admin_User creation succeeds, THE System SHALL return a success response with the new admin's basic information (excluding password_hash)
10. IF any validation fails, THEN THE System SHALL return an error response with the specific validation message

### Requirement 3: Admin Credential Management

**User Story:** As a Super_Admin, I want to securely update admin user credentials, so that I can maintain account security and respond to security incidents.

#### Acceptance Criteria

1. WHEN an authenticated Admin_User requests to update another admin's password, THE Admin_Controller SHALL verify the requesting user has admin role
2. WHEN updating a password, THE System SHALL validate that the new password meets Strong_Password requirements
3. WHEN the new password validation passes, THE System SHALL hash the password using bcrypt
4. WHEN the password is hashed, THE Admin_Controller SHALL update the target Admin_User's password_hash field
5. WHEN the password update succeeds, THE System SHALL log the action to Audit_Log with admin ID, target user ID, action type, and timestamp
6. WHEN an Admin_User updates their own password, THE System SHALL require the current password for verification
7. WHEN verifying current password, THE System SHALL compare the provided password against the stored password_hash using bcrypt
8. IF the current password verification fails, THEN THE System SHALL return an error response and not update the password
9. WHEN updating admin email or phone, THE System SHALL validate uniqueness across all users
10. WHEN any credential update succeeds, THE System SHALL return a success response with updated user information (excluding password_hash)

### Requirement 4: Admin Account Lifecycle Management

**User Story:** As a Super_Admin, I want to deactivate and reactivate admin accounts, so that I can control access without permanently deleting accounts.

#### Acceptance Criteria

1. WHEN an authenticated Admin_User requests to deactivate another Admin_User, THE Admin_Controller SHALL verify the requesting user has admin role
2. WHEN deactivating an Admin_User, THE System SHALL check that the target is not the requesting user (prevent self-deactivation)
3. IF the target Admin_User is the requesting user, THEN THE System SHALL return an error response with message "Cannot deactivate your own account"
4. WHEN the self-deactivation check passes, THE Admin_Controller SHALL set the target Admin_User's is_active field to false
5. WHEN the deactivation succeeds, THE System SHALL log the action to Audit_Log with admin ID, target user ID, and timestamp
6. WHEN an Admin_User requests to reactivate a deactivated Admin_User, THE Admin_Controller SHALL set the target Admin_User's is_active field to true
7. WHEN the reactivation succeeds, THE System SHALL log the action to Audit_Log
8. WHEN a deactivated Admin_User attempts to authenticate, THE Auth_Service SHALL return an error response with message "Account is deactivated"
9. THE System SHALL display active and inactive admin status in the admin management interface
10. WHEN listing admin users, THE Admin_Dashboard SHALL allow filtering by active/inactive status

### Requirement 5: Admin Activity Audit Logging

**User Story:** As a Super_Admin, I want to view comprehensive audit logs of all admin actions, so that I can track system changes and investigate security incidents.

#### Acceptance Criteria

1. WHEN an Admin_User performs any admin action (create, update, deactivate, approve, reject), THE System SHALL create an Activity_Record in Audit_Log
2. THE Activity_Record SHALL include admin_id, action_type, target_resource, target_id, ip_address, user_agent, timestamp, and optional metadata JSON
3. WHEN an Admin_User accesses the audit log section, THE Admin_Dashboard SHALL display Activity_Record entries in reverse chronological order
4. THE Admin_Dashboard SHALL allow filtering Activity_Record entries by admin_id, action_type, date range, and target_resource
5. THE Admin_Dashboard SHALL allow searching Activity_Record entries by target_id or metadata content
6. WHEN displaying Activity_Record entries, THE Admin_Dashboard SHALL show admin name, action description, target resource, timestamp, and IP address
7. THE Admin_Dashboard SHALL support pagination of Activity_Record entries with configurable page size (default 50)
8. WHEN an Admin_User requests Activity_Record details, THE Admin_Dashboard SHALL display full metadata JSON in readable format
9. THE System SHALL retain Activity_Record entries for a minimum of 365 days
10. THE Admin_Dashboard SHALL allow exporting Activity_Record entries to CSV format

### Requirement 6: Admin Session Management

**User Story:** As a Super_Admin, I want admin sessions to timeout after inactivity, so that unattended sessions do not pose security risks.

#### Acceptance Criteria

1. WHEN an Admin_User authenticates successfully, THE Auth_Service SHALL create a Session with expiration time of 4 hours
2. WHEN an Admin_User performs any action, THE System SHALL update the Session's last_activity timestamp
3. WHEN an Admin_User makes a request with an expired Session, THE System SHALL return a 401 error response with message "Session expired"
4. WHEN a Session expires, THE Admin_Dashboard SHALL redirect the user to the login page
5. THE Admin_Dashboard SHALL display a warning message 5 minutes before Session expiration
6. WHEN an Admin_User clicks "Extend Session" on the warning, THE System SHALL refresh the Session expiration time
7. WHEN an Admin_User logs out, THE System SHALL invalidate the Session immediately
8. THE System SHALL store active Session information in JWT_Token with secure, httpOnly cookies
9. WHEN generating JWT_Token for Admin_User, THE Auth_Service SHALL include role='admin' in the token payload
10. THE System SHALL validate JWT_Token signature and expiration on every admin route request

### Requirement 7: Password Security Requirements

**User Story:** As a security-conscious administrator, I want the system to enforce strong password policies for all admin accounts, so that admin credentials are resistant to common attacks.

#### Acceptance Criteria

1. THE System SHALL define Strong_Password as minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character
2. WHEN an Admin_User or Setup_Script provides a password, THE System SHALL validate against Strong_Password requirements
3. IF the password is shorter than 8 characters, THEN THE System SHALL return error "Password must be at least 8 characters"
4. IF the password lacks an uppercase letter, THEN THE System SHALL return error "Password must contain at least one uppercase letter"
5. IF the password lacks a lowercase letter, THEN THE System SHALL return error "Password must contain at least one lowercase letter"
6. IF the password lacks a number, THEN THE System SHALL return error "Password must contain at least one number"
7. IF the password lacks a special character, THEN THE System SHALL return error "Password must contain at least one special character (!@#$%^&*)"
8. THE System SHALL hash all passwords using bcrypt with salt rounds of 10 or higher
9. THE System SHALL never log or return password_hash values in API responses
10. WHEN storing Admin_User records, THE System SHALL ensure password_hash field is never null

### Requirement 8: Admin Dashboard Enhancement - System Metrics

**User Story:** As an Admin_User, I want to see comprehensive system metrics on the dashboard, so that I can monitor platform health and user activity.

#### Acceptance Criteria

1. WHEN an Admin_User accesses the Admin_Dashboard overview, THE System SHALL display total user count grouped by Role
2. THE Admin_Dashboard SHALL display count of users with verification_status='pending_review' grouped by Role
3. THE Admin_Dashboard SHALL display count of active properties (deleted_at is null) grouped by PropertyStatus
4. THE Admin_Dashboard SHALL display total listing fee revenue (sum of completed payments)
5. THE Admin_Dashboard SHALL display count of pending bookings (BookingStatus='PENDING')
6. THE Admin_Dashboard SHALL display count of active admin users (role='admin' AND is_active=true)
7. THE Admin_Dashboard SHALL refresh metrics automatically every 60 seconds
8. WHEN metrics fail to load, THE Admin_Dashboard SHALL display cached values with a staleness indicator
9. THE Admin_Dashboard SHALL display metrics using visual charts (bar, line, or pie) for easy comprehension
10. WHEN an Admin_User clicks a metric, THE Admin_Dashboard SHALL navigate to the detailed view for that metric category

### Requirement 9: Admin Dashboard Enhancement - User Management

**User Story:** As an Admin_User, I want comprehensive user management capabilities, so that I can manage all platform users from a single interface.

#### Acceptance Criteria

1. WHEN an Admin_User accesses the user management section, THE Admin_Dashboard SHALL display a paginated list of all users
2. THE Admin_Dashboard SHALL allow filtering users by Role, verification_status, and is_active status
3. THE Admin_Dashboard SHALL allow searching users by email, phone, first_name, or last_name
4. WHEN an Admin_User clicks on a user row, THE Admin_Dashboard SHALL display detailed user information including all profile fields
5. THE Admin_Dashboard SHALL allow updating user verification_status (approve/reject with reason)
6. THE Admin_Dashboard SHALL allow toggling user is_active status (activate/deactivate)
7. WHEN an Admin_User deactivates a user, THE System SHALL set is_active=false and log the action to Audit_Log
8. WHEN an Admin_User activates a user, THE System SHALL set is_active=true and log the action to Audit_Log
9. THE Admin_Dashboard SHALL display user statistics: total properties, total bookings, account creation date, last_login
10. THE Admin_Dashboard SHALL allow exporting filtered user lists to CSV format

### Requirement 10: Admin Dashboard Enhancement - Listing Management

**User Story:** As an Admin_User, I want advanced listing management tools, so that I can efficiently review and moderate property listings.

#### Acceptance Criteria

1. WHEN an Admin_User accesses the listing management section, THE Admin_Dashboard SHALL display properties with status='pending' and listing_fee_paid=true
2. THE Admin_Dashboard SHALL allow filtering properties by PropertyStatus, PropertyType, and Purpose
3. THE Admin_Dashboard SHALL display property thumbnail, title, owner name, creation date, and current status
4. WHEN an Admin_User clicks on a property, THE Admin_Dashboard SHALL display full property details including all photos, location, and amenities
5. WHEN an Admin_User approves a listing, THE Admin_Controller SHALL set status='available' and listing_rejection_reason=null
6. WHEN an Admin_User rejects a listing, THE Admin_Dashboard SHALL require a rejection reason with minimum 10 characters
7. WHEN the rejection reason is provided, THE Admin_Controller SHALL set status='withdrawn' and listing_rejection_reason to the provided text
8. WHEN a listing is approved or rejected, THE System SHALL log the action to Audit_Log with admin_id, property_id, action, and reason
9. THE Admin_Dashboard SHALL allow bulk approval of multiple listings with a single action
10. WHEN bulk approving, THE System SHALL validate that all selected listings have listing_fee_paid=true

### Requirement 11: Admin Dashboard Enhancement - Payment Reconciliation

**User Story:** As an Admin_User, I want detailed payment tracking and reconciliation tools, so that I can manage financial transactions and resolve payment issues.

#### Acceptance Criteria

1. WHEN an Admin_User accesses the payment management section, THE Admin_Dashboard SHALL display all ListingFeePayment records
2. THE Admin_Dashboard SHALL allow filtering payments by status (PENDING, PROCESSING, COMPLETED, FAILED)
3. THE Admin_Dashboard SHALL allow filtering payments by date range
4. THE Admin_Dashboard SHALL display payment amount, currency, status, payment method, user name, property title, and timestamp
5. WHEN an Admin_User clicks on a payment, THE Admin_Dashboard SHALL display full payment details including transaction reference and metadata
6. THE Admin_Dashboard SHALL display total revenue sum grouped by status and date range
7. THE Admin_Dashboard SHALL display payment success rate percentage (COMPLETED / total)
8. THE Admin_Dashboard SHALL allow exporting payment records to CSV format with all fields
9. WHEN a payment status is FAILED, THE Admin_Dashboard SHALL display the failure reason if available
10. THE Admin_Dashboard SHALL allow Admin_User to manually mark a payment as COMPLETED with audit log entry and confirmation dialog

### Requirement 12: Role-Based Access Control Enforcement

**User Story:** As a security architect, I want strict role-based access control on all admin routes, so that only authenticated admin users can access administrative functions.

#### Acceptance Criteria

1. WHEN a request is made to any Admin_Routes endpoint, THE System SHALL verify the JWT_Token is valid and not expired
2. WHEN the JWT_Token is valid, THE System SHALL verify that the token payload includes role='admin'
3. IF the JWT_Token is missing, THEN THE System SHALL return 401 error with message "Access denied. No token provided."
4. IF the JWT_Token is expired, THEN THE System SHALL return 401 error with message "Token has expired. Please login again."
5. IF the role is not 'admin', THEN THE System SHALL return 403 error with message "Access denied. Admin role required."
6. WHEN the Admin_User is authenticated and authorized, THE Admin_Routes SHALL execute the requested controller action
7. THE System SHALL load complete Admin_User data from database on each request to ensure is_active status is current
8. IF the Admin_User is_active=false, THEN THE System SHALL return 403 error with message "Account is deactivated"
9. THE System SHALL pass the authenticated Admin_User object to all controller methods via req.user
10. THE Admin_Routes SHALL use the authMiddleware.verifyToken and authMiddleware.checkRole(['admin']) middleware chain

### Requirement 13: Two-Factor Authentication Setup

**User Story:** As a security-conscious Admin_User, I want to enable two-factor authentication on my account, so that my admin access requires both password and device verification.

#### Acceptance Criteria

1. WHERE Two_Factor_Auth is enabled, WHEN an Admin_User accesses account security settings, THE Admin_Dashboard SHALL display a "Enable 2FA" button
2. WHEN an Admin_User clicks "Enable 2FA", THE System SHALL generate a unique TOTP secret for the Admin_User
3. WHEN the TOTP secret is generated, THE Admin_Dashboard SHALL display a QR code for scanning with an authenticator app
4. WHEN the QR code is displayed, THE Admin_Dashboard SHALL require the Admin_User to enter a verification code from their authenticator app
5. WHEN the verification code is correct, THE System SHALL store the TOTP secret (encrypted) in the Admin_User record and set two_factor_enabled=true
6. WHERE Two_Factor_Auth is enabled for an Admin_User, WHEN the Admin_User logs in with valid credentials, THE System SHALL prompt for a 6-digit TOTP code
7. WHEN the TOTP code is provided, THE System SHALL verify it matches the current time-based token for the stored secret
8. IF the TOTP code is invalid, THEN THE System SHALL return error "Invalid authentication code" and not create a Session
9. WHEN the TOTP code is valid, THE Auth_Service SHALL create a Session and return JWT_Token
10. THE Admin_Dashboard SHALL allow Admin_User to disable Two_Factor_Auth with password confirmation

### Requirement 14: Prevent Accidental Data Deletion

**User Story:** As an Admin_User, I want safeguards against accidental data deletion, so that critical platform data is protected from human error.

#### Acceptance Criteria

1. WHEN an Admin_User attempts to delete a user account, THE Admin_Dashboard SHALL display a confirmation dialog with account details
2. THE confirmation dialog SHALL require typing "DELETE" in all caps to confirm the action
3. WHEN an Admin_User confirms deletion, THE System SHALL perform soft delete (set deleted_at timestamp) instead of hard delete
4. THE System SHALL never permanently delete Admin_User, Property, or User records from the database
5. WHEN an Admin_User attempts to delete multiple records via bulk action, THE Admin_Dashboard SHALL display count and require explicit confirmation
6. THE Admin_Dashboard SHALL highlight destructive actions (delete, deactivate) in red color
7. WHEN a user account is soft deleted, THE System SHALL set is_active=false and deleted_at=current_timestamp
8. THE Admin_Dashboard SHALL provide a "Restore" function for soft-deleted records within 30 days
9. WHEN restoring a soft-deleted record, THE System SHALL set deleted_at=null and is_active=true
10. THE System SHALL log all deletion and restoration actions to Audit_Log with full details

### Requirement 15: Admin Dashboard Search and Filter

**User Story:** As an Admin_User, I want powerful search and filter capabilities across all admin sections, so that I can quickly find specific records.

#### Acceptance Criteria

1. WHEN an Admin_User enters text in the search box, THE Admin_Dashboard SHALL search across all relevant text fields for the current section
2. THE Admin_Dashboard SHALL perform case-insensitive partial matching for search queries
3. THE Admin_Dashboard SHALL debounce search input with 300ms delay to reduce API calls
4. WHEN search results are displayed, THE Admin_Dashboard SHALL highlight matching text in the results
5. THE Admin_Dashboard SHALL allow combining multiple filters (AND logic)
6. THE Admin_Dashboard SHALL display active filter tags that can be clicked to remove individual filters
7. THE Admin_Dashboard SHALL include a "Clear All Filters" button when any filter is active
8. THE Admin_Dashboard SHALL persist filter and search state in URL query parameters
9. WHEN an Admin_User shares a URL with filters, THE Admin_Dashboard SHALL apply those filters on page load
10. THE Admin_Dashboard SHALL display result count for current search and filter combination

### Requirement 16: Bulk Actions Support

**User Story:** As an Admin_User, I want to perform actions on multiple records simultaneously, so that I can efficiently manage large datasets.

#### Acceptance Criteria

1. WHEN an Admin_User is viewing a list (users, listings, payments), THE Admin_Dashboard SHALL display checkboxes for each row
2. THE Admin_Dashboard SHALL display a "Select All" checkbox in the table header
3. WHEN checkboxes are selected, THE Admin_Dashboard SHALL display a bulk action toolbar with available actions
4. THE Admin_Dashboard SHALL display the count of selected items in the bulk action toolbar
5. WHEN an Admin_User clicks "Approve All" in bulk toolbar, THE System SHALL approve all selected listings
6. WHEN an Admin_User clicks "Deactivate All" in bulk toolbar, THE System SHALL deactivate all selected users
7. WHEN performing bulk actions, THE Admin_Dashboard SHALL display a progress indicator showing X of Y processed
8. IF any individual action fails during bulk operation, THE System SHALL continue processing remaining items
9. WHEN bulk operation completes, THE Admin_Dashboard SHALL display a summary: X succeeded, Y failed with error details
10. THE System SHALL log each individual action in bulk operation to Audit_Log

### Requirement 17: Data Export Capabilities

**User Story:** As an Admin_User, I want to export data to CSV format, so that I can analyze data in external tools and create reports.

#### Acceptance Criteria

1. WHEN an Admin_User clicks "Export to CSV" button, THE System SHALL generate a CSV file with all records matching current filters
2. THE CSV file SHALL include column headers with human-readable names
3. THE CSV file SHALL respect the current sort order of the table
4. WHEN exporting users, THE System SHALL exclude password_hash field from the CSV
5. WHEN exporting payments, THE System SHALL include all payment details including metadata
6. THE System SHALL limit CSV exports to 10,000 records per file for performance
7. IF the result set exceeds 10,000 records, THEN THE Admin_Dashboard SHALL display a warning and prompt to refine filters
8. THE CSV file SHALL use UTF-8 encoding to support international characters
9. THE System SHALL sanitize CSV data to prevent formula injection attacks (prefix =, +, -, @ with single quote)
10. WHEN CSV generation completes, THE System SHALL trigger browser download with filename including timestamp

### Requirement 18: Mobile-Responsive Admin Interface

**User Story:** As an Admin_User, I want the Admin_Dashboard to work well on mobile devices, so that I can perform urgent admin tasks while away from my desk.

#### Acceptance Criteria

1. WHEN the Admin_Dashboard is accessed on a screen width < 768px, THE System SHALL display a mobile-optimized layout
2. THE Admin_Dashboard SHALL use a collapsible sidebar menu on mobile devices
3. THE Admin_Dashboard SHALL display data tables with horizontal scrolling on mobile devices
4. THE Admin_Dashboard SHALL use touch-friendly button sizes (minimum 44x44 pixels) on mobile
5. THE Admin_Dashboard SHALL display condensed card views instead of tables for key information on mobile
6. WHEN a table is displayed on mobile, THE Admin_Dashboard SHALL show only essential columns by default
7. THE Admin_Dashboard SHALL allow expanding rows to see full details on mobile
8. THE Admin_Dashboard SHALL use native mobile date/time pickers when available
9. THE Admin_Dashboard SHALL support touch gestures (swipe to delete, pull to refresh) on mobile
10. THE Admin_Dashboard SHALL maintain full functionality on mobile including all CRUD operations

### Requirement 19: Real-Time Dashboard Updates

**User Story:** As an Admin_User, I want the dashboard to show real-time updates when data changes, so that I always see current information without manual refresh.

#### Acceptance Criteria

1. WHEN the Admin_Dashboard is loaded, THE System SHALL establish a polling mechanism that refreshes data every 30 seconds
2. WHEN new data is loaded, THE Admin_Dashboard SHALL update the display without full page reload
3. WHEN an Admin_User is viewing a detail page, THE System SHALL suspend automatic refresh to prevent disruption
4. WHEN an Admin_User returns to a list view, THE System SHALL resume automatic refresh
5. THE Admin_Dashboard SHALL display a timestamp showing when data was last refreshed
6. THE Admin_Dashboard SHALL provide a manual "Refresh Now" button
7. WHEN an Admin_User performs an action (approve, reject), THE Admin_Dashboard SHALL immediately update the local data without waiting for next poll
8. WHEN a data refresh fails, THE Admin_Dashboard SHALL display a non-intrusive error message and retry after 60 seconds
9. THE Admin_Dashboard SHALL display a visual indicator (animated icon) when actively refreshing data
10. THE System SHALL optimize polling by only fetching changed records using last_updated timestamps where possible

### Requirement 20: Setup Script Idempotency and Safety

**User Story:** As a system administrator, I want the setup script to be safe to run multiple times, so that accidental re-execution does not corrupt the database or create duplicate admins.

#### Acceptance Criteria

1. WHEN the Setup_Script is executed, THE System SHALL check for existing Admin_User records before any database writes
2. IF any user with role='admin' exists, THEN THE Setup_Script SHALL output "Admin user already exists. Skipping setup." and exit with code 0
3. THE Setup_Script SHALL validate all Environment_Config variables are present before attempting user creation
4. IF any required Environment_Config variable is missing, THEN THE Setup_Script SHALL output "Missing required environment variable: [NAME]" and exit with code 1
5. THE Setup_Script SHALL use database transactions to ensure atomic user creation
6. IF the user creation transaction fails, THEN THE Setup_Script SHALL rollback all changes and exit with code 1
7. THE Setup_Script SHALL log all actions (checks, validation, creation) to standard output with timestamps
8. THE Setup_Script SHALL never output sensitive information (passwords, hashes) to logs
9. THE Setup_Script SHALL create the Admin_User with a unique UUID generated by the database
10. WHEN the Setup_Script completes successfully, THE System SHALL output the created admin's ID and email for verification

