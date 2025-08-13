/**
 * Enhanced Tactical Leaflet Map Component
 * Complete ATAK-inspired mapping with PostGIS integration and real-time collaboration
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Layers, 
  Drawing, 
  Shield, 
  Radio,
  Target,
  AlertTriangle,
  Users,
  Settings,
  Plane,
  Camera,
  Navigation,
  Crosshair,
  Ruler,
  FileImage,
  Satellite,
  Mountain,
  Zap,
  Eye,
  EyeOff,
  Upload,
  Download,
  Share2,
  Lock,
  Unlock
} from 'lucide-react';

// Dynamic import to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const FeatureGroup = dynamic(
  () => import('react-leaflet').then((mod) => mod.FeatureGroup),
  { ssr: false }
);

interface Device {
  id: string;
  name: string;
  deviceType: 'mobile' | 'vehicle' | 'uav' | 'sensor' | 'mesh_node';
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp: string;
  };
  isOnline: boolean;
  batteryLevel?: number;
  networkType?: string;
  lastSeen: string;
  status: 'active' | 'idle' | 'emergency' | 'offline' | 'mission';
  capabilities?: string[];
  metadata?: Record<string, any>;
}

interface TacticalAsset {
  id: string;
  name: string;
  assetType: 'uav_reconnaissance' | 'uav_tactical' | 'vehicle_transport' | 'equipment';
  status: 'operational' | 'maintenance' | 'deployed' | 'offline';
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
    heading?: number;
  };
  assignedOperation?: string;
  assignedTo?: string;
  capabilities: string[];
  specifications: Record<string, any>;
  liveStream?: {
    isActive: boolean;
    streamUrl?: string;
    quality?: string;
  };
}

interface MapAnnotation {
  id: string;
  type: 'marker' | 'polygon' | 'polyline' | 'circle' | 'rectangle' | 'text' | 'arrow';
  coordinates: any;
  properties: {
    title?: string;
    description?: string;
    color?: string;
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    icon?: string;
    classification?: 'unclassified' | 'confidential' | 'secret' | 'top_secret';
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  layerId?: string;
}

interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: 'circle' | 'polygon';
  coordinates: any;
  radius?: number;
  triggerType: 'enter' | 'exit' | 'dwell';
  dwellTimeMinutes?: number;
  isActive: boolean;
  alertLevel: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

interface EmergencyAlert {
  id: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  radiusMeters?: number;
  status: 'active' | 'acknowledged' | 'responding' | 'resolved';
  createdAt: string;
  assignedTo?: string[];
  responseLog?: Array<{
    timestamp: string;
    responder: string;
    action: string;
    status: string;
  }>;
}

interface TacticalOperation {
  id: string;
  name: string;
  description: string;
  operationType: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  operationArea?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  centerPoint?: {
    latitude: number;
    longitude: number;
  };
  assignedPersonnel: string[];
  assignedAssets: string[];
  objectives: string[];
  startTime?: string;
  endTime?: string;
}

interface TacticalMapProps {
  devices: Device[];
  tacticalAssets?: TacticalAsset[];
  annotations: MapAnnotation[];
  geofences: Geofence[];
  emergencyAlerts?: EmergencyAlert[];
  tacticalOperations?: TacticalOperation[];
  center?: [number, number];
  zoom?: number;
  onDeviceClick?: (device: Device) => void;
  onAssetClick?: (asset: TacticalAsset) => void;
  onMapClick?: (coordinates: [number, number]) => void;
  onAnnotationCreate?: (annotation: Omit<MapAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onGeofenceCreate?: (geofence: Omit<Geofence, 'id'>) => void;
  onEmergencyAlertClick?: (alert: EmergencyAlert) => void;
  onOperationClick?: (operation: TacticalOperation) => void;
  isCollaborationEnabled?: boolean;
  userRole?: 'civilian' | 'government' | 'military';
  securityClearance?: 'unclassified' | 'confidential' | 'secret' | 'top_secret';
  className?: string;
}

type MapMode = 'view' | 'draw' | 'measure' | 'geofence';
type MapLayer = 'street' | 'satellite' | 'terrain' | 'tactical';

export function TacticalLeafletMap({
  devices = [],
  tacticalAssets = [],
  annotations = [],
  geofences = [],
  emergencyAlerts = [],
  tacticalOperations = [],
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  onDeviceClick,
  onAssetClick,
  onMapClick,
  onAnnotationCreate,
  onGeofenceCreate,
  onEmergencyAlertClick,
  onOperationClick,
  isCollaborationEnabled = false,
  userRole = 'civilian',
  securityClearance = 'unclassified',
  className = ''
}: TacticalMapProps) {
  const mapRef = useRef<any>(null);
  const [mapMode, setMapMode] = useState<MapMode>('view');
  const [activeLayer, setActiveLayer] = useState<MapLayer>('street');
  const [showDevices, setShowDevices] = useState(true);
  const [showTacticalAssets, setShowTacticalAssets] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showEmergencyAlerts, setShowEmergencyAlerts] = useState(true);
  const [showOperations, setShowOperations] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<TacticalAsset | null>(null);
  const [isCollaborating, setIsCollaborating] = useState(isCollaborationEnabled);

  // Device status colors
  const getDeviceColor = (device: Device) => {
    if (!device.isOnline) return '#6b7280'; // gray
    switch (device.status) {
      case 'emergency': return '#ef4444'; // red
      case 'active': return '#22c55e'; // green
      case 'idle': return '#f59e0b'; // yellow
      default: return '#6b7280'; // gray
    }
  };

  // Tactical asset status colors
  const getAssetColor = (asset: TacticalAsset) => {
    switch (asset.status) {
      case 'operational': return '#22c55e'; // green
      case 'deployed': return '#3b82f6'; // blue
      case 'maintenance': return '#f59e0b'; // yellow
      case 'offline': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  // Emergency alert colors
  const getAlertColor = (alert: EmergencyAlert) => {
    switch (alert.severity) {
      case 'critical': return '#dc2626'; // red
      case 'high': return '#ea580c'; // orange
      case 'medium': return '#d97706'; // amber
      case 'low': return '#65a30d'; // lime
      default: return '#6b7280';
    }
  };

  // Create custom device icon
  const createDeviceIcon = useCallback((device: Device) => {
    if (typeof window === 'undefined') return null;
    
    const L = require('leaflet');
    const color = getDeviceColor(device);
    const batteryLevel = device.batteryLevel || 0;
    
    // Device type icons
    const getDeviceTypeIcon = (type: string) => {
      switch (type) {
        case 'uav': return '✈️';
        case 'vehicle': return '🚗';
        case 'sensor': return '📡';
        case 'mesh_node': return '📶';
        default: return '📱';
      }
    };
    
    return L.divIcon({
      html: `
        <div class="device-marker" style="
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        ">
          ${getDeviceTypeIcon(device.deviceType)}
          <div style="
            position: absolute;
            bottom: -22px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
          ">${device.name}</div>
          ${batteryLevel > 0 ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: ${batteryLevel > 20 ? '#22c55e' : '#ef4444'};
              color: white;
              border-radius: 50%;
              width: 16px;
              height: 16px;
              font-size: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">${batteryLevel}</div>
          ` : ''}
        </div>
      `,
      className: 'custom-device-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }, []);

  // Create tactical asset icon
  const createAssetIcon = useCallback((asset: TacticalAsset) => {
    if (typeof window === 'undefined') return null;
    
    const L = require('leaflet');
    const color = getAssetColor(asset);
    
    const getAssetTypeIcon = (type: string) => {
      switch (type) {
        case 'uav_reconnaissance': return '🔍';
        case 'uav_tactical': return '🎯';
        case 'vehicle_transport': return '🚛';
        case 'equipment': return '⚙️';
        default: return '📦';
      }
    };
    
    return L.divIcon({
      html: `
        <div class="asset-marker" style="
          background-color: ${color};
          border: 2px solid white;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">
          ${getAssetTypeIcon(asset.assetType)}
          <div style="
            position: absolute;
            bottom: -22px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
          ">${asset.name}</div>
          ${asset.liveStream?.isActive ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: #dc2626;
              color: white;
              border-radius: 50%;
              width: 16px;
              height: 16px;
              font-size: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              animation: pulse 2s infinite;
            ">🔴</div>
          ` : ''}
        </div>
      `,
      className: 'custom-asset-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  // Create emergency alert icon
  const createAlertIcon = useCallback((alert: EmergencyAlert) => {
    if (typeof window === 'undefined') return null;
    
    const L = require('leaflet');
    const color = getAlertColor(alert);
    
    return L.divIcon({
      html: `
        <div class="alert-marker" style="
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          animation: ${alert.severity === 'critical' ? 'pulse 1s infinite' : 'none'};
        ">
          ⚠️
          <div style="
            position: absolute;
            bottom: -24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            font-weight: bold;
          ">${alert.title}</div>
        </div>
      `,
      className: 'custom-alert-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, []);

  // Handle map mode changes
  const handleModeChange = (mode: MapMode) => {
    setMapMode(mode);
    // Additional mode-specific logic here
  };

  // Handle layer changes
  const handleLayerChange = (layer: MapLayer) => {
    setActiveLayer(layer);
  };

  // Get tile layer URL based on active layer
  const getTileLayerUrl = () => {
    switch (activeLayer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'tactical':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // Can be replaced with tactical tiles
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  // Get tile layer attribution
  const getTileLayerAttribution = () => {
    switch (activeLayer) {
      case 'satellite':
        return '&copy; <a href="https://www.esri.com/">Esri</a>';
      case 'terrain':
        return '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>';
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        {/* Mode Controls */}
        <Card className="p-2 bg-black/80 border-gray-700">
          <div className="flex space-x-1">
            <Button
              variant={mapMode === 'view' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('view')}
              className="h-8 w-8 p-0"
            >
              <MapPin className="h-4 w-4" />
            </Button>
            <Button
              variant={mapMode === 'draw' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('draw')}
              className="h-8 w-8 p-0"
            >
              <Drawing className="h-4 w-4" />
            </Button>
            <Button
              variant={mapMode === 'geofence' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('geofence')}
              className="h-8 w-8 p-0"
            >
              <Shield className="h-4 w-4" />
            </Button>
            <Button
              variant={mapMode === 'measure' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('measure')}
              className="h-8 w-8 p-0"
            >
              <Target className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Layer Controls */}
        <Card className="p-2 bg-black/80 border-gray-700">
          <div className="flex space-x-1">
            <Button
              variant={activeLayer === 'street' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleLayerChange('street')}
              className="h-8 px-2 text-xs"
            >
              Street
            </Button>
            <Button
              variant={activeLayer === 'satellite' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleLayerChange('satellite')}
              className="h-8 px-2 text-xs"
            >
              Satellite
            </Button>
            <Button
              variant={activeLayer === 'terrain' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleLayerChange('terrain')}
              className="h-8 px-2 text-xs"
            >
              Terrain
            </Button>
          </div>
        </Card>

        {/* Layer Toggles */}
        <Card className="p-2 bg-black/80 border-gray-700">
          <div className="space-y-1">
            <label className="flex items-center space-x-2 text-xs text-white">
              <input
                type="checkbox"
                checked={showDevices}
                onChange={(e) => setShowDevices(e.target.checked)}
                className="rounded"
              />
              <span>Devices ({devices.length})</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-white">
              <input
                type="checkbox"
                checked={showTacticalAssets}
                onChange={(e) => setShowTacticalAssets(e.target.checked)}
                className="rounded"
              />
              <span>Assets ({tacticalAssets.length})</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-white">
              <input
                type="checkbox"
                checked={showEmergencyAlerts}
                onChange={(e) => setShowEmergencyAlerts(e.target.checked)}
                className="rounded"
              />
              <span>Alerts ({emergencyAlerts.length})</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-white">
              <input
                type="checkbox"
                checked={showAnnotations}
                onChange={(e) => setShowAnnotations(e.target.checked)}
                className="rounded"
              />
              <span>Annotations ({annotations.length})</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-white">
              <input
                type="checkbox"
                checked={showGeofences}
                onChange={(e) => setShowGeofences(e.target.checked)}
                className="rounded"
              />
              <span>Geofences ({geofences.length})</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-white">
              <input
                type="checkbox"
                checked={showOperations}
                onChange={(e) => setShowOperations(e.target.checked)}
                className="rounded"
              />
              <span>Operations ({tacticalOperations.length})</span>
            </label>
          </div>
        </Card>
      </div>

      {/* Status Panel */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Card className="p-3 bg-black/80 border-gray-700 min-w-[200px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Tactical Status</span>
              <Badge variant={isCollaborating ? 'default' : 'secondary'}>
                {isCollaborating ? 'Live' : 'Solo'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-300">
                <div>Online: {devices.filter(d => d.isOnline).length}</div>
                <div>Offline: {devices.filter(d => !d.isOnline).length}</div>
              </div>
              <div className="text-gray-300">
                <div>Emergency: {devices.filter(d => d.status === 'emergency').length}</div>
                <div>Active: {devices.filter(d => d.status === 'active').length}</div>
              </div>
            </div>

            {selectedDevice && (
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="text-sm font-medium text-white">{selectedDevice.name}</div>
                <div className="text-xs text-gray-300">
                  <div>Status: {selectedDevice.status}</div>
                  <div>Battery: {selectedDevice.batteryLevel}%</div>
                  <div>Network: {selectedDevice.networkType}</div>
                  <div>Last Seen: {new Date(selectedDevice.lastSeen).toLocaleTimeString()}</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div className="w-full h-full">
        <MapContainer
          ref={mapRef}
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="tactical-map"
          zoomControl={false}
          attributionControl={false}
        >
          {/* Tile Layer */}
          <TileLayer
            url={getTileLayerUrl()}
            attribution={getTileLayerAttribution()}
            maxZoom={18}
          />

          {/* Device Markers */}
          {showDevices && devices.map((device) => {
            const icon = createDeviceIcon(device);
            if (!icon) return null;
            
            return (
              <Marker
                key={device.id}
                position={[device.location.latitude, device.location.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedDevice(device);
                    onDeviceClick?.(device);
                  },
                }}
              >
                <Popup>
                  <div className="device-popup min-w-[200px]">
                    <div className="font-semibold text-lg mb-2">{device.name}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <Badge variant="outline">{device.deviceType}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge 
                          variant={device.status === 'emergency' ? 'destructive' : 
                                  device.status === 'active' ? 'default' : 'secondary'}
                        >
                          {device.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Battery:</span>
                        <span className={device.batteryLevel && device.batteryLevel < 20 ? 'text-red-500' : ''}>
                          {device.batteryLevel}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network:</span>
                        <span>{device.networkType || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span>{device.location.accuracy ? `${device.location.accuracy}m` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Update:</span>
                        <span>{new Date(device.location.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {device.location.speed && (
                        <div className="flex justify-between">
                          <span>Speed:</span>
                          <span>{device.location.speed.toFixed(1)} km/h</span>
                        </div>
                      )}
                      {device.location.altitude && (
                        <div className="flex justify-between">
                          <span>Altitude:</span>
                          <span>{device.location.altitude.toFixed(0)}m</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" className="flex-1">
                        <Radio className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Target className="h-3 w-3 mr-1" />
                        Track
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Tactical Asset Markers */}
          {showTacticalAssets && tacticalAssets.map((asset) => {
            const icon = createAssetIcon(asset);
            if (!icon) return null;
            
            return (
              <Marker
                key={asset.id}
                position={[asset.location.latitude, asset.location.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedAsset(asset);
                    onAssetClick?.(asset);
                  },
                }}
              >
                <Popup>
                  <div className="asset-popup min-w-[220px]">
                    <div className="font-semibold text-lg mb-2">{asset.name}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <Badge variant="outline">{asset.assetType.replace(/_/g, ' ')}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge 
                          variant={asset.status === 'operational' ? 'default' : 
                                  asset.status === 'deployed' ? 'default' : 'secondary'}
                        >
                          {asset.status}
                        </Badge>
                      </div>
                      {asset.assignedOperation && (
                        <div className="flex justify-between">
                          <span>Operation:</span>
                          <span className="text-blue-400">{asset.assignedOperation}</span>
                        </div>
                      )}
                      {asset.assignedTo && (
                        <div className="flex justify-between">
                          <span>Assigned To:</span>
                          <span>{asset.assignedTo}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Capabilities:</span>
                        <span className="text-xs">{asset.capabilities.length} items</span>
                      </div>
                      {asset.location.altitude && (
                        <div className="flex justify-between">
                          <span>Altitude:</span>
                          <span>{asset.location.altitude.toFixed(0)}m</span>
                        </div>
                      )}
                      {asset.location.heading && (
                        <div className="flex justify-between">
                          <span>Heading:</span>
                          <span>{asset.location.heading.toFixed(0)}°</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      {asset.liveStream?.isActive && (
                        <Button size="sm" className="flex-1">
                          <Camera className="h-3 w-3 mr-1" />
                          View Stream
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="flex-1">
                        <Navigation className="h-3 w-3 mr-1" />
                        Control
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Emergency Alert Markers */}
          {showEmergencyAlerts && emergencyAlerts.map((alert) => {
            const icon = createAlertIcon(alert);
            if (!icon) return null;
            
            return (
              <Marker
                key={alert.id}
                position={[alert.location.latitude, alert.location.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    onEmergencyAlertClick?.(alert);
                  },
                }}
              >
                <Popup>
                  <div className="alert-popup min-w-[250px]">
                    <div className="font-semibold text-lg mb-2 text-red-600">{alert.title}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <Badge variant="outline">{alert.alertType}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Severity:</span>
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 
                                  alert.severity === 'high' ? 'destructive' : 
                                  alert.severity === 'medium' ? 'default' : 'secondary'}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge 
                          variant={alert.status === 'active' ? 'destructive' : 
                                  alert.status === 'responding' ? 'default' : 'secondary'}
                        >
                          {alert.status}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <span className="font-medium">Description:</span>
                        <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                      </div>
                      {alert.address && (
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span className="text-xs">{alert.address}</span>
                        </div>
                      )}
                      {alert.radiusMeters && (
                        <div className="flex justify-between">
                          <span>Radius:</span>
                          <span>{alert.radiusMeters}m</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-xs">{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="destructive" className="flex-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Respond
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Users className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Drawing Tools */}
          {mapMode === 'draw' && (
            <FeatureGroup>
              {/* Drawing controls will be added here */}
            </FeatureGroup>
          )}
        </MapContainer>
      </div>

      {/* Emergency Alert */}
      {devices.some(d => d.status === 'emergency') && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <Card className="p-3 bg-red-900/90 border-red-700">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
              <span className="text-red-100 font-medium">
                Emergency Alert: {devices.filter(d => d.status === 'emergency').length} device(s) in emergency state
              </span>
              <Button size="sm" variant="destructive" className="ml-auto">
                Respond
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TacticalLeafletMap;