# Design Document

## Overview

This design addresses the critical security vulnerabilities in the Android Agent project by implementing a proper authentication system, session management, and configuration handling. The solution maintains backward compatibility while fixing the broken bcrypt/MD5 authentication mismatch and implementing proper security practices.

## Architecture

### Authentication Flow
```
User Login Request → Input Validation → bcrypt.compare() → Session Creation → Cookie Setting → Redirect
                                    ↓
                              Failed Auth → Rate Limiting → Error Response
```

### Session Management Architecture
```
Redis (Primary) ← Session Store → Memory (Fallback)
       ↓
Session Middleware → Route Protection → Request Processing
```

### Configuration Management
```
Environment Variables → Validation → Configuration Object → Application Startup
                                  ↓
                            Missing/Invalid → Error Messages → Startup Failure
```

## Components and Interfaces

### 1. Authentication Service (`server/includes/authService.js`)

**Purpose:** Centralized authentication logic with proper bcrypt handling

**Interface:**
```javascript
class AuthService {
  async validateCredentials(username, password)
  async createSession(userId, sessionData)
  async validateSession(sessionToken)
  async destroySession(sessionToken)
  async hashPassword(password)
}
```

**Key Features:**
- Uses bcrypt.compare() for password verification
- Implements rate limiting for failed attempts
- Generates cryptographically secure session tokens
- Handles session lifecycle management

### 2. Session Manager (`server/includes/sessionManager.js`)

**Purpose:** Manages session storage with Redis primary and memory fallback

**Interface:**
```javascript
class SessionManager {
  async store(sessionId, sessionData, ttl)
  async retrieve(sessionId)
  async destroy(sessionId)
  async cleanup()
  isRedisAvailable()
}
```

**Key Features:**
- Redis-first with automatic fallback to memory
- Configurable session TTL
- Automatic cleanup of expired sessions
- Health monitoring for Redis connection

### 3. Configuration Validator (`server/includes/configValidator.js`)

**Purpose:** Validates and normalizes configuration from environment variables

**Interface:**
```javascript
class ConfigValidator {
  validateRequired(config)
  validateOptional(config)
  generateDefaults()
  getValidatedConfig()
}
```

**Key Features:**
- Validates all required environment variables
- Provides secure defaults
- Clear error messages for missing configuration
- Type validation and conversion

### 4. Enhanced Express Routes (`server/includes/expressRoutes.js`)

**Updated Authentication Middleware:**
```javascript
async function isAllowed(req, res, next) {
  // Session-based authentication with proper validation
  // Rate limiting for authentication attempts
  // Secure cookie handling
}
```

**Updated Login Route:**
```javascript
routes.post('/login', async (req, res) => {
  // Input validation and sanitization
  // bcrypt password verification
  // Session creation and cookie setting
  // Proper error handling
})
```

## Data Models

### Session Data Structure
```javascript
{
  sessionId: "crypto-secure-random-string",
  userId: "admin",
  createdAt: Date,
  lastAccessed: Date,
  ipAddress: "client-ip",
  userAgent: "client-user-agent",
  expiresAt: Date
}
```

### Configuration Schema
```javascript
{
  security: {
    bcrypt_rounds: Number (10-15),
    session_secret: String (required),
    session_ttl: Number (default: 24h),
    rate_limit_window: Number (default: 15min),
    rate_limit_max: Number (default: 5)
  },
  database: {
    redis_host: String (optional),
    redis_port: Number (default: 6379),
    redis_password: String (optional)
  },
  server: {
    web_port: Number (default: 22533),
    control_port: Number (default: 22222),
    tls_enabled: Boolean (default: false)
  }
}
```

### Database Migration Schema
```javascript
// Migration for existing bcrypt passwords
{
  admin: {
    username: String,
    password: String (bcrypt hash - preserved),
    loginToken: String (deprecated),
    sessions: Array (new),
    lastLogin: Date (new),
    failedAttempts: Number (new),
    lockedUntil: Date (new)
  }
}
```

## Error Handling

### Authentication Errors
- **Invalid Credentials:** Generic "Invalid username or password" message
- **Account Locked:** "Account temporarily locked due to failed attempts"
- **Session Expired:** Automatic redirect to login with message
- **Configuration Error:** Detailed error for administrators

### Session Management Errors
- **Redis Connection Failed:** Automatic fallback to memory sessions
- **Session Not Found:** Treat as unauthenticated, redirect to login
- **Session Corruption:** Clear session, require re-authentication

### Configuration Errors
- **Missing Required Config:** Detailed error message with expected format
- **Invalid Config Values:** Validation error with acceptable ranges
- **Environment Variable Issues:** Clear guidance on required variables

## Testing Strategy

### Unit Tests
1. **AuthService Tests**
   - Password hashing and verification
   - Session token generation and validation
   - Rate limiting functionality
   - Error handling scenarios

2. **SessionManager Tests**
   - Redis connection and fallback
   - Session CRUD operations
   - TTL and cleanup functionality
   - Concurrent access handling

3. **ConfigValidator Tests**
   - Required field validation
   - Default value generation
   - Type conversion and validation
   - Error message generation

### Integration Tests
1. **Authentication Flow Tests**
   - Complete login/logout cycle
   - Session persistence across requests
   - Rate limiting enforcement
   - Cookie security validation

2. **Database Migration Tests**
   - Existing bcrypt password preservation
   - New session schema creation
   - Data integrity validation
   - Rollback capability

3. **Configuration Tests**
   - Environment variable loading
   - Docker configuration validation
   - Default value application
   - Error handling for missing config

### Security Tests
1. **Authentication Security**
   - Brute force protection
   - Session hijacking prevention
   - Password timing attack resistance
   - CSRF protection validation

2. **Session Security**
   - Session token entropy validation
   - Secure cookie flag verification
   - Session fixation prevention
   - Proper session invalidation

## Implementation Phases

### Phase 1: Core Authentication Fix
1. Create AuthService with bcrypt.compare()
2. Update login route to use AuthService
3. Implement basic session management
4. Test authentication flow

### Phase 2: Session Management
1. Implement SessionManager with Redis support
2. Add session middleware to routes
3. Implement session cleanup
4. Add fallback mechanisms

### Phase 3: Configuration and Security
1. Create ConfigValidator
2. Update environment variable handling
3. Implement rate limiting
4. Add security headers and cookie flags

### Phase 4: Migration and Cleanup
1. Create database migration scripts
2. Remove unused dependencies
3. Update Docker configuration
4. Clean up deprecated code

### Phase 5: Testing and Documentation
1. Implement comprehensive test suite
2. Update documentation
3. Create deployment guides
4. Performance testing and optimization

## Security Considerations

### Password Security
- Use bcrypt with configurable rounds (minimum 10)
- Never log or expose passwords in any form
- Implement secure password reset mechanism
- Consider password complexity requirements

### Session Security
- Use cryptographically secure random session IDs
- Implement proper session timeout
- Secure cookie flags (HttpOnly, Secure, SameSite)
- Session invalidation on logout

### Network Security
- Remove hardcoded IP addresses
- Implement configurable TLS support
- Add CORS configuration
- Consider implementing API rate limiting

### Data Protection
- Encrypt sensitive data at rest
- Implement proper input validation
- Add SQL injection protection (if applicable)
- Consider implementing audit logging

## Performance Considerations

### Session Storage
- Redis for high-performance session storage
- Memory fallback for development/small deployments
- Configurable session cleanup intervals
- Connection pooling for Redis

### Authentication
- Implement authentication caching where appropriate
- Optimize bcrypt rounds for performance vs security
- Consider implementing remember-me functionality
- Add monitoring for authentication performance

## Monitoring and Observability

### Logging
- Authentication attempts (success/failure)
- Session creation and destruction
- Configuration validation results
- Error conditions and recovery

### Metrics
- Authentication success/failure rates
- Session duration statistics
- Redis connection health
- Performance metrics for critical paths

### Health Checks
- Database connectivity
- Redis availability
- Configuration validation status
- Overall system health endpoint