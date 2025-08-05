# Android Agent AI - Quick Start Guide

## 🚀 **Get Started in 5 Minutes**

### **Prerequisites**
- Node.js 18+
- Docker & Docker Compose (recommended)
- Git

### **Option 1: Docker Setup (Recommended)**

```bash
# Clone and start
git clone <repository-url>
cd android-agent
docker-compose up --build

# Access application
open http://localhost:3000/login
```

### **Option 2: Local Development**

```bash
# Clone repository
git clone <repository-url>
cd android-agent/modern-dashboard

# Install dependencies
npm install

# Setup database
npm run db:setup

# Start development server
npm run dev

# Access application
open http://localhost:3000/login
```

### **Login Credentials**
```
Username: admin
Password: admin123
```

## 🎯 **What You'll See**

### **Modern UI Features**
- ✅ **Dark Theme**: Beautiful gradient backgrounds
- ✅ **ShadCN/UI Components**: Professional card layouts
- ✅ **Glass Morphism**: Modern backdrop blur effects
- ✅ **Responsive Design**: Perfect on mobile and desktop
- ✅ **Smooth Animations**: Hover effects and transitions

### **Dashboard Features**
- 📊 **Real-time Metrics**: Device status and statistics
- 🗺️ **Interactive Maps**: GPS tracking visualization
- 📱 **Device Cards**: Status indicators and controls
- 🔔 **Alert System**: Notification management
- 🎥 **LiveKit Integration**: Video/audio streaming ready

## 🛠️ **Development Commands**

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:setup        # Initialize database
npm run db:studio       # Open Prisma Studio
npm run db:migrate      # Run migrations
npm run db:reset        # Reset database

# Testing
npm run test:local      # Setup and test locally
```

## 📱 **PWA Installation**

1. **Open in browser**: https://your-domain.com
2. **Click install prompt** or use browser menu
3. **Add to home screen** on mobile
4. **Launch like native app**

## 🔧 **Environment Setup**

Create `.env.local` in `modern-dashboard/`:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
BCRYPT_ROUNDS=12

# PWA
NEXT_PUBLIC_PWA_NAME="Android Agent AI"
```

## 🎨 **UI Components Available**

### **ShadCN/UI Components**
- `Card`, `CardHeader`, `CardContent` - Professional cards
- `Button` - Multiple variants with hover effects
- `Badge` - Status indicators
- `Alert` - Notification components
- `Input`, `Select` - Form elements
- `Progress` - Loading indicators

### **Custom Components**
- `ProtectedRoute` - Authentication wrapper
- `ThemeProvider` - Dark theme management
- `NoSSR` - Client-side rendering wrapper

## 🚀 **Ready for Development**

The project is now ready for feature development with:

- ✅ **Modern Stack**: Next.js 15 + React 19 + TypeScript 5
- ✅ **UI Library**: ShadCN/UI + Tailwind CSS 3.4
- ✅ **Database**: PostgreSQL + Prisma ORM
- ✅ **Authentication**: JWT + bcrypt
- ✅ **PWA**: Service workers + offline support

**Start building amazing features!** 🎉