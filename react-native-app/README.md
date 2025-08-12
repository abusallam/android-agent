# 🎖️ Tactical Mapping System - React Native App

## 📋 **Overview**

The Tactical Mapping System is a comprehensive, ATAK-inspired mobile application built with React Native and Expo. It provides real-time collaborative mapping, communication, and situational awareness capabilities for tactical operations.

### **Key Features**
- 🗺️ **High-Performance Mapping** - Leaflet-based mapping with offline capabilities
- 🎨 **Tactical Theming** - Military camo themes (Desert, Forest) + Light/Dark
- 🌍 **Multi-language** - Arabic (RTL) and English support
- 🔐 **Professional Permissions** - Tactical context explanations
- 📡 **Real-time Communication** - LiveKit video/audio + chat
- 🎯 **AI-Powered Tracking** - Machine learning target tracking
- 🚨 **Emergency Response** - Panic buttons and CASEVAC planning

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-native-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

---

## 🏗️ **Architecture**

### **Project Structure**
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── tactical/        # Tactical-specific components
│   └── communication/   # Communication components
├── screens/             # Screen components
├── services/            # Business logic and API services
│   ├── core/           # Core services (API, Storage)
│   ├── tactical/       # Tactical services
│   ├── communication/ # Communication services
│   └── system/        # System services (Permissions, Location)
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── theme/              # Theming system
├── i18n/               # Internationalization
├── constants/          # Application constants
└── assets/             # Static assets
```

### **Technology Stack**
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript 5 with strict mode
- **Mapping**: Leaflet with react-leaflet
- **Communication**: LiveKit for video/audio
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context + Hooks
- **Styling**: StyleSheet with tactical theming
- **Testing**: Jest + Playwright for E2E

---

## 🎨 **Theming System**

### **Available Themes**
- **Light**: Professional appearance for office use
- **Dark**: Reduced eye strain for night operations  
- **Desert Camo**: Sand, tan, brown tones for desert environments
- **Forest Camo**: Green, brown, olive tones for forest operations

### **Usage**
```typescript
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Tactical Content
      </Text>
    </View>
  );
};
```

---

## 🌍 **Internationalization**

### **Supported Languages**
- **English** (LTR) - Default
- **Arabic** (RTL) - Full tactical terminology

### **Usage**
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <Text>{t('tactical:friendly')}</Text>
  );
};
```

### **Adding New Languages**
1. Create translation file in `src/i18n/locales/`
2. Add language to `SUPPORTED_LANGUAGES` in `src/i18n/index.ts`
3. Update language selector component

---

## 🗺️ **Mapping System**

### **Tile Sources**
- **OpenStreetMap** - Standard street maps
- **OpenTopoMap** - Topographic maps for terrain
- **Esri Satellite** - High-resolution satellite imagery
- **USGS Topo** - US Geological Survey topographic maps

### **Features**
- Offline tile caching
- Theme-aware tile selection
- Custom tactical markers
- Real-time collaboration
- Drawing and annotation tools
- Geofencing with alerts

### **Usage**
```typescript
import TacticalMapView from '../components/TacticalMapView';

const MapScreen = () => {
  const handleLocationSelect = (lat: number, lng: number) => {
    console.log('Selected:', lat, lng);
  };

  return (
    <TacticalMapView
      theme="camo-desert"
      language="en"
      onLocationSelect={handleLocationSelect}
      markers={tacticalMarkers}
      showControls={true}
    />
  );
};
```

---

## 📡 **Communication System**

### **LiveKit Integration**
- Video/audio calls with screen sharing
- Push-to-talk functionality
- Low-latency streaming (<500ms)
- Multi-participant support

### **Chat Features**
- Real-time messaging
- Location-aware messages
- Media sharing (photos, videos, files)
- Message threading and reactions
- Offline message queuing

### **Usage**
```typescript
import { LiveKitService } from '../services/LiveKitService';

const communicationService = LiveKitService.getInstance();

// Start video call
await communicationService.startVideoCall(roomId, userId);

// Send chat message
await communicationService.sendMessage(channelId, {
  text: 'Message content',
  location: [lat, lng],
});
```

---

## 🔐 **Permissions System**

### **Required Permissions**
- **Location** (Critical) - Position tracking and navigation
- **Camera** (Important) - Photo capture and QR scanning
- **Microphone** (Critical) - Voice communication
- **Notifications** (Critical) - Tactical alerts
- **Media Library** (Important) - Photo/video storage

### **Usage**
```typescript
import { usePermissions } from '../hooks/usePermissions';

const PermissionsScreen = () => {
  const { 
    permissions, 
    requestAllEssentialPermissions,
    areEssentialPermissionsGranted 
  } = usePermissions();

  const handleRequestPermissions = async () => {
    await requestAllEssentialPermissions();
  };

  return (
    <View>
      {/* Permission UI */}
    </View>
  );
};
```

---

## 🧪 **Testing**

### **Running Tests**
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Install Playwright browsers
npm run test:install
```

### **Test Structure**
- **Unit Tests**: Services, utilities, and hooks
- **Component Tests**: React component testing
- **Integration Tests**: Service interactions
- **E2E Tests**: Complete user workflows

---

## 🚀 **Deployment**

### **Development Build**
```bash
# Start development server
npm start

# Build for development
expo build:android --type apk
expo build:ios --type simulator
```

### **Production Build**
```bash
# Build for production
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to app stores
eas submit --platform android
eas submit --platform ios
```

### **Environment Configuration**
```bash
# .env file
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
```

---

## 🔧 **Development**

### **Code Standards**
- **TypeScript**: Strict mode enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Naming**: PascalCase for components, camelCase for functions
- **Documentation**: JSDoc comments for all functions

### **Git Workflow**
```bash
# Feature branch
git checkout -b feature/new-tactical-feature

# Commit with conventional commits
git commit -m "feat: add emergency beacon functionality"

# Push and create PR
git push origin feature/new-tactical-feature
```

### **Adding New Features**
1. Create feature branch
2. Add TypeScript types in `src/types/`
3. Implement service in `src/services/`
4. Create components in `src/components/`
5. Add tests
6. Update documentation
7. Submit PR

---

## 📚 **API Documentation**

### **Service Layer**
All services extend `BaseService` and provide:
- Singleton pattern
- Error handling with retry logic
- Health checks
- Logging and monitoring

### **Key Services**
- **ApiService** - HTTP API communications
- **PermissionsService** - Permission management
- **TileSourceService** - Map tile management
- **LiveKitService** - Video/audio communication
- **GeospatialService** - Location and mapping utilities

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Metro bundler issues**
```bash
# Clear cache
npx expo start --clear

# Reset Metro cache
npx react-native start --reset-cache
```

#### **Permission issues**
```bash
# Reset permission history (development only)
const permissionsService = PermissionsService.getInstance();
await permissionsService.resetPermissionHistory();
```

#### **Map not loading**
- Check internet connection
- Verify tile source URLs
- Clear map cache
- Check console for errors

#### **LiveKit connection issues**
- Verify LiveKit server URL
- Check authentication tokens
- Ensure proper network connectivity
- Review firewall settings

---

## 🤝 **Contributing**

### **Development Setup**
1. Fork the repository
2. Create feature branch
3. Follow coding standards
4. Add tests for new features
5. Update documentation
6. Submit pull request

### **Code Review Process**
- All PRs require review
- Tests must pass
- Code coverage maintained
- Documentation updated

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support**

### **Getting Help**
- Check the [troubleshooting guide](#troubleshooting)
- Review the [API documentation](#api-documentation)
- Search existing issues
- Create new issue with detailed description

### **Contact**
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Security**: security@example.com

---

## 🎯 **Roadmap**

### **Current Version: 1.0.0**
- ✅ Core mapping functionality
- ✅ Tactical theming system
- ✅ Multi-language support
- ✅ Real-time communication
- ✅ Permission management

### **Upcoming Features**
- 🚧 Emergency response system
- 🚧 File format support (KML/GPX)
- 🚧 Plugin architecture
- 🚧 3D visualization
- 🚧 Drone integration

---

**Built with ❤️ for tactical operations worldwide** 🌍🎖️