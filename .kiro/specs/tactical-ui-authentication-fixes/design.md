# Design Document

## Overview

This design addresses critical production issues in the TacticalOps platform including theme inconsistencies, authentication failures, broken internationalization, and missing test coverage. The solution focuses on systematic fixes with comprehensive testing to ensure reliability.

## Architecture

### Component Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Loading Screen  │  Auth Components  │  Language Switcher  │
│  (Tactical Theme)│  (Fixed Auth)     │  (Working i18n)     │
├─────────────────────────────────────────────────────────────┤
│                 Authentication Layer                        │
├─────────────────────────────────────────────────────────────┤
│  JWT Auth        │  Database Auth    │  Role Management    │
│  (Fixed)         │  (Supabase)       │  (ROOT_ADMIN)       │
├─────────────────────────────────────────────────────────────┤
│                   Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Supabase Cloud  │  User Management  │  Session Storage    │
│  (Connection Fix)│  (Admin Creation) │  (Redis)            │
├─────────────────────────────────────────────────────────────┤
│                    Testing Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Playwright E2E  │  Unit Tests       │  Integration Tests  │
│  (Comprehensive) │  (Components)     │  (API/DB)           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
```
User Access → Loading Screen (Tactical) → Authentication → Language Selection → Dashboard
     ↓              ↓                        ↓                    ↓              ↓
Theme Check → Tactical Colors → Database → i18n Context → Role-based Content
```

## Components and Interfaces

### 1. Tactical Theme System

**Loading Screen Component**
```typescript
interface LoadingScreenProps {
  theme: 'tactical' | 'default';
  message?: string;
  progress?: number;
}

interface TacticalTheme {
  primary: '#D4AF37';      // Tactical Gold
  secondary: '#4A5D23';    // Tactical Green
  background: 'camo-pattern';
  accent: '#8B4513';       // Tactical Brown
}
```

**Implementation Strategy:**
- Replace all blue loading screens with tactical camo patterns
- Use CSS custom properties for consistent theming
- Implement loading spinner with tactical colors
- Add camo background patterns using CSS or SVG

### 2. Authentication System

**Authentication Interface**
```typescript
interface AuthCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

interface User {
  id: string;
  username: string;
  role: 'ROOT_ADMIN' | 'ADMIN' | 'USER';
  createdAt: Date;
}
```

**Database Schema Fix:**
```sql
-- Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert admin user with correct credentials
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$12$hashed_password_here', 'ROOT_ADMIN')
ON CONFLICT (username) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;
```

### 3. Internationalization System

**i18n Interface**
```typescript
interface LanguageContext {
  currentLanguage: 'en' | 'ar';
  translations: Record<string, string>;
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string) => string;
}

interface TranslationFiles {
  en: Record<string, string>;
  ar: Record<string, string>;
}
```

**RTL Support:**
```css
[dir="rtl"] {
  text-align: right;
  direction: rtl;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}
```

### 4. Database Connection Management

**Connection Strategy:**
```typescript
interface DatabaseConfig {
  primary: SupabaseConfig;
  fallback?: LocalConfig;
  retryAttempts: number;
  timeout: number;
}

interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: Date;
  error?: string;
}
```

## Data Models

### User Model
```typescript
interface User {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
  preferences: {
    language: 'en' | 'ar';
    theme: 'tactical' | 'default';
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

enum UserRole {
  ROOT_ADMIN = 'ROOT_ADMIN',
  ADMIN = 'ADMIN', 
  USER = 'USER'
}
```

### Session Model
```typescript
interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

### Theme Model
```typescript
interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  patterns: {
    loading: string;
    background: string;
  };
}
```

## Error Handling

### Authentication Errors
```typescript
enum AuthError {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED'
}

interface ErrorResponse {
  code: AuthError;
  message: string;
  details?: any;
  timestamp: Date;
}
```

### Database Error Handling
```typescript
class DatabaseErrorHandler {
  static handleConnectionError(error: Error): ErrorResponse;
  static handleAuthError(error: Error): ErrorResponse;
  static handleQueryError(error: Error): ErrorResponse;
  static shouldRetry(error: Error): boolean;
}
```

### UI Error States
```typescript
interface ErrorState {
  type: 'auth' | 'network' | 'database' | 'validation';
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
}
```

## Testing Strategy

### 1. End-to-End Testing (Playwright)

**Test Scenarios:**
```typescript
describe('TacticalOps E2E Tests', () => {
  test('Loading screen shows tactical theme', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.loading-screen')).toHaveClass(/tactical/);
    await expect(page.locator('.loading-spinner')).toHaveCSS('color', '#D4AF37');
  });

  test('Admin authentication works', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'admin123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('Arabic language switching works', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="language-arabic"]');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('[data-testid="login-title"]')).toContainText('تسجيل الدخول');
  });
});
```

### 2. Component Testing

**Theme Testing:**
```typescript
describe('TacticalTheme', () => {
  test('applies tactical colors correctly', () => {
    render(<LoadingScreen theme="tactical" />);
    expect(screen.getByTestId('loading-screen')).toHaveStyle({
      backgroundColor: expect.stringContaining('camo')
    });
  });
});
```

### 3. Integration Testing

**Authentication Integration:**
```typescript
describe('Authentication Integration', () => {
  test('creates admin user in database', async () => {
    const result = await createAdminUser('admin', 'admin123');
    expect(result.success).toBe(true);
    expect(result.user.role).toBe('ROOT_ADMIN');
  });

  test('authenticates with correct credentials', async () => {
    const result = await authenticate('admin', 'admin123');
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });
});
```

### 4. Database Testing

**Connection Testing:**
```typescript
describe('Database Connection', () => {
  test('connects to Supabase successfully', async () => {
    const health = await checkDatabaseHealth();
    expect(health.status).toBe('healthy');
  });

  test('handles connection failures gracefully', async () => {
    // Mock connection failure
    const result = await authenticateWithFailure();
    expect(result.error).toBeDefined();
    expect(result.fallback).toBe(true);
  });
});
```

## Implementation Plan

### Phase 1: Critical Fixes (Immediate)
1. **Fix Loading Screen Theme**
   - Replace blue loading with tactical camo
   - Update CSS variables and components
   - Test on all entry points

2. **Fix Authentication**
   - Debug database connection issues
   - Ensure admin user exists with correct credentials
   - Test login flow end-to-end

3. **Fix Language Switching**
   - Debug i18n context issues
   - Ensure Arabic translations load correctly
   - Test RTL layout switching

### Phase 2: Testing Implementation
1. **Set up Playwright Tests**
   - Configure test environment
   - Write comprehensive E2E tests
   - Set up CI/CD integration

2. **Component and Integration Tests**
   - Test all critical components
   - Test database operations
   - Test authentication flows

### Phase 3: Monitoring and Reliability
1. **Error Monitoring**
   - Implement comprehensive error logging
   - Set up health check monitoring
   - Create alerting for critical failures

2. **Performance Optimization**
   - Optimize loading times
   - Implement proper caching
   - Monitor database performance

## Success Criteria

### Functional Requirements
- ✅ Loading screen displays tactical camo theme
- ✅ Admin login works with admin/admin123
- ✅ Arabic language switching works with RTL
- ✅ All critical functionalities tested

### Performance Requirements
- ✅ Page load time < 3 seconds
- ✅ Authentication < 2 seconds
- ✅ Language switching < 1 second

### Quality Requirements
- ✅ 95% test coverage on critical paths
- ✅ Zero critical bugs in production
- ✅ Comprehensive error handling