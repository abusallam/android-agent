# Android Agent AI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you get the **Hybrid PWA + React Native Platform** running quickly for development and testing.

---

## 📋 Prerequisites

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Comes with Node.js
- **Expo CLI** - For React Native development
- **Git** - [Download here](https://git-scm.com/)
- **ngrok account** (optional) - For external mobile testing

---

## 🚀 Quick Setup

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd android-agent
```

### **2. Setup PWA Dashboard**
```bash
cd modern-dashboard

# Install dependencies
npm install

# Setup database with admin user and sample data
npm run db:setup

# Start development server
npm run dev
```

**Access at**: http://localhost:3000  
**Login**: admin / admin123

### **3. Setup React Native App**
```bash
# Navigate to React Native app
cd ../react-native-app

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

**Test with**:
- **Expo Go app** on your mobile device
- **Android/iOS simulators**
- **Web browser** (limited functionality)

---

## 📱 Platform Overview

| Platform | Purpose | Technology | Access |
|----------|---------|------------|---------|
| **PWA Dashboard** | Administrators | Next.js 15 + React 19 | http://localhost:3000 |
| **React Native App** | End Users | Expo SDK 53 + React 19 | Expo Go / Simulators |
| **Shared Backend** | Both Platforms | Next.js API Routes | REST + WebSocket |

---

## 🔐 Default Credentials

### **Admin Access**
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: ROOT_ADMIN (full system access)

### **Sample Data**
- **3 Sample Devices** with GPS and sensor data
- **15 GPS Logs** with location history
- **27 Sensor Records** (accelerometer, gyroscope, magnetometer)

⚠️ **Security**: Change the default password after first login!

---

## 🧪 Testing Features

### **🌐 PWA Dashboard Features**
- ✅ **Professional UI** - GitHub-inspired dark theme
- ✅ **Admin User Management** - Create, edit, delete users
- ✅ **Real-time Dashboard** - Live device monitoring
- ✅ **Device Management** - View connected devices
- ✅ **PWA Installation** - Install on any device
- ✅ **Responsive Design** - Works on mobile and desktop

### **📱 React Native App Features**
- ✅ **Device Registration** - Automatic device setup
- ✅ **Sensor Data Collection** - Real-time sensor monitoring
- ✅ **Location Tracking** - GPS with background support
- ✅ **Real-time Sync** - Data synchronization with PWA
- ✅ **Native Performance** - Expo SDK 53 with New Architecture
- ✅ **Background Processing** - Continuous monitoring

### **🔗 Integration Features**
- ✅ **Real-time Communication** - WebSocket between platforms
- ✅ **Shared Authentication** - JWT tokens for both platforms
- ✅ **Cross-platform Data** - Device data visible in both apps
- ✅ **Role-based Access** - Different permissions per platform

---

## 🔧 External Testing with ngrok

For testing the React Native app with external API access:

### **1. Setup ngrok**
```bash
# Run the comprehensive setup script
./setup-ngrok-testing.sh
```

### **2. Start Services**
```bash
# Terminal 1: Start PWA Dashboard
./start-pwa.sh

# Terminal 2: Start ngrok tunnel
./start-ngrok.sh

# Terminal 3: Start React Native App
./start-react-native.sh
```

### **3. Test System**
```bash
# Check system health
./test-system.sh
```

---

## 📊 API Endpoints

Test these endpoints to verify the system:

### **System Health**
- **Health Check**: http://localhost:3000/api/health
- **Dashboard Data**: http://localhost:3000/api/dashboard

### **Authentication**
- **Login**: `POST /api/auth/login`
- **User Profile**: `GET /api/auth/me`
- **Logout**: `POST /api/auth/logout`

### **Admin Management**
- **List Users**: `GET /api/admin/users`
- **Create User**: `POST /api/admin/users`
- **Update User**: `PATCH /api/admin/users/[id]`

### **Device Management**
- **Register Device**: `POST /api/devices/register`
- **Sync Device Data**: `POST /api/device/sync`
- **Location Updates**: `POST /api/location/sync`

---

## 🛠️ Development Scripts

### **PWA Dashboard**
```bash
cd modern-dashboard

# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:setup        # Initialize with admin user
npm run db:push         # Push schema changes
npm run db:studio       # Open Prisma Studio

# Testing
npm run lint            # Run ESLint
npm run type-check      # TypeScript checking
```

### **React Native App**
```bash
cd react-native-app

# Development
npx expo start          # Start development server
npx expo start --web    # Start web version
npx expo start --ios    # Start iOS simulator
npx expo start --android # Start Android emulator

# Building
eas build --platform all # Build for production
```

---

## 🎯 Key Testing Scenarios

### **1. PWA Dashboard Testing**
1. **Login** with admin/admin123
2. **Navigate to Admin Panel** at `/admin`
3. **Create a new user** with different role
4. **View device dashboard** with sample data
5. **Test PWA installation** (Add to Home Screen)

### **2. React Native App Testing**
1. **Scan QR code** with Expo Go app
2. **Register device** automatically
3. **View sensor data** in real-time
4. **Check location tracking**
5. **Verify data sync** with PWA dashboard

### **3. Integration Testing**
1. **Register device** in React Native app
2. **Check device appears** in PWA dashboard
3. **Verify real-time updates** between platforms
4. **Test admin user management** across platforms

---

## 🚨 Troubleshooting

### **Common Issues**

#### **Port 3000 in use**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

#### **Database connection issues**
```bash
cd modern-dashboard
rm prisma/dev.db  # Remove old database
npm run db:setup  # Recreate with fresh data
```

#### **React Native Metro issues**
```bash
cd react-native-app
npx expo start --clear  # Clear Metro cache
```

#### **ngrok authentication issues**
1. Get new auth token from https://dashboard.ngrok.com/
2. Update `NGROK_AUTHTOKEN` in `.env.local`
3. Restart ngrok setup

### **Environment Issues**

#### **Missing environment variables**
```bash
# Copy example environment file
cp modern-dashboard/.env.example modern-dashboard/.env.local
# Edit with your values
```

#### **TypeScript errors**
```bash
# Regenerate Prisma client
cd modern-dashboard
npm run db:generate
```

---

## 🎯 Next Steps

### **For Developers**
1. **Explore the codebase** - Check project structure
2. **Read documentation** - Complete guides in README.md
3. **Set up development environment** - IDE, extensions, tools
4. **Run tests** - Ensure everything works correctly
5. **Start contributing** - Check CONTRIBUTING.md

### **For Testers**
1. **Test all PWA features** - Dashboard, admin, installation
2. **Test React Native app** - All services and integrations
3. **Test cross-platform sync** - Data flow between platforms
4. **Test external access** - ngrok setup and mobile testing
5. **Report issues** - Use GitHub Issues for bug reports

### **For Production**
1. **Configure production environment** - Database, security
2. **Set up deployment** - Docker, cloud hosting
3. **Configure monitoring** - Logging, health checks
4. **Set up CI/CD** - Automated testing and deployment
5. **Create user documentation** - End-user guides

---

## 📚 Additional Resources

### **Documentation**
- [**README.md**](README.md) - Complete project documentation
- [**CHANGELOG.md**](CHANGELOG.md) - Version history and changes
- [**PROJECT_STATUS.md**](PROJECT_STATUS.md) - Current development status
- [**CONTRIBUTING.md**](CONTRIBUTING.md) - Contribution guidelines

### **Technical Guides**
- [**Architecture Guide**](.kiro/specs/react-native-hybrid-enhancement/design.md) - System design
- [**API Reference**](.kiro/specs/react-native-hybrid-enhancement/requirements.md) - Complete API docs
- [**Testing Guide**](.kiro/specs/react-native-hybrid-enhancement/FINAL_TESTING_GUIDE.md) - Testing instructions

### **Support**
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and community support
- **Project Wiki** - Additional documentation and guides

---

## 🎉 Success!

You now have a complete **Hybrid PWA + React Native Platform** running with:

✅ **Professional PWA Dashboard** for administrators  
✅ **Modern React Native App** for end users  
✅ **Real-time synchronization** between platforms  
✅ **External testing capabilities** with ngrok  
✅ **Production-ready architecture** with modern technologies  

**Happy coding! 🚀**

---

*Last updated: August 7, 2025 - Hybrid Architecture Complete*