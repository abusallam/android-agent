/**
 * Tactical Leaflet Map Component
 * ATAK-inspired mapping with real-time collaboration
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
  Settings
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
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  };
  isOnline: boolean;
  batteryLevel?: number;
  networkType?: string;
  lastSeen: string;
  status: 'active' | 'idle' | 'emergency' | 'offline';
}

interface MapAnnotation {
  id: string;
  type: 'marker' | 'polygon' | 'polyline' | 'circle' | 'rectangle';
  coordinates: any;
  properties: {
    title?: string;
    description?: string;
    color?: string;
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    icon?: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  coordinates: any;
  radius?: number;
  triggerType: 'enter' | 'exit' | 'dwell';
  isActive: boolean;
  alertLevel: 'info' | 'warning' | 'critical';
}

interface TacticalMapProps {
  devices: Device[];
  annotations: MapAnnotation[];
  geofences: Geofence[];
  center?: [number, number];
  zoom?: number;
  onDeviceClick?: (device: Device) => void;
  onMapClick?: (coordinates: [number, number]) => void;
  onAnnotationCreate?: (annotation: Omit<MapAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onGeofenceCreate?: (geofence: Omit<Geofence, 'id'>) => void;
  className?: string;
}

type MapMode = 'view' | 'draw' | 'measure' | 'geofence';
type MapLayer = 'street' | 'satellite' | 'terrain' | 'tactical';

export function TacticalLeafletMap({
  devices = [],
  annotations = [],
  geofences = [],
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  onDeviceClick,
  onMapClick,
  onAnnotationCreate,
  onGeofenceCreate,
  className = ''
}: TacticalMapProps) {
  const mapRef = useRef<any>(null);
  const [mapMode, setMapMode] = useState<MapMode>('view');
  const [activeLayer, setActiveLayer] = useState<MapLayer>('street');
  const [showDevices, setShowDevices] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isCollaborating, setIsCollaborating] = useState(false);

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

  // Create custom device icon
  const createDeviceIcon = useCallback((device: Device) => {
    if (typeof window === 'undefined') return null;
    
    const L = require('leaflet');
    const color = getDeviceColor(device);
    const batteryLevel = device.batteryLevel || 0;
    
    return L.divIcon({
      html: `
        <div class="device-marker" style="
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="
            position: absolute;
            bottom: -20px;
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
      iconSize: [24, 24],
      iconAnchor: [12, 12],
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