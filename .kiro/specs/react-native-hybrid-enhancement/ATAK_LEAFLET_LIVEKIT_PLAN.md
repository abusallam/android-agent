# ATAK-Inspired Features with Leaflet + LiveKit Implementation

## 🎯 **Technology Stack Decision**

Based on user preferences and open-source requirements:

### **✅ Mapping Solution: Leaflet (Open Source)**
- **PWA**: Leaflet + React-Leaflet + OpenStreetMap
- **React Native**: react-native-maps + Leaflet integration
- **Benefits**: Free, open source, lightweight, highly customizable

### **✅ Communication: LiveKit + Coturn (Already Configured)**
- **Streaming**: LiveKit for video/audio/screen sharing
- **Data Layer**: LiveKit data channels for real-time messaging
- **TURN Server**: Our own Coturn server for NAT traversal
- **Benefits**: Complete control, secure, scalable

## 🗺️ **Phase 1: Advanced Mapping with Leaflet**

### **1.1 PWA Dashboard Mapping**

#### **Dependencies**
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "leaflet-draw": "^1.0.4",
  "leaflet.markercluster": "^1.5.3",
  "leaflet-geometryutil": "^0.10.1",
  "leaflet-offline": "^3.0.1",
  "@turf/turf": "^6.5.0"
}
```

#### **Implementation**
```typescript
// modern-dashboard/src/components/tactical-map/TacticalLeafletMap.tsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface TacticalMapProps {
  center: [number, number];
  zoom: number;
  devices: Device[];
  onMarkerAdd: (marker: MapMarker) => void;
  onDrawCreate: (layer: any) => void;
}

export function TacticalLeafletMap({ 
  center, 
  zoom, 
  devices, 
  onMarkerAdd, 
  onDrawCreate 
}: TacticalMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="tactical-map"
    >
      {/* Multiple tile layer options */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Satellite imagery option */}
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      
      {/* Device markers */}
      {devices.map((device) => (
        <Marker
          key={device.id}
          position={[device.location.latitude, device.location.longitude]}
          icon={createDeviceIcon(device)}
        >
          <Popup>
            <div className="device-popup">
              <h3>{device.name}</h3>
              <p>Status: {device.isOnline ? 'Online' : 'Offline'}</p>
              <p>Battery: {device.batteryLevel}%</p>
              <p>Last Seen: {device.lastSeen}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Drawing tools */}
      <FeatureGroup>
        <EditControl
          position="topright"
          onCreated={onDrawCreate}
          draw={{
            rectangle: true,
            polygon: true,
            circle: true,
            marker: true,
            polyline: true,
            circlemarker: false,
          }}
          edit={{
            edit: true,
            remove: true,
          }}
        />
      </FeatureGroup>
      
      {/* Real-time collaboration layer */}
      <CollaborativeLayer />
      
      {/* Geofencing layer */}
      <GeofenceLayer />
    </MapContainer>
  );
}

// Custom device icons
const createDeviceIcon = (device: Device) => {
  const color = device.isOnline ? '#22c55e' : '#ef4444';
  const batteryLevel = device.batteryLevel || 0;
  
  return L.divIcon({
    html: `
      <div class="device-marker" style="background-color: ${color}">
        <div class="device-id">${device.name}</div>
        <div class="battery-indicator" style="width: ${batteryLevel}%"></div>
      </div>
    `,
    className: 'custom-device-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};
```

### **1.2 React Native Mapping**

#### **Dependencies**
```json
{
  "react-native-maps": "^1.8.0",
  "react-native-webview": "^13.6.0",
  "@react-native-community/geolocation": "^3.2.1",
  "react-native-fs": "^2.20.0"
}
```

#### **Implementation**
```typescript
// react-native-app/src/components/TacticalMapView.tsx
import React, { useState, useEffect } from 'react';
import MapView, { 
  Marker, 
  Polygon, 
  Circle, 
  Polyline, 
  PROVIDER_GOOGLE 
} from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { StyleSheet, View, Switch, Text } from 'react-native';

interface TacticalMapViewProps {
  region: MapRegion;
  devices: Device[];
  geofences: Geofence[];
  annotations: MapAnnotation[];
  useNativeMaps?: boolean;
}

export function TacticalMapView({ 
  region, 
  devices, 
  geofences, 
  annotations,
  useNativeMaps = true 
}: TacticalMapViewProps) {
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('hybrid');
  
  if (useNativeMaps) {
    return (
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          mapType={mapType}
          showsUserLocation
          showsMyLocationButton
          followsUserLocation
          showsCompass
          showsScale
          rotateEnabled
          pitchEnabled
        >
          {/* Device markers */}
          {devices.map((device) => (
            <Marker
              key={device.id}
              coordinate={{
                latitude: device.location.latitude,
                longitude: device.location.longitude,
              }}
              title={device.name}
              description={`Battery: ${device.batteryLevel}% | ${device.isOnline ? 'Online' : 'Offline'}`}
              pinColor={device.isOnline ? '#22c55e' : '#ef4444'}
            />
          ))}
          
          {/* Geofences */}
          {geofences.map((geofence) => (
            <Circle
              key={geofence.id}
              center={{
                latitude: geofence.center.latitude,
                longitude: geofence.center.longitude,
              }}
              radius={geofence.radius}
              strokeColor="rgba(255, 0, 0, 0.8)"
              fillColor="rgba(255, 0, 0, 0.2)"
              strokeWidth={2}
            />
          ))}
          
          {/* Annotations */}
          {annotations.map((annotation) => {
            if (annotation.type === 'polygon') {
              return (
                <Polygon
                  key={annotation.id}
                  coordinates={annotation.coordinates}
                  strokeColor={annotation.strokeColor}
                  fillColor={annotation.fillColor}
                  strokeWidth={annotation.strokeWidth}
                />
              );
            }
            if (annotation.type === 'polyline') {
              return (
                <Polyline
                  key={annotation.id}
                  coordinates={annotation.coordinates}
                  strokeColor={annotation.strokeColor}
                  strokeWidth={annotation.strokeWidth}
                />
              );
            }
            return null;
          })}
        </MapView>
        
        {/* Map type switcher */}
        <View style={styles.controls}>
          <Text>Satellite</Text>
          <Switch
            value={mapType === 'satellite'}
            onValueChange={(value) => 
              setMapType(value ? 'satellite' : 'standard')
            }
          />
        </View>
      </View>
    );
  }
  
  // Fallback to Leaflet WebView for advanced features
  return (
    <WebView
      source={{ uri: 'https://your-domain.com/mobile-map' }}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
```

## 📡 **Phase 2: Enhanced LiveKit Integration**

### **2.1 LiveKit Data Channels for Real-time Collaboration**

```typescript
// modern-dashboard/src/services/LiveKitCollaborationService.ts
import { Room, DataPacket_Kind, RemoteParticipant } from 'livekit-client';

export class LiveKitCollaborationService {
  private room: Room | null = null;
  private onMapUpdate: (data: MapUpdateData) => void;
  
  constructor(onMapUpdate: (data: MapUpdateData) => void) {
    this.onMapUpdate = onMapUpdate;
  }
  
  async connect(token: string, serverUrl: string) {
    this.room = new Room();
    
    // Handle data messages
    this.room.on('dataReceived', (payload: Uint8Array, participant?: RemoteParticipant) => {
      const data = JSON.parse(new TextDecoder().decode(payload));
      this.handleMapUpdate(data);
    });
    
    await this.room.connect(serverUrl, token);
  }
  
  // Send map updates to all participants
  sendMapUpdate(updateData: MapUpdateData) {
    if (!this.room) return;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(updateData));
    
    this.room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
  }
  
  private handleMapUpdate(data: MapUpdateData) {
    switch (data.type) {
      case 'marker_added':
        this.onMapUpdate(data);
        break;
      case 'annotation_created':
        this.onMapUpdate(data);
        break;
      case 'geofence_updated':
        this.onMapUpdate(data);
        break;
    }
  }
}

interface MapUpdateData {
  type: 'marker_added' | 'annotation_created' | 'geofence_updated';
  data: any;
  userId: string;
  timestamp: number;
}
```

### **2.2 LiveKit React Native Integration**

```typescript
// react-native-app/src/services/LiveKitService.ts
import { Room, VideoPresets, AudioPresets } from '@livekit/react-native';

export class LiveKitService {
  private room: Room | null = null;
  
  async startStreaming(token: string, serverUrl: string) {
    this.room = new Room();
    
    // Configure for mobile optimization
    await this.room.connect(serverUrl, token, {
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
        frameRate: 30,
      },
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    
    // Enable camera and microphone
    await this.room.localParticipant.enableCameraAndMicrophone();
    
    return this.room;
  }
  
  async sendDataMessage(message: any) {
    if (!this.room) return;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));
    
    await this.room.localParticipant.publishData(data);
  }
}
```

## 🛡️ **Phase 3: Security & Mesh Networking**

### **3.1 Coturn Server Integration**

Our existing Coturn configuration supports:
```bash
# Already configured in coturn/turnserver.conf
├── STUN/TURN server for NAT traversal
├── Authentication with credentials
├── Secure relay for WebRTC traffic
├── Performance tuning for mobile devices
└── Prometheus metrics for monitoring
```

### **3.2 Mesh Networking Capabilities**

```typescript
// Mesh networking using LiveKit data channels
export class MeshNetworkService {
  private peers: Map<string, RTCPeerConnection> = new Map();
  
  async createMeshNetwork(participants: string[]) {
    // Create direct peer connections for mesh networking
    for (const participantId of participants) {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:your-coturn-server:3478' },
          { 
            urls: 'turn:your-coturn-server:3478',
            username: 'androidagent',
            credential: 'coturn_password_2024'
          }
        ]
      });
      
      this.peers.set(participantId, peerConnection);
    }
  }
  
  async sendMeshMessage(message: any, targetPeer?: string) {
    // Send message through mesh network
    if (targetPeer && this.peers.has(targetPeer)) {
      // Direct peer-to-peer message
      const peer = this.peers.get(targetPeer)!;
      // Implementation for direct messaging
    } else {
      // Broadcast to all peers
      this.peers.forEach((peer, peerId) => {
        // Broadcast implementation
      });
    }
  }
}
```

## 🎯 **Implementation Roadmap**

### **Week 1-2: Leaflet Integration**
- [ ] Replace Mapbox with Leaflet in PWA dashboard
- [ ] Implement React-Leaflet with drawing tools
- [ ] Set up OpenStreetMap tile layers
- [ ] Create custom device markers and clustering

### **Week 3-4: React Native Maps**
- [ ] Integrate react-native-maps with Google Maps
- [ ] Implement Leaflet WebView fallback for advanced features
- [ ] Create offline tile caching system
- [ ] Sync map state between platforms

### **Week 5-6: LiveKit Enhancement**
- [ ] Implement LiveKit data channels for real-time collaboration
- [ ] Create mesh networking capabilities
- [ ] Enhance Coturn server configuration
- [ ] Add end-to-end encryption for sensitive data

### **Week 7-8: ATAK Features**
- [ ] Implement geofencing with Leaflet
- [ ] Create collaborative annotation system
- [ ] Add emergency beacon functionality
- [ ] Integrate tactical communication features

## 📊 **Benefits of This Approach**

### **✅ Leaflet Advantages**
- **Cost**: $0 vs Mapbox's $0.50-$5.00 per 1,000 requests
- **Control**: Complete control over map styling and features
- **Flexibility**: Works with any tile provider
- **Performance**: Lighter weight, faster loading
- **Privacy**: No external API calls for basic functionality

### **✅ LiveKit + Coturn Advantages**
- **Security**: Own TURN server, complete control
- **Scalability**: Mesh networking for degraded environments
- **Features**: Video, audio, data channels, recording
- **Cost**: No per-minute charges, own infrastructure
- **Reliability**: No dependency on external services

## 🚀 **Next Steps**

Would you like me to start implementing the Leaflet integration first? I can:

1. **Replace Mapbox with Leaflet** in the PWA dashboard
2. **Set up React-Leaflet** with drawing tools and collaboration
3. **Integrate react-native-maps** for the mobile app
4. **Enhance LiveKit data channels** for real-time map collaboration

This approach gives us a completely open-source, self-hosted tactical awareness platform with no external dependencies or usage costs!