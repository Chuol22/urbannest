# Design Document: Super Admin Management System

## Overview

The Super Admin Management System is a comprehensive administrative framework for UrbanNEST that provides secure initial setup, role-based access control, comprehensive audit logging, and an enhanced dashboard interface. The system addresses critical security and operational requirements through a multi-layered approach:

- **Security Layer**: Strong password policies, bcrypt hashing, JWT authentication, two-factor authentication
- **Initial Bootstrap**: One-time setup script for creating the first admin securely
- **Admin Lifecycle**: Full CRUD operations for admin user management with self-protection rules
- **Audit Layer**: Complete activity logging with search, filter, and export capabilities
- **Dashboard Enhancement**: System metrics, user management, listing moderation, payment reconciliation
- **Access Control**: Strict RBAC with middleware chain enforcement

This design integrates seamlessly with the existing UrbanNEST architecture by extending the User model, leveraging existing authentication middleware, and building on established patterns for API endpoints and frontend components.

### Key Design Goals

1. **Security First**: All admin operations require authentication, authorization, and audit logging
2. **Idempotent Setup**: Safe initial bootstrap that prevents duplicate admin creation
3. **Operational Efficiency**: Bulk actions, search/filter, export capabilities for managing scale
4. **Auditability**: Every administrative action is logged with full context
5. **User Experience**: Mobile-responsive, real-time updates, intuitive workflows
6. **Data Integrity**: Soft deletes, confirmation dialogs, transaction safety

---

## Architecture

### High-Level Component Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        AD[Admin Dashboard]
        AMF[Admin Management Forms]
        ALV[Audit Log Viewer]
        SM[System Metrics]
        UM[User Management]
        LM[Listing Management]
        PM[Payment Management]
    end
    
    subgraph "API Layer"
        AR[Admin Routes]
        AM[Auth Middleware]
        RM[RBAC Middleware]
        AC[Admin Controller]
        ALC[Audit Log Controller]
        MC[Metrics Controller]
    end
    
    subgraph "Service Layer"
        AS[Auth Service]
        PS[Password Service]
        TS[TOTP Service]
        ALS[Audit Log Service]
        ES[Export Service]
        SS[Search Service]
    end
    
    subgraph "Data Layer"
        PC[Prisma Client]
        DB[(PostgreSQL)]
        UT[User Table]
        ALT[Audit Log Table]
        PT[Property Table]
        LFT[Listing Fee Payment Table]
    end
    
    subgraph "Setup Script"
        SES[Setup Entry Script]
        VAL[Validation Module]
        UCS[User Creation Service]
    end
    
    AD --> AR
    AMF --> AR
    ALV --> ALC
    SM --> MC
    UM --> AR
    LM --> AR
    PM --> AR
    
    AR --> AM
    AM --> RM
    RM --> AC
    AR --> ALC
    AR --> MC
    
    AC --> AS
    AC --> ALS
    AC --> PS
    AC --> TS
    ALC --> ALS
    MC --> PC
    
    AS --> PC
    PS --> PC
    ALS --> PC
    ES --> PC
    SS --> PC
    
    PC --> DB
    DB --> UT
    DB --> ALT
    DB --> PT
    DB --> LFT
    
    SES --> VAL
    SES --> UCS
    UCS --> PS
    UCS --> PC
```

### Architecture Layers

#### 1. Frontend Layer (React + TypeScript)
- **Admin Dashboard**: Main hub with system metrics, navigation, and real-time updates
- **Admin Management**: Forms for creating, updating, deactivating admin users
- **Audit Log Viewer**: Search, filter, paginate, and export audit records
- **Enhanced Admin Sections**: User management, listing moderation, payment reconciliation
- **Mobile Responsive**: Collapsible sidebar, touch-friendly controls, responsive tables

#### 2. API Layer (Express.js)
- **Admin Routes**: RESTful endpoints protected by authentication and RBAC
- **Middleware Chain**: Token verification → Role checking → Controller execution
- **Controllers**: Business logic orchestration, validation, response formatting
- **Error Handling**: Consistent error responses with proper HTTP status codes

#### 3. Service Layer
- **Auth Service**: JWT generation, session management, token validation
- **Password Service**: Bcrypt hashing, strength validation, comparison
- **TOTP Service**: Two-factor authentication with time-based one-time passwords
- **Audit Log Service**: Activity recording, metadata storage, query optimization
- **Export Service**: CSV generation with sanitization and encoding
- **Search Service**: Full-text search with filtering and pagination

#### 4. Data Layer (Prisma + PostgreSQL)
- **Prisma Client**: Type-safe database queries, migrations, transactions
- **User Table**: Extended with 2FA fields (two_factor_enabled, two_factor_secret)
- **Audit Log Table**: New table for comprehensive activity logging
- **Existing Tables**: Property, ListingFeePayment, Booking, etc.

#### 5. Setup Script (Node.js)
- **One-Time Execution**: Creates first admin user from environment variables
- **Idempotent**: Safe to run multiple times, exits early if admin exists
- **Validation**: Strong password requirements, email format, phone format
- **Atomic**: Database transaction ensures all-or-nothing creation

### Data Flow Patterns

#### Admin Creation Flow
```
User fills form → Frontend validation → POST /api/admin/users
→ Auth middleware → RBAC middleware → Validation
→ Password hashing → User creation → Audit log entry
→ Response with sanitized user data → UI update
```

#### Audit Log Query Flow
```
User applies filters → GET /api/admin/audit-logs?filters
→ Auth middleware → RBAC middleware → Query builder
→ Prisma query with filters → Pagination → Response
→ UI displays results with highlighting
```

#### Setup Script Flow
```
Script execution → Load env vars → Check existing admins
→ If exists: exit(0)
→ Validate credentials → Hash password → Create user in transaction
→ Success: log details, exit(0)
→ Failure: rollback, log error, exit(1)
```

---

## Components and Interfaces

### Database Schema Extensions

#### 1. User Model Extensions (2FA Support)

```prisma
model User {
  // ... existing fields ...
  
  // Two-Factor Authentication fields
  two_factor_enabled  Boolean   @default(false) @map("two_factor_enabled")
  two_factor_secret   String?   @map("two_factor_secret") @db.VarChar(255)
  
  // ... existing relations ...
  audit_logs          AuditLog[] @relation("AdminActions")
  
  @@index([two_factor_enabled])
  @@map("users")
}
```

#### 2. Audit Log Table (New)

```prisma
model AuditLog {
  id              String    @id @default(uuid()) @db.Uuid
  admin_id        String    @db.Uuid
  action_type     String    @db.VarChar(50)  // CREATE_ADMIN, UPDATE_USER, APPROVE_LISTING, etc.
  target_resource String    @db.VarChar(50)  // USER, PROPERTY, PAYMENT, etc.
  target_id       String?   @db.Uuid
  ip_address      String?   @db.VarChar(45)
  user_agent      String?   @db.VarChar(255)
  metadata        Json?                        // Additional context (old values, reason, etc.)
  created_at      DateTime  @default(now()) @map("created_at")
  
  admin           User      @relation("AdminActions", fields: [admin_id], references: [id], onDelete: Cascade)
  
  @@index([admin_id])
  @@index([action_type])
  @@index([target_resource])
  @@index([target_id])
  @@index([created_at])
  @@map("audit_logs")
}
```

**Migration Script**:
```sql
-- Add 2FA fields to users table
ALTER TABLE users 
ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN two_factor_secret VARCHAR(255);

CREATE INDEX idx_users_two_factor_enabled ON users(two_factor_enabled);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  target_resource VARCHAR(50) NOT NULL,
  target_id UUID,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_target_resource ON audit_logs(target_resource);
CREATE INDEX idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### API Endpoints

#### Admin User Management

**Base Path**: `/api/admin`

| Method | Endpoint | Description | Auth | Body/Query |
|--------|----------|-------------|------|------------|
| POST | `/users` | Create new admin user | Admin | `{ email, phone, password, first_name, last_name }` |
| GET | `/users` | List all admin users | Admin | `?page=1&limit=20&active=true` |
| GET | `/users/:id` | Get admin user details | Admin | - |
| PUT | `/users/:id` | Update admin user | Admin | `{ email?, phone?, first_name?, last_name? }` |
| PUT | `/users/:id/password` | Update admin password | Admin | `{ newPassword, currentPassword? }` |
| POST | `/users/:id/deactivate` | Deactivate admin user | Admin | - |
| POST | `/users/:id/activate` | Reactivate admin user | Admin | - |
| POST | `/users/:id/enable-2fa` | Enable 2FA for admin | Admin | - |
| POST | `/users/:id/verify-2fa` | Verify 2FA setup | Admin | `{ code }` |
| POST | `/users/:id/disable-2fa` | Disable 2FA | Admin | `{ password }` |

#### Audit Logs

| Method | Endpoint | Description | Auth | Query |
|--------|----------|-------------|------|-------|
| GET | `/audit-logs` | List audit logs | Admin | `?page=1&limit=50&admin_id&action_type&resource&from_date&to_date&search` |
| GET | `/audit-logs/:id` | Get audit log details | Admin | - |
| GET | `/audit-logs/export` | Export to CSV | Admin | Same as list query |

#### Dashboard Metrics

| Method | Endpoint | Description | Auth | Query |
|--------|----------|-------------|------|-------|
| GET | `/dashboard` | Get system metrics | Admin | - |
| GET | `/dashboard/users` | User statistics | Admin | `?role&status` |
| GET | `/dashboard/properties` | Property statistics | Admin | `?status&type` |
| GET | `/dashboard/revenue` | Revenue statistics | Admin | `?from_date&to_date` |

#### Enhanced User Management

| Method | Endpoint | Description | Auth | Body/Query |
|--------|----------|-------------|------|------------|
| GET | `/users/all` | All platform users | Admin | `?page&limit&role&status&search` |
| PUT | `/users/all/:id/verify` | Verify user | Admin | `{ verification_status, rejection_reason? }` |
| POST | `/users/all/:id/deactivate` | Deactivate user | Admin | `{ reason }` |
| POST | `/users/all/:id/activate` | Activate user | Admin | - |
| POST | `/users/all/bulk-action` | Bulk user action | Admin | `{ action, user_ids }` |
| GET | `/users/all/export` | Export users CSV | Admin | Same as list query |

#### Enhanced Listing Management

| Method | Endpoint | Description | Auth | Body/Query |
|--------|----------|-------------|------|------------|
| POST | `/listings/bulk-approve` | Bulk approve listings | Admin | `{ listing_ids }` |
| POST | `/listings/bulk-reject` | Bulk reject listings | Admin | `{ listing_ids, reason }` |

#### Enhanced Payment Management

| Method | Endpoint | Description | Auth | Body/Query |
|--------|----------|-------------|------|------------|
| POST | `/payments/:id/complete` | Manually complete payment | Admin | `{ reason }` |
| GET | `/payments/export` | Export payments CSV | Admin | Same as list query |

### Request/Response Examples

#### Create Admin User

**Request**:
```http
POST /api/admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "email": "john.admin@urbannest.com",
  "phone": "+251911234567",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Smith"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "john.admin@urbannest.com",
    "phone": "+251911234567",
    "first_name": "John",
    "last_name": "Smith",
    "role": "admin",
    "is_active": true,
    "is_verified": true,
    "verification_status": "approved",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response** (Validation Error):
```json
{
  "success": false,
  "message": "Password must contain at least one uppercase letter"
}
```

#### Get Audit Logs

**Request**:
```http
GET /api/admin/audit-logs?page=1&limit=50&action_type=APPROVE_LISTING&from_date=2024-01-01
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-uuid-1",
        "admin_id": "admin-uuid-1",
        "admin_name": "Jane Doe",
        "action_type": "APPROVE_LISTING",
        "target_resource": "PROPERTY",
        "target_id": "property-uuid-1",
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "metadata": {
          "property_title": "Modern 2BR Apartment",
          "previous_status": "pending",
          "new_status": "available"
        },
        "created_at": "2024-01-15T14:20:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

### Frontend Components

#### 1. AdminDashboard Component

**Path**: `client/src/pages/admin/AdminDashboard.tsx`

**Features**:
- System metrics cards (users, listings, revenue, pending approvals)
- Recent activity timeline
- Quick action buttons
- Real-time data refresh (30-second polling)
- Visual charts using Recharts

**State Management**:
```typescript
interface DashboardState {
  stats: SystemStats;
  recentActivity: AuditLog[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date;
}

interface SystemStats {
  users: {
    total: number;
    byRole: Record<Role, number>;
    pendingVerification: number;
    active: number;
  };
  properties: {
    total: number;
    byStatus: Record<PropertyStatus, number>;
    pendingReview: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    completedPayments: number;
  };
  admins: {
    total: number;
    active: number;
  };
}
```

#### 2. AdminManagementPage Component

**Path**: `client/src/pages/admin/AdminManagement.tsx`

**Features**:
- List of all admin users with status indicators
- Create admin form modal
- Update admin details
- Deactivate/activate toggle
- Password reset
- 2FA enable/disable

**Subcomponents**:
- `AdminTable`: Sortable, filterable table
- `CreateAdminModal`: Form with validation
- `AdminDetailsDrawer`: Side panel with full details

#### 3. AuditLogViewer Component

**Path**: `client/src/pages/admin/AuditLogs.tsx`

**Features**:
- Paginated log table
- Advanced filters (admin, action type, resource, date range)
- Full-text search
- Export to CSV button
- Expandable rows for metadata viewing
- Syntax highlighting for JSON metadata

#### 4. EnhancedUserManagement Component

**Path**: `client/src/pages/admin/UserManagement.tsx`

**Features**:
- All platform users (not just admins)
- Role-based filtering
- Verification status management
- Bulk actions (approve, reject, deactivate)
- User statistics panel
- CSV export

#### 5. EnhancedListingManagement Component

**Path**: `client/src/pages/admin/ListingManagement.tsx`

**Features**:
- Property cards with thumbnails
- Bulk approve/reject
- Detailed property viewer
- Rejection reason form
- Payment status indicator

#### 6. EnhancedPaymentManagement Component

**Path**: `client/src/pages/admin/PaymentManagement.tsx`

**Features**:
- Payment transaction table
- Status filters
- Date range picker
- Revenue charts
- Manual completion with confirmation
- CSV export

### Services and Utilities

#### Password Service

**Path**: `server/src/services/password.service.js`

```javascript
class PasswordService {
  // Validate password strength
  validate(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    if (password.length < minLength) {
      errors.push('Password must be at least 8 characters');
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumber) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Hash password with bcrypt
  async hash(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
  
  // Compare password with hash
  async compare(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}
```

#### Audit Log Service

**Path**: `server/src/services/auditLog.service.js`

```javascript
class AuditLogService {
  // Create audit log entry
  async log({ adminId, actionType, targetResource, targetId, ipAddress, userAgent, metadata }) {
    return await prisma.auditLog.create({
      data: {
        admin_id: adminId,
        action_type: actionType,
        target_resource: targetResource,
        target_id: targetId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: metadata || {}
      }
    });
  }
  
  // Query audit logs with filters
  async query({ page = 1, limit = 50, adminId, actionType, resource, fromDate, toDate, search }) {
    const where = {};
    
    if (adminId) where.admin_id = adminId;
    if (actionType) where.action_type = actionType;
    if (resource) where.target_resource = resource;
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate);
    }
    if (search) {
      // Search in metadata JSON
      where.OR = [
        { metadata: { path: '$', string_contains: search } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);
    
    return {
      logs: logs.map(log => ({
        ...log,
        admin_name: `${log.admin.first_name} ${log.admin.last_name}`
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  // Export to CSV
  async exportToCsv(filters) {
    const { logs } = await this.query({ ...filters, limit: 10000 });
    
    const csvRows = [
      ['ID', 'Admin', 'Action', 'Resource', 'Target ID', 'IP Address', 'Timestamp', 'Metadata'].join(',')
    ];
    
    for (const log of logs) {
      const row = [
        log.id,
        `"${log.admin_name}"`,
        log.action_type,
        log.target_resource,
        log.target_id || '',
        log.ip_address || '',
        log.created_at.toISOString(),
        `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"`
      ].join(',');
      csvRows.push(row);
    }
    
    return csvRows.join('\n');
  }
}
```

#### TOTP Service (2FA)

**Path**: `server/src/services/totp.service.js`

```javascript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

class TOTPService {
  // Generate secret for user
  generateSecret(email) {
    return speakeasy.generateSecret({
      name: `UrbanNEST Admin (${email})`,
      issuer: 'UrbanNEST'
    });
  }
  
  // Generate QR code data URL
  async generateQRCode(secret) {
    return await QRCode.toDataURL(secret.otpauth_url);
  }
  
  // Verify TOTP code
  verify(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2-step window for clock skew
    });
  }
}
```

#### Export Service

**Path**: `server/src/services/export.service.js`

```javascript
class ExportService {
  // Sanitize cell value to prevent formula injection
  sanitizeCell(value) {
    if (typeof value === 'string' && /^[=+\-@]/.test(value)) {
      return `'${value}`;
    }
    return value;
  }
  
  // Convert array of objects to CSV
  toCsv(data, columns) {
    const header = columns.map(col => `"${col.label}"`).join(',');
    const rows = data.map(row => {
      return columns.map(col => {
        const value = col.accessor(row);
        const sanitized = this.sanitizeCell(value);
        return `"${String(sanitized).replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    return [header, ...rows].join('\n');
  }
  
  // Generate filename with timestamp
  generateFilename(prefix) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}.csv`;
  }
}
```

---

## Data Models

### User Model (Extended)

```typescript
interface User {
  id: string;
  email: string | null;
  phone: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  verification_status: VerificationStatus;
  verification_document_url: string | null;
  verification_rejection_reason: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
  is_active: boolean;
  role: Role;
  
  // 2FA fields (NEW)
  two_factor_enabled: boolean;
  two_factor_secret: string | null; // Encrypted TOTP secret
}

type Role = 'seeker' | 'owner' | 'agent' | 'admin';
type VerificationStatus = 'pending_review' | 'approved' | 'rejected';
```

### AuditLog Model (New)

```typescript
interface AuditLog {
  id: string;
  admin_id: string;
  action_type: ActionType;
  target_resource: ResourceType;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  
  // Relations
  admin: User;
}

type ActionType =
  | 'CREATE_ADMIN'
  | 'UPDATE_ADMIN'
  | 'DEACTIVATE_ADMIN'
  | 'ACTIVATE_ADMIN'
  | 'UPDATE_PASSWORD'
  | 'ENABLE_2FA'
  | 'DISABLE_2FA'
  | 'APPROVE_USER'
  | 'REJECT_USER'
  | 'DEACTIVATE_USER'
  | 'ACTIVATE_USER'
  | 'APPROVE_LISTING'
  | 'REJECT_LISTING'
  | 'BULK_APPROVE_LISTINGS'
  | 'BULK_REJECT_LISTINGS'
  | 'COMPLETE_PAYMENT'
  | 'EXPORT_DATA';

type ResourceType =
  | 'USER'
  | 'PROPERTY'
  | 'PAYMENT'
  | 'ADMIN';
```

### Frontend State Types

```typescript
// Admin management state
interface AdminManagementState {
  admins: AdminUser[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: {
    active: boolean | null;
    search: string;
  };
}

interface AdminUser {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: 'admin';
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  last_login: string | null;
}

// Audit log state
interface AuditLogState {
  logs: AuditLogEntry[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: AuditLogFilters;
}

interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  action_type: ActionType;
  target_resource: ResourceType;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface AuditLogFilters {
  admin_id: string | null;
  action_type: ActionType | null;
  resource: ResourceType | null;
  from_date: string | null;
  to_date: string | null;
  search: string;
}

// Dashboard metrics state
interface DashboardMetrics {
  users: UserMetrics;
  properties: PropertyMetrics;
  revenue: RevenueMetrics;
  admins: AdminMetrics;
  recentActivity: AuditLogEntry[];
}

interface UserMetrics {
  total: number;
  byRole: Record<Role, number>;
  pendingVerification: number;
  active: number;
}

interface PropertyMetrics {
  total: number;
  byStatus: Record<PropertyStatus, number>;
  pendingReview: number;
}

interface RevenueMetrics {
  total: number;
  thisMonth: number;
  completedPayments: number;
}

interface AdminMetrics {
  total: number;
  active: number;
}
```

---

## Security Design

### 1. Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Server
    participant MW as Auth Middleware
    participant AS as Auth Service
    participant DB as Database
    participant TS as TOTP Service
    
    C->>API: POST /api/auth/login
    API->>DB: Find user by email/phone
    DB-->>API: User record
    API->>AS: Compare password
    AS-->>API: Password valid
    
    alt 2FA Enabled
        API-->>C: 200 { requires2FA: true }
        C->>API: POST /api/auth/verify-2fa { code }
        API->>TS: Verify TOTP code
        TS-->>API: Code valid
    end
    
    API->>AS: Generate JWT token
    AS-->>API: JWT token
    API-->>C: 200 { token, user }
    
    Note over C: Store token in httpOnly cookie
    
    C->>API: GET /api/admin/dashboard
    API->>MW: Verify token
    MW->>AS: Validate JWT
    AS-->>MW: Token valid, user data
    MW->>DB: Check is_active status
    DB-->>MW: User active
    MW->>MW: Check role = 'admin'
    MW-->>API: Authorization granted
    API-->>C: 200 { dashboard data }
```

### 2. Role-Based Access Control (RBAC)

**Middleware Chain**:
```javascript
// server/src/middleware/auth.middleware.js
class AuthMiddleware {
  // Verify JWT token
  verifyToken(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check expiration
      if (decoded.exp < Date.now() / 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }
      
      req.userId = decoded.id;
      req.userRole = decoded.role;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  }
  
  // Check user role
  checkRole(allowedRoles) {
    return async (req, res, next) => {
      try {
        // Load fresh user data to check is_active
        const user = await prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            role: true,
            is_active: true,
            first_name: true,
            last_name: true,
            email: true,
            two_factor_enabled: true
          }
        });
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found.'
          });
        }
        
        if (!user.is_active) {
          return res.status(403).json({
            success: false,
            message: 'Account is deactivated.'
          });
        }
        
        if (!allowedRoles.includes(user.role)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
          });
        }
        
        req.user = user;
        next();
      } catch (error) {
        console.error('Role check error:', error);
        res.status(500).json({
          success: false,
          message: 'Authorization check failed.'
        });
      }
    };
  }
}
```

**Route Protection**:
```javascript
// server/src/routes/admin.routes.js
import authMiddleware from '../middleware/auth.middleware.js';

// All admin routes require authentication + admin role
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.checkRole(['admin']));

// Now all routes are protected
router.get('/dashboard', adminController.getDashboardStats);
router.post('/users', adminController.createAdmin);
// ... etc
```

### 3. Password Security

**Requirements**:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

**Hashing**:
- Algorithm: bcrypt
- Salt rounds: 10
- Never store plaintext passwords
- Never log or return password hashes in API responses

**Validation Implementation**:
```javascript
// server/src/utils/validators.js
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?\d+$/;
  return phoneRegex.test(phone);
};
```

### 4. Session Management

**JWT Token Structure**:
```json
{
  "id": "user-uuid",
  "email": "admin@urbannest.com",
  "role": "admin",
  "iat": 1705320000,
  "exp": 1705334400
}
```

**Token Configuration**:
- Expiration: 4 hours
- Storage: httpOnly secure cookies
- Refresh: On user activity (optional enhancement)
- Invalidation: On logout, password change, or deactivation

**Cookie Settings**:
```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 4 * 60 * 60 * 1000 // 4 hours
});
```

### 5. Two-Factor Authentication (2FA)

**TOTP (Time-Based One-Time Password)**:
- Algorithm: TOTP (RFC 6238)
- Time step: 30 seconds
- Window: ±2 steps (allows for clock skew)
- Secret length: 32 characters (base32)

**Setup Flow**:
1. Admin enables 2FA in settings
2. Server generates TOTP secret
3. Server encrypts secret and stores in database
4. Server generates QR code
5. Client displays QR code
6. Admin scans with authenticator app
7. Admin enters verification code
8. Server verifies code and enables 2FA

**Login Flow with 2FA**:
1. Admin enters email/password
2. Server validates credentials
3. If 2FA enabled, return `{ requires2FA: true }`
4. Client prompts for 6-digit code
5. Admin enters code from app
6. Server verifies code against stored secret
7. If valid, issue JWT token
8. If invalid, reject with error

**Encryption**:
```javascript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = 'aes-256-cbc';

export const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
};
```

### 6. Audit Logging

**What to Log**:
- All admin actions (create, update, delete, approve, reject)
- Authentication events (login, logout, failed attempts)
- Configuration changes
- Data exports
- Bulk operations

**Log Entry Structure**:
```json
{
  "id": "log-uuid",
  "admin_id": "admin-uuid",
  "action_type": "APPROVE_LISTING",
  "target_resource": "PROPERTY",
  "target_id": "property-uuid",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "metadata": {
    "property_title": "Modern 2BR Apartment",
    "previous_status": "pending",
    "new_status": "available",
    "reason": null
  },
  "created_at": "2024-01-15T14:20:00.000Z"
}
```

**Helper Function**:
```javascript
// server/src/utils/audit.js
export const logAuditAction = async ({ req, actionType, targetResource, targetId, metadata }) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  return await prisma.auditLog.create({
    data: {
      admin_id: req.user.id,
      action_type: actionType,
      target_resource: targetResource,
      target_id: targetId,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: metadata || {}
    }
  });
};
```

**Usage in Controller**:
```javascript
async approveListing(req, res) {
  try {
    const { id } = req.params;
    
    const property = await prisma.property.findUnique({ where: { id } });
    
    const updated = await prisma.property.update({
      where: { id },
      data: { status: 'available', listing_rejection_reason: null }
    });
    
    // Log the action
    await logAuditAction({
      req,
      actionType: 'APPROVE_LISTING',
      targetResource: 'PROPERTY',
      targetId: id,
      metadata: {
        property_title: property.title,
        previous_status: property.status,
        new_status: 'available'
      }
    });
    
    res.json({ success: true, message: 'Listing approved', data: updated });
  } catch (error) {
    console.error('Approve listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve listing' });
  }
}
```

### 7. Data Protection

**Soft Deletes**:
- Never hard delete User, Property, or Transaction records
- Use `deleted_at` timestamp for soft deletes
- Filter soft-deleted records in queries: `where: { deleted_at: null }`
- Provide restore function within 30 days

**Confirmation Dialogs**:
```typescript
// Destructive action confirmation
const confirmDelete = async (targetName: string) => {
  const confirmed = await showConfirmDialog({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete ${targetName}?`,
    confirmText: 'DELETE',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    variant: 'danger'
  });
  
  return confirmed;
};

// Type to confirm
const confirmWithTyping = async (targetName: string) => {
  const userInput = await showTypingConfirmDialog({
    title: 'Confirm Deletion',
    message: `This will permanently delete ${targetName}. Type DELETE to confirm.`,
    expectedText: 'DELETE'
  });
  
  return userInput === 'DELETE';
};
```

**Self-Protection Rules**:
- Admins cannot deactivate their own accounts
- Admins cannot delete their own accounts
- Last active admin cannot be deactivated

```javascript
// In deactivate controller
if (targetUserId === req.user.id) {
  return res.status(400).json({
    success: false,
    message: 'Cannot deactivate your own account'
  });
}

// Check if last admin
const activeAdminCount = await prisma.user.count({
  where: { role: 'admin', is_active: true }
});

if (activeAdminCount <= 1) {
  return res.status(400).json({
    success: false,
    message: 'Cannot deactivate the last active admin'
  });
}
```

### 8. Input Validation and Sanitization

**Server-Side Validation** (Always Required):
```javascript
// Example: Create admin validation
const validateCreateAdmin = (data) => {
  const errors = {};
  
  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = 'Valid phone number is required';
  }
  
  if (!data.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors.join(', ');
    }
  }
  
  if (!data.first_name || data.first_name.trim().length === 0) {
    errors.first_name = 'First name is required';
  }
  
  if (!data.last_name || data.last_name.trim().length === 0) {
    errors.last_name = 'Last name is required';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};
```

**XSS Prevention**:
- Escape HTML in user-generated content
- Use React's built-in XSS protection (JSX auto-escapes)
- Sanitize data before rendering in `dangerouslySetInnerHTML`

**SQL Injection Prevention**:
- Prisma uses parameterized queries (automatic protection)
- Never concatenate user input into raw SQL

**CSV Injection Prevention**:
```javascript
// Sanitize cells to prevent formula injection
const sanitizeForCsv = (value) => {
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) {
    return `'${value}`; // Prefix with single quote
  }
  return value;
};
```

---

## Setup Script Workflow

### Script Purpose
Create the first admin user securely from environment variables for initial system bootstrap.

### Script Location
`server/scripts/setup-admin.js`

### Environment Variables Required
```env
ADMIN_EMAIL=admin@urbannest.com
ADMIN_PASSWORD=SecurePass123!
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator
ADMIN_PHONE=+251911234567
```

### Script Implementation

```javascript
// server/scripts/setup-admin.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?\d+$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

const setupAdmin = async () => {
  try {
    console.log('🚀 Starting admin setup...');
    
    // 1. Load environment variables
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const firstName = process.env.ADMIN_FIRST_NAME;
    const lastName = process.env.ADMIN_LAST_NAME;
    const phone = process.env.ADMIN_PHONE;
    
    // 2. Check required variables
    const missing = [];
    if (!email) missing.push('ADMIN_EMAIL');
    if (!password) missing.push('ADMIN_PASSWORD');
    if (!firstName) missing.push('ADMIN_FIRST_NAME');
    if (!lastName) missing.push('ADMIN_LAST_NAME');
    if (!phone) missing.push('ADMIN_PHONE');
    
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
    
    // 3. Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists. Skipping setup.');
      process.exit(0);
    }
    
    console.log('✅ No existing admin found. Proceeding with creation...');
    
    // 4. Validate email
    if (!validateEmail(email)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }
    
    // 5. Validate phone
    if (!validatePhone(phone)) {
      console.error('❌ Invalid phone format (must contain only digits and optional + prefix)');
      process.exit(1);
    }
    
    // 6. Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.error('❌ Password validation failed:');
      passwordValidation.errors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }
    
    console.log('✅ Validation passed');
    
    // 7. Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 8. Create admin user (atomic transaction)
    console.log('💾 Creating admin user...');
    const admin = await prisma.$transaction(async (tx) => {
      return await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          password_hash: passwordHash,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: 'admin',
          is_verified: true,
          is_active: true,
          verification_status: 'approved'
        },
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          role: true,
          created_at: true
        }
      });
    });
    
    // 9. Success output
    console.log('\n✨ Admin user created successfully!');
    console.log('─'.repeat(50));
    console.log(`ID:         ${admin.id}`);
    console.log(`Email:      ${admin.email}`);
    console.log(`Phone:      ${admin.phone}`);
    console.log(`Name:       ${admin.first_name} ${admin.last_name}`);
    console.log(`Role:       ${admin.role}`);
    console.log(`Created At: ${admin.created_at.toISOString()}`);
    console.log('─'.repeat(50));
    console.log('\n🎉 Setup complete! You can now log in with the admin credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

setupAdmin();
```

### Script Execution

**Add to package.json**:
```json
{
  "scripts": {
    "setup:admin": "node scripts/setup-admin.js"
  }
}
```

**Run the script**:
```bash
npm run setup:admin
```

### Script Output Examples

**Success**:
```
🚀 Starting admin setup...
✅ No existing admin found. Proceeding with creation...
✅ Validation passed
🔐 Hashing password...
💾 Creating admin user...

✨ Admin user created successfully!
──────────────────────────────────────────────────
ID:         a1b2c3d4-e5f6-7890-abcd-ef1234567890
Email:      admin@urbannest.com
Phone:      +251911234567
Name:       System Administrator
Role:       admin
Created At: 2024-01-15T10:30:00.000Z
──────────────────────────────────────────────────

🎉 Setup complete! You can now log in with the admin credentials.
```

**Admin Already Exists**:
```
🚀 Starting admin setup...
ℹ️  Admin user already exists. Skipping setup.
```

**Missing Environment Variable**:
```
🚀 Starting admin setup...
❌ Missing required environment variables: ADMIN_EMAIL, ADMIN_PASSWORD
```

**Invalid Password**:
```
🚀 Starting admin setup...
✅ No existing admin found. Proceeding with creation...
❌ Password validation failed:
   - Password must be at least 8 characters
   - Password must contain at least one uppercase letter
   - Password must contain at least one special character
```

### Script Features

1. **Idempotent**: Safe to run multiple times
2. **Atomic**: Uses database transaction for all-or-nothing creation
3. **Validated**: Comprehensive validation before any database writes
4. **Secure**: Never logs passwords, uses bcrypt hashing
5. **Informative**: Clear success/error messages with details
6. **Exit Codes**:
   - `0`: Success (admin created or already exists)
   - `1`: Error (validation failed, creation failed)

---

## Integration Points with Existing System

### 1. Authentication System Integration

**Existing Auth Service** (`server/src/services/auth.service.js`):
- Extend to support 2FA verification step
- Add 2FA code validation before token issuance
- Maintain existing JWT structure with role field

**Modifications Needed**:
```javascript
// Add to existing auth service
class AuthService {
  // Existing methods...
  
  // NEW: Verify 2FA code
  async verify2FACode(userId, code) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { two_factor_secret: true, two_factor_enabled: true }
    });
    
    if (!user.two_factor_enabled || !user.two_factor_secret) {
      throw new Error('2FA not enabled for this user');
    }
    
    const decryptedSecret = decrypt(user.two_factor_secret);
    return totpService.verify(decryptedSecret, code);
  }
}
```

### 2. User Model Integration

**Existing User Model** (Prisma):
- Add `two_factor_enabled` and `two_factor_secret` fields
- No changes to existing fields or relations
- Backwards compatible with existing user queries

**Migration**:
```prisma
// Add to existing User model
model User {
  // ... all existing fields ...
  
  // NEW FIELDS
  two_factor_enabled Boolean @default(false) @map("two_factor_enabled")
  two_factor_secret  String?  @map("two_factor_secret") @db.VarChar(255)
  
  // NEW RELATION
  audit_logs AuditLog[] @relation("AdminActions")
  
  @@index([two_factor_enabled])
}
```

### 3. Middleware Integration

**Existing Auth Middleware** (`server/src/middleware/auth.middleware.js`):
- Already has `verifyToken` method ✓
- Already has `checkRole` method ✓
- Extend `checkRole` to load fresh user data and check `is_active`

**No Breaking Changes**:
- Existing protected routes continue to work
- New admin routes use same middleware pattern

### 4. Frontend Route Integration

**Existing Routes** (`client/src/App.tsx`):
- Add new admin routes under `/admin/*`
- Use existing `ProtectedRoute` component
- Add role check to `ProtectedRoute`

```typescript
// client/src/App.tsx additions
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminManagement from './pages/admin/AdminManagement';
import AuditLogs from './pages/admin/AuditLogs';
import UserManagement from './pages/admin/UserManagement';

// In Routes:
<Route element={<ProtectedRoute requiredRole="admin" />}>
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
  <Route path="/admin/users" element={<AdminManagement />} />
  <Route path="/admin/audit-logs" element={<AuditLogs />} />
  <Route path="/admin/user-management" element={<UserManagement />} />
  <Route path="/admin/listings" element={<ListingManagement />} />
  <Route path="/admin/payments" element={<PaymentManagement />} />
</Route>
```

### 5. API Client Integration

**Existing API Client** (`client/src/api/axios.ts`):
- Add admin-specific API methods
- Use existing axios instance with interceptors
- Maintain consistent error handling

```typescript
// client/src/api/admin.ts
import axios from './axios';

export const adminApi = {
  // Admin user management
  createAdmin: (data) => axios.post('/api/admin/users', data),
  getAdmins: (params) => axios.get('/api/admin/users', { params }),
  updateAdmin: (id, data) => axios.put(`/api/admin/users/${id}`, data),
  deactivateAdmin: (id) => axios.post(`/api/admin/users/${id}/deactivate`),
  
  // Audit logs
  getAuditLogs: (params) => axios.get('/api/admin/audit-logs', { params }),
  exportAuditLogs: (params) => axios.get('/api/admin/audit-logs/export', { params, responseType: 'blob' }),
  
  // Dashboard
  getDashboard: () => axios.get('/api/admin/dashboard'),
  
  // User management
  getAllUsers: (params) => axios.get('/api/admin/users/all', { params }),
  verifyUser: (id, data) => axios.put(`/api/admin/users/all/${id}/verify`, data),
  
  // ... etc
};
```

### 6. Database Schema Integration

**No Breaking Changes to Existing Tables**:
- User table: Add new columns (nullable, with defaults)
- New AuditLog table: No foreign key constraints on other tables
- Property, Payment, Booking tables: No modifications needed

**Backwards Compatibility**:
- Existing queries work without modification
- New fields have sensible defaults (`two_factor_enabled: false`)
- Optional relations (`audit_logs: []`)

### 7. Existing Admin Dashboard Enhancement

**Current Admin Dashboard** (`client/src/pages/admin/AdminDashboard.tsx`):
- Extend with new metrics sections
- Add admin management card
- Add audit log summary
- Keep existing broker/listing/payment sections

**Navigation Integration**:
```typescript
// Add to existing sidebar navigation
const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: DashboardIcon },
  { label: 'Admin Users', path: '/admin/users', icon: AdminIcon, new: true },
  { label: 'All Users', path: '/admin/user-management', icon: UsersIcon },
  { label: 'Brokers', path: '/admin/brokers', icon: BrokerIcon },
  { label: 'Listings', path: '/admin/listings', icon: ListingIcon },
  { label: 'Payments', path: '/admin/payments', icon: PaymentIcon },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: AuditIcon, new: true },
];
```

### 8. Styling Integration

**Use Existing Design System**:
- Tailwind CSS classes from existing components
- Color palette: primary, secondary, success, danger, warning
- Component library: Existing Button, Input, Modal, Table components
- Icons: Same icon library (Heroicons, Lucide, etc.)

**Consistency**:
- Match existing admin dashboard styling
- Use existing form patterns
- Follow existing table/card layouts
- Maintain responsive breakpoints

### 9. Error Handling Integration

**Use Existing Error Patterns**:
```typescript
// client/src/utils/errorHandler.ts (existing)
export const handleApiError = (error) => {
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Show access denied message
    toast.error('Access denied');
  } else {
    toast.error(error.response?.data?.message || 'An error occurred');
  }
};
```

### 10. State Management Integration

**Use Existing Patterns**:
- React Query for server state (if used)
- Context API for auth state (if used)
- Local state for form handling
- Consistent patterns across admin pages

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the requirements, several core behaviors can be expressed as universal properties suitable for property-based testing:

### Property 1: Password Validation Consistency

*For any* password string, the validation function SHALL correctly identify whether it meets all strength requirements (minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character), and return the specific validation errors for any rules that are not met.

**Validates: Requirements 1.4, 2.3, 3.2, 7.1-7.7**

### Property 2: Email Validation Correctness

*For any* string input, the email validation function SHALL correctly identify whether it matches a valid email format (contains @ symbol, has characters before and after @, has domain with at least one dot).

**Validates: Requirements 1.5**

### Property 3: Phone Validation Correctness

*For any* string input, the phone validation function SHALL correctly identify whether it contains only digits and an optional + prefix, rejecting any input with letters, spaces, or other special characters.

**Validates: Requirements 1.6**

### Property 4: Validation Error Messages

*For any* invalid input (password, email, phone), when validation fails, the system SHALL return a specific, descriptive error message indicating which validation rule was violated, and SHALL NOT proceed with the operation.

**Validates: Requirements 1.10, 2.10**

### Property 5: Audit Log Creation for Admin Actions

*For any* administrative action (create admin, update user, deactivate account, approve listing, reject listing, update password, enable 2FA, disable 2FA), the system SHALL create an audit log entry containing the admin ID, action type, target resource, target ID, IP address, user agent, timestamp, and relevant metadata.

**Validates: Requirements 2.8, 3.5, 4.5, 4.7, 5.1**

### Property 6: Audit Log Structure Integrity

*For any* audit log entry created, the record SHALL include all required fields (admin_id, action_type, target_resource, created_at), with target_id, ip_address, user_agent, and metadata being optional, and all values SHALL match their expected types.

**Validates: Requirements 5.2**

### Property 7: Password Hash Exclusion from Responses

*For any* API response containing user data (admin creation, update, retrieval), the response SHALL NOT include the password_hash field, and SHALL include all other user fields (id, email, phone, first_name, last_name, role, is_active, etc.).

**Validates: Requirements 2.9, 3.10, 7.9**

### Property 8: Self-Deactivation Prevention

*For any* admin user attempting to deactivate an account, if the target account ID matches the requesting admin's ID, the system SHALL reject the request with an error message and SHALL NOT modify the is_active field.

**Validates: Requirements 4.2, 4.3**

### Property 9: Audit Log Chronological Ordering

*For any* set of audit log entries, when retrieved from the database without specific filters, they SHALL be ordered by created_at in descending order (newest first).

**Validates: Requirements 5.3**

### Property 10: Audit Log Filtering Correctness

*For any* combination of filters (admin_id, action_type, target_resource, date range), the audit log query SHALL return only entries that match ALL specified filters (AND logic), and SHALL NOT return entries that fail any filter criterion.

**Validates: Requirements 5.4**

### Property 11: Audit Log Search Matching

*For any* search query string, the audit log search SHALL return entries where the query appears in either the target_id field or anywhere within the metadata JSON, using case-insensitive partial matching.

**Validates: Requirements 5.5**

### Property 12: Pagination Correctness

*For any* paginated result set with total count T, page size L, and page number P, the system SHALL return exactly L items (or fewer for the last page), the skip offset SHALL equal (P-1) × L, and the total pages SHALL equal ceil(T / L).

**Validates: Requirements 5.7**

### Property 13: CSV Export Format Correctness

*For any* data set exported to CSV, the output SHALL contain a header row with column labels, data rows with values matching the column order, proper escaping of quotes and special characters, UTF-8 encoding, and sanitization of values starting with =, +, -, or @ to prevent formula injection.

**Validates: Requirements 5.10, 17.1-17.9**

### Property 14: Admin Token Role Inclusion

*For any* JWT token generated for a user with role='admin', the token payload SHALL include the role field with value 'admin', and SHALL NOT be generated for users with other roles accessing admin endpoints.

**Validates: Requirements 6.9**

### Property 15: Active Status Filter Correctness

*For any* list of admin users, when filtering by is_active status (true or false), the returned results SHALL include only users matching the specified status, and SHALL NOT include users with the opposite status.

**Validates: Requirements 4.10**

### Property 16: Bulk Operation Atomicity Per Item

*For any* bulk operation (approve multiple listings, deactivate multiple users), each individual item operation SHALL be logged separately in the audit log, and if an individual operation fails, it SHALL NOT prevent other operations from completing (fail-safe).

**Validates: Requirements 16.6-16.9**

### Property 17: Search Case-Insensitivity

*For any* search query across user management, listing management, or audit logs, the search SHALL match results case-insensitively, so that "JOHN", "john", and "John" all return the same matching records.

**Validates: Requirements 15.2**

### Property 18: URL Query Parameter Filter Persistence

*For any* active filter or search state in the admin dashboard, the URL query parameters SHALL reflect the current state, and when the URL is shared or reloaded, the filters SHALL be restored from the query parameters.

**Validates: Requirements 15.8-15.9**

---

## Error Handling

### Error Categories

#### 1. Validation Errors (400 Bad Request)
- Invalid email format
- Invalid phone format
- Weak password (fails strength requirements)
- Missing required fields
- Duplicate email or phone (uniqueness violation)

**Response Format**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Valid email is required",
    "password": "Password must contain at least one uppercase letter"
  }
}
```

#### 2. Authentication Errors (401 Unauthorized)
- Missing token
- Invalid token
- Expired token
- Invalid credentials (wrong password)
- Invalid 2FA code
- Deactivated account attempting login

**Response Format**:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### 3. Authorization Errors (403 Forbidden)
- Non-admin accessing admin routes
- Deactivated admin attempting operations
- Self-deactivation attempt
- Attempting to deactivate last active admin

**Response Format**:
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

#### 4. Not Found Errors (404 Not Found)
- Admin user not found
- Audit log entry not found
- Target user not found
- Property not found

**Response Format**:
```json
{
  "success": false,
  "message": "Admin user not found"
}
```

#### 5. Server Errors (500 Internal Server Error)
- Database connection failure
- Unexpected exceptions
- External service failures (email, SMS)

**Response Format**:
```json
{
  "success": false,
  "message": "Failed to create admin user. Please try again."
}
```

### Error Handling Patterns

#### Controller Error Handling
```javascript
async createAdmin(req, res) {
  try {
    // Validate input
    const validation = validateCreateAdmin(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    // Check uniqueness
    const existingEmail = await prisma.user.findUnique({
      where: { email: req.body.email }
    });
    
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Create admin...
    
    res.json({ success: true, data: admin });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user'
    });
  }
}
```

#### Frontend Error Handling
```typescript
const handleApiError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    // Redirect to login
    localStorage.removeItem('token');
    navigate('/login');
    toast.error('Session expired. Please login again.');
  } else if (error.response?.status === 403) {
    toast.error('Access denied. Admin privileges required.');
  } else if (error.response?.status === 400) {
    const data = error.response.data as any;
    if (data.errors) {
      // Display validation errors
      Object.values(data.errors).forEach((msg) => {
        toast.error(msg as string);
      });
    } else {
      toast.error(data.message || 'Invalid request');
    }
  } else {
    toast.error('An unexpected error occurred. Please try again.');
  }
};
```

### Retry Logic

**Transient Failures**:
- Network timeouts: Retry up to 3 times with exponential backoff
- Database deadlocks: Retry once immediately
- Rate limiting: Wait and retry after specified delay

```typescript
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const isRetryable = error.code === 'ETIMEDOUT' || 
                         error.code === 'ECONNRESET' ||
                         error.response?.status === 429;
      
      if (!isRetryable) throw error;
      
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw new Error('Operation failed after retries');
};
```

---

## Testing Strategy

### Overview

The Super Admin Management System testing strategy employs a three-layered approach:

1. **Unit Tests**: Test individual functions and utilities in isolation (password validation, CSV sanitization, audit log formatting)
2. **Property-Based Tests**: Verify universal properties across wide input ranges (validation logic, filtering, search, CSV generation)
3. **Integration Tests**: Test API endpoints, database operations, authentication flows, and middleware chains

**PBT Library**: **fast-check** (JavaScript/TypeScript property-based testing library)
**Test Framework**: **Jest** or **Vitest** (existing project test framework)
**Minimum Iterations**: 100 runs per property test

### Property-Based Testing Implementation

#### Property 1: Password Validation

```typescript
// server/src/utils/__tests__/validators.pbt.test.ts
import fc from 'fast-check';
import { validatePassword } from '../validators';

describe('Property-Based Tests: Password Validation', () => {
  /**
   * Feature: super-admin-system
   * Property 1: Password Validation Consistency
   * For any password string, the validation function SHALL correctly identify 
   * whether it meets all strength requirements
   */
  test('password validation correctly identifies all requirement violations', () => {
    fc.assert(
      fc.property(fc.string(), (password) => {
        const result = validatePassword(password);
        
        // Check length requirement
        const meetsLength = password.length >= 8;
        const hasLengthError = result.errors.some(e => e.includes('8 characters'));
        expect(meetsLength).toBe(!hasLengthError);
        
        // Check uppercase requirement
        const hasUpperCase = /[A-Z]/.test(password);
        const hasUpperError = result.errors.some(e => e.includes('uppercase'));
        expect(hasUpperCase).toBe(!hasUpperError);
        
        // Check lowercase requirement
        const hasLowerCase = /[a-z]/.test(password);
        const hasLowerError = result.errors.some(e => e.includes('lowercase'));
        expect(hasLowerCase).toBe(!hasLowerError);
        
        // Check digit requirement
        const hasDigit = /\d/.test(password);
        const hasDigitError = result.errors.some(e => e.includes('number'));
        expect(hasDigit).toBe(!hasDigitError);
        
        // Check special char requirement
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasSpecialError = result.errors.some(e => e.includes('special'));
        expect(hasSpecial).toBe(!hasSpecialError);
        
        // Valid means all requirements met
        const allRequirementsMet = meetsLength && hasUpperCase && hasLowerCase && hasDigit && hasSpecial;
        expect(result.valid).toBe(allRequirementsMet);
      }),
      { numRuns: 100 }
    );
  });
});
```

#### Property 2: Email Validation

```typescript
/**
 * Feature: super-admin-system
 * Property 2: Email Validation Correctness
 * For any string input, the email validation function SHALL correctly identify 
 * whether it matches a valid email format
 */
test('email validation correctly identifies valid and invalid emails', () => {
  // Generator for valid emails
  const validEmailArb = fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 20 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 20 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 2, maxLength: 10 })
  ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);
  
  fc.assert(
    fc.property(validEmailArb, (email) => {
      const result = validateEmail(email);
      expect(result).toBe(true);
    }),
    { numRuns: 100 }
  );
  
  // Invalid emails should be rejected
  const invalidEmailArb = fc.oneof(
    fc.string().filter(s => !s.includes('@')), // No @ symbol
    fc.string().filter(s => s.startsWith('@')), // Starts with @
    fc.string().filter(s => s.endsWith('@')),   // Ends with @
    fc.constant('test@'),                        // No domain
    fc.constant('@example.com')                  // No local part
  );
  
  fc.assert(
    fc.property(invalidEmailArb, (email) => {
      const result = validateEmail(email);
      expect(result).toBe(false);
    }),
    { numRuns: 100 }
  );
});
```

#### Property 5: Audit Log Creation

```typescript
/**
 * Feature: super-admin-system
 * Property 5: Audit Log Creation for Admin Actions
 * For any administrative action, the system SHALL create an audit log entry
 */
test('every admin action creates an audit log entry', async () => {
  const actionArb = fc.record({
    adminId: fc.uuid(),
    actionType: fc.constantFrom('CREATE_ADMIN', 'UPDATE_USER', 'APPROVE_LISTING', 'DEACTIVATE_ADMIN'),
    targetResource: fc.constantFrom('USER', 'PROPERTY', 'ADMIN'),
    targetId: fc.uuid(),
    ipAddress: fc.ipV4(),
    userAgent: fc.string({ minLength: 10, maxLength: 100 }),
    metadata: fc.object()
  });
  
  await fc.assert(
    fc.asyncProperty(actionArb, async (action) => {
      // Log the action
      const logEntry = await auditLogService.log(action);
      
      // Verify log was created
      expect(logEntry).toBeDefined();
      expect(logEntry.admin_id).toBe(action.adminId);
      expect(logEntry.action_type).toBe(action.actionType);
      expect(logEntry.target_resource).toBe(action.targetResource);
      expect(logEntry.target_id).toBe(action.targetId);
      expect(logEntry.ip_address).toBe(action.ipAddress);
      expect(logEntry.user_agent).toBe(action.userAgent);
      expect(logEntry.created_at).toBeDefined();
      
      // Cleanup
      await prisma.auditLog.delete({ where: { id: logEntry.id } });
    }),
    { numRuns: 100 }
  );
});
```

#### Property 7: Password Hash Exclusion

```typescript
/**
 * Feature: super-admin-system
 * Property 7: Password Hash Exclusion from Responses
 * For any API response containing user data, the response SHALL NOT include password_hash
 */
test('API responses never contain password_hash field', () => {
  const userDataArb = fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    phone: fc.string(),
    first_name: fc.string(),
    last_name: fc.string(),
    role: fc.constant('admin'),
    is_active: fc.boolean(),
    password_hash: fc.string() // This should be removed
  });
  
  fc.assert(
    fc.property(userDataArb, (userData) => {
      // Simulate controller sanitization
      const { password_hash, ...sanitized } = userData;
      const response = { success: true, data: sanitized };
      
      // Verify password_hash is not in response
      expect(response.data.password_hash).toBeUndefined();
      expect('password_hash' in response.data).toBe(false);
      
      // Verify other fields are present
      expect(response.data.id).toBe(userData.id);
      expect(response.data.email).toBe(userData.email);
    }),
    { numRuns: 100 }
  );
});
```

#### Property 10: Filtering Correctness

```typescript
/**
 * Feature: super-admin-system
 * Property 10: Audit Log Filtering Correctness
 * For any combination of filters, the query SHALL return only matching entries
 */
test('audit log filtering returns only matching entries', async () => {
  const filterArb = fc.record({
    adminId: fc.option(fc.uuid(), { nil: null }),
    actionType: fc.option(fc.constantFrom('CREATE_ADMIN', 'UPDATE_USER', 'APPROVE_LISTING'), { nil: null }),
    resource: fc.option(fc.constantFrom('USER', 'PROPERTY', 'ADMIN'), { nil: null }),
    fromDate: fc.option(fc.date(), { nil: null }),
    toDate: fc.option(fc.date(), { nil: null })
  });
  
  await fc.assert(
    fc.asyncProperty(filterArb, async (filters) => {
      // Create test data with various attributes
      const testLogs = await createTestAuditLogs(20);
      
      // Query with filters
      const results = await auditLogService.query(filters);
      
      // Verify each result matches ALL filters
      for (const log of results.logs) {
        if (filters.adminId) {
          expect(log.admin_id).toBe(filters.adminId);
        }
        if (filters.actionType) {
          expect(log.action_type).toBe(filters.actionType);
        }
        if (filters.resource) {
          expect(log.target_resource).toBe(filters.resource);
        }
        if (filters.fromDate) {
          expect(log.created_at.getTime()).toBeGreaterThanOrEqual(filters.fromDate.getTime());
        }
        if (filters.toDate) {
          expect(log.created_at.getTime()).toBeLessThanOrEqual(filters.toDate.getTime());
        }
      }
      
      // Cleanup
      await cleanupTestAuditLogs(testLogs);
    }),
    { numRuns: 50 } // Reduced for async DB operations
  );
});
```

#### Property 13: CSV Export Format

```typescript
/**
 * Feature: super-admin-system
 * Property 13: CSV Export Format Correctness
 * For any data set exported to CSV, the output SHALL have proper format and sanitization
 */
test('CSV export produces correctly formatted and sanitized output', () => {
  const dataRowArb = fc.record({
    id: fc.uuid(),
    name: fc.string(),
    email: fc.emailAddress(),
    formula: fc.oneof(
      fc.constant('=SUM(A1:A10)'),
      fc.constant('+1+1'),
      fc.constant('-5'),
      fc.constant('@IMPORT')
    ),
    normalValue: fc.integer()
  });
  
  const dataSetArb = fc.array(dataRowArb, { minLength: 1, maxLength: 100 });
  
  fc.assert(
    fc.property(dataSetArb, (dataSet) => {
      const columns = [
        { label: 'ID', accessor: (row) => row.id },
        { label: 'Name', accessor: (row) => row.name },
        { label: 'Email', accessor: (row) => row.email },
        { label: 'Formula', accessor: (row) => row.formula },
        { label: 'Value', accessor: (row) => row.normalValue }
      ];
      
      const csv = exportService.toCsv(dataSet, columns);
      const lines = csv.split('\n');
      
      // Verify header row
      expect(lines[0]).toBe('"ID","Name","Email","Formula","Value"');
      
      // Verify data rows
      expect(lines.length).toBe(dataSet.length + 1);
      
      // Verify formula injection prevention
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        // Check that formulas are sanitized (prefixed with ')
        if (dataSet[i - 1].formula.match(/^[=+\-@]/)) {
          expect(row).toContain(`"'${dataSet[i - 1].formula}"`);
        }
      }
      
      // Verify no unescaped quotes
      for (const line of lines) {
        // Count quotes - should be even
        const quoteCount = (line.match(/"/g) || []).length;
        expect(quoteCount % 2).toBe(0);
      }
    }),
    { numRuns: 100 }
  );
});
```

### Unit Tests

#### Password Service Tests
```typescript
describe('PasswordService', () => {
  test('validates correct strong password', () => {
    const result = passwordService.validate('StrongPass123!');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
  
  test('rejects password without uppercase', () => {
    const result = passwordService.validate('weakpass123!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });
  
  test('hashes password with bcrypt', async () => {
    const password = 'TestPass123!';
    const hash = await passwordService.hash(password);
    
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
    
    const isValid = await passwordService.compare(password, hash);
    expect(isValid).toBe(true);
  });
});
```

#### Audit Log Service Tests
```typescript
describe('AuditLogService', () => {
  test('creates audit log with all fields', async () => {
    const logData = {
      adminId: 'admin-uuid',
      actionType: 'CREATE_ADMIN',
      targetResource: 'USER',
      targetId: 'target-uuid',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      metadata: { key: 'value' }
    };
    
    const log = await auditLogService.log(logData);
    
    expect(log.admin_id).toBe(logData.adminId);
    expect(log.action_type).toBe(logData.actionType);
    expect(log.metadata).toEqual(logData.metadata);
  });
});
```

### Integration Tests

#### Admin User Creation API
```typescript
describe('POST /api/admin/users', () => {
  test('creates admin user with valid data', async () => {
    const adminData = {
      email: 'newadmin@test.com',
      phone: '+251911234567',
      password: 'SecurePass123!',
      first_name: 'John',
      last_name: 'Doe'
    };
    
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(adminData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(adminData.email);
    expect(response.body.data.password_hash).toBeUndefined();
    
    // Verify audit log was created
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action_type: 'CREATE_ADMIN',
        target_id: response.body.data.id
      }
    });
    expect(auditLog).toBeDefined();
  });
  
  test('rejects weak password', async () => {
    const adminData = {
      email: 'newadmin@test.com',
      phone: '+251911234567',
      password: 'weak',
      first_name: 'John',
      last_name: 'Doe'
    };
    
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(adminData);
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Password');
  });
  
  test('rejects duplicate email', async () => {
    // Create first admin
    await createTestAdmin({ email: 'duplicate@test.com' });
    
    // Attempt to create second with same email
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'duplicate@test.com',
        phone: '+251911234568',
        password: 'SecurePass123!',
        first_name: 'Jane',
        last_name: 'Smith'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Email already exists');
  });
  
  test('rejects non-admin user', async () => {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`) // Non-admin token
      .send(validAdminData);
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Admin role required');
  });
});
```

#### Setup Script Integration Test
```typescript
describe('Setup Script', () => {
  beforeEach(async () => {
    // Clean up any existing admins
    await prisma.user.deleteMany({ where: { role: 'admin' } });
  });
  
  test('creates first admin successfully', async () => {
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.ADMIN_PASSWORD = 'SecurePass123!';
    process.env.ADMIN_FIRST_NAME = 'Admin';
    process.env.ADMIN_LAST_NAME = 'User';
    process.env.ADMIN_PHONE = '+251911234567';
    
    const exitCode = await runSetupScript();
    
    expect(exitCode).toBe(0);
    
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    expect(admin).toBeDefined();
    expect(admin.email).toBe('admin@test.com');
    expect(admin.is_verified).toBe(true);
    expect(admin.is_active).toBe(true);
  });
  
  test('exits early if admin exists', async () => {
    // Create existing admin
    await createTestAdmin();
    
    const exitCode = await runSetupScript();
    
    expect(exitCode).toBe(0);
    
    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    });
    
    expect(adminCount).toBe(1); // Only the pre-existing one
  });
  
  test('fails with invalid password', async () => {
    process.env.ADMIN_PASSWORD = 'weak';
    
    const exitCode = await runSetupScript();
    
    expect(exitCode).toBe(1);
    
    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    });
    
    expect(adminCount).toBe(0);
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 90%+ coverage of utility functions and services
- **Property Tests**: All identified correctness properties (18 total)
- **Integration Tests**: All API endpoints and critical user flows
- **E2E Tests**: Key admin workflows (create admin, approve listing, view audit logs)

### Continuous Integration

**Pre-commit Hooks**:
```bash
npm run test:unit
npm run test:pbt
npm run lint
```

**CI Pipeline**:
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:pbt -- --numRuns=100
      - run: npm run test:integration
      - run: npm run test:coverage
```

---

This design document provides a comprehensive technical blueprint for implementing the Super Admin Management System, covering all aspects from architecture to testing. The system integrates seamlessly with the existing UrbanNEST platform while introducing critical admin management, security, and audit capabilities.