# 📱 Android Agent AI - APK Generation Guide

## 🎯 **Current Status: READY FOR APK BUILD**

### ✅ **Completed Implementation**

- **ATAK-inspired tactical features** with Leaflet + LiveKit
- **Security & Permission Management** with expo-secure-store
- **Location Services** with geofencing and background tracking
- **Real-time Communication** with LiveKit data channels
- **Database Integration** with tactical schema extensions
- **EAS Build Configuration** for cloud APK generation

---

## 🔑 **API Keys Required (Priority Order)**

### **🔥 ESSENTIAL (Must Have)**

```bash
# 1. JWT Secret (generate one)
JWT_SECRET=your_jwt_secret_here_minimum_32_characters

# 2. Expo Access Token (from your account)
EXPO_ACCESS_TOKEN=your_expo_access_token_here
```

### **⚡ RECOMMENDED (Enhanced Features)**

```bash
# 3. LiveKit Cloud (for streaming)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# 4. API URLs (your server)
EXPO_PUBLIC_API_URL=http://your-server.com:3000
EXPO_PUBLIC_WS_URL=ws://your-server.com:3000
```

### **💡 OPTIONAL (Nice to Have)**

```bash
# 5. Google Maps (enhanced mobile maps)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# 6. Push Notifications
EXPO_PUBLIC_PUSH_TOKEN=ExponentPushToken[your_push_token]
```

---

## 🚀 **APK Build Options**

### **Option 1: Expo Cloud Build (Recommended)**

```bash
# Quick cloud build
./scripts/build-apk.sh
```

**Advantages:**

- ✅ No local Android SDK required
- ✅ Consistent build environment
- ✅ Automatic signing and optimization
- ✅ Build artifacts stored in cloud
- ✅ Easy sharing via download links

### **Option 2: Local Build**

```bash
# Local build (requires Android SDK)
./scripts/build-apk-local.sh
```

**Advantages:**

- ✅ Full control over build process
- ✅ No dependency on cloud services
- ✅ Faster iteration for development
- ✅ Works offline

---

## 📋 **Step-by-Step APK Generation**

### **Step 1: Set Up API Keys**

1. **Generate JWT Secret:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Get Expo Access Token:**

   ```bash
   npm install -g @expo/cli
   expo login
   expo whoami --json
   ```

3. **Create Environment File:**
   ```bash
   cd react-native-app
   cp .env.example .env
   # Edit .env with your API keys
   ```

### **Step 2: Choose Build Method**

#### **Cloud Build (Recommended):**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
expo login

# Build APK
./build-apk.sh
```

#### **Local Build:**

```bash
# Ensure Android SDK is installed
export ANDROID_HOME=/path/to/android-sdk

# Build APK
./build-apk-local.sh
```

### **Step 3: Install APK**

```bash
# Install on connected device
adb install android-agent-tactical.apk

# Or share APK file for manual installation
```

---

## 🏗️ **Build Profiles Available**

### **Preview Build (Testing)**

- **Purpose**: Testing and development
- **Output**: APK file
- **Signing**: Debug signing
- **Size**: ~50MB
- **Command**: `eas build --platform android --profile preview`

### **Production Build (Release)**

- **Purpose**: Production deployment
- **Output**: APK file
- **Signing**: Release signing
- **Size**: ~40MB (optimized)
- **Command**: `eas build --platform android --profile production`

### **Production AAB (Play Store)**

- **Purpose**: Google Play Store submission
- **Output**: AAB file
- **Signing**: Release signing
- **Size**: ~35MB (optimized)
- **Command**: `eas build --platform android --profile production-aab`

---

## 📱 **App Features Included**

### **✅ Tactical Mapping**

- Leaflet-based tactical maps
- Real-time device tracking
- Geofencing with alerts
- Drawing tools for planning
- Multiple map layers (Street/Satellite/Terrain)

### **✅ Communication**

- LiveKit video/audio streaming
- Real-time data channels
- Emergency broadcasting
- Push notifications
- Mesh networking support

### **✅ Security**

- Secure storage with encryption
- Comprehensive permission management
- JWT authentication
- Role-based access control
- Audit logging

### **✅ Location Services**

- High-precision GPS tracking
- Background location monitoring
- Geofence detection
- Emergency location broadcasting
- Movement analysis

---

## 🔧 **Build Configuration**

### **App Details**

- **Name**: Android Agent AI - Tactical
- **Package**: com.androidagent.tactical
- **Version**: 1.0.0
- **Target SDK**: Android 14 (API 34)
- **Min SDK**: Android 7.0 (API 24)

### **Permissions Included**

- Location (foreground & background)
- Camera & Microphone
- Storage & Media Library
- Notifications
- Network Access
- Contacts & Calendar
- Sensors & Device Info

### **Features**

- New Architecture (Fabric + Turbo Modules)
- Edge-to-edge display support
- Dark theme optimized
- PWA companion app support
- Offline functionality

---

## 🎯 **Quick Start (Minimum Setup)**

If you want to build APK with minimal setup:

```bash
# 1. Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Create basic .env file
cd react-native-app
echo "JWT_SECRET=$JWT_SECRET" > .env
echo "EXPO_PUBLIC_API_URL=http://localhost:3000" >> .env
echo "EXPO_PUBLIC_WS_URL=ws://localhost:3000" >> .env

# 3. Build APK
./build-apk.sh
```

This will create a functional APK with basic features. You can add more API keys later for enhanced functionality.

---

## 📊 **Expected Build Results**

### **APK Size**: ~40-50MB

### **Build Time**: 10-15 minutes (cloud) / 5-10 minutes (local)

### **Compatibility**: Android 7.0+ (API 24+)

### **Architecture**: ARM64, ARMv7, x86_64

---

## 🎉 **What You'll Get**

A fully functional **ATAK-inspired tactical awareness app** with:

- 🗺️ **Professional tactical mapping**
- 📡 **Real-time team communication**
- 🛡️ **Advanced geofencing & alerts**
- 📱 **Native mobile performance**
- 🔐 **Enterprise-grade security**
- 🚨 **Emergency response system**

**Ready to build your tactical APK!** 🚀

---

_APK Generation Guide - August 7, 2025_
