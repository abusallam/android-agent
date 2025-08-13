/**
 * Enhanced Authentication and Authorization System
 * Multi-tier security with role-based access control
 * Supports civilian, government, and military security tiers
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// Security tier definitions
export const SECURITY_TIERS = {
  CIVILIAN: 'civilian',
  GOVERNMENT: 'government', 
  MILITARY: 'military'
} as const;

export type SecurityTier = typeof SECURITY_TIERS[keyof typeof SECURITY_TIERS];

// Role definitions with hierarchical permissions
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin', 
  PROJECT_ADMIN: 'project_admin',
  ROOT_ADMIN: 'root_admin',
  AGENT: 'agent'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Permission definitions
export const PERMISSIONS = {
  // Basic permissions
  READ_OWN_DATA: 'read_own_data',
  UPDATE_OWN_PROFILE: 'update_own_profile',
  
  // User management
  READ_USERS: 'read_users',
  CREATE_USERS: 'create_users',
  UPDATE_USERS: 'update_users',
  DELETE_USERS: 'delete_users',
  
  // Tactical operations
  READ_OPERATIONS: 'read_operations',
  CREATE_OPERATIONS: 'create_operations',
  UPDATE_OPERATIONS: 'update_operations',
  DELETE_OPERATIONS: 'delete_operations',
  
  // Asset management
  READ_ASSETS: 'read_assets',
  CREATE_ASSETS: 'create_assets',
  UPDATE_ASSETS: 'update_assets',
  DELETE_ASSETS: 'delete_assets',
  CONTROL_ASSETS: 'control_assets',
  
  // Emergency response
  READ_EMERGENCIES: 'read_emergencies',
  CREATE_EMERGENCIES: 'create_emergencies',
  RESPOND_EMERGENCIES: 'respond_emergencies',
  
  // Intelligence and analytics
  READ_INTELLIGENCE: 'read_intelligence',
  CREATE_INTELLIGENCE: 'create_intelligence',
  ANALYZE_INTELLIGENCE: 'analyze_intelligence',
  
  // System administration
  SYSTEM_CONFIG: 'system_config',
  SYSTEM_MONITORING: 'system_monitoring',
  SYSTEM_BACKUP: 'system_backup',
  
  // Agent control
  AGENT_CONTROL: 'agent_control',
  AGENT_MONITORING: 'agent_monitoring'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [ROLES.USER]: [
    PERMISSIONS.READ_OWN_DATA,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.READ_OPERATIONS,
    PERMISSIONS.CREATE_EMERGENCIES
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.READ_OWN_DATA,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.READ_USERS,
    PERMISSIONS.READ_OPERATIONS,
    PERMISSIONS.CREATE_OPERATIONS,
    PERMISSIONS.UPDATE_OPERATIONS,
    PERMISSIONS.READ_ASSETS,
    PERMISSIONS.CREATE_ASSETS,
    PERMISSIONS.UPDATE_ASSETS,
    PERMISSIONS.READ_EMERGENCIES,
    PERMISSIONS.CREATE_EMERGENCIES,
    PERMISSIONS.RESPOND_EMERGENCIES,
    PERMISSIONS.READ_INTELLIGENCE
  ],
  [ROLES.PROJECT_ADMIN]: [
    PERMISSIONS.READ_OWN_DATA,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.READ_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.UPDATE_USERS,
    PERMISSIONS.READ_OPERATIONS,
    PERMISSIONS.CREATE_OPERATIONS,
    PERMISSIONS.UPDATE_OPERATIONS,
    PERMISSIONS.DELETE_OPERATIONS,
    PERMISSIONS.READ_ASSETS,
    PERMISSIONS.CREATE_ASSETS,
    PERMISSIONS.UPDATE_ASSETS,
    PERMISSIONS.DELETE_ASSETS,
    PERMISSIONS.CONTROL_ASSETS,
    PERMISSIONS.READ_EMERGENCIES,
    PERMISSIONS.CREATE_EMERGENCIES,
    PERMISSIONS.RESPOND_EMERGENCIES,
    PERMISSIONS.READ_INTELLIGENCE,
    PERMISSIONS.CREATE_INTELLIGENCE,
    PERMISSIONS.ANALYZE_INTELLIGENCE,
    PERMISSIONS.SYSTEM_MONITORING
  ],
  [ROLES.ROOT_ADMIN]: [
    // Root admin has all permissions
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.AGENT]: [
    PERMISSIONS.READ_OWN_DATA,
    PERMISSIONS.READ_OPERATIONS,
    PERMISSIONS.CREATE_OPERATIONS,
    PERMISSIONS.UPDATE_OPERATIONS,
    PERMISSIONS.READ_ASSETS,
    PERMISSIONS.CREATE_ASSETS,
    PERMISSIONS.UPDATE_ASSETS,
    PERMISSIONS.CONTROL_ASSETS,
    PERMISSIONS.READ_EMERGENCIES,
    PERMISSIONS.CREATE_EMERGENCIES,
    PERMISSIONS.RESPOND_EMERGENCIES,
    PERMISSIONS.READ_INTELLIGENCE,
    PERMISSIONS.CREATE_INTELLIGENCE,
    PERMISSIONS.ANALYZE_INTELLIGENCE,
    PERMISSIONS.SYSTEM_MONITORING
  ]
};

// Security tier requirements
export const TIER_REQUIREMENTS: Record<SecurityTier, {
  mfaRequired: boolean;
  sessionTimeout: number; // minutes
  passwordComplexity: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  auditLogging: boolean;
  encryptionLevel: 'basic' | 'enhanced' | 'military';
}> = {
  [SECURITY_TIERS.CIVILIAN]: {
    mfaRequired: false,
    sessionTimeout: 480, // 8 hours
    passwordComplexity: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    auditLogging: false,
    encryptionLevel: 'basic'
  },
  [SECURITY_TIERS.GOVERNMENT]: {
    mfaRequired: true,
    sessionTimeout: 240, // 4 hours
    passwordComplexity: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    auditLogging: true,
    encryptionLevel: 'enhanced'
  },
  [SECURITY_TIERS.MILITARY]: {
    mfaRequired: true,
    sessionTimeout: 120, // 2 hours
    passwordComplexity: {
      minLength: 16,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    auditLogging: true,
    encryptionLevel: 'military'
  }
};

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  securityTier: SecurityTier;
  permissions: Permission[];
  lastLogin: Date;
  mfaEnabled: boolean;
  sessionId: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: AuthUser;
}

// Authentication functions
export class EnhancedAuth {
  
  static async authenticateUser(
    username: string, 
    password: string, 
    securityTier: SecurityTier = SECURITY_TIERS.CIVILIAN,
    mfaCode?: string
  ): Promise<AuthToken | null> {
    try {
      // Get user from database
      const users = await prisma.$queryRawUnsafe(`
        SELECT 
          id, username, email, password_hash, role, status, 
          security_tier, mfa_enabled, mfa_secret, last_login, metadata
        FROM users 
        WHERE username = $1 AND status = 'active'
      `, username);

      if (!users || users.length === 0) {
        await this.logAuthEvent('login_failed', { username, reason: 'user_not_found' });
        return null;
      }

      const user = users[0];

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        await this.logAuthEvent('login_failed', { username, reason: 'invalid_password' });
        return null;
      }

      // Check security tier requirements
      const tierReqs = TIER_REQUIREMENTS[securityTier];
      
      // MFA verification if required
      if (tierReqs.mfaRequired && user.mfa_enabled) {
        if (!mfaCode) {
          return null; // MFA code required
        }
        
        const mfaValid = await this.verifyMFA(user.mfa_secret, mfaCode);
        if (!mfaValid) {
          await this.logAuthEvent('login_failed', { username, reason: 'invalid_mfa' });
          return null;
        }
      }

      // Generate session ID
      const sessionId = this.generateSessionId();

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as UserRole,
        securityTier,
        permissions: ROLE_PERMISSIONS[user.role as UserRole] || [],
        lastLogin: new Date(),
        mfaEnabled: user.mfa_enabled,
        sessionId
      };

      // Generate tokens
      const tokens = await this.generateTokens(authUser, tierReqs.sessionTimeout);

      // Update last login
      await prisma.$queryRawUnsafe(`
        UPDATE users 
        SET last_login = NOW(), metadata = jsonb_set(COALESCE(metadata, '{}'), '{lastSessionId}', $1)
        WHERE id = $2
      `, JSON.stringify(sessionId), user.id);

      // Log successful authentication
      await this.logAuthEvent('login_success', { 
        userId: user.id, 
        username, 
        securityTier, 
        sessionId 
      });

      return tokens;

    } catch (error) {
      console.error('Authentication error:', error);
      await this.logAuthEvent('login_error', { username, error: error.message });
      return null;
    }
  }

  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Check if session is still valid
      const sessions = await prisma.$queryRawUnsafe(`
        SELECT * FROM users 
        WHERE id = $1 AND status = 'active'
        AND metadata->>'lastSessionId' = $2
      `, decoded.userId, decoded.sessionId);

      if (!sessions || sessions.length === 0) {
        return null;
      }

      const user = sessions[0];
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as UserRole,
        securityTier: decoded.securityTier,
        permissions: ROLE_PERMISSIONS[user.role as UserRole] || [],
        lastLogin: user.last_login,
        mfaEnabled: user.mfa_enabled,
        sessionId: decoded.sessionId
      };

    } catch (error) {
      return null;
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthToken | null> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
      
      const users = await prisma.$queryRawUnsafe(`
        SELECT * FROM users WHERE id = $1 AND status = 'active'
      `, decoded.userId);

      if (!users || users.length === 0) {
        return null;
      }

      const user = users[0];
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as UserRole,
        securityTier: decoded.securityTier,
        permissions: ROLE_PERMISSIONS[user.role as UserRole] || [],
        lastLogin: user.last_login,
        mfaEnabled: user.mfa_enabled,
        sessionId: decoded.sessionId
      };

      const tierReqs = TIER_REQUIREMENTS[decoded.securityTier];
      return await this.generateTokens(authUser, tierReqs.sessionTimeout);

    } catch (error) {
      return null;
    }
  }

  static async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      await prisma.$queryRawUnsafe(`
        UPDATE users 
        SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{revokedSessions}', 
                                 COALESCE(metadata->'revokedSessions', '[]'::jsonb) || $1::jsonb)
        WHERE id = $2
      `, JSON.stringify([sessionId]), userId);

      await this.logAuthEvent('session_revoked', { userId, sessionId });
      return true;
    } catch (error) {
      return false;
    }
  }

  static hasPermission(user: AuthUser, permission: Permission): boolean {
    return user.permissions.includes(permission);
  }

  static hasAnyPermission(user: AuthUser, permissions: Permission[]): boolean {
    return permissions.some(permission => user.permissions.includes(permission));
  }

  static hasAllPermissions(user: AuthUser, permissions: Permission[]): boolean {
    return permissions.every(permission => user.permissions.includes(permission));
  }

  static async requireAuth(request: NextRequest): Promise<AuthUser | null> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    return await this.verifyToken(token);
  }

  static async requirePermission(
    request: NextRequest, 
    permission: Permission
  ): Promise<AuthUser | null> {
    const user = await this.requireAuth(request);
    if (!user || !this.hasPermission(user, permission)) {
      return null;
    }
    return user;
  }

  static async requireRole(
    request: NextRequest, 
    role: UserRole
  ): Promise<AuthUser | null> {
    const user = await this.requireAuth(request);
    if (!user || user.role !== role) {
      return null;
    }
    return user;
  }

  static async requireSecurityTier(
    request: NextRequest, 
    minTier: SecurityTier
  ): Promise<AuthUser | null> {
    const user = await this.requireAuth(request);
    if (!user) return null;

    const tierLevels = {
      [SECURITY_TIERS.CIVILIAN]: 1,
      [SECURITY_TIERS.GOVERNMENT]: 2,
      [SECURITY_TIERS.MILITARY]: 3
    };

    if (tierLevels[user.securityTier] < tierLevels[minTier]) {
      return null;
    }

    return user;
  }

  // Private helper methods
  private static async generateTokens(user: AuthUser, sessionTimeoutMinutes: number): Promise<AuthToken> {
    const accessTokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      securityTier: user.securityTier,
      sessionId: user.sessionId,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (sessionTimeoutMinutes * 60)
    };

    const refreshTokenPayload = {
      userId: user.id,
      sessionId: user.sessionId,
      securityTier: user.securityTier,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET);
    const refreshToken = jwt.sign(refreshTokenPayload, JWT_REFRESH_SECRET);

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + sessionTimeoutMinutes * 60 * 1000),
      user
    };
  }

  private static generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private static async verifyMFA(secret: string, code: string): Promise<boolean> {
    // In a real implementation, use a proper TOTP library like 'speakeasy'
    // For now, return true for demonstration
    return code === '123456'; // Mock MFA verification
  }

  private static async logAuthEvent(event: string, data: any): Promise<void> {
    try {
      await prisma.$queryRawUnsafe(`
        INSERT INTO system_metrics (
          metric_name, metric_value, source, tags, metadata
        ) VALUES (
          'auth_event', 1, 'auth_system', $1, $2
        )
      `,
        JSON.stringify({ event }),
        JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          userAgent: data.userAgent || 'unknown'
        })
      );
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }
}

// Middleware helper functions
export function createAuthMiddleware(options: {
  requiredPermission?: Permission;
  requiredRole?: UserRole;
  requiredSecurityTier?: SecurityTier;
} = {}) {
  return async (request: NextRequest) => {
    let user: AuthUser | null = null;

    if (options.requiredPermission) {
      user = await EnhancedAuth.requirePermission(request, options.requiredPermission);
    } else if (options.requiredRole) {
      user = await EnhancedAuth.requireRole(request, options.requiredRole);
    } else if (options.requiredSecurityTier) {
      user = await EnhancedAuth.requireSecurityTier(request, options.requiredSecurityTier);
    } else {
      user = await EnhancedAuth.requireAuth(request);
    }

    return user;
  };
}

// Password validation
export function validatePassword(password: string, securityTier: SecurityTier): {
  valid: boolean;
  errors: string[];
} {
  const requirements = TIER_REQUIREMENTS[securityTier].passwordComplexity;
  const errors: string[] = [];

  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Hash password with appropriate strength for security tier
export async function hashPassword(password: string, securityTier: SecurityTier): Promise<string> {
  const saltRounds = {
    [SECURITY_TIERS.CIVILIAN]: 10,
    [SECURITY_TIERS.GOVERNMENT]: 12,
    [SECURITY_TIERS.MILITARY]: 14
  };

  return await bcrypt.hash(password, saltRounds[securityTier]);
}