# 🚀 Tactical Mapping System - Complete Setup Guide

## 📋 **Prerequisites**

### **System Requirements**
- **Operating System**: macOS, Windows, or Linux
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or yarn 1.22.0+)
- **Git**: Latest version
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: At least 10GB free space

### **Development Tools**

#### **Required**
- **Expo CLI**: `npm install -g @expo/cli`
- **EAS CLI**: `npm install -g eas-cli`
- **Code Editor**: VS Code (recommended) with extensions:
  - React Native Tools
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - Auto Rename Tag

#### **Platform-Specific**

##### **Android Development**
- **Android Studio**: Latest stable version
- **Android SDK**: API level 30 or higher
- **Java Development Kit**: JDK 11 or higher
- **Android Emulator** or physical Android device

##### **iOS Development (macOS only)**
- **Xcode**: Latest stable version
- **iOS Simulator** or physical iOS device
- **CocoaPods**: `sudo gem install cocoapods`

---

## 🛠️ **Installation Steps**

### **Step 1: Clone Repository**
```bash
# Clone the repository
git clone <repository-url>
cd react-native-app

# Verify you're in the correct directory
ls -la
# Should see package.json, src/, etc.
```

### **Step 2: Install Dependencies**
```bash
# Install Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

### **Step 3: Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env  # or use your preferred editor
```

#### **Environment Variables**
```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_TIMEOUT=30000

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# LiveKit Configuration
EXPO_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
EXPO_PUBLIC_LIVEKIT_API_KEY=your-api-key
EXPO_PUBLIC_LIVEKIT_SECRET_KEY=your-secret-key

# Map Configuration
EXPO_PUBLIC_DEFAULT_MAP_CENTER_LAT=31.9686
EXPO_PUBLIC_DEFAULT_MAP_CENTER_LNG=35.2033
EXPO_PUBLIC_DEFAULT_MAP_ZOOM=10

# Feature Flags
EXPO_PUBLIC_ENABLE_3D_TERRAIN=true
EXPO_PUBLIC_ENABLE_AI_TRACKING=true
EXPO_PUBLIC_ENABLE_MESH_NETWORKING=false
```

### **Step 4: Verify Installation**
```bash
# Check Expo CLI
expo --version

# Check EAS CLI
eas --version

# Verify project structure
npm run type-check
```

---

## 🏃‍♂️ **Running the Application**

### **Development Server**
```bash
# Start Expo development server
npm start

# Alternative: Start with specific options
npm start -- --clear  # Clear cache
npm start -- --tunnel  # Use tunnel connection
```

### **Platform-Specific Launch**

#### **Web Development**
```bash
# Start web version
npm run web

# Open in browser
# http://localhost:19006
```

#### **Android Development**
```bash
# Using Android emulator
npm run android

# Using physical device
# 1. Enable USB debugging on device
# 2. Connect via USB
# 3. Run: npm run android
```

#### **iOS Development (macOS only)**
```bash
# Using iOS simulator
npm run ios

# Using physical device
# 1. Connect device via USB
# 2. Trust computer on device
# 3. Run: npm run ios
```

---

## 🔧 **Development Environment Setup**

### **VS Code Configuration**

#### **Recommended Extensions**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-react-native",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

#### **Workspace Settings**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### **Git Configuration**
```bash
# Set up Git hooks (optional)
npx husky install

# Configure Git for the project
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

## 🧪 **Testing Setup**

### **Unit Testing**
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### **E2E Testing**
```bash
# Install Playwright browsers
npm run test:install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

---

## 🏗️ **Backend Services Setup**

### **Supabase Setup**
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note the URL and anon key

2. **Database Schema**
   ```sql
   -- Run in Supabase SQL editor
   -- See supabase-schema.sql for complete schema
   ```

3. **Environment Variables**
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### **LiveKit Setup**
1. **LiveKit Cloud** (Recommended)
   - Sign up at [livekit.io](https://livekit.io)
   - Create project and get credentials

2. **Self-Hosted LiveKit**
   ```bash
   # Using Docker
   docker run --rm -p 7880:7880 \
     -e LIVEKIT_KEYS="APIKey: APISecret" \
     livekit/livekit-server
   ```

3. **Environment Variables**
   ```bash
   EXPO_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
   EXPO_PUBLIC_LIVEKIT_API_KEY=your-api-key
   EXPO_PUBLIC_LIVEKIT_SECRET_KEY=your-secret-key
   ```

---

## 📱 **Device Testing**

### **Android Device Setup**
1. **Enable Developer Options**
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > Developer Options

2. **Enable USB Debugging**
   - In Developer Options, enable "USB Debugging"
   - Connect device via USB
   - Accept debugging prompt on device

3. **Verify Connection**
   ```bash
   # Check connected devices
   adb devices
   
   # Should show your device
   ```

### **iOS Device Setup (macOS only)**
1. **Trust Computer**
   - Connect device via USB
   - Tap "Trust" on device prompt

2. **Xcode Setup**
   - Open Xcode
   - Go to Window > Devices and Simulators
   - Verify device appears

---

## 🚀 **Production Build Setup**

### **EAS Build Configuration**
```bash
# Initialize EAS
eas init

# Configure build profiles
# Edit eas.json as needed
```

#### **eas.json Configuration**
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### **Build Commands**
```bash
# Development build
eas build --profile development --platform android

# Production build
eas build --profile production --platform all

# Submit to app stores
eas submit --platform android
eas submit --platform ios
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Metro Bundler Issues**
```bash
# Clear all caches
npx expo start --clear

# Reset Metro cache
npx react-native start --reset-cache

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

#### **Android Build Issues**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Check Android SDK path
echo $ANDROID_HOME

# Update Android SDK
# Open Android Studio > SDK Manager > Update
```

#### **iOS Build Issues (macOS)**
```bash
# Clean iOS build
cd ios
rm -rf build
pod install
cd ..

# Update CocoaPods
sudo gem install cocoapods
pod repo update
```

#### **Permission Issues**
```bash
# Fix npm permissions (Linux/macOS)
sudo chown -R $(whoami) ~/.npm

# Fix Android permissions
chmod +x android/gradlew
```

#### **Network Issues**
```bash
# Use tunnel connection
npm start -- --tunnel

# Check firewall settings
# Ensure ports 19000-19006 are open

# Use different port
npm start -- --port 19001
```

### **Debug Tools**

#### **React Native Debugger**
```bash
# Install React Native Debugger
# Download from: https://github.com/jhen0409/react-native-debugger

# Enable debugging in app
# Shake device > Debug > Enable Remote JS Debugging
```

#### **Flipper (Meta's debugging platform)**
```bash
# Install Flipper
# Download from: https://fbflipper.com

# Enable Flipper in development builds
```

---

## 📊 **Performance Optimization**

### **Bundle Analysis**
```bash
# Analyze bundle size
npx expo export --platform web
npx webpack-bundle-analyzer web-build/static/js/*.js
```

### **Memory Profiling**
```bash
# Enable Hermes (Android)
# Already enabled in expo config

# Profile memory usage
# Use Flipper or Chrome DevTools
```

---

## 🔐 **Security Setup**

### **Code Signing (iOS)**
1. **Apple Developer Account**
   - Enroll in Apple Developer Program
   - Create certificates and provisioning profiles

2. **Xcode Configuration**
   - Open project in Xcode
   - Configure signing team and certificates

### **Keystore (Android)**
```bash
# Generate keystore
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Configure in eas.json
```

---

## 📚 **Additional Resources**

### **Documentation**
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)

### **Community**
- [Expo Discord](https://discord.gg/expo)
- [React Native Community](https://reactnative.dev/community/overview)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

### **Tools**
- [Expo Snack](https://snack.expo.dev/) - Online playground
- [React Native Directory](https://reactnative.directory/) - Package directory
- [Can I Use](https://caniuse.com/) - Browser compatibility

---

## ✅ **Setup Verification Checklist**

- [ ] Node.js 18+ installed
- [ ] Expo CLI installed globally
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Development server starts successfully
- [ ] App runs on at least one platform (web/Android/iOS)
- [ ] Tests run successfully
- [ ] Code linting and formatting work
- [ ] Backend services (Supabase/LiveKit) configured
- [ ] Device/simulator testing working

---

**🎉 Congratulations! Your Tactical Mapping System development environment is ready!**

For additional help, refer to the [main README](README.md) or create an issue in the repository.