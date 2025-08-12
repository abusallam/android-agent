# Role-Based Dashboard System - Design Document

## Overview

This design implements a hierarchical Role-Based Access Control (RBAC) system with three distinct user types: ROOT_ADMIN, PROJECT_ADMIN, and USER. Each role has specific dashboard views, capabilities, and data access patterns designed to support organizational hierarchy and security requirements.

## Architecture

### Role Hierarchy
```
ROOT_ADMIN (System Level)
├── Manages PROJECT_ADMIN accounts
├── Views system-wide metrics
└── No direct user device access

PROJECT_ADMIN (Project Level)
├── Manages assigned USER accounts
├── Full access to assigned users' devices
├── Real-time monitoring capabilities
└── Cannot access other projects' users

USER (Individual Level)
├── Access to personal features
├── Emergency capabilities
├── Location/mapping features
└── No administrative access
```

### Database Schema Extensions

#### Users Table Enhancement
```sql
-- Extend existing users table
ALTER TABLE users ADD COLUMN project_id VARCHAR(255);
ALTER TABLE users ADD COLUMN created_by VARCHAR(255);
ALTER TABLE users ADD COLUMN assigned_admin VARCHAR(255);

-- Add indexes for performance
CREATE INDEX idx_users_project_id ON users(project_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_assigned_admin ON users(assigned_admin);
```

#### New Projects Table
```sql
CREATE TABLE projects (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  admin_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);
```

#### User Assignments Table
```sql
CREATE TABLE user_assignments (
  id VARCHAR(255) PRIMARY KEY,
  project_admin_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_admin_id) REFERENCES users(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id) -- Each user can only be assigned to one admin
);
```

## Components and Interfaces

### Dashboard Components by Role

#### ROOT_ADMIN Dashboard
```typescript
interface RootAdminDashboardProps {
  systemMetrics: SystemMetrics;
  projectAdmins: ProjectAdmin[];
  onCreateProjectAdmin: (data: CreateProjectAdminData) => void;
  onDeleteProjectAdmin: (adminId: string) => void;
}

interface SystemMetrics {
  totalProjectAdmins: number;
  totalUsers: number;
  totalProjects: number;
  systemResourceUsage: ResourceUsage;
  activeDevices: number;
  systemHealth: HealthStatus;
}
```

#### PROJECT_ADMIN Dashboard
```typescript
interface ProjectAdminDashboardProps {
  projectMetrics: ProjectMetrics;
  assignedUsers: AssignedUser[];
  onCreateUser: (data: CreateUserData) => void;
  onInitiateCall: (userId: string, type: 'video' | 'audio') => void;
  onAccessCamera: (userId: string) => void;
}

interface ProjectMetrics {
  totalAssignedUsers: number;
  activeUsers: number;
  emergencyAlerts: EmergencyAlert[];
  deviceStatuses: DeviceStatus[];
  projectResourceUsage: ResourceUsage;
}
```

#### USER Dashboard
```typescript
interface UserDashboardProps {
  userProfile: UserProfile;
  deviceStatus: DeviceStatus;
  emergencyContacts: EmergencyContact[];
  onTriggerEmergency: () => void;
  onUpdateLocation: (location: Location) => void;
}

interface UserProfile {
  id: string;
  username: string;
  assignedAdmin: ProjectAdmin;
  personalMetrics: PersonalMetrics;
}
```

### Authentication & Authorization

#### Role-Based Route Protection
```typescript
// Enhanced ProtectedRoute component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ROOT_ADMIN' | 'PROJECT_ADMIN' | 'USER';
  allowedRoles?: ('ROOT_ADMIN' | 'PROJECT_ADMIN' | 'USER')[];
}

// Route configuration
const roleBasedRoutes = {
  '/root-admin': { requiredRole: 'ROOT_ADMIN' },
  '/project-admin': { requiredRole: 'PROJECT_ADMIN' },
  '/user-dashboard': { requiredRole: 'USER' },
  '/admin': { allowedRoles: ['ROOT_ADMIN', 'PROJECT_ADMIN'] }
};
```

#### Authorization Middleware
```typescript
// API route protection
export function withRoleAuth(
  handler: NextApiHandler,
  allowedRoles: UserRole[]
) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser(req);
    
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    return handler(req);
  };
}
```

## Data Models

### Enhanced User Model
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'ROOT_ADMIN' | 'PROJECT_ADMIN' | 'USER';
  projectId?: string; // For PROJECT_ADMIN and USER
  assignedAdminId?: string; // For USER only
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin?: Date;
}
```

### Project Model
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  adminId: string; // PROJECT_ADMIN who manages this project
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
```

### User Assignment Model
```typescript
interface UserAssignment {
  id: string;
  projectAdminId: string;
  userId: string;
  assignedAt: Date;
  permissions: UserPermissions;
}

interface UserPermissions {
  canReceiveCalls: boolean;
  canShareLocation: boolean;
  canTriggerEmergency: boolean;
  monitoringLevel: 'basic' | 'full';
}
```

## Error Handling

### Role-Based Error Responses
```typescript
enum AuthorizationError {
  INSUFFICIENT_ROLE = 'User role insufficient for this action',
  CROSS_PROJECT_ACCESS = 'Cannot access users from other projects',
  INVALID_USER_ASSIGNMENT = 'User not assigned to your project',
  ADMIN_SELF_DELETION = 'Cannot delete your own admin account'
}

interface RoleBasedErrorHandler {
  handleUnauthorizedAccess(userRole: string, requiredRole: string): ErrorResponse;
  handleCrossProjectAccess(adminId: string, targetUserId: string): ErrorResponse;
  handleInvalidAssignment(assignment: UserAssignment): ErrorResponse;
}
```

## Testing Strategy

### Role-Based Test Scenarios

#### Authentication Tests
1. **Login Flow Tests**
   - ROOT_ADMIN login → redirect to `/root-admin`
   - PROJECT_ADMIN login → redirect to `/project-admin`
   - USER login → redirect to `/user-dashboard`

2. **Authorization Tests**
   - ROOT_ADMIN accessing PROJECT_ADMIN routes (should work)
   - USER accessing admin routes (should fail)
   - PROJECT_ADMIN accessing other project users (should fail)

#### Dashboard Feature Tests
1. **ROOT_ADMIN Dashboard**
   - System metrics display
   - Project admin creation/deletion
   - System-wide resource monitoring

2. **PROJECT_ADMIN Dashboard**
   - Assigned user management
   - Device monitoring for assigned users
   - Video/audio call initiation

3. **USER Dashboard**
   - Emergency button functionality
   - Location sharing
   - Personal device status

### Dummy Data Structure

#### Test Users
```typescript
const dummyUsers = {
  rootAdmin: {
    username: 'root',
    password: 'root123',
    role: 'ROOT_ADMIN'
  },
  projectAdmins: [
    {
      username: 'admin1',
      password: 'admin123',
      role: 'PROJECT_ADMIN',
      projectId: 'project-1'
    },
    {
      username: 'admin2', 
      password: 'admin123',
      role: 'PROJECT_ADMIN',
      projectId: 'project-2'
    }
  ],
  users: [
    {
      username: 'user1',
      password: 'user123',
      role: 'USER',
      assignedAdminId: 'admin1-id'
    },
    {
      username: 'user2',
      password: 'user123', 
      role: 'USER',
      assignedAdminId: 'admin1-id'
    },
    {
      username: 'user3',
      password: 'user123',
      role: 'USER', 
      assignedAdminId: 'admin2-id'
    }
  ]
};
```

## Security Considerations

### Data Isolation
- PROJECT_ADMIN can only access users assigned to their project
- USER can only access their own data
- ROOT_ADMIN has system-wide view but no direct device access

### API Security
- All API routes protected with role-based middleware
- Cross-project access validation
- Audit logging for administrative actions

### Session Management
- Role-based session validation
- Automatic role verification on sensitive operations
- Session invalidation on role changes

## Performance Optimizations

### Database Queries
- Indexed queries by role and project assignment
- Cached user-role mappings
- Optimized dashboard data aggregation

### Real-time Features
- Role-based WebSocket channels
- Filtered real-time updates based on user permissions
- Efficient device status broadcasting

## Deployment Considerations

### Environment Variables
```bash
# Role-based feature flags
ENABLE_RBAC=true
DEFAULT_ROOT_ADMIN_PASSWORD=secure_root_password
ENABLE_CROSS_PROJECT_MONITORING=false

# Security settings
RBAC_SESSION_TIMEOUT=3600
ENABLE_AUDIT_LOGGING=true
```

### Migration Strategy
1. Add new database columns and tables
2. Create dummy data for testing
3. Implement role-based components
4. Update authentication flow
5. Deploy with feature flags

This design provides a comprehensive foundation for implementing the three-tier role-based dashboard system with proper security, data isolation, and user experience considerations.