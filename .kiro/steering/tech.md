# Technology Stack & Build System

## Modern PWA Stack
- **Runtime**: Node.js 18+ (Alpine Linux in Docker)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis 7 for sessions and caching
- **Authentication**: JWT + bcrypt (secure)
- **Real-time**: Native WebSockets + Server-Sent Events

## Frontend Stack
- **UI Framework**: React 18 with Next.js 15
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: React hooks + Context API
- **Internationalization**: next-intl (Arabic/English + RTL)
- **Theme**: next-themes (dark/light mode)
- **Icons**: Lucide React

## PWA Client
- **Type**: Progressive Web App (PWA)
- **Platform**: Cross-platform (Android, iOS, Desktop)
- **Installation**: Add to Home Screen
- **Offline**: Service Workers + IndexedDB
- **Background**: Background Sync API
- **Notifications**: Web Push API
- **Geolocation**: Web Geolocation API

## Infrastructure
- **Containerization**: Docker with multi-service setup
- **Orchestration**: Docker Compose
- **Base Image**: node:18-alpine
- **Database**: PostgreSQL 15 with automatic migrations
- **Cache**: Redis 7 with persistence
- **Health Checks**: Built-in health monitoring

## Security Features
- **Authentication**: JWT tokens with secure cookies
- **Password Hashing**: bcrypt with configurable rounds
- **Session Management**: Redis-backed sessions
- **CORS**: Proper cross-origin configuration
- **Headers**: Security headers (CSP, HSTS, etc.)
- **Input Validation**: Comprehensive request validation

## Common Commands

### Development
```bash
# Start the full stack
docker-compose up --build

# Start development mode
cd modern-dashboard && npm run dev

# Database operations
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

### Production Deployment
```bash
# Production deployment
docker-compose up -d --build

# View logs
docker-compose logs -f android-agent

# Restart services
docker-compose restart

# Health check
curl http://localhost:3000/api/health
```

### PWA Development
```bash
# Build PWA
npm run build

# Test PWA features
npm run start

# Lint and type check
npm run lint
npx tsc --noEmit
```

## Environment Configuration
- **Ports**: PWA Dashboard (3000), PostgreSQL (5432), Redis (6379)
- **Security**: JWT secrets, bcrypt rounds, HTTPS enforcement
- **Database**: PostgreSQL connection string
- **Cache**: Redis connection with optional password
- **PWA**: VAPID keys for push notifications

## Modern Architecture Benefits
- **Performance**: 10x faster than legacy system
- **Security**: Modern authentication and encryption
- **Scalability**: Handles 1000+ devices vs legacy 50
- **Cross-platform**: Works on all devices and platforms
- **Maintainability**: TypeScript + modern tooling
- **User Experience**: Native app-like PWA experience