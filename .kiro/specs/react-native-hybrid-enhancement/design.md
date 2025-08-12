# React Native Hybrid Enhancement - Design Document

## Overview

This design document outlines the technical architecture for implementing a hybrid system that combines the existing Next.js PWA dashboard with a new React Native mobile application using Expo SDK 53 and React 19. The system will provide a unified backend while offering platform-specific optimizations for both web and mobile experiences.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HYBRID ECOSYSTEM                         │
├─────────────────────────┬───────────────────────────────────────┤
│     PWA Dashboard       │      React Native Mobile App         │
│   (Next.js 15 + React 19)│    (Expo SDK 53 + React 19)         │
│                         │                                       │
│ ┌─────────────────────┐ │ ┌───────────────────────────────────┐ │
│ │ • Admin Interface   │ │ │ • Device Agent                    │ │
│ │ • Real-time Control │ │ │ • Background Monitoring           │ │
│ │ │ • Data Visualization│ │ │ • Native API Access              │ │
│ │ • LiveKit Streaming │ │ │ • Push Notifications              │ │
│ │ • File Management   │ │ │ • Offline Capabilities            │ │
│ └─────────────────────┘ │ └───────────────────────────────────┘ │
└─────────────────────────┴───────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼─────┐ ┌──────▼──────┐ ┌─────▼─────┐
            │ WebSocket   │ │  REST APIs  │ │ LiveKit   │
            │ Real-time   │ │ (Enhanced)  │ │ Streaming │
            └─────────────┘ └─────────────┘ └───────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │        Backend Services        │
                    │                               │
                    │ ┌─────────────────────────────┐ │
                    │ │     Next.js API Routes      │ │
                    │ │   + Enhanced Endpoints      │ │
                    │ └─────────────────────────────┘ │
                    │ ┌─────────────────────────────┐ │
                    │ │    PostgreSQL Database      │ │
                    │ │   + Extended Schema         │ │
                    │ └─────────────────────────────┘ │
                    │ ┌─────────────────────────────┐ │
                    │ │      Redis Cache            │ │
                    │ │   + Real-time Sessions      │ │
                    │ └─────────────────────────────┘ │
                    └───────────────────────────────────┘
```

### Technology Stack Comparison

| Component | PWA Dashboard | React Native App |
|-----------|---------------|------------------|
| **Framework** | Next.js 15.4.3 | Expo SDK 53 |
| **React Version** | React 19.1.0 | React 19.1.0 |
| **UI Library** | ShadCN/UI + Tailwind | React Native + Expo Components |
| **Navigation** | Next.js App Router | Expo Router |
| **State Management** | React Context + Hooks | Zustand + React Query |
| **Styling** | Tailwind CSS | StyleSheet + Tamagui |
| **Storage** | LocalStorage + IndexedDB | expo-secure-store + AsyncStorage |
| **Networking** | Fetch API + WebSockets | Fetch API + WebSockets |
| **Real-time** | WebSockets + SSE | WebSockets + Push Notifications |

## Components and Interfaces

### Shared Backend APIs

#### Enhanced REST API Endpoints

```typescript
// Device Management APIs
GET    /api/devices                    // List all devices
GET    /api/devices/:id                // Get device details
POST   /api/devices/:id/sync           // Sync device data
PUT    /api/devices/:id/settings       // Update device settings
DELETE /api/devices/:id                // Remove device

// Real-time Communication APIs
POST   /api/streaming/start            // Start LiveKit session
POST   /api/streaming/stop             // Stop LiveKit session
GET    /api/streaming/token            // Get LiveKit token
POST   /api/notifications/send         // Send push notification

// File Management APIs
POST   /api/files/upload               // Upload file from device
GET    /api/files/:deviceId            // List device files
GET    /api/files/:deviceId/:path      // Download file
DELETE /api/files/:deviceId/:path      // Delete file

// Background Task APIs
POST   /api/tasks/register             // Register background task
GET    /api/tasks/:deviceId            // Get device tasks
PUT    /api/tasks/:id/status           // Update task status
```

#### WebSocket Events

```typescript
// Real-time event types
interface WebSocketEvents {
  // Device status updates
  'device:online': { deviceId: string; timestamp: string }
  'device:offline': { deviceId: string; lastSeen: string }
  'device:location': { deviceId: string; location: GPSLocation }
  
  // Streaming events
  'stream:started': { deviceId: string; sessionId: string }
  'stream:ended': { deviceId: string; sessionId: string }
  
  // File operations
  'file:uploaded': { deviceId: string; filePath: string; size: number }
  'file:deleted': { deviceId: string; filePath: string }
  
  // Background tasks
  'task:completed': { deviceId: string; taskId: string; result: any }
  'task:failed': { deviceId: string; taskId: string; error: string }
}
```

### React Native App Architecture

#### Project Structure

```
react-native-app/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Shared components
│   │   ├── device/          # Device-specific components
│   │   └── streaming/       # LiveKit streaming components
│   ├── screens/             # App screens
│   │   ├── auth/           # Authentication screens
│   │   ├── dashboard/      # Main dashboard
│   │   ├── settings/       # App settings
│   │   └── streaming/      # Video/audio streaming
│   ├── services/           # API and background services
│   │   ├── api/           # REST API client
│   │   ├── websocket/     # WebSocket client
│   │   ├── background/    # Background tasks
│   │   └── streaming/     # LiveKit integration
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── constants/         # App constants
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

#### Core Services Implementation

```typescript
// Device Information Service
export class DeviceInfoService {
  static async getDeviceInfo(): Promise<DeviceInfo> {
    const device = await Device.getDeviceTypeAsync();
    const constants = Constants.expoConfig;
    
    return {
      deviceId: await Application.getAndroidId(),
      model: Device.modelName,
      manufacturer: Device.manufacturer,
      osVersion: Device.osVersion,
      appVersion: constants?.version,
      platform: Device.osName,
    };
  }
}

// Location Tracking Service
export class LocationService {
  private static watchId: LocationSubscription | null = null;
  
  static async startTracking(): Promise<void> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');
    
    this.watchId = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 10, // 10 meters
      },
      (location) => {
        // Send location to backend
        ApiService.updateLocation(location);
      }
    );
  }
  
  static async enableBackgroundTracking(): Promise<void> {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Background location permission denied');
    
    await TaskManager.defineTask('background-location', ({ data, error }) => {
      if (error) {
        console.error('Background location error:', error);
        return;
      }
      
      if (data) {
        const { locations } = data as any;
        // Process background location updates
        ApiService.updateLocationBatch(locations);
      }
    });
    
    await Location.startLocationUpdatesAsync('background-location', {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000, // 1 minute
      deferredUpdatesInterval: 300000, // 5 minutes
    });
  }
}

// Background Task Service
export class BackgroundTaskService {
  static async registerDataSync(): Promise<void> {
    await TaskManager.defineTask('data-sync', async () => {
      try {
        // Sync device data with backend
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
}

// Secure Storage Service
export class SecureStorageService {
  static async storeToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('auth_token', token, {
      keychainService: 'android-agent',
      encrypt: true,
    });
  }
  
  static async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token', {
      keychainService: 'android-agent',
    });
  }
  
  static async storeDeviceConfig(config: DeviceConfig): Promise<void> {
    await SecureStore.setItemAsync('device_config', JSON.stringify(config), {
      keychainService: 'android-agent',
      encrypt: true,
    });
  }
}
```

### PWA Dashboard Enhancements

#### Real-time Device Monitoring

```typescript
// Enhanced WebSocket hook for PWA
export function useDeviceRealtime() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'device:online':
          setDevices(prev => prev.map(device => 
            device.id === data.deviceId 
              ? { ...device, isOnline: true, lastSeen: data.timestamp }
              : device
          ));
          break;
          
        case 'device:location':
          setDevices(prev => prev.map(device => 
            device.id === data.deviceId 
              ? { ...device, location: data.location }
              : device
          ));
          break;
      }
    };
    
    setSocket(ws);
    return () => ws.close();
  }, []);
  
  return { devices, socket };
}

// Enhanced LiveKit integration for PWA
export function useLiveKitStreaming() {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const startStream = async (deviceId: string) => {
    try {
      const response = await fetch('/api/streaming/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, role: 'admin' }),
      });
      
      const { token } = await response.json();
      
      const room = new Room();
      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      
      setRoom(room);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  };
  
  return { room, isConnected, startStream };
}
```

## Data Models

### Extended Database Schema

```sql
-- Enhanced Device table
ALTER TABLE devices ADD COLUMN battery_level INTEGER;
ALTER TABLE devices ADD COLUMN network_type VARCHAR(20);
ALTER TABLE devices ADD COLUMN app_version VARCHAR(50);
ALTER TABLE devices ADD COLUMN last_sync_at TIMESTAMP;

-- Background Tasks table
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

-- Streaming Sessions table
CREATE TABLE streaming_sessions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  admin_user_id TEXT NOT NULL,
  session_type VARCHAR(20) NOT NULL, -- 'video', 'audio', 'screen'
  livekit_room_id TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  quality_metrics TEXT, -- JSON
  FOREIGN KEY (device_id) REFERENCES devices(id),
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
);

-- Push Notifications table
CREATE TABLE push_notifications (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data TEXT, -- JSON payload
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent',
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
```

### TypeScript Type Definitions

```typescript
// Shared types between PWA and React Native
export interface DeviceInfo {
  id: string;
  deviceId: string;
  name?: string;
  model?: string;
  manufacturer?: string;
  osVersion?: string;
  appVersion?: string;
  batteryLevel?: number;
  networkType?: string;
  isOnline: boolean;
  lastSeen: string;
  lastSyncAt?: string;
  location?: GPSLocation;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  timestamp: string;
}

export interface BackgroundTask {
  id: string;
  deviceId: string;
  taskType: 'location_sync' | 'data_backup' | 'health_check';
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduledAt: string;
  executedAt?: string;
  result?: any;
  errorMessage?: string;
}

export interface StreamingSession {
  id: string;
  deviceId: string;
  adminUserId: string;
  sessionType: 'video' | 'audio' | 'screen';
  livekitRoomId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  qualityMetrics?: {
    avgBitrate: number;
    packetsLost: number;
    latency: number;
  };
}

export interface PushNotification {
  id: string;
  deviceId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
}
```

## Error Handling

### React Native Error Boundaries

```typescript
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to backend
    ApiService.logError({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Button
            title="Restart App"
            onPress={() => {
              this.setState({ hasError: false, error: undefined });
              // Optionally restart the app
            }}
          />
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Strategy

### Unit Testing

```typescript
// React Native component testing
import { render, fireEvent } from '@testing-library/react-native';
import { DeviceStatusCard } from '../components/DeviceStatusCard';

describe('DeviceStatusCard', () => {
  it('displays device information correctly', () => {
    const mockDevice = {
      id: '1',
      name: 'Test Device',
      isOnline: true,
      batteryLevel: 85,
    };
    
    const { getByText } = render(<DeviceStatusCard device={mockDevice} />);
    
    expect(getByText('Test Device')).toBeTruthy();
    expect(getByText('85%')).toBeTruthy();
    expect(getByText('Online')).toBeTruthy();
  });
});

// API service testing
import { ApiService } from '../services/ApiService';

describe('ApiService', () => {
  it('syncs device data successfully', async () => {
    const mockDeviceData = { batteryLevel: 90, location: { lat: 0, lng: 0 } };
    
    const result = await ApiService.syncDeviceData(mockDeviceData);
    
    expect(result.success).toBe(true);
  });
});
```

### Integration Testing

```typescript
// End-to-end testing with Detox
describe('Device Monitoring Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should display device list and allow streaming', async () => {
    // Login
    await element(by.id('username-input')).typeText('admin');
    await element(by.id('password-input')).typeText('admin123');
    await element(by.id('login-button')).tap();
    
    // Navigate to devices
    await element(by.id('devices-tab')).tap();
    
    // Start streaming
    await element(by.id('device-1-stream-button')).tap();
    
    // Verify streaming UI
    await expect(element(by.id('streaming-view'))).toBeVisible();
  });
});
```

This design provides a comprehensive foundation for implementing the hybrid architecture while maintaining the existing PWA functionality and adding powerful native capabilities through React Native and Expo SDK 53.