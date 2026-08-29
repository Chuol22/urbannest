# Implementation Plan: Super Admin Management System

## Overview

This implementation plan provides a comprehensive, step-by-step approach to building the Super Admin Management System for UrbanNEST. The system includes secure initial setup via a setup script, complete admin user lifecycle management, comprehensive audit logging, and enhanced dashboard features for managing users, listings, and payments. The implementation is organized into logical phases that build incrementally, with each task referencing specific requirements for traceability.

## Tasks

- [x] 1. Database Schema Setup
  - [x] 1.1 Create Prisma migration for User table 2FA fields
    - Add `two_factor_enabled` boolean field (default false)
    - Add `two_factor_secret` varchar(255) nullable field
    - Create index on `two_factor_enabled`
    - _Requirements: 13.1, 13.5_
  
  - [x] 1.2 Create Prisma migration for AuditLog table
    - Create new `audit_logs` table with all required fields (id, admin_id, action_type, target_resource, target_id, ip_address, user_agent, metadata, created_at)
    - Add foreign key constraint to users table
    - Create indexes on admin_id, action_type, target_resource, target_id, created_at
    - _Requirements: 5.2, 5.9_
  
  - [x] 1.3 Update Prisma schema file
    - Add 2FA fields to User model
    - Add AuditLog model with all fields and relations
    - Add audit_logs relation to User model
    - _Requirements: 13.1, 5.2_
  
  - [x] 1.4 Generate Prisma client and run migrations
    - Run `npx prisma migrate dev --name add-admin-features`
    - Generate updated Prisma client with `npx prisma generate`
    - _Requirements: 1.8, 5.2_

- [x] 2. Backend Core Services
  - [x] 2.1 Create Password Service
    - Implement `validate()` method with all password strength checks (length, uppercase, lowercase, number, special char)
    - Implement `hash()` method using bcryptjs with 10 salt rounds
    - Implement `compare()` method for password verification
    - Return detailed error messages for each validation failure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 2.2 Create Audit Log Service
    - Implement `log()` method to create audit log entries with all required fields
    - Implement `query()` method with filtering by admin_id, action_type, resource, date range, search
    - Implement pagination support (page, limit, total, totalPages)
    - Include admin name in query results via join
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 2.3 Create TOTP Service for 2FA
    - Implement `generateSecret()` method using speakeasy
    - Implement `generateQRCode()` method returning data URL
    - Implement `verify()` method with 2-step window for clock skew
    - Install required dependencies: speakeasy, qrcode
    - _Requirements: 13.2, 13.3, 13.7_
  
  - [x] 2.4 Create Export Service
    - Implement `sanitizeCell()` method to prevent formula injection
    - Implement `toCsv()` method converting arrays to CSV with proper escaping
    - Implement `generateFilename()` method with timestamp
    - Handle UTF-8 encoding properly
    - _Requirements: 17.1, 17.2, 17.4, 17.8, 17.9_
  
  - [x] 2.5 Create validation utilities module
    - Create email format validator using regex
    - Create phone number validator (digits and optional + prefix)
    - Create input sanitization functions
    - Export all validators for reuse
    - _Requirements: 1.5, 1.6_

- [x] 3. Authentication Middleware Enhancements
  - [x] 3.1 Update Auth Middleware with enhanced token verification
    - Implement `verifyToken()` method checking token presence, validity, and expiration
    - Return proper 401 errors for missing/invalid/expired tokens
    - Extract userId and userRole from JWT payload
    - Store in req.userId and req.userRole
    - _Requirements: 12.1, 12.3, 12.4, 6.3_
  
  - [x] 3.2 Implement role-based authorization middleware
    - Create `checkRole(allowedRoles)` middleware factory
    - Load fresh user data from database to check is_active status
    - Verify user role matches allowed roles
    - Return 403 error if role doesn't match or account is deactivated
    - Attach full user object to req.user
    - _Requirements: 12.2, 12.5, 12.7, 12.8, 12.10_
  
  - [x] 3.3 Add request context extraction utility
    - Create helper function to extract IP address from req
    - Create helper function to extract user agent from req headers
    - Handle proxy headers (X-Forwarded-For) correctly
    - _Requirements: 5.2_

- [x] 4. Admin User Management Controller
  - [x] 4.1 Implement Create Admin endpoint
    - Validate all required fields (email, phone, password, first_name, last_name)
    - Check email and phone uniqueness
    - Validate password strength using Password Service
    - Hash password using Password Service
    - Create user with role='admin', is_verified=true, is_active=true, verification_status='approved'
    - Log action to audit log with creator's ID
    - Return sanitized user data (exclude password_hash)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_
  
  - [x] 4.2 Implement List Admins endpoint
    - Support pagination (page, limit query params)
    - Support filtering by active status
    - Support search by email, phone, name
    - Return admin list with pagination metadata
    - Exclude password_hash from results
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 4.3 Implement Get Admin Details endpoint
    - Fetch admin by ID with all profile fields
    - Return error if admin not found
    - Exclude password_hash from response
    - Include two_factor_enabled status
    - _Requirements: 9.4_
  
  - [x] 4.4 Implement Update Admin endpoint
    - Allow updating email, phone, first_name, last_name
    - Validate email and phone uniqueness
    - Prevent updating password through this endpoint
    - Log action to audit log
    - Return updated admin data
    - _Requirements: 3.9, 3.10_
  
  - [x] 4.5 Implement Update Admin Password endpoint
    - Require new password in request body
    - If updating own password, require current password verification
    - Validate new password strength
    - Hash new password using Password Service
    - Update password_hash field
    - Log action to audit log with admin ID and target user ID
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [x] 4.6 Implement Deactivate Admin endpoint
    - Check that target is not the requesting user (prevent self-deactivation)
    - Set is_active=false for target admin
    - Log action to audit log
    - Return success response
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 4.7 Implement Activate Admin endpoint
    - Set is_active=true for target admin
    - Log action to audit log
    - Return success response
    - _Requirements: 4.6, 4.7_

- [x] 5. Two-Factor Authentication Implementation
  - [x] 5.1 Implement Enable 2FA endpoint
    - Generate TOTP secret using TOTP Service
    - Generate QR code data URL
    - Store secret temporarily (not yet enabled)
    - Return QR code URL to client
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [x] 5.2 Implement Verify 2FA Setup endpoint
    - Accept verification code from request body
    - Verify code against stored temporary secret
    - If valid, encrypt and store secret in user record, set two_factor_enabled=true
    - Log action to audit log
    - Return success response
    - _Requirements: 13.4, 13.5_
  
  - [x] 5.3 Implement Disable 2FA endpoint
    - Require password confirmation
    - Verify password using Password Service
    - Set two_factor_enabled=false, clear two_factor_secret
    - Log action to audit log
    - Return success response
    - _Requirements: 13.10_
  
  - [x] 5.4 Update login flow to support 2FA
    - After password validation, check if two_factor_enabled=true
    - If yes, return response indicating 2FA required (don't create session yet)
    - Create separate endpoint for 2FA verification during login
    - Verify TOTP code using TOTP Service
    - Only create session and return JWT if code is valid
    - Return error if code is invalid
    - _Requirements: 13.6, 13.7, 13.8, 13.9_

- [x] 6. Audit Log Controller
  - [x] 6.1 Implement Get Audit Logs endpoint
    - Accept filter params: page, limit, admin_id, action_type, resource, from_date, to_date, search
    - Use Audit Log Service query method
    - Return paginated results with admin names
    - Support sorting by created_at descending
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 6.2 Implement Get Audit Log Details endpoint
    - Fetch single audit log by ID
    - Return full details including metadata JSON
    - Include admin information
    - _Requirements: 5.8_
  
  - [x] 6.3 Implement Export Audit Logs endpoint
    - Accept same filter params as list endpoint
    - Use Audit Log Service to fetch logs (max 10000)
    - Generate CSV using Export Service
    - Set proper headers for file download
    - Include timestamp in filename
    - _Requirements: 5.10, 17.1, 17.6_

- [x] 7. Dashboard Metrics Controller
  - [x] 7.1 Implement Get Dashboard Stats endpoint
    - Query total user count grouped by role
    - Query pending verification count by role
    - Query active properties count by status
    - Query total listing fee revenue (sum completed payments)
    - Query pending bookings count
    - Query active admin count
    - Return all metrics in single response
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 7.2 Implement Get User Statistics endpoint
    - Support filtering by role and status
    - Return user counts with breakdowns
    - Include growth metrics (new users this month)
    - _Requirements: 8.1, 8.2_
  
  - [x] 7.3 Implement Get Property Statistics endpoint
    - Support filtering by status and type
    - Return property counts with breakdowns
    - Include pending review count
    - _Requirements: 8.3_
  
  - [x] 7.4 Implement Get Revenue Statistics endpoint
    - Support date range filtering
    - Calculate total revenue and monthly revenue
    - Include payment success rate calculation
    - Return revenue breakdowns by status
    - _Requirements: 8.4, 11.6, 11.7_

- [x] 8. Enhanced User Management Controller
  - [x] 8.1 Implement Get All Users endpoint
    - Support pagination, filtering by role, verification_status, is_active
    - Support search by email, phone, first_name, last_name
    - Include user statistics (property count, booking count, created_at, last_login)
    - Return paginated results
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.9_
  
  - [x] 8.2 Implement Update User Verification endpoint
    - Accept verification_status and optional rejection_reason
    - Update user record
    - Log action to audit log with metadata
    - Return updated user data
    - _Requirements: 9.5_
  
  - [x] 8.3 Implement Deactivate User endpoint
    - Set is_active=false
    - Require reason in request body
    - Log action to audit log with reason in metadata
    - Return success response
    - _Requirements: 9.7_
  
  - [x] 8.4 Implement Activate User endpoint
    - Set is_active=true
    - Log action to audit log
    - Return success response
    - _Requirements: 9.8_
  
  - [x] 8.5 Implement Bulk User Action endpoint
    - Accept action type and array of user IDs
    - Support actions: activate, deactivate, approve, reject
    - Process each user individually, continue on individual failures
    - Track success/failure count
    - Log each action to audit log
    - Return summary with success count, failure count, and error details
    - _Requirements: 16.1, 16.5, 16.6, 16.8, 16.9, 16.10_
  
  - [x] 8.6 Implement Export Users endpoint
    - Accept same filters as list endpoint
    - Fetch users (max 10000)
    - Generate CSV using Export Service
    - Exclude password_hash field
    - Set download headers with timestamp filename
    - _Requirements: 9.10, 17.1, 17.4, 17.6_

- [x] 9. Enhanced Listing Management Controller
  - [x] 9.1 Implement Bulk Approve Listings endpoint
    - Accept array of listing IDs
    - Validate all listings have listing_fee_paid=true
    - Set status='available', listing_rejection_reason=null for each
    - Log each action to audit log
    - Return summary with success/failure counts
    - _Requirements: 10.9, 10.10_
  
  - [x] 9.2 Implement Bulk Reject Listings endpoint
    - Accept array of listing IDs and rejection reason
    - Validate reason has minimum 10 characters
    - Set status='withdrawn', listing_rejection_reason for each
    - Log each action to audit log with reason in metadata
    - Return summary with success/failure counts
    - _Requirements: 10.6, 10.7, 10.8_
  
  - [x] 9.3 Update existing listing approval/rejection endpoints
    - Enhance to include comprehensive audit logging
    - Add validation for listing_fee_paid on approval
    - Ensure listing_rejection_reason is set on rejection
    - _Requirements: 10.5, 10.6, 10.7, 10.8_

- [x] 10. Enhanced Payment Management Controller
  - [x] 10.1 Implement Get Payments endpoint
    - Support filtering by status, date range
    - Include user name and property title via joins
    - Support pagination
    - Return payment list with transaction details
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 10.2 Implement Get Payment Details endpoint
    - Fetch payment by ID with full details
    - Include transaction reference and metadata
    - Include related user and property information
    - _Requirements: 11.5_
  
  - [x] 10.3 Implement Manual Payment Completion endpoint
    - Require confirmation and reason
    - Update payment status to COMPLETED
    - Log action to audit log with reason and admin details
    - Return updated payment data
    - _Requirements: 11.10_
  
  - [x] 10.4 Implement Export Payments endpoint
    - Accept same filters as list endpoint
    - Fetch payments (max 10000) with all fields
    - Generate CSV using Export Service
    - Include metadata in CSV
    - Set download headers
    - _Requirements: 11.8, 17.1, 17.5_

- [x] 11. Setup Script Implementation
  - [x] 11.1 Create setup script file
    - Create `server/scripts/setupAdmin.js` file
    - Add shebang for Node.js execution
    - Import required dependencies (dotenv, Prisma client, Password Service)
    - _Requirements: 1.1, 20.3_
  
  - [x] 11.2 Implement environment variable loading and validation
    - Load .env file using dotenv
    - Check for required variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_PHONE
    - Exit with code 1 and error message if any variable missing
    - _Requirements: 1.1, 20.4_
  
  - [x] 11.3 Implement admin existence check
    - Query database for any user with role='admin'
    - If exists, output "Admin user already exists. Skipping setup." and exit with code 0
    - Make script idempotent and safe to run multiple times
    - _Requirements: 1.2, 1.3, 20.1, 20.2_
  
  - [x] 11.4 Implement credential validation
    - Validate email format using validation utilities
    - Validate phone format (digits and optional + prefix)
    - Validate password strength using Password Service
    - Exit with code 1 and specific error message if any validation fails
    - _Requirements: 1.4, 1.5, 1.6, 1.10, 7.2_
  
  - [x] 11.5 Implement admin user creation
    - Hash password using Password Service
    - Create user in database transaction with role='admin', is_verified=true, verification_status='approved', is_active=true
    - Use UUID generated by database
    - Rollback transaction on failure
    - _Requirements: 1.7, 1.8, 20.5, 20.6, 20.9_
  
  - [x] 11.6 Add logging and output
    - Log all actions with timestamps to stdout
    - Never log passwords or hashes
    - On success, output created admin's ID and email
    - On failure, output specific error and exit with code 1
    - _Requirements: 1.9, 20.7, 20.8, 20.10_
  
  - [x] 11.7 Add npm script for setup
    - Add "setup:admin" script to server/package.json
    - Script should run: `node scripts/setupAdmin.js`
    - Document usage in README
    - _Requirements: 1.1_

- [x] 12. API Routes Setup
  - [x] 12.1 Create admin routes file
    - Create `server/src/routes/admin.routes.js`
    - Import auth middleware and all admin controllers
    - Apply verifyToken and checkRole(['admin']) middleware to all routes
    - _Requirements: 12.1, 12.6, 12.10_
  
  - [x] 12.2 Define admin user management routes
    - POST `/users` - Create admin
    - GET `/users` - List admins
    - GET `/users/:id` - Get admin details
    - PUT `/users/:id` - Update admin
    - PUT `/users/:id/password` - Update password
    - POST `/users/:id/deactivate` - Deactivate admin
    - POST `/users/:id/activate` - Activate admin
    - POST `/users/:id/enable-2fa` - Enable 2FA
    - POST `/users/:id/verify-2fa` - Verify 2FA
    - POST `/users/:id/disable-2fa` - Disable 2FA
    - _Requirements: 2.1, 3.1, 4.1, 13.1_
  
  - [x] 12.3 Define audit log routes
    - GET `/audit-logs` - List audit logs
    - GET `/audit-logs/:id` - Get audit log details
    - GET `/audit-logs/export` - Export audit logs CSV
    - _Requirements: 5.3, 5.10_
  
  - [x] 12.4 Define dashboard metrics routes
    - GET `/dashboard` - Get system metrics
    - GET `/dashboard/users` - Get user statistics
    - GET `/dashboard/properties` - Get property statistics
    - GET `/dashboard/revenue` - Get revenue statistics
    - _Requirements: 8.1_
  
  - [x] 12.5 Define enhanced user management routes
    - GET `/users/all` - List all platform users
    - PUT `/users/all/:id/verify` - Verify user
    - POST `/users/all/:id/deactivate` - Deactivate user
    - POST `/users/all/:id/activate` - Activate user
    - POST `/users/all/bulk-action` - Bulk user actions
    - GET `/users/all/export` - Export users CSV
    - _Requirements: 9.1, 9.5, 9.7, 9.8, 16.5_
  
  - [x] 12.6 Define enhanced listing management routes
    - POST `/listings/bulk-approve` - Bulk approve listings
    - POST `/listings/bulk-reject` - Bulk reject listings
    - _Requirements: 10.9_
  
  - [x] 12.7 Define enhanced payment management routes
    - GET `/payments` - List payments
    - GET `/payments/:id` - Get payment details
    - POST `/payments/:id/complete` - Manual payment completion
    - GET `/payments/export` - Export payments CSV
    - _Requirements: 11.1, 11.10_
  
  - [x] 12.8 Register admin routes in main server file
    - Import admin routes
    - Mount at `/api/admin` base path
    - Ensure CORS and security middleware applied
    - _Requirements: 12.1_

- [x] 13. Checkpoint - Backend Foundation Complete
  - Ensure all migrations run successfully
  - Ensure all services and controllers compile without errors
  - Ensure all routes are registered and accessible
  - Test setup script creates admin user successfully
  - Ask the user if questions arise

- [x] 14. Frontend - Admin Dashboard Core
  - [x] 14.1 Create AdminDashboard page component
    - Create `client/src/pages/admin/AdminDashboard.tsx`
    - Set up state management for dashboard stats
    - Implement API call to fetch dashboard metrics
    - Display loading and error states
    - _Requirements: 8.1_
  
  - [x] 14.2 Create system metrics cards
    - Create MetricsCard component with icon, label, value, change indicator
    - Display user metrics (total, by role, pending verification)
    - Display property metrics (total, by status, pending review)
    - Display revenue metrics (total, monthly, payment success rate)
    - Display admin metrics (total, active)
    - Use responsive grid layout
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 14.3 Create recent activity timeline
    - Fetch recent audit logs (last 10)
    - Display as timeline with icons per action type
    - Show admin name, action description, timestamp
    - Link to detailed audit log viewer
    - _Requirements: 5.3, 5.6_
  
  - [x] 14.4 Implement real-time dashboard updates
    - Set up polling mechanism (refresh every 30 seconds)
    - Update metrics without full page reload
    - Display last refresh timestamp
    - Add manual refresh button
    - Suspend polling on navigation away
    - _Requirements: 19.1, 19.2, 19.3, 19.5, 19.6, 19.9_
  
  - [x] 14.5 Add quick action buttons
    - Create Admin button linking to admin management
    - Review Listings button linking to listing management
    - View Payments button linking to payment management
    - View Audit Logs button linking to audit log viewer
    - _Requirements: 8.10_

- [x] 15. Frontend - Admin Management Interface
  - [x] 15.1 Create AdminManagement page component
    - Create `client/src/pages/admin/AdminManagement.tsx`
    - Set up state for admin list, pagination, filters
    - Implement API calls for fetching admin list
    - Display loading and error states
    - _Requirements: 2.1, 9.1_
  
  - [x] 15.2 Create AdminTable component
    - Display admins in sortable table
    - Show columns: name, email, phone, status, 2FA status, last_login, actions
    - Add status indicators (active/inactive, 2FA enabled/disabled)
    - Add action buttons: edit, deactivate/activate, reset password
    - _Requirements: 4.9_
  
  - [x] 15.3 Create CreateAdminModal component
    - Create modal with form for admin creation
    - Add input fields: email, phone, password, first_name, last_name
    - Implement client-side validation (password strength, email format, phone format)
    - Show validation errors inline
    - Submit form and handle API response
    - Close modal and refresh list on success
    - _Requirements: 2.1, 2.2, 7.1_
  
  - [x] 15.4 Create UpdateAdminModal component
    - Create modal with form for updating admin details
    - Pre-populate with current admin data
    - Allow editing email, phone, first_name, last_name
    - Validate email and phone format
    - Submit form and handle API response
    - _Requirements: 3.9, 3.10_
  
  - [x] 15.5 Create ResetPasswordModal component
    - Create modal with form for password reset
    - If resetting own password, require current password
    - Require new password with strength validation
    - Show password strength indicator
    - Submit form and handle API response
    - _Requirements: 3.1, 3.2, 3.6_
  
  - [x] 15.6 Implement deactivate/activate functionality
    - Add confirmation dialog for deactivation
    - Check if trying to deactivate self, show error
    - Call deactivate/activate API endpoints
    - Update UI optimistically
    - Show success/error toast notifications
    - _Requirements: 4.2, 4.3, 4.6_

- [x] 16. Frontend - Two-Factor Authentication
  - [x] 16.1 Create Enable2FAModal component
    - Display QR code for scanning
    - Show manual setup key as fallback
    - Add input field for verification code
    - Submit code for verification
    - Show success message on completion
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 16.2 Create Disable2FAModal component
    - Require password confirmation
    - Show warning about security implications
    - Submit disable request
    - Show success message
    - _Requirements: 13.10_
  
  - [x] 16.3 Update login flow for 2FA
    - Detect when 2FA is required from login response
    - Show 2FA code input screen instead of redirecting
    - Submit TOTP code for verification
    - Create session and redirect only after successful 2FA verification
    - Show error for invalid codes
    - _Requirements: 13.6, 13.7, 13.8, 13.9_

- [x] 17. Frontend - Audit Log Viewer
  - [x] 17.1 Create AuditLogs page component
    - Create `client/src/pages/admin/AuditLogs.tsx`
    - Set up state for logs, pagination, filters
    - Implement API call to fetch audit logs
    - Display loading and error states
    - _Requirements: 5.3_
  
  - [x] 17.2 Create AuditLogTable component
    - Display logs in table with columns: admin, action, resource, target, IP, timestamp
    - Make rows expandable to show metadata
    - Add syntax highlighting for JSON metadata
    - Support sorting by timestamp
    - _Requirements: 5.6, 5.8_
  
  - [x] 17.3 Create audit log filter panel
    - Add dropdown for admin selection
    - Add dropdown for action type
    - Add dropdown for resource type
    - Add date range picker (from_date, to_date)
    - Add search input with debouncing (300ms)
    - Show active filter tags with remove buttons
    - Add "Clear All Filters" button
    - _Requirements: 5.4, 5.5, 15.1, 15.2, 15.3, 15.6, 15.7_
  
  - [x] 17.4 Implement pagination controls
    - Show page numbers with prev/next buttons
    - Display total count and current range
    - Allow changing page size (25, 50, 100)
    - Update URL query params with pagination state
    - _Requirements: 5.7, 15.8_
  
  - [x] 17.5 Implement export to CSV functionality
    - Add "Export to CSV" button
    - Show warning if result count > 10000
    - Call export API endpoint with current filters
    - Trigger browser download
    - Show success toast
    - _Requirements: 5.10, 17.1, 17.10_

- [x] 18. Frontend - Enhanced User Management
  - [x] 18.1 Create UserManagement page component
    - Create `client/src/pages/admin/UserManagement.tsx`
    - Set up state for user list, pagination, filters, selection
    - Implement API call to fetch all users
    - Display loading and error states
    - _Requirements: 9.1_
  
  - [x] 18.2 Create UserTable component with selection
    - Display users in table with checkboxes
    - Show columns: name, email, phone, role, verification_status, is_active, created_at, actions
    - Add "Select All" checkbox in header
    - Track selected user IDs in state
    - Add action buttons: view details, verify, deactivate/activate
    - _Requirements: 9.1, 16.1, 16.2_
  
  - [x] 18.3 Create user filter panel
    - Add dropdown for role filtering
    - Add dropdown for verification_status filtering
    - Add dropdown for is_active filtering
    - Add search input (email, phone, name) with debouncing
    - Show active filters and clear all button
    - Update URL params with filter state
    - _Requirements: 9.2, 9.3, 15.5, 15.8, 15.9_
  
  - [x] 18.4 Create VerifyUserModal component
    - Show user details for context
    - Add approve/reject radio buttons
    - If rejecting, require rejection reason (minimum 10 chars)
    - Submit verification decision
    - Log action to audit log (handled by backend)
    - _Requirements: 9.5_
  
  - [x] 18.5 Create bulk action toolbar
    - Show toolbar when users are selected
    - Display selected count
    - Add bulk action buttons: Approve, Reject, Activate, Deactivate
    - Show confirmation dialog before bulk actions
    - Display progress indicator during bulk operation
    - Show summary after completion (X succeeded, Y failed)
    - _Requirements: 16.3, 16.4, 16.5, 16.7, 16.9_

- [x] 19. Frontend - Enhanced Listing Management
  - [x] 19.1 Create ListingManagement page component
    - Create `client/src/pages/admin/ListingManagement.tsx`
    - Set up state for listings, pagination, filters, selection
    - Implement API call to fetch properties
    - Display loading and error states
    - _Requirements: 10.1_
  
  - [x] 19.2 Create ListingGrid component with selection
    - Display properties as cards with checkboxes
    - Show thumbnail, title, owner name, status, payment status, creation date
    - Add "Select All" checkbox
    - Track selected listing IDs
    - Add click handler to view details
    - _Requirements: 10.3, 16.1_
  
  - [x] 19.3 Create RejectListingModal component
    - Require rejection reason input (min 10 characters)
    - Show character count
    - Display validation error if too short
    - Submit rejection with reason
    - _Requirements: 10.6, 10.7_
  
  - [x] 19.4 Implement bulk listing actions
    - Create bulk action toolbar (visible when listings selected)
    - Add "Bulk Approve" button
    - Add "Bulk Reject" button (requires reason input)
    - Validate all selected have listing_fee_paid=true before approving
    - Show progress during bulk operation
    - Display summary after completion
    - _Requirements: 10.9, 10.10, 16.5, 16.7_

- [x] 20. Frontend - Enhanced Payment Management
  - [x] 20.1 Create PaymentManagement page component
    - Create `client/src/pages/admin/PaymentManagement.tsx`
    - Set up state for payments, pagination, filters
    - Implement API call to fetch payments
    - Display loading and error states
    - _Requirements: 11.1_
  
  - [x] 20.2 Create PaymentTable component
    - Display payments in table
    - Show columns: ID, user, property, amount, currency, status, payment_method, timestamp, actions
    - Add status badges with colors (pending, processing, completed, failed)
    - Add action button: view details, manually complete (for failed)
    - _Requirements: 11.4_
  
  - [x] 20.3 Create PaymentDetailsModal component
    - Display full payment details including transaction reference
    - Show metadata in formatted JSON
    - Display user and property information
    - Show payment timeline if available
    - Show failure reason for failed payments
    - _Requirements: 11.5, 11.9_
  
  - [x] 20.4 Implement manual payment completion
    - Add "Mark as Completed" button for failed payments
    - Show confirmation dialog requiring reason input
    - Call manual completion API endpoint
    - Update UI on success
    - Log action to audit log (handled by backend)
    - _Requirements: 11.10_

- [x] 21. Frontend - Mobile Responsiveness
  - [x] 21.1 Make AdminDashboard mobile-responsive
    - Use responsive grid for metrics cards (1 col mobile, 2 col tablet, 4 col desktop)
    - Stack action buttons vertically on mobile
    - _Requirements: 18.1, 18.4_
  
  - [x] 21.2 Make data tables mobile-responsive
    - Add horizontal scrolling for tables on mobile
    - Ensure touch-friendly button sizes (44x44px minimum)
    - _Requirements: 18.3, 18.4, 18.5_
  
  - [x] 21.3 Create collapsible sidebar for mobile
    - Implement hamburger menu toggle
    - Show/hide sidebar on mobile based on state
    - Overlay sidebar on mobile, don't push content
    - Close sidebar after navigation on mobile
    - _Requirements: 18.2_

- [x] 22. Frontend - Routing and Navigation
  - [x] 22.1 Create admin route configuration
    - Define routes for all admin pages in React Router
    - Add route protection requiring admin role
    - Set up nested routes under /admin path
    - _Requirements: 12.1_
  
  - [x] 22.2 Create AdminLayout component
    - Create shared layout with sidebar and header
    - Add navigation menu with links to all admin sections
    - Show current user info in header
    - Add logout button
    - _Requirements: 8.1_

- [x] 23. Frontend - API Service Layer
  - [x] 23.1 Create admin API service (`client/src/services/admin.service.ts`)
    - Implement methods for all admin user management, audit logs, metrics, user moderation, listings, and payments
    - Include proper error handling and response typing
    - _Requirements: 2.1, 3.1, 4.1_

- [x] 24. Frontend - TypeScript Types and Interfaces
  - [x] 24.1 Define admin-related types (`client/src/types/admin.types.ts`)
    - Types for AdminUser, AuditLog, DashboardMetrics, PlatformUser, PlatformListing, PlatformPayment
    - _Requirements: Design Section_
    - Implement API call to fetch dashboard metrics
    - Display loading and error states
    - _Requirements: 8.1_
  
  - [ ] 14.2 Create system metrics cards
    - Create MetricsCard component with icon, label, value, change indicator
    - Display user metrics (total, by role, pending verification)
    - Display property metrics (total, by status, pending review)
    - Display revenue metrics (total, monthly, payment success rate)
    - Display admin metrics (total, active)
    - Use responsive grid layout
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 14.3 Create recent activity timeline
    - Fetch recent audit logs (last 10)
    - Display as timeline with icons per action type
    - Show admin name, action description, timestamp
    - Link to detailed audit log viewer
    - _Requirements: 5.3, 5.6_
  
  - [ ] 14.4 Implement real-time dashboard updates
    - Set up polling mechanism (refresh every 30 seconds)
    - Update metrics without full page reload
    - Display last refresh timestamp
    - Add manual refresh button
    - Suspend polling on navigation away
    - _Requirements: 19.1, 19.2, 19.3, 19.5, 19.6, 19.9_
  
  - [ ] 14.5 Add quick action buttons
    - Create Admin button linking to admin management
    - Review Listings button linking to listing management
    - View Payments button linking to payment management
    - View Audit Logs button linking to audit log viewer
    - _Requirements: 8.10_
  
  - [ ] 14.6 Create dashboard charts using Recharts
    - Install recharts dependency
    - Create user growth line chart (last 30 days)
    - Create property status pie chart
    - Create revenue bar chart (last 12 months)
    - Make charts responsive
    - _Requirements: 8.9_

- [ ] 15. Frontend - Admin Management Interface
  - [ ] 15.1 Create AdminManagement page component
    - Create `client/src/pages/admin/AdminManagement.tsx`
    - Set up state for admin list, pagination, filters
    - Implement API calls for fetching admin list
    - Display loading and error states
    - _Requirements: 2.1, 9.1_
  
  - [ ] 15.2 Create AdminTable component
    - Display admins in sortable table
    - Show columns: name, email, phone, status, 2FA status, last_login, actions
    - Add status indicators (active/inactive, 2FA enabled/disabled)
    - Add action buttons: edit, deactivate/activate, reset password
    - _Requirements: 4.9_
  
  - [ ] 15.3 Create CreateAdminModal component
    - Create modal with form for admin creation
    - Add input fields: email, phone, password, first_name, last_name
    - Implement client-side validation (password strength, email format, phone format)
    - Show validation errors inline
    - Submit form and handle API response
    - Close modal and refresh list on success
    - _Requirements: 2.1, 2.2, 7.1_
  
  - [ ] 15.4 Create UpdateAdminModal component
    - Create modal with form for updating admin details
    - Pre-populate with current admin data
    - Allow editing email, phone, first_name, last_name
    - Validate email and phone format
    - Submit form and handle API response
    - _Requirements: 3.9, 3.10_
  
  - [ ] 15.5 Create ResetPasswordModal component
    - Create modal with form for password reset
    - If resetting own password, require current password
    - Require new password with strength validation
    - Show password strength indicator
    - Submit form and handle API response
    - _Requirements: 3.1, 3.2, 3.6_
  
  - [ ] 15.6 Implement deactivate/activate functionality
    - Add confirmation dialog for deactivation
    - Check if trying to deactivate self, show error
    - Call deactivate/activate API endpoints
    - Update UI optimistically
    - Show success/error toast notifications
    - _Requirements: 4.2, 4.3, 4.6_
  
  - [ ] 15.7 Create AdminDetailsDrawer component
    - Create side panel showing full admin details
    - Display all profile fields, creation date, last login, activity count
    - Show 2FA status and enable/disable button
    - Show recent actions by this admin (audit log entries)
    - _Requirements: 9.4, 13.1_

- [ ] 16. Frontend - Two-Factor Authentication
  - [ ] 16.1 Create Enable2FAModal component
    - Display QR code for scanning
    - Show manual setup key as fallback
    - Add input field for verification code
    - Submit code for verification
    - Show success message on completion
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ] 16.2 Create Disable2FAModal component
    - Require password confirmation
    - Show warning about security implications
    - Submit disable request
    - Show success message
    - _Requirements: 13.10_
  
  - [ ] 16.3 Update login flow for 2FA
    - Detect when 2FA is required from login response
    - Show 2FA code input screen instead of redirecting
    - Submit TOTP code for verification
    - Create session and redirect only after successful 2FA verification
    - Show error for invalid codes
    - _Requirements: 13.6, 13.7, 13.8, 13.9_

- [ ] 17. Frontend - Audit Log Viewer
  - [ ] 17.1 Create AuditLogs page component
    - Create `client/src/pages/admin/AuditLogs.tsx`
    - Set up state for logs, pagination, filters
    - Implement API call to fetch audit logs
    - Display loading and error states
    - _Requirements: 5.3_
  
  - [ ] 17.2 Create AuditLogTable component
    - Display logs in table with columns: admin, action, resource, target, IP, timestamp
    - Make rows expandable to show metadata
    - Add syntax highlighting for JSON metadata
    - Support sorting by timestamp
    - _Requirements: 5.6, 5.8_
  
  - [ ] 17.3 Create audit log filter panel
    - Add dropdown for admin selection
    - Add dropdown for action type
    - Add dropdown for resource type
    - Add date range picker (from_date, to_date)
    - Add search input with debouncing (300ms)
    - Show active filter tags with remove buttons
    - Add "Clear All Filters" button
    - _Requirements: 5.4, 5.5, 15.1, 15.2, 15.3, 15.6, 15.7_
  
  - [ ] 17.4 Implement pagination controls
    - Show page numbers with prev/next buttons
    - Display total count and current range
    - Allow changing page size (25, 50, 100)
    - Update URL query params with pagination state
    - _Requirements: 5.7, 15.8_
  
  - [ ] 17.5 Implement export to CSV functionality
    - Add "Export to CSV" button
    - Show warning if result count > 10000
    - Call export API endpoint with current filters
    - Trigger browser download
    - Show success toast
    - _Requirements: 5.10, 17.1, 17.10_
  
  - [ ] 17.6 Add search highlighting
    - Highlight search term matches in table results
    - Use yellow background for matched text
    - _Requirements: 15.4_

- [ ] 18. Frontend - Enhanced User Management
  - [ ] 18.1 Create UserManagement page component
    - Create `client/src/pages/admin/UserManagement.tsx`
    - Set up state for user list, pagination, filters, selection
    - Implement API call to fetch all users
    - Display loading and error states
    - _Requirements: 9.1_
  
  - [ ] 18.2 Create UserTable component with selection
    - Display users in table with checkboxes
    - Show columns: name, email, phone, role, verification_status, is_active, created_at, actions
    - Add "Select All" checkbox in header
    - Track selected user IDs in state
    - Add action buttons: view details, verify, deactivate/activate
    - _Requirements: 9.1, 16.1, 16.2_
  
  - [ ] 18.3 Create user filter panel
    - Add dropdown for role filtering
    - Add dropdown for verification_status filtering
    - Add dropdown for is_active filtering
    - Add search input (email, phone, name) with debouncing
    - Show active filters and clear all button
    - Update URL params with filter state
    - _Requirements: 9.2, 9.3, 15.5, 15.8, 15.9_
  
  - [ ] 18.4 Create UserDetailsModal component
    - Display all user profile fields
    - Show user statistics: property count, booking count, account age, last_login
    - Show verification status and documents
    - Add buttons: verify/reject, activate/deactivate
    - _Requirements: 9.4, 9.9_
  
  - [ ] 18.5 Create VerifyUserModal component
    - Show user details for context
    - Add approve/reject radio buttons
    - If rejecting, require rejection reason (minimum 10 chars)
    - Submit verification decision
    - Log action to audit log (handled by backend)
    - _Requirements: 9.5_
  
  - [ ] 18.6 Create bulk action toolbar
    - Show toolbar when users are selected
    - Display selected count
    - Add bulk action buttons: Approve, Reject, Activate, Deactivate
    - Show confirmation dialog before bulk actions
    - Display progress indicator during bulk operation
    - Show summary after completion (X succeeded, Y failed)
    - _Requirements: 16.3, 16.4, 16.5, 16.7, 16.9_
  
  - [ ] 18.7 Implement export users functionality
    - Add "Export to CSV" button
    - Call export API with current filters
    - Show warning if > 10000 users
    - Trigger download
    - _Requirements: 9.10, 17.1, 17.6, 17.7_

- [ ] 19. Frontend - Enhanced Listing Management
  - [ ] 19.1 Create ListingManagement page component
    - Create `client/src/pages/admin/ListingManagement.tsx`
    - Set up state for listings, pagination, filters, selection
    - Implement API call to fetch properties
    - Display loading and error states
    - _Requirements: 10.1_
  
  - [ ] 19.2 Create ListingGrid component with selection
    - Display properties as cards with checkboxes
    - Show thumbnail, title, owner name, status, payment status, creation date
    - Add "Select All" checkbox
    - Track selected listing IDs
    - Add click handler to view details
    - _Requirements: 10.3, 16.1_
  
  - [ ] 19.3 Create listing filter panel
    - Add dropdown for PropertyStatus filtering
    - Add dropdown for PropertyType filtering
    - Add dropdown for Purpose filtering
    - Add toggle for listing_fee_paid status
    - Show active filters with remove tags
    - _Requirements: 10.2, 15.5_
  
  - [ ] 19.4 Create ListingDetailsModal component
    - Display full property details
    - Show all photos in gallery
    - Show location map
    - Display amenities and description
    - Show owner information
    - Show payment status with indicator
    - Add approve/reject buttons at bottom
    - _Requirements: 10.4_
  
  - [ ] 19.5 Create RejectListingModal component
    - Require rejection reason input (min 10 characters)
    - Show character count
    - Display validation error if too short
    - Submit rejection with reason
    - _Requirements: 10.6, 10.7_
  
  - [ ] 19.6 Implement bulk listing actions
    - Create bulk action toolbar (visible when listings selected)
    - Add "Bulk Approve" button
    - Add "Bulk Reject" button (requires reason input)
    - Validate all selected have listing_fee_paid=true before approving
    - Show progress during bulk operation
    - Display summary after completion
    - _Requirements: 10.9, 10.10, 16.5, 16.7_

- [ ] 20. Frontend - Enhanced Payment Management
  - [ ] 20.1 Create PaymentManagement page component
    - Create `client/src/pages/admin/PaymentManagement.tsx`
    - Set up state for payments, pagination, filters
    - Implement API call to fetch payments
    - Display loading and error states
    - _Requirements: 11.1_
  
  - [ ] 20.2 Create PaymentTable component
    - Display payments in table
    - Show columns: ID, user, property, amount, currency, status, payment_method, timestamp, actions
    - Add status badges with colors (pending, processing, completed, failed)
    - Add action button: view details, manually complete (for failed)
    - _Requirements: 11.4_
  
  - [ ] 20.3 Create payment filter panel
    - Add dropdown for status filtering (PENDING, PROCESSING, COMPLETED, FAILED)
    - Add date range picker
    - Show active filters
    - _Requirements: 11.2, 11.3_
  
  - [ ] 20.4 Create PaymentDetailsModal component
    - Display full payment details including transaction reference
    - Show metadata in formatted JSON
    - Display user and property information
    - Show payment timeline if available
    - Show failure reason for failed payments
    - _Requirements: 11.5, 11.9_
  
  - [ ] 20.5 Create revenue summary cards
    - Display total revenue with sum
    - Display revenue by status breakdown
    - Calculate and show payment success rate percentage
    - Show monthly revenue trend
    - _Requirements: 11.6, 11.7_
  
  - [ ] 20.6 Implement manual payment completion
    - Add "Mark as Completed" button for failed payments
    - Show confirmation dialog requiring reason input
    - Call manual completion API endpoint
    - Update UI on success
    - Log action to audit log (handled by backend)
    - _Requirements: 11.10_
  
  - [ ] 20.7 Implement export payments functionality
    - Add "Export to CSV" button
    - Call export API with current filters
    - Include all payment fields and metadata
    - Trigger download
    - _Requirements: 11.8, 17.5_

- [ ] 21. Frontend - Mobile Responsiveness
  - [ ] 21.1 Make AdminDashboard mobile-responsive
    - Use responsive grid for metrics cards (1 col mobile, 2 col tablet, 4 col desktop)
    - Make charts responsive with proper aspect ratios
    - Stack action buttons vertically on mobile
    - _Requirements: 18.1, 18.4_
  
  - [ ] 21.2 Make data tables mobile-responsive
    - Add horizontal scrolling for tables on mobile
    - Show condensed card views for key entities on mobile
    - Use collapsible rows for details on mobile
    - Ensure touch-friendly button sizes (44x44px minimum)
    - _Requirements: 18.3, 18.4, 18.5_
  
  - [ ] 21.3 Create collapsible sidebar for mobile
    - Implement hamburger menu toggle
    - Show/hide sidebar on mobile based on state
    - Overlay sidebar on mobile, don't push content
    - Close sidebar after navigation on mobile
    - _Requirements: 18.2_
  
  - [ ] 21.4 Optimize forms for mobile
    - Use native date/time pickers on mobile
    - Make form inputs full-width on mobile
    - Add proper mobile keyboard types (email, tel, number)
    - Ensure modals are scrollable on mobile
    - _Requirements: 18.8_
  
  - [ ] 21.5 Add touch gesture support
    - Implement swipe-to-delete for list items (optional enhancement)
    - Add pull-to-refresh on list pages
    - _Requirements: 18.9_

- [ ] 22. Frontend - Routing and Navigation
  - [ ] 22.1 Create admin route configuration
    - Define routes for all admin pages in React Router
    - Add route protection requiring admin role
    - Set up nested routes under /admin path
    - _Requirements: 12.1_
  
  - [ ] 22.2 Create AdminLayout component
    - Create shared layout with sidebar and header
    - Add navigation menu with links to all admin sections
    - Show current user info in header
    - Add logout button
    - _Requirements: 8.1_
  
  - [ ] 22.3 Create admin navigation sidebar
    - Add menu items: Dashboard, Admins, Users, Listings, Payments, Audit Logs
    - Highlight active route
    - Show icons for each menu item
    - Make collapsible on mobile
    - _Requirements: 8.10_
  
  - [ ] 22.4 Update main app routing
    - Add admin routes to main router
    - Ensure AuthGuard checks for admin role
    - Redirect non-admins attempting to access admin routes
    - _Requirements: 12.5_

- [ ] 23. Frontend - API Service Layer
  - [ ] 23.1 Create admin API service
    - Create `client/src/services/admin.service.ts`
    - Implement methods for all admin user management endpoints
    - Include proper error handling and response typing
    - Add request interceptors for auth token
    - _Requirements: 2.1, 3.1, 4.1_
  
  - [ ] 23.2 Create audit log API service
    - Implement methods for fetching and exporting audit logs
    - Support all filter parameters
    - Handle pagination properly
    - _Requirements: 5.3, 5.10_
  
  - [ ] 23.3 Create dashboard API service
    - Implement methods for fetching system metrics
    - Handle caching for performance
    - Support partial updates
    - _Requirements: 8.1_
  
  - [ ] 23.4 Create user management API service
    - Implement methods for all user management endpoints
    - Support bulk actions with progress tracking
    - Handle export functionality
    - _Requirements: 9.1, 16.5_
  
  - [ ] 23.5 Create listing management API service
    - Implement methods for listing approval/rejection
    - Support bulk operations
    - _Requirements: 10.9_
  
  - [ ] 23.6 Create payment management API service
    - Implement methods for payment queries and export
    - Support manual completion
    - _Requirements: 11.1, 11.10_

- [ ] 24. Frontend - TypeScript Types and Interfaces
  - [ ] 24.1 Define admin-related types
    - Create types for AdminUser, AdminMetrics, AdminManagementState
    - Create enums for Role, VerificationStatus, ActionType, ResourceType
    - Export from central types file
    - _Requirements: Design Section_
  
  - [ ] 24.2 Define audit log types
    - Create types for AuditLog, AuditLogEntry, AuditLogFilters, AuditLogState
    - _Requirements: Design Section_
  
  - [ ] 24.3 Define dashboard metrics types
    - Create types for DashboardMetrics, UserMetrics, PropertyMetrics, RevenueMetrics
    - _Requirements: Design Section_
  
  - [ ] 24.4 Define API response types
    - Create generic ApiResponse<T> type
    - Create PaginatedResponse<T> type
    - Create ErrorResponse type
    - _Requirements: Design Section_

- [ ] 25. Security Enhancements
  - [ ] 25.1 Add CSRF protection
    - Implement CSRF token generation and validation
    - Include CSRF token in all state-changing requests
    - _Requirements: Security Best Practices_
  
  - [ ] 25.2 Implement rate limiting for admin endpoints
    - Add rate limiting middleware to admin routes
    - Set appropriate limits (e.g., 100 requests per 15 minutes)
    - Return 429 status for exceeded limits
    - _Requirements: Security Best Practices_
  
  - [ ] 25.3 Add request validation middleware
    - Use express-validator for input validation
    - Validate and sanitize all request inputs
    - Return 400 with validation errors
    - _Requirements: 1.4, 1.5, 1.6_
  
  - [ ] 25.4 Enhance password hashing security
    - Verify bcrypt salt rounds is set to 10 or higher
    - Ensure password hashes are never logged or returned in responses
    - Add password hash verification before allowing sensitive operations
    - _Requirements: 7.8, 7.9_
  
  - [ ] 25.5 Implement secure session management
    - Use httpOnly, secure cookies for JWT storage
    - Implement session expiration (4 hours)
    - Add session extension mechanism
    - Display session expiration warning (5 minutes before)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8_
  
  - [ ] 25.6 Add XSS protection
    - Sanitize all user inputs displayed in UI
    - Use Content Security Policy headers
    - Escape HTML in dynamic content
    - _Requirements: Security Best Practices_

- [ ] 26. Error Handling and User Feedback
  - [ ] 26.1 Implement consistent error handling
    - Create centralized error handler middleware
    - Return consistent error response format
    - Log errors appropriately (exclude sensitive data)
    - _Requirements: 1.10, 2.10, 3.10_
  
  - [ ] 26.2 Add toast notifications
    - Install sonner (already in package.json) or use existing toast library
    - Show success toasts for successful actions
    - Show error toasts for failed actions
    - Show info toasts for informational messages
    - _Requirements: User Experience_
  
  - [ ] 26.3 Add loading states
    - Show skeleton loaders for data tables during fetch
    - Show spinner for button actions
    - Disable buttons during async operations
    - _Requirements: 8.8, 19.8_
  
  - [ ] 26.4 Add empty states
    - Create EmptyState component
    - Show friendly messages when no data exists
    - Add call-to-action buttons in empty states
    - _Requirements: User Experience_
  
  - [ ] 26.5 Implement confirmation dialogs
    - Create reusable ConfirmDialog component
    - Use for destructive actions (delete, deactivate, bulk actions)
    - Require typing "DELETE" for critical deletions
    - Show action details in confirmation
    - _Requirements: 14.1, 14.2, 14.6_

- [ ] 27. Checkpoint - Frontend Core Complete
  - Ensure all admin pages render without errors
  - Ensure all forms validate correctly
  - Ensure all API integrations work properly
  - Test responsive layouts on mobile and desktop
  - Ask the user if questions arise

- [ ] 28. Testing - Backend Unit Tests
  - [ ]* 28.1 Write unit tests for Password Service
    - Test validate method with various password scenarios
    - Test hash method returns valid bcrypt hash
    - Test compare method correctly verifies passwords
    - Test all validation error messages
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [ ]* 28.2 Write unit tests for Audit Log Service
    - Test log method creates audit entries correctly
    - Test query method with various filters
    - Test pagination logic
    - Test CSV export format
    - _Requirements: 5.1, 5.2, 5.3, 5.10_
  
  - [ ]* 28.3 Write unit tests for TOTP Service
    - Test secret generation
    - Test QR code generation
    - Test TOTP verification with valid/invalid codes
    - Test clock skew tolerance
    - _Requirements: 13.2, 13.3, 13.7_
  
  - [ ]* 28.4 Write unit tests for Export Service
    - Test sanitizeCell prevents formula injection
    - Test CSV generation with special characters
    - Test UTF-8 encoding
    - Test filename generation
    - _Requirements: 17.8, 17.9_
  
  - [ ]* 28.5 Write unit tests for validation utilities
    - Test email validation with valid/invalid emails
    - Test phone validation with various formats
    - Test input sanitization
    - _Requirements: 1.5, 1.6_

- [ ] 29. Testing - Backend Integration Tests
  - [ ]* 29.1 Write integration tests for admin user management endpoints
    - Test POST /api/admin/users creates admin successfully
    - Test validation errors return proper status codes
    - Test duplicate email/phone returns error
    - Test update/deactivate/activate endpoints
    - Test password update with current password verification
    - Mock database and authentication
    - _Requirements: 2.1, 2.10, 3.1, 4.1_
  
  - [ ]* 29.2 Write integration tests for 2FA endpoints
    - Test enable 2FA flow
    - Test verify 2FA code
    - Test disable 2FA with password
    - Test login with 2FA enabled
    - _Requirements: 13.1, 13.4, 13.6, 13.10_
  
  - [ ]* 29.3 Write integration tests for audit log endpoints
    - Test fetching audit logs with filters
    - Test pagination
    - Test export endpoint returns CSV
    - _Requirements: 5.3, 5.4, 5.10_
  
  - [ ]* 29.4 Write integration tests for dashboard metrics endpoints
    - Test dashboard stats endpoint returns all metrics
    - Test user/property/revenue statistics endpoints
    - Test data aggregation logic
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 29.5 Write integration tests for bulk operations
    - Test bulk user actions (approve, reject, activate, deactivate)
    - Test bulk listing approval/rejection
    - Test partial failures handled correctly
    - Test audit logging for bulk actions
    - _Requirements: 16.5, 16.8, 16.9, 10.9_

- [ ] 30. Testing - Middleware Tests
  - [ ]* 30.1 Write tests for auth middleware
    - Test verifyToken with valid/invalid/expired tokens
    - Test missing token returns 401
    - Test expired token returns proper error
    - _Requirements: 12.3, 12.4_
  
  - [ ]* 30.2 Write tests for RBAC middleware
    - Test checkRole allows admin users
    - Test checkRole rejects non-admin users
    - Test deactivated admin returns 403
    - Test role verification loads fresh user data
    - _Requirements: 12.2, 12.5, 12.7, 12.8_
  
  - [ ]* 30.3 Write tests for request validation
    - Test validation middleware catches invalid inputs
    - Test sanitization removes malicious content
    - Test error responses have proper format
    - _Requirements: 1.4, 25.3_

- [ ] 31. Testing - Setup Script Tests
  - [ ]* 31.1 Write tests for setup script
    - Test script creates admin when none exists
    - Test script exits with code 0 when admin already exists
    - Test script validates password strength
    - Test script validates email and phone format
    - Test script handles missing environment variables
    - Test script uses database transactions
    - Mock Prisma client for testing
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 20.1, 20.2, 20.4, 20.5_

- [ ] 32. Testing - Frontend Component Tests
  - [ ]* 32.1 Write tests for AdminDashboard component
    - Test renders metrics cards with data
    - Test displays loading state
    - Test displays error state
    - Test auto-refresh polling mechanism
    - Mock API calls
    - _Requirements: 8.1, 19.1, 19.2_
  
  - [ ]* 32.2 Write tests for AdminManagement component
    - Test renders admin list
    - Test create admin form validation
    - Test update admin form
    - Test deactivate/activate functionality
    - Test prevents self-deactivation
    - Mock admin API service
    - _Requirements: 2.1, 4.2, 4.3_
  
  - [ ]* 32.3 Write tests for AuditLogs component
    - Test renders audit log table
    - Test filters work correctly
    - Test pagination
    - Test search with debouncing
    - Test export functionality
    - Mock audit log API service
    - _Requirements: 5.3, 5.4, 5.10, 15.3_
  
  - [ ]* 32.4 Write tests for UserManagement component
    - Test renders user list
    - Test selection and bulk actions
    - Test filters and search
    - Test verify/reject modal
    - Test export functionality
    - Mock user API service
    - _Requirements: 9.1, 9.5, 16.5_
  
  - [ ]* 32.5 Write tests for mobile responsiveness
    - Test components render correctly on mobile viewport
    - Test sidebar collapsible behavior
    - Test touch-friendly button sizes
    - Use viewport resize in tests
    - _Requirements: 18.1, 18.2, 18.4_

- [ ] 33. Documentation
  - [ ] 33.1 Create API documentation
    - Document all admin API endpoints
    - Include request/response examples
    - Document authentication requirements
    - Document error codes and messages
    - Use OpenAPI/Swagger format if possible
    - _Requirements: All API endpoints_
  
  - [ ] 33.2 Create setup guide
    - Document how to run database migrations
    - Document how to run setup script
    - Document required environment variables
    - Include troubleshooting section
    - _Requirements: 1.1, 20.3, 20.4_
  
  - [ ] 33.3 Create admin user guide
    - Document how to access admin dashboard
    - Document how to create and manage admin users
    - Document how to use audit logs
    - Document how to manage users, listings, payments
    - Include screenshots
    - _Requirements: All user-facing features_
  
  - [ ] 33.4 Create security documentation
    - Document password requirements
    - Document session management
    - Document 2FA setup process
    - Document audit logging capabilities
    - Document rate limiting and protection measures
    - _Requirements: 7.1, 6.1, 13.1, 5.1, 25.2_
  
  - [ ] 33.5 Update project README
    - Add section about admin system
    - Link to detailed documentation
    - Document new npm scripts (setup:admin)
    - Update environment variable list
    - _Requirements: 11.7_

- [ ] 34. Deployment Preparation
  - [ ] 34.1 Create production environment checklist
    - Verify all environment variables are set
    - Verify database migrations are applied
    - Verify setup script has been run
    - Verify JWT secret is strong and unique
    - Verify HTTPS is enabled
    - _Requirements: Security Best Practices_
  
  - [ ] 34.2 Configure production security headers
    - Set up Helmet.js with appropriate CSP
    - Configure CORS for production domain
    - Enable HSTS headers
    - Configure secure cookie settings
    - _Requirements: Security Best Practices_
  
  - [ ] 34.3 Set up production logging
    - Configure Winston for production log levels
    - Set up log rotation
    - Configure error tracking (Sentry or similar)
    - Ensure sensitive data not logged
    - _Requirements: 20.7, 20.8_
  
  - [ ] 34.4 Create database backup strategy
    - Document backup procedures for audit logs
    - Set up automated backups
    - Test restore procedures
    - Document retention policy (365 days for audit logs)
    - _Requirements: 5.9_
  
  - [ ] 34.5 Performance optimization
    - Add database indexes for frequently queried fields
    - Optimize audit log queries with proper indexes
    - Add caching for dashboard metrics
    - Compress API responses
    - _Requirements: 19.10_

- [ ] 35. Final Integration and Testing
  - [ ] 35.1 End-to-end testing of complete admin workflow
    - Run setup script to create first admin
    - Login as admin and verify dashboard loads
    - Create additional admin users
    - Test all CRUD operations on users, listings, payments
    - Test audit log entries are created correctly
    - Test export functionality
    - Test 2FA enable/disable flow
    - Test session timeout and extension
    - _Requirements: All requirements_
  
  - [ ] 35.2 Cross-browser testing
    - Test admin interface on Chrome, Firefox, Safari, Edge
    - Test on mobile browsers (iOS Safari, Chrome Mobile)
    - Fix any browser-specific issues
    - _Requirements: 18.1_
  
  - [ ] 35.3 Performance testing
    - Test dashboard load time with large datasets
    - Test pagination performance with 10000+ records
    - Test export performance with maximum allowed records
    - Test concurrent admin user sessions
    - _Requirements: 17.6, 19.1_
  
  - [ ] 35.4 Security testing
    - Test authentication and authorization thoroughly
    - Test for SQL injection vulnerabilities
    - Test for XSS vulnerabilities
    - Test rate limiting effectiveness
    - Test CSRF protection
    - Test session management security
    - _Requirements: 12.1, 25.1, 25.2, 25.6_
  
  - [ ] 35.5 Accessibility testing
    - Test keyboard navigation
    - Test screen reader compatibility
    - Verify color contrast ratios
    - Test form labels and ARIA attributes
    - _Requirements: Accessibility Best Practices_

- [ ] 36. Final Checkpoint and Handoff
  - Verify all requirements are implemented
  - Verify all tests pass
  - Verify documentation is complete
  - Verify deployment checklist is ready
  - Create demo video or walkthrough
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for full traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Testing tasks cover unit, integration, and end-to-end scenarios
- Security is prioritized throughout with proper validation, authentication, and audit logging
- The implementation follows a layered approach: Database → Backend Services → API → Frontend
- Mobile responsiveness and accessibility are built-in from the start
- Documentation is comprehensive covering setup, usage, API, and security


## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3"]
    },
    {
      "id": 1,
      "tasks": ["1.4", "2.5", "11.1"]
    },
    {
      "id": 2,
      "tasks": ["2.1", "2.2", "2.3", "2.4", "11.2"]
    },
    {
      "id": 3,
      "tasks": ["3.1", "3.2", "3.3", "11.3"]
    },
    {
      "id": 4,
      "tasks": ["4.1", "4.2", "4.3", "11.4"]
    },
    {
      "id": 5,
      "tasks": ["4.4", "4.5", "4.6", "4.7", "5.1", "6.1", "7.1", "11.5"]
    },
    {
      "id": 6,
      "tasks": ["5.2", "5.3", "6.2", "6.3", "7.2", "7.3", "7.4", "8.1", "11.6", "11.7"]
    },
    {
      "id": 7,
      "tasks": ["5.4", "8.2", "8.3", "8.4", "8.5", "8.6", "9.1", "9.2", "10.1"]
    },
    {
      "id": 8,
      "tasks": ["9.3", "10.2", "10.3", "10.4", "12.1", "12.2"]
    },
    {
      "id": 9,
      "tasks": ["12.3", "12.4", "12.5", "12.6", "12.7", "12.8"]
    },
    {
      "id": 10,
      "tasks": ["14.1", "24.1", "24.2", "24.3", "24.4"]
    },
    {
      "id": 11,
      "tasks": ["14.2", "14.3", "23.1", "23.2", "23.3"]
    },
    {
      "id": 12,
      "tasks": ["14.4", "14.5", "14.6", "15.1", "23.4", "23.5", "23.6"]
    },
    {
      "id": 13,
      "tasks": ["15.2", "15.3", "15.4", "15.5", "17.1"]
    },
    {
      "id": 14,
      "tasks": ["15.6", "15.7", "16.1", "16.2", "17.2", "17.3", "18.1"]
    },
    {
      "id": 15,
      "tasks": ["16.3", "17.4", "17.5", "17.6", "18.2", "18.3"]
    },
    {
      "id": 16,
      "tasks": ["18.4", "18.5", "18.6", "18.7", "19.1"]
    },
    {
      "id": 17,
      "tasks": ["19.2", "19.3", "19.4", "19.5", "20.1"]
    },
    {
      "id": 18,
      "tasks": ["19.6", "20.2", "20.3", "20.4"]
    },
    {
      "id": 19,
      "tasks": ["20.5", "20.6", "20.7", "22.1", "22.2"]
    },
    {
      "id": 20,
      "tasks": ["21.1", "21.2", "21.3", "21.4", "21.5", "22.3", "22.4"]
    },
    {
      "id": 21,
      "tasks": ["25.1", "25.2", "25.3", "25.4", "25.5", "25.6"]
    },
    {
      "id": 22,
      "tasks": ["26.1", "26.2", "26.3", "26.4", "26.5"]
    },
    {
      "id": 23,
      "tasks": ["28.1", "28.2", "28.3", "28.4", "28.5"]
    },
    {
      "id": 24,
      "tasks": ["29.1", "29.2", "29.3", "29.4", "29.5"]
    },
    {
      "id": 25,
      "tasks": ["30.1", "30.2", "30.3", "31.1"]
    },
    {
      "id": 26,
      "tasks": ["32.1", "32.2", "32.3", "32.4", "32.5"]
    },
    {
      "id": 27,
      "tasks": ["33.1", "33.2", "33.3", "33.4", "33.5"]
    },
    {
      "id": 28,
      "tasks": ["34.1", "34.2", "34.3", "34.4", "34.5"]
    },
    {
      "id": 29,
      "tasks": ["35.1", "35.2", "35.3", "35.4", "35.5"]
    }
  ]
}
```
