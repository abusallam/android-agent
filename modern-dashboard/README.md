# Android Agent - Modern PWA Dashboard

A modern, secure Progressive Web App (PWA) for comprehensive Android device management and monitoring.

## 🚀 Quick Start

### Local Development (SQLite)

```bash
# 1. Install dependencies
npm install

# 2. Set up SQLite database
./setup-dev.sh

# 3. Start development server
DATABASE_URL="file:./dev.db" npm run dev

# 4. Open http://localhost:3000
# Login: admin / admin
```

### HTTPS Development with ngrok (Recommended for PWA)

```bash
# 1. Install ngrok (if not already installed)
# Visit: https://ngrok.com/download

# 2. Start ngrok in another terminal
ngrok http 3000

# 3. Configure ngrok URL
./setup-ngrok.sh

# 4. Start development server
npm run dev

# 5. Access via ngrok HTTPS URL
# PWA features now fully functional!
```

### Production (PostgreSQL)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.production

# 3. Configure PostgreSQL in .env.production
DATABASE_URL="postgresql://user:password@localhost:5432/android_agent_db"

# 4. Set up PostgreSQL database
./setup-prod.sh

# 5. Start production server
npm start
```

## 🗄️ Database Configuration

The application supports both SQLite (development) and PostgreSQL (production) with automatic switching:

### SQLite (Local Development)
- **File**: `./dev.db`
- **URL**: `file:./dev.db`
- **Schema**: `prisma/schema-sqlite.prisma`

### PostgreSQL (Production)
- **URL**: `postgresql://user:password@host:port/database`
- **Schema**: `prisma/schema-postgres.prisma`

### Switching Databases

```bash
# Switch to SQLite
npm run db:sqlite

# Switch to PostgreSQL
npm run db:postgres

# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Initialize with default data
npm run db:init
```

## 📦 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:init      # Initialize with default data
npm run db:studio    # Open Prisma Studio
npm run db:setup     # Full database setup
npm run db:reset     # Reset database
```

### Utilities
```bash
npm run test:local   # Full setup and test
./setup-dev.sh       # Set up for local development
./setup-prod.sh      # Set up for production
./test-local.sh      # Test local setup
```

## 🔧 Environment Variables

Create `.env.local` for development or `.env.production` for production:

```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev
# DATABASE_URL="postgresql://user:pass@host:port/db"  # PostgreSQL for prod

# Authentication
NEXTAUTH_SECRET="your-super-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Redis for sessions
REDIS_URL="redis://localhost:6379"

# Environment
NODE_ENV="development"

# PWA Configuration
NEXT_PUBLIC_WS_URL="ws://localhost:3000"
# For ngrok HTTPS: NEXT_PUBLIC_WS_URL="wss://your-subdomain.ngrok.io"
ENABLE_BACKGROUND_SYNC="true"
LOCATION_SYNC_INTERVAL="300000"
DEVICE_SYNC_INTERVAL="600000"

# LiveKit Configuration (for streaming features)
LIVEKIT_URL="wss://your-livekit-server.livekit.cloud"
LIVEKIT_API_KEY="your-api-key"
LIVEKIT_API_SECRET="your-api-secret"
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **Database**: PostgreSQL/SQLite + Prisma ORM
- **Authentication**: JWT + bcrypt
- **PWA**: Service Workers + Web APIs
- **Real-time**: WebSockets + Server-Sent Events

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/            # React components
├── hooks/                 # Custom hooks
├── lib/                   # Utilities and config
└── middleware.ts          # Next.js middleware

prisma/
├── schema.prisma          # Current schema (SQLite)
├── schema-sqlite.prisma   # SQLite schema
└── schema-postgres.prisma # PostgreSQL schema
```

## 🔐 Security Features

- **JWT Authentication** with secure cookies
- **bcrypt Password Hashing** (12 rounds)
- **Session Management** with Redis fallback
- **Rate Limiting** for API endpoints
- **CORS Configuration** for cross-origin requests
- **Security Headers** (CSP, HSTS, etc.)
- **Input Validation** and sanitization

## 📱 PWA Features

- **Installable** on all platforms (Android, iOS, Desktop)
- **Offline Support** with service workers
- **Background Sync** for continuous monitoring
- **Push Notifications** for real-time alerts
- **Auto-start** capability on device boot
- **Native App Experience** with touch optimization

## 🗺️ Core Features

### Device Management
- Real-time device monitoring
- GPS location tracking
- Battery and network status
- Application inventory
- File management
- Remote device control

### Security & Monitoring
- Emergency alert system
- Geofencing with location-based alerts
- Communication logs (calls, SMS)
- WiFi network monitoring
- Clipboard tracking
- Notification logging

### Dashboard & Analytics
- Interactive maps with device locations
- Real-time status updates
- Activity timeline
- Device statistics
- Emergency response center
- Notification management

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Device Management
- `POST /api/device/sync` - Device status sync
- `POST /api/location/sync` - GPS location sync
- `POST /api/emergency/alert` - Emergency alerts

### System
- `GET /api/health` - Health check
- `POST /api/sync` - General data sync
- `POST /api/push/subscribe` - Push notifications

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset database
npm run db:reset

# Check database connection
DATABASE_URL="file:./dev.db" npm run db:init

# View database
npm run db:studio
```

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npm run db:generate
```

### Environment Issues
```bash
# Check environment variables
echo $DATABASE_URL

# Test with explicit environment
DATABASE_URL="file:./dev.db" npm run dev
```

## 🚀 Deployment

### Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# View logs
docker-compose logs -f android-agent

# Health check
curl http://localhost:3000/api/health
```

### Manual Deployment
```bash
# 1. Set up production environment
cp .env.example .env.production

# 2. Configure PostgreSQL
# Edit DATABASE_URL in .env.production

# 3. Build application
npm run build

# 4. Start production server
npm start
```

## 📊 Performance

- **Build Size**: ~100KB First Load JS
- **Database**: Optimized queries with indexes
- **Caching**: Redis for sessions and data
- **PWA**: Offline-first architecture
- **Real-time**: Efficient WebSocket connections

## 🔄 Database Migration

### From Legacy System
```bash
# 1. Export data from legacy system
# 2. Run migration script (to be created)
# 3. Verify data integrity
npm run db:studio
```

### Schema Updates
```bash
# 1. Update schema file
# 2. Generate migration
npm run db:migrate

# 3. Apply to production
npm run db:push
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check this README
- **Issues**: Create GitHub issues
- **Health Check**: Visit `/api/health`
- **Database Browser**: Run `npm run db:studio`

---

**Default Login**: admin / admin (change in production!)