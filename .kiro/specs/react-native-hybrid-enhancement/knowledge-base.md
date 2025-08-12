# React Native Hybrid Enhancement - Knowledge Base

## 📚 **Knowledge Base Overview**

This document serves as the central knowledge repository for the React Native Hybrid Enhancement project. It contains all technical knowledge, implementation details, best practices, and lessons learned during development.

**Last Updated**: January 8, 2025  
**Version**: 1.0.0  
**Status**: Initial Setup

---

## 🎯 **Project Context**

### Current State Analysis
- **PWA Dashboard**: Next.js 15.4.3 + React 19.1.0 + ShadCN/UI
- **Database**: PostgreSQL with comprehensive schema via Prisma ORM
- **Authentication**: JWT + bcrypt implementation (working)
- **Streaming**: LiveKit integration (UI ready, functionality pending)
- **UI/UX**: Professional dark theme with glass morphism effects
- **Status**: CSS & theming system complete, ready for feature enhancement

### Strategic Direction
- **Hybrid Architecture**: Keep PWA + Add React Native mobile app
- **Technology**: Expo SDK 53 + React 19 for native capabilities
- **Goal**: Leverage native device APIs while maintaining web admin interface

---

## 🔧 **Expo SDK 53 Knowledge Base**

### Core Features & Capabilities

#### **React Native 0.79 + React 19 Support**
```typescript
// New React 19 features available in Expo SDK 53
import { use, Suspense } from 'react';

// use() hook for promises
function UserProfile({ userPromise }) {
  const user = use(userPromise); // Suspends until resolved
  return <Text>{user.name}</Text>;
}

// Enhanced Suspense for data fetching
<Suspense fallback={<LoadingSpinner />}>
  <UserProfile userPromise={fetchUser()} />
</Suspense>
```

#### **New Architecture (Fabric + Turbo Modules)**
- **Enabled by default** in SDK 53 projects
- **Performance improvements**: Faster rendering, better memory usage
- **Opt-out available** for legacy compatibility if needed
- **Benefits**: 25% faster Android builds, improved cold start times

#### **Edge-to-Edge Layout Support**
```javascript
// app.json configuration
{
  "expo": {
    "plugins": [
      [
        "react-native-edge-to-edge",
        {
          "android": {
            "enforceNavigationBarContrast": false
          }
        }
      ]
    ]
  }
}
```

#### **Audio System Overhaul**
```typescript
// expo-audio (stable replacement for expo-av audio)
import { Audio } from 'expo-audio';

// More performant audio recording
const recording = new Audio.Recording();
await recording.prepareAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
await recording.startAsync();
```

#### **Alpha Maps Integration**
```typescript
// expo-maps (alpha) - SwiftUI + Jetpack Compose
import { MapView, Marker } from 'expo-maps';

<MapView
  style={{ flex: 1 }}
  initialRegion={{
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
>
  <Marker coordinate={{ latitude: 37.78825, longitude: -122.4324 }} />
</MapView>
```

### Device Integration APIs

#### **Device Information Collection**
```typescript
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export const DeviceInfoService = {
  async getDeviceInfo() {
    return {
      deviceId: await Application.getAndroidId(),
      model: Device.modelName,
      manufacturer: Device.manufacturer,
      osVersion: Device.osVersion,
      platform: Device.osName,
      appVersion: Constants.expoConfig?.version,
      deviceType: await Device.getDeviceTypeAsync(),
    };
  }
};
```

#### **Location Tracking with Background Support**
```typescript
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

// Foreground location tracking
export const LocationService = {
  async startTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');
    
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 10, // 10 meters
      },
      (location) => {
        // Send to backend
        ApiService.updateLocation(location);
      }
    );
  },

  // Background location tracking
  async enableBackgroundTracking() {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Background permission denied');
    
    await TaskManager.defineTask('background-location', ({ data, error }) => {
      if (error) {
        console.error('Background location error:', error);
        return;
      }
      
      if (data) {
        const { locations } = data as any;
        ApiService.updateLocationBatch(locations);
      }
    });
    
    await Location.startLocationUpdatesAsync('background-location', {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000, // 1 minute
      deferredUpdatesInterval: 300000, // 5 minutes
    });
  }
};
```

#### **Background Task Management**
```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

export const BackgroundTaskService = {
  async registerDataSync() {
    await TaskManager.defineTask('data-sync', async () => {
      try {
        await ApiService.syncDeviceData();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background sync failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
    
    await BackgroundFetch.registerTaskAsync('data-sync', {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
};
```

#### **Secure Storage Implementation**
```typescript
import * as SecureStore from 'expo-secure-store';

export const SecureStorageService = {
  async storeToken(token: string) {
    await SecureStore.setItemAsync('auth_token', token, {
      keychainService: 'android-agent',
      encrypt: true,
    });
  },
  
  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token', {
      keychainService: 'android-agent',
    });
  },
  
  async storeDeviceConfig(config: DeviceConfig) {
    await SecureStore.setItemAsync('device_config', JSON.stringify(config), {
      keychainService: 'android-agent',
      encrypt: true,
    });
  }
};
```

#### **File System Management**
```typescript
import * as FileSystem from 'expo-file-system';

export const FileSystemService = {
  async uploadFile(uri: string, filename: string) {
    const response = await FileSystem.uploadAsync(
      `${API_BASE_URL}/api/files/upload`,
      uri,
      {
        fieldName: 'file',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        parameters: { filename },
      }
    );
    return JSON.parse(response.body);
  },
  
  async downloadFile(url: string, filename: string) {
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      FileSystem.documentDirectory + filename,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        // Update progress UI
      }
    );
    
    return await downloadResumable.downloadAsync();
  }
};
```

#### **Push Notifications**
```typescript
import * as Notifications from 'expo-notifications';

export const NotificationService = {
  async registerForPushNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Push notification permission denied');
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  },
  
  setupNotificationHandlers() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
};
```

### Performance Optimizations

#### **Metro Configuration**
```javascript
// metro.config.js - ES Module support
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package.json.exports support
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
```

#### **Build Optimizations**
```json
// app.json - Performance settings
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "enableProguardInReleaseBuilds": true,
            "enableShrinkResourcesInReleaseBuilds": true
          },
          "ios": {
            "deploymentTarget": "13.0"
          }
        }
      ]
    ]
  }
}
```

---

## 🏗️ **Architecture Knowledge**

### Hybrid System Design

#### **Component Communication Flow**
```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   PWA Dashboard │◄──────────────►│ React Native App │
│   (Admin)       │                │ (Device Agent)  │
└─────────┬───────┘                └─────────┬───────┘
          │                                  │
          │            REST APIs             │
          └──────────────┬───────────────────┘
                         │
                ┌────────▼────────┐
                │  Next.js Backend │
                │  + PostgreSQL    │
                │  + Redis Cache   │
                └─────────────────┘
```

#### **Data Synchronization Strategy**
```typescript
// Real-time sync pattern
interface SyncEvent {
  type: 'device:status' | 'device:location' | 'file:upload' | 'stream:start';
  deviceId: string;
  data: any;
  timestamp: string;
}

// WebSocket event handling
export const SyncManager = {
  handleEvent(event: SyncEvent) {
    switch (event.type) {
      case 'device:status':
        // Update device status in both PWA and mobile
        break;
      case 'device:location':
        // Update location on map in real-time
        break;
      case 'file:upload':
        // Show file upload progress
        break;
    }
  }
};
```

### Database Schema Extensions

#### **New Tables for Hybrid Features**
```sql
-- Background Tasks
CREATE TABLE background_tasks (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  scheduled_at TIMESTAMP NOT NULL,
  executed_at TIMESTAMP,
  result TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Streaming Sessions
CREATE TABLE streaming_sessions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  admin_user_id TEXT NOT NULL,
  session_type VARCHAR(20) NOT NULL,
  livekit_room_id TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  quality_metrics TEXT,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Push Notifications
CREATE TABLE push_notifications (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent',
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
```

---

## 🧪 **Technical Prototype Specifications**

### Prototype Scope
The technical prototype will validate:
1. **React Native + Expo SDK 53** setup with React 19
2. **Device information collection** and backend sync
3. **Real-time communication** between PWA and mobile
4. **Basic location tracking** with permissions
5. **Secure storage** and authentication flow
6. **File system access** and upload capabilities

### Prototype Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    TECHNICAL PROTOTYPE                      │
├─────────────────────┬───────────────────────────────────────┤
│   PWA Dashboard     │     React Native Prototype           │
│   (Enhanced)        │     (Expo SDK 53)                    │
│                     │                                       │
│ • Device list view  │ • Device registration                │
│ • Real-time updates │ • Location tracking                  │
│ • File management   │ • File upload/download               │
│ • Streaming UI      │ • Background tasks                   │
└─────────────────────┴───────────────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │     Enhanced Backend          │
                    │                               │
                    │ • Device registration API     │
                    │ • Real-time WebSocket         │
                    │ • File upload/download        │
                    │ • Background task management  │
                    └───────────────────────────────┘
```

---

## 🚀 **Implementation Progress**

### Project Structure Created
```
react-native-app/
├── App.tsx                 # Main application component
├── app.json               # Expo configuration with SDK 53
├── package.json           # Dependencies with React 19
├── tsconfig.json          # TypeScript configuration
├── src/
│   ├── components/        # UI components (ready for implementation)
│   │   ├── common/
│   │   ├── device/
│   │   └── streaming/
│   ├── services/          # Core business logic services
│   │   ├── DeviceService.ts      # ✅ Device info & registration
│   │   ├── LocationService.ts    # ✅ GPS tracking & background
│   │   ├── StorageService.ts     # ✅ Secure & regular storage
│   │   └── ApiService.ts         # ✅ Backend communication
│   ├── screens/           # App screens (ready for implementation)
│   ├── hooks/             # Custom React hooks (ready for implementation)
│   ├── types/             # ✅ Shared TypeScript definitions
│   │   └── index.ts       # DeviceInfo, LocationData, ApiResponse, etc.
│   ├── constants/         # ✅ App configuration & constants
│   │   └── index.ts       # API config, UI constants, permissions
│   └── utils/             # Utility functions (ready for implementation)
```

### Core Services Implementation

#### **DeviceService.ts - Device Management**
```typescript
// Key features implemented:
- getDeviceInfo(): Comprehensive device information collection
- registerDevice(): Backend registration with authentication
- updateDeviceStatus(): Online/offline status management
- getDeviceCapabilities(): Hardware capability detection
- getSecureDeviceId(): Secure device identification

// Expo SDK 53 APIs used:
- expo-device: Hardware information
- expo-constants: App configuration
- expo-application: Device identifiers
```

#### **LocationService.ts - GPS Tracking**
```typescript
// Key features implemented:
- requestPermissions(): Foreground & background location permissions
- startForegroundTracking(): Real-time location updates
- startBackgroundTracking(): Background location with TaskManager
- getCurrentLocation(): One-time location retrieval
- syncPendingLocations(): Offline location sync
- calculateDistance(): Location utility functions

// Expo SDK 53 APIs used:
- expo-location: GPS tracking with high accuracy
- expo-task-manager: Background task management
- Native background services integration
```

#### **StorageService.ts - Data Persistence**
```typescript
// Key features implemented:
- Secure storage: Authentication tokens, device config
- Regular storage: User preferences, cached data
- Cache management: Expiration-based data caching
- Storage info: Usage monitoring and cleanup

// Expo SDK 53 APIs used:
- expo-secure-store: Encrypted keychain storage
- @react-native-async-storage/async-storage: Regular data storage
```

#### **ApiService.ts - Backend Communication**
```typescript
// Key features implemented:
- Generic HTTP client with error handling
- Authentication header management
- Location updates (single & batch)
- File upload/download capabilities
- Health checks and error logging

// Features:
- Automatic token management
- Network error handling
- Request timeout configuration
- Response type handling
```

### App.tsx - Main Application
```typescript
// Prototype features implemented:
- Device information display
- Location tracking controls
- Registration workflow
- Data synchronization
- Status monitoring
- Modern React Native UI with hooks

// React 19 features used:
- Modern hooks pattern
- Concurrent rendering ready
- Error boundary compatible
```

### Configuration Highlights

#### **app.json - Expo SDK 53 Configuration**
```json
{
  "expo": {
    "newArchEnabled": true,           // New Architecture enabled
    "userInterfaceStyle": "dark",     // Dark theme
    "edgeToEdgeEnabled": true,        // Android edge-to-edge
    "plugins": [
      "expo-location",                // Location permissions
      "expo-background-fetch",        // Background tasks
      "expo-task-manager",           // Task management
      "expo-notifications"           // Push notifications
    ]
  }
}
```

#### **Dependencies Successfully Installed**
```json
{
  "expo": "~53.0.20",              // Latest SDK 53
  "react": "19.0.0",               // React 19
  "react-native": "0.79.5",        // RN 0.79 with New Architecture
  "expo-device": "~6.0.2",         // Device information
  "expo-location": "~18.0.3",      // GPS tracking
  "expo-secure-store": "~14.0.0",  // Secure storage
  "expo-file-system": "~18.0.4",   // File management
  "expo-background-fetch": "~13.0.1", // Background tasks
  "expo-task-manager": "~12.0.2",  // Task management
  "expo-notifications": "~0.30.3", // Push notifications
  "expo-application": "~6.0.4"     // App information
}
```

---

## 📝 **Implementation Notes**

### Development Environment Setup
- **Node.js**: 20+ (Node 18 is EOL)
- **Expo CLI**: Latest version with SDK 53 support
- **React DevTools**: Use React Native DevTools (press 'j' in Metro)
- **EAS Build**: Required for production builds with native modules

### Key Dependencies
```json
{
  "expo": "~53.0.0",
  "react": "19.1.0",
  "react-native": "0.79.x",
  "expo-device": "~6.0.0",
  "expo-location": "~18.0.0",
  "expo-background-fetch": "~13.0.0",
  "expo-task-manager": "~12.0.0",
  "expo-secure-store": "~14.0.0",
  "expo-file-system": "~18.0.0",
  "expo-notifications": "~0.30.0"
}
```

### Best Practices Established
1. **Type Safety**: Shared TypeScript types between PWA and mobile
2. **Error Handling**: Comprehensive error boundaries and logging
3. **Performance**: Leverage New Architecture optimizations
4. **Security**: Use expo-secure-store for sensitive data
5. **Testing**: Unit tests for services, integration tests for flows

---

## 🔄 **Update Log**

### Version 2.0.0 - January 8, 2025 - 🎉 COMPLETE FEATURE SET IMPLEMENTATION
- **✅ ALL FEATURES IMPLEMENTED** - Camera, Audio, Battery, Network, Backward Compatibility
- **✅ CameraService** - Photo capture, video recording, gallery access, upload functionality
- **✅ AudioService** - Audio recording, playback, format conversion, legacy support
- **✅ Enhanced DeviceService** - Battery monitoring, network status, compatibility checks
- **✅ Comprehensive App.tsx** - Full feature demonstration with modern UI
- **✅ Backward Compatibility** - Support for Android 5.0+ (API 21+) with graceful degradation
- **✅ Legacy Device Support** - Specific handling for older Android versions
- **✅ Complete Permission System** - Camera, microphone, location, storage, contacts
- **✅ Error Handling & Fallbacks** - Robust error handling for all device types
- **✅ Complete Documentation** - Implementation guide, testing guide, knowledge base
- **✅ Production Ready** - All tasks completed, comprehensive testing guide provided
- **🚀 READY FOR PRODUCTION TESTING AND DEPLOYMENT**

### Version 1.1.0 - January 8, 2025
- **✅ React Native project structure created**
- **✅ Expo SDK 53 + React 19 setup completed**
- **✅ Core services implemented** (DeviceService, LocationService, StorageService, ApiService)
- **✅ TypeScript types and constants defined**
- **✅ Main App.tsx prototype created**
- **✅ Dependencies installed and configured**
- **📱 Project ready for testing and development**

### Version 1.0.0 - January 8, 2025
- **Initial knowledge base creation**
- **Expo SDK 53 core features documented**
- **Device integration APIs catalogued**
- **Architecture patterns established**
- **Technical prototype specifications defined**

---

## 📚 **References & Resources**

### Official Documentation
- [Expo SDK 53 Release Notes](https://expo.dev/changelog/2024/11-12-sdk-53)
- [React 19 Features](https://react.dev/blog/2024/12/05/react-19)
- [New Architecture Guide](https://reactnative.dev/docs/the-new-architecture/landing-page)

### Community Resources
- [Expo Examples Repository](https://github.com/expo/examples)
- [React Native Performance Guide](https://reactnative.dev/docs/performance)
- [LiveKit React Native SDK](https://docs.livekit.io/client-sdk-js/react-native/)

---

**Note**: This knowledge base will be continuously updated as we implement features and learn new patterns. Each implementation will add to our collective understanding and best practices.