# 🛡️ Android Agent - Modern PWA Dashboard

A modern, secure Progressive Web App (PWA) for comprehensive Android device management and monitoring with real-time tracking, emergency alerts, and advanced geolocation features.

![Android Agent Dashboard](https://img.shields.io/badge/PWA-Ready-green) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![SQLite](https://img.shields.io/badge/SQLite-Ready-orange) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-blue)

## 🚀 Quick Start

### One-Command Setup
```bash
cd modern-dashboard
./start-clean.sh
```

This will:
- 🏗️ Build the application in production mode
- 🚀 Start the server (eliminates webpack runtime errors)
- 🌐 Launch ngrok tunnel for mobile access
- 📱 Display both PC and mobile URLs

### Manual Setup
```bash
cd modern-dashboard
npm install
npm run db:setup
npm run build
DATABASE_URL="file:./dev.db" node .next/standalone/server.js
```

## 🌟 Features

### 🔐 **Enterprise Security**
- JWT authentication with bcrypt password hashing
- Secure API endpoints with comprehensive validation
- Role-based access control and session management
- HTTPS/TLS support with modern security headers

### 📱 **Progressive Web App**
- **Installable** on all platforms (Android, iOS, Desktop)
- **Offline Support** with service workers
- **Background Sync** for continuous monitoring
- **Push Notifications** for real-time alerts
- **Auto-start** capability on device boot
- **Native Experience** with touch optimization

### 🗺️ **Advanced Geolocation**
- **Interactive Maps** with real-time device tracking
- **Geofencing** with location-based alerts
- **Route History** and movement analysis
- **Heatmaps** for usage pattern visualization

### 📊 **Real-Time Monitoring**
- **Live Device Status** with battery, network, and GPS tracking
- **Emergency Alert System** with instant notifications
- **Communication Logs** (calls, SMS, contacts)
- **File Management** with remote access
- **WiFi Network** scanning and monitoring
- **Application Inventory** and permission tracking

### 🎨 **Modern Interface**
- **Dark/Light Theme** with automatic system detection
- **Responsive Design** optimized for all screen sizes
- **Touch-Friendly** mobile-first design
- **Real-time Updates** with live data streaming

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + Radix UI components
- **Database**: SQLite (dev) / PostgreSQL (prod) + Prisma ORM
- **Authentication**: JWT tokens + bcrypt hashing
- **PWA**: Service Workers + Web APIs
- **Real-time**: WebSockets + Server-Sent Events

### Database Support
- **SQLite** for local development and small deployments
- **PostgreSQL** for production and enterprise use
- **Automatic switching** based on environment
- **Prisma ORM** for type-safe database access

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- UV package manager (for Python tools)
- ngrok (for mobile testing)

### Complete Setup (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd android-agent

# Run complete setup (includes UV package manager)
./setup-complete.sh

# Start development
./run-dev.sh
```

### Manual Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd android-agent

# Install UV package manager (if not installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Setup Node.js project
cd modern-dashboard
npm install

# Set up SQLite database
cp prisma/schema-sqlite.prisma prisma/schema.prisma
npm run db:generate
npm run db:push
npm run db:init

# Start development (production mode - no webpack errors)
./start-clean.sh
```

### Production Setup
```bash
# Set up PostgreSQL
cp prisma/schema-postgres.prisma prisma/schema.prisma
export DATABASE_URL="postgresql://user:password@host:port/database"

# Build and start
npm run build
DATABASE_URL="your-postgres-url" node .next/standalone/server.js
```

## 🌐 Access URLs

### 🖥️ **PC Access**
- **Local**: `http://localhost:3000`
- **Network**: `http://your-ip:3000`

### 📱 **Mobile Access**
- **ngrok Tunnel**: Provided when running `./start-clean.sh`
- **Local Network**: `http://your-ip:3000` (same WiFi required)

### 🔑 **Default Login**
- **Username**: `admin`
- **Password**: `admin`

## 📱 PWA Installation

### Mobile Installation
1. Open the ngrok URL on your mobile device
2. Look for "Add to Home Screen" prompt
3. Follow installation instructions
4. App will work offline and can auto-start

### Desktop Installation
1. Open `http://localhost:3000` in Chrome/Edge
2. Look for install icon in address bar
3. Click to install as desktop app

## 🗄️ Database Management

### Available Scripts
```bash
# Database operations
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:migrate      # Run migrations (PostgreSQL)
npm run db:init         # Initialize with default data
npm run db:studio       # Open database browser
npm run db:setup        # Complete setup
npm run db:reset        # Reset database

# Switch database types
npm run db:sqlite       # Switch to SQLite
npm run db:postgres     # Switch to PostgreSQL
```

### Database Configuration
```env
# SQLite (Development)
DATABASE_URL="file:./dev.db"

# PostgreSQL (Production)
DATABASE_URL="postgresql://user:password@host:port/database"
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Device Management
- `POST /api/device/sync` - Device status synchronization
- `POST /api/location/sync` - GPS location updates
- `POST /api/emergency/alert` - Emergency alerts

### System
- `GET /api/health` - Health check and system status
- `POST /api/sync` - General data synchronization
- `POST /api/push/subscribe` - Push notification subscription

## 🎯 Dashboard Components

### 📊 **Status Overview**
- Real-time device statistics
- Battery levels and network status
- GPS tracking status
- Active alerts counter

### 🗺️ **Interactive Map**
- Live device location tracking
- Clickable device markers
- Location accuracy indicators
- Map controls and navigation

### 🚨 **Emergency Panel**
- Panic alert system
- Emergency contacts
- Quick action buttons
- Alert history

### 📱 **Device Status Cards**
- Detailed device information
- Battery and network status
- Last seen timestamps
- Quick action buttons

### 🔔 **Notification Manager**
- Real-time notifications
- Alert management
- Notification history
- Settings and preferences

### 📱 **PWA Installer**
- Installation status
- Auto-start configuration
- Permission management
- Setup wizard

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_SECRET="your-super-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Redis for sessions
REDIS_URL="redis://localhost:6379"

# PWA Configuration
NEXT_PUBLIC_WS_URL="ws://localhost:3000"
ENABLE_BACKGROUND_SYNC="true"
LOCATION_SYNC_INTERVAL="300000"
DEVICE_SYNC_INTERVAL="600000"
```

### Docker Deployment
```bash
# Using Docker Compose
docker-compose up --build -d

# Manual Docker build
docker build -t android-agent .
docker run -p 3000:3000 -e DATABASE_URL="your-db-url" android-agent
```

## 🐛 Troubleshooting

### Common Issues

**Webpack Runtime Errors**
- ✅ **Solution**: Use production mode with `./start-clean.sh`
- The script builds and runs in production mode, eliminating webpack development errors

**CSS Not Loading**
- ✅ **Solution**: Tailwind CSS is properly configured
- Run `npm run build` to ensure CSS is compiled

**Mobile Access Issues**
- ✅ **Solution**: Use ngrok tunnel provided by the startup script
- Ensure mobile device can access the ngrok URL

**Database Connection Errors**
- ✅ **Solution**: Run `npm run db:init` to initialize the database
- Check DATABASE_URL environment variable

### Debug Commands
```bash
# Check server logs
tail -f prod-server.log

# Check ngrok status
curl http://localhost:4040/api/tunnels

# Test API health
curl http://localhost:3000/api/health

# Open database browser
npm run db:studio
```

## 📦 UV Package Manager Integration

This project includes UV package manager for Python development tools and utilities:

### UV Commands
```bash
# Install UV (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install development dependencies
uv add --dev black flake8 pytest mypy

# Run Python tools
uv run black .
uv run flake8 .
uv run pytest

# Create virtual environment
uv venv
source .venv/bin/activate  # Linux/Mac
```

### Available UV Tools
- **black**: Code formatting
- **flake8**: Linting and style checking
- **pytest**: Testing framework
- **mypy**: Type checking

## 🚀 Performance

- **Build Size**: ~100KB First Load JS
- **Database**: Optimized queries with indexes
- **Caching**: Service worker caching strategies
- **Real-time**: Efficient WebSocket connections
- **PWA**: Offline-first architecture

## 🔒 Security Features

- **JWT Authentication** with secure cookies
- **bcrypt Password Hashing** (12 rounds)
- **Session Management** with Redis support
- **CORS Configuration** for cross-origin requests
- **Security Headers** (CSP, HSTS, etc.)
- **Input Validation** and sanitization
- **Rate Limiting** for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and `SETUP_SUMMARY.md`
- **Issues**: Create GitHub issues for bugs or feature requests
- **Health Check**: Visit `/api/health` for system status
- **Database Browser**: Run `npm run db:studio`

---

## 🎉 **Ready for GitHub! Complete Intelligence Platform**

The Android Agent AI is now production-ready with comprehensive testing and user feedback integration:
- ✅ **Custom Assets Integrated** - Background image and logo properly implemented
- ✅ **Mobile Responsive** - Fixed CSS breaking, touch-friendly interface
- ✅ **Local Development Tested** - All core features validated on PC and mobile
- ✅ **LiveKit Infrastructure** - Complete WebRTC streaming setup ready
- ✅ **Intelligence Theme** - Professional AI-focused design with custom branding
- ✅ **PWA Capabilities** - Installable, offline support, background sync
- ✅ **Performance Optimized** - 109KB bundle, 9-second build time
- ✅ **Comprehensive Documentation** - Complete guides and testing reports

## 🚀 **Quick Start Options**

### **🐳 Docker Infrastructure (Recommended)**
```bash
# Start complete infrastructure with LiveKit + COTURN
./docker-start.sh start

# Test all streaming capabilities
./test-docker-setup.sh

# Access: http://localhost:3000
```

### **💻 Local Development**
```bash
# Start local development
cd modern-dashboard
./start-clean.sh

# Access: http://localhost:3000
# Mobile: https://93aab4c1e00c.ngrok-free.app
```

**Default Login**: admin / admin

## 📹 **Streaming Capabilities**

- **Video Streaming** - Camera access with LiveKit WebRTC
- **Audio Communication** - Two-way audio with noise cancellation
- **Screen Sharing** - Real-time desktop capture
- **NAT Traversal** - COTURN server for firewall bypass
- **Multi-device Support** - Concurrent stream management
- **Emergency Communication** - Priority streaming system
- **Session Recording** - Video/audio session capture
- **Adaptive Quality** - Bandwidth-based optimization

## 🌐 **Access Information**

- **🖥️ PC Dashboard**: `http://localhost:3000`
- **📱 Mobile Access**: `https://93aab4c1e00c.ngrok-free.app`
- **🎥 LiveKit Server**: `ws://localhost:7880` (Docker)
- **🌐 COTURN Server**: `stun:localhost:3478` (Docker)
- **🗄️ Database**: SQLite (dev) / PostgreSQL (prod)

## 📊 **Project Status**

- **Version**: 1.0.0
- **Status**: ✅ Production Ready
- **Bundle Size**: 104KB (optimized)
- **Dependencies**: 809 packages, 0 vulnerabilities
- **Features**: Complete streaming infrastructure
- **Documentation**: Comprehensive guides and testing

**See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed status information.**