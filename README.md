# 🛡️ Family Safety Monitor - Enhanced PWA for Disabled Family Care

<div align="center">

![Family Safety Monitor](modern-dashboard/public/logo.png)

**A comprehensive, secure Progressive Web App (PWA) designed specifically for monitoring disabled family members with real-time tracking, emergency alerts, and auto-start capabilities**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Auto--Start-purple?style=for-the-badge)](https://web.dev/progressive-web-apps/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG-orange?style=for-the-badge)](https://www.w3.org/WAI/WCAG21/quickref/)

[🌟 Features](#-features) • [🚀 Quick Start](#-quick-start) • [📱 Mobile Setup](#-mobile-setup) • [🔧 Configuration](#-configuration) • [🤝 Contributing](#-contributing)

**⭐ Star this repository if it helps your family! ⭐**

</div>

---

## 🎯 **Mission Statement**

Family Safety Monitor is built with **love and understanding** for families caring for disabled loved ones. This isn't just another tracking app - it's a **comprehensive safety solution** designed specifically for families who need **reliable, continuous monitoring** for their disabled family members' safety and wellbeing.

### 💙 **Why This Matters**

- **Peace of Mind**: Know your loved one is safe, even when you can't be there
- **Emergency Response**: Immediate alerts when help is needed
- **Independence**: Allow your family member to maintain independence while staying safe
- **Accessibility**: Designed with disabled users in mind from the ground up
- **Family-Focused**: Built by families, for families who understand the challenges

---

## 🌟 Features

### 🔐 **Enterprise-Grade Security**
- **JWT Authentication** with bcrypt password hashing
- **Secure API endpoints** with comprehensive input validation
- **HTTPS/TLS support** with security headers
- **Role-based access control** and session management
- **CSRF protection** and XSS prevention

### 📱 **Advanced Progressive Web App**
- **🔄 Auto-Start on Boot** - Automatically starts when device restarts
- **🛡️ Background Monitoring** - Continuous monitoring even when app is closed
- **📍 Location Tracking** - Automatic GPS updates every 5 minutes
- **🚨 Emergency Alerts** - Automatic detection and notification of emergency conditions
- **💾 Offline Support** - Full functionality without internet connection
- **🔔 Push Notifications** - Real-time alerts and notifications
- **📱 Cross-Platform** - Android, iOS, Desktop, Tablet support

### 🌍 **Multilingual & Accessible**
- **Arabic & English** support with full RTL layout
- **Dark/Light theme** with automatic system detection
- **Responsive design** optimized for all screen sizes
- **Touch-friendly** interface for mobile devices
- **Accessibility compliant** with WCAG guidelines

### 📊 **Real-Time Device Management**
- **Live GPS tracking** with interactive maps
- **Device information** collection and monitoring
- **Call logs & SMS logs** tracking and analysis
- **File management** with remote access capabilities
- **WiFi network** scanning and logging
- **App inventory** and permission monitoring

### 🤖 **AI-Ready Architecture** *(Phase 2)*
- **Intelligent alerts** with anomaly detection
- **Natural language queries** for device management
- **Predictive analytics** for device maintenance
- **Automated responses** to common issues

---

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for development)
- **PostgreSQL 15+** (if not using Docker)

### 🐳 One-Click Docker Deployment

```bash
# Clone the repository
git clone https://github.com/yourusername/android-agent.git
cd android-agent

# Start the entire stack with Docker Compose
docker-compose up -d

# Wait for services to be healthy (about 30 seconds)
docker-compose logs -f android-agent

# Access the application
open http://localhost:3000
```

**That's it! 🎉** The application is now running with:
- ✅ Modern PWA Dashboard on port 3000
- ✅ PostgreSQL database with automatic setup
- ✅ Redis for sessions and caching
- ✅ Complete PWA functionality with auto-start capabilities

### 🔑 Default Credentials
- **Username:** `admin`
- **Password:** `admin`

> ⚠️ **Security Notice:** Change the default password immediately in production!

---

## 📱 PWA Auto-Start Setup

### **🔄 Auto-Start Feature**
The Android Agent PWA includes advanced auto-start capabilities that ensure continuous monitoring:

#### **Key Auto-Start Features:**
- **🚀 Boot Startup** - App automatically starts when device restarts
- **🛡️ Background Monitoring** - Continuous operation even when app is closed
- **📍 Location Updates** - Automatic GPS tracking every 5 minutes
- **📱 Device Status** - System information updates every 30 seconds
- **🚨 Emergency Detection** - Automatic alerts for low battery, location issues
- **💾 Offline Operation** - Works without internet connection
- **🔄 Auto-Sync** - Synchronizes data when connection is restored

### **📋 Setup Instructions**

#### **Step 1: Install PWA**
1. Open the Android Agent URL on your Android device
2. Tap **"Install App"** when the installation prompt appears
3. The app will be added to your home screen

#### **Step 2: Configure Auto-Start**
1. In the dashboard, click **"Setup Auto-Start"**
2. Enter your login credentials
3. ✅ Check **"Save credentials for auto-login"**
4. Click **"Enable Auto-Start"**
5. Grant the following permissions:
   - 📍 **Location** - Always allow (for GPS tracking)
   - 🔔 **Notifications** - Allow (for emergency alerts)
   - 📱 **Background App Refresh** - Enable (for continuous monitoring)

#### **Step 3: Test Auto-Start**
1. Restart your Android device
2. The PWA should automatically open and start monitoring
3. Check that background monitoring shows as active
4. Test emergency alert functionality

### **🛡️ How Auto-Start Works**

#### **On Device Boot:**
1. **Enhanced Service Worker** activates automatically
2. **Saved credentials** are retrieved from secure storage
3. **Auto-login** happens in background
4. **Background monitoring** starts immediately
5. **Location tracking** begins automatically
6. **Emergency monitoring** is activated

#### **Continuous Operation:**
- **Runs in background** even when screen is off
- **Survives app switching** and multitasking
- **Continues monitoring** during phone calls
- **Persists through** device sleep/wake cycles
- **Only stops** when manually disabled or uninstalled

---

## 🏗️ Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 15 + TypeScript | Modern React framework with SSR |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **Database** | PostgreSQL 15 + Prisma | Scalable relational database |
| **Cache** | Redis 7 | Session storage and caching |
| **Auth** | JWT + bcrypt | Secure authentication |
| **PWA** | Enhanced Service Workers | Auto-start and background sync |
| **UI** | Tailwind CSS + Radix UI | Modern, accessible components |
| **i18n** | next-intl | Internationalization support |

### **Enhanced PWA Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Android Device                           │
├─────────────────────────────────────────────────────────────┤
│  📱 PWA App (Installed)                                     │
│  ├── 🔄 Auto-Start on Boot                                  │
│  ├── 🛡️ Enhanced Service Worker                            │
│  ├── 📍 Background Location Tracking                       │
│  ├── 🚨 Emergency Detection                                 │
│  └── 💾 Offline Data Storage                               │
├─────────────────────────────────────────────────────────────┤
│  🌐 Network Layer                                           │
│  ├── 🔄 Background Sync                                     │
│  ├── 📡 Real-time Communication                            │
│  └── 🔒 Secure API Calls                                   │
├─────────────────────────────────────────────────────────────┤
│  🖥️ Server Infrastructure                                   │
│  ├── 🚀 Next.js API Routes                                 │
│  ├── 🗄️ PostgreSQL Database                                │
│  ├── ⚡ Redis Cache                                         │
│  └── 🔐 JWT Authentication                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the `modern-dashboard` directory:

```env
# Database
DATABASE_URL="postgresql://android_agent:secure_password@localhost:5432/android_agent_db"

# Security
NEXTAUTH_SECRET="your-super-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Redis
REDIS_URL="redis://localhost:6379"

# Optional: AI Features (Phase 2)
OPENAI_API_KEY="your-openai-api-key"

# Optional: Enhanced Maps (Phase 2)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your-mapbox-token"

# PWA Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
```

### Docker Configuration

Customize `docker-compose.yml` for your environment:

```yaml
environment:
  # Change these for production
  POSTGRES_PASSWORD: "your-secure-db-password"
  NEXTAUTH_SECRET: "your-unique-secret-key"
  REDIS_PASSWORD: "your-redis-password"
```

---

## 🛠️ Development

### Local Development Setup

```bash
# Clone and install dependencies
git clone https://github.com/yourusername/android-agent.git
cd android-agent/modern-dashboard
npm install

# Set up database
npm run db:push
npm run db:init

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

---

## 🚢 Deployment

### 🐳 Docker (Recommended)

```bash
# Production deployment
docker-compose up -d

# View logs
docker-compose logs -f android-agent

# Health check
curl http://localhost:3000/api/health
```

### ☁️ Cloud Platforms

#### **Vercel (Frontend + API)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd modern-dashboard
vercel

# Configure environment variables in Vercel dashboard
```

#### **Railway (Full Stack)**
```bash
# Connect your GitHub repository to Railway
# Railway will automatically detect and deploy the Docker setup
```

#### **DigitalOcean App Platform**
```bash
# Use the provided docker-compose.yml
# Configure environment variables in the DigitalOcean dashboard
```

### 🖥️ Self-Hosted

#### **Ubuntu/CentOS Server**
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone and deploy
git clone https://github.com/yourusername/android-agent.git
cd android-agent
docker-compose up -d
```

#### **Raspberry Pi (ARM)**
```bash
# Use ARM-compatible images
# Modify docker-compose.yml to use arm64 images
docker-compose up -d
```

---

## 📊 PWA vs Native App Comparison

| Feature | Android Agent PWA | Traditional Native App |
|---------|-------------------|------------------------|
| **Installation Size** | ~3MB | ~20-50MB |
| **Installation Method** | One-click from browser | App store download |
| **Updates** | Automatic, instant | Manual download |
| **Auto-Start on Boot** | ✅ Full support | ✅ Full support |
| **Background Processing** | ✅ Service Workers | ✅ Native background |
| **Cross-Platform** | ✅ Android, iOS, Desktop | ❌ Platform-specific |
| **Offline Support** | ✅ Full offline mode | ✅ Limited offline |
| **Push Notifications** | ✅ Web Push API | ✅ Native push |
| **Distribution** | 🌐 Share URL | 📱 App store approval |
| **Development Cost** | 💰 Single codebase | 💰💰 Multiple codebases |

---

## 🔒 Security Features

- **🔐 JWT Authentication** - Stateless, secure token-based auth
- **🛡️ bcrypt Password Hashing** - Industry-standard password protection
- **🍪 Secure Cookies** - HttpOnly, Secure, SameSite protection
- **🔒 HTTPS Enforcement** - TLS/SSL encryption for all communications
- **🚫 CSRF Protection** - Cross-site request forgery prevention
- **🛡️ XSS Prevention** - Content Security Policy headers
- **📝 Input Validation** - Comprehensive request sanitization
- **🔍 SQL Injection Protection** - Prisma ORM with prepared statements
- **💾 Secure Storage** - Encrypted local storage for credentials

---

## 🧪 Testing

### **PWA Auto-Start Testing**

#### **Test Checklist:**
- [ ] PWA installs to home screen successfully
- [ ] Auto-start setup completes without errors
- [ ] Device restarts and app starts automatically
- [ ] Background monitoring shows as active
- [ ] Location updates are being sent every 5 minutes
- [ ] Emergency test alert works
- [ ] App continues running in background
- [ ] Offline functionality works correctly
- [ ] Data syncs when connection is restored

#### **Testing Commands:**
```bash
# Test the auto-start PWA server
node auto-start-pwa.js

# Test HTTPS functionality
node simple-https-test.js

# Test with ngrok tunnel
ngrok http 3000
```

---

## 🗺️ Roadmap

### 🎯 **Phase 1: Core PWA with Auto-Start** ✅ **COMPLETED**
- [x] Modern Next.js 15 PWA with TypeScript
- [x] Auto-start on device boot functionality
- [x] Background monitoring with service workers
- [x] Location tracking and emergency alerts
- [x] Offline support and data synchronization
- [x] Docker containerization
- [x] Comprehensive documentation

### 🚀 **Phase 2: Enhanced Features** *(Coming Soon)*
- [ ] **AI-Powered Analytics** - Intelligent device behavior analysis
- [ ] **Advanced Geofencing** - Complex location-based rules with Mapbox
- [ ] **Multi-Device Management** - Support for multiple family members
- [ ] **Enhanced Security** - Two-factor authentication, device encryption
- [ ] **React Native Client** - Native mobile app for advanced features
- [ ] **Advanced Monitoring** - App usage tracking, screen time monitoring

### 🔮 **Phase 3: Enterprise Features** *(Future)*
- [ ] **Multi-Tenant Support** - Organization and team management
- [ ] **API Webhooks** - External system integrations
- [ ] **Machine Learning** - Predictive device maintenance
- [ ] **IoT Integration** - Support for IoT devices beyond Android
- [ ] **Advanced Reporting** - Custom dashboards and exports

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 Bug Reports
- Use the [issue tracker](https://github.com/yourusername/android-agent/issues)
- Include detailed reproduction steps
- Provide system information and logs

### 💡 Feature Requests
- Check existing [feature requests](https://github.com/yourusername/android-agent/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)
- Describe the use case and expected behavior
- Consider contributing the implementation!

### 🔧 Development
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Open Source Community** - Inspiration and collaboration
- **Next.js Team** - Amazing React framework with PWA support
- **Prisma Team** - Excellent database toolkit
- **Tailwind CSS** - Beautiful utility-first CSS framework
- **Service Worker Community** - Advanced PWA capabilities

---

## 📞 Support

- **📧 Email:** support@androidagent.dev
- **💬 Discord:** [Join our community](https://discord.gg/androidagent)
- **📖 Documentation:** [docs.androidagent.dev](https://docs.androidagent.dev)
- **🐛 Issues:** [GitHub Issues](https://github.com/yourusername/android-agent/issues)

---

## 🎯 **Phase 1 Completion Status**

### ✅ **Completed Features:**
- **🔄 Auto-Start PWA** - Automatically starts on device boot
- **🛡️ Background Monitoring** - Continuous operation with service workers
- **📍 Location Tracking** - Automatic GPS updates every 5 minutes
- **🚨 Emergency Alerts** - Low battery and location-based alerts
- **💾 Offline Support** - Full functionality without internet
- **🔐 Secure Authentication** - JWT with bcrypt password hashing
- **🌍 Multilingual Support** - Arabic/English with RTL layout
- **🐳 Docker Deployment** - One-click deployment with Docker Compose
- **📱 PWA Installation** - Add to home screen with auto-start setup
- **🔄 Background Sync** - Data synchronization when connection restored

### 🚀 **Ready for Production Deployment!**

<div align="center">

**⭐ Star this repository if you find it useful!**

**Made with ❤️ for families who need reliable device monitoring**

[🏠 Homepage](https://androidagent.dev) • [📚 Documentation](https://docs.androidagent.dev) • [💬 Community](https://discord.gg/androidagent)

</div>