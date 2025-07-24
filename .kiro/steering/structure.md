# Project Structure & Organization

## Root Directory Layout
```
android-agent/
├── modern-dashboard/       # Next.js PWA application
├── .github/               # GitHub workflows and templates
├── .kiro/                 # Kiro IDE configuration and specs
├── docker-compose.yml     # Multi-service orchestration
├── init-db.sql           # Database initialization
├── deploy.sh             # Production deployment script
└── README.md             # Project documentation
```

## Modern Dashboard Structure (`modern-dashboard/`)
```
modern-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalized routes
│   │   │   ├── layout.tsx     # Locale-specific layout
│   │   │   └── page.tsx       # Main dashboard page
│   │   ├── api/               # API routes
│   │   │   ├── auth/login/    # Authentication endpoints
│   │   │   ├── device/sync/   # Device management API
│   │   │   ├── location/sync/ # GPS tracking API
│   │   │   └── health/        # Health check endpoint
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable React components
│   │   ├── theme-provider.tsx # Theme management
│   │   ├── theme-toggle.tsx   # Dark/light mode toggle
│   │   ├── language-switcher.tsx # Language selection
│   │   └── pwa-installer.tsx  # PWA installation component
│   ├── hooks/                 # Custom React hooks
│   │   └── usePWA.ts         # PWA functionality hook
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts           # Authentication utilities
│   │   └── db-init.ts        # Database initialization
│   ├── i18n/                 # Internationalization
│   │   └── request.ts        # i18n configuration
│   └── middleware.ts         # Next.js middleware
├── public/                   # Static assets
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service worker
│   └── logo.png            # Application logo
├── prisma/                  # Database schema and migrations
│   └── schema.prisma       # Prisma database schema
├── messages/               # Translation files
│   ├── en.json            # English translations
│   └── ar.json            # Arabic translations
├── Dockerfile             # Container definition
├── package.json           # Dependencies and scripts
└── next.config.ts         # Next.js configuration
```

## Key Architectural Patterns

### Modern PWA Architecture
- **App Router**: Next.js 15 App Router for modern routing
- **Server Components**: React Server Components for performance
- **API Routes**: Serverless API endpoints
- **Middleware**: Request/response processing
- **Service Workers**: Background processing and offline support

### Database & API Design
- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Scalable relational database
- **Redis Cache**: Session storage and performance optimization
- **RESTful APIs**: Clean, predictable API design
- **Real-time Updates**: WebSocket connections for live data

### Security Architecture
- **JWT Authentication**: Stateless, secure token-based auth
- **bcrypt Hashing**: Industry-standard password protection
- **Secure Cookies**: HttpOnly, Secure, SameSite protection
- **Input Validation**: Comprehensive request sanitization
- **CORS Configuration**: Proper cross-origin security

### PWA Features
- **Installable**: Add to home screen functionality
- **Offline Support**: Service worker caching strategies
- **Background Sync**: Continuous data synchronization
- **Push Notifications**: Real-time alerts and updates
- **Responsive Design**: Mobile-first, touch-optimized interface

### Internationalization
- **Multi-language**: English and Arabic support
- **RTL Support**: Right-to-left layout for Arabic
- **Dynamic Switching**: Runtime language switching
- **Locale Routing**: URL-based locale detection

### Development Patterns
- **TypeScript**: Full type safety across the application
- **Component-Based**: Reusable React components
- **Hook-Based**: Custom hooks for shared logic
- **Environment-Based**: Configuration through environment variables

## File Naming Conventions
- **Components**: PascalCase React components (ThemeToggle.tsx)
- **Hooks**: camelCase with 'use' prefix (usePWA.ts)
- **API Routes**: RESTful naming (route.ts in folders)
- **Utilities**: camelCase JavaScript modules (auth.ts)
- **Styles**: kebab-case CSS files (globals.css)
- **Configuration**: lowercase with extensions (next.config.ts)

## Data Flow Architecture
```
PWA Client → API Routes → Prisma ORM → PostgreSQL
     ↓           ↓            ↓
Service Worker → Redis Cache → Background Jobs
     ↓
IndexedDB (Offline Storage)
```

## Security Considerations
- **Authentication Flow**: JWT-based stateless authentication
- **Session Management**: Redis-backed secure sessions
- **Data Validation**: Input sanitization at API boundaries
- **HTTPS Enforcement**: TLS encryption for all communications
- **Permission Management**: Role-based access control

## Performance Optimizations
- **Server-Side Rendering**: Next.js SSR for fast initial loads
- **Static Generation**: Pre-built pages where possible
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic bundle splitting
- **Caching Strategy**: Multi-layer caching (Redis, CDN, Browser)
- **Database Indexing**: Optimized database queries with proper indexes