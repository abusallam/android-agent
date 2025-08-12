export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'ROOT_ADMIN' | 'PROJECT_ADMIN' | 'USER';
  parentAdminId?: string; // For users under project admins
  maxUsers?: number; // For project admins (default 10)
  currentUsers?: number; // Current users under this admin
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface UserHierarchy {
  rootAdmin: User;
  projectAdmins: Array<{
    admin: User;
    users: User[];
  }>;
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  password: string;
  role: 'PROJECT_ADMIN' | 'USER';
  parentAdminId?: string;
}

export interface UserPermissions {
  canCreateProjectAdmins: boolean;
  canCreateUsers: boolean;
  canViewAllDevices: boolean;
  canManageDevices: boolean;
  canAccessEmergencyFeatures: boolean;
  maxUsersAllowed: number;
}