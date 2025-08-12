/**
 * Tactical Map Testing Page
 * Test the ATAK-inspired features we've implemented
 */

'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Dynamic import to avoid SSR issues with Leaflet
const TacticalLeafletMap = dynamic(
  () => import('@/components/tactical-map/TacticalLeafletMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading Tactical Map...</div>
      </div>
    )
  }
);

const MapCollaboration = dynamic(
  () => import('@/components/tactical-map/MapCollaboration'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-32 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-sm">Loading Collaboration...</div>
      </div>
    )
  }
);

// Mock data for testing
const mockDevices = [
  {
    id: '1',
    name: 'Alpha-1',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 5,
      timestamp: new Date().toISOString(),
    },
    isOnline: true,
    batteryLevel: 85,
    networkType: 'WiFi',
    lastSeen: new Date().toISOString(),
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Bravo-2',
    location: {
      latitude: 40.7589,
      longitude: -73.9851,
      accuracy: 8,
      timestamp: new Date().toISOString(),
    },
    isOnline: true,
    batteryLevel: 45,
    networkType: '4G',
    lastSeen: new Date().toISOString(),
    status: 'idle' as const,
  },
  {
    id: '3',
    name: 'Charlie-3',
    location: {
      latitude: 40.6892,
      longitude: -74.0445,
      accuracy: 3,
      timestamp: new Date().toISOString(),
    },
    isOnline: false,
    batteryLevel: 15,
    networkType: 'None',
    lastSeen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    status: 'offline' as const,
  },
  {
    id: '4',
    name: 'Delta-4',
    location: {
      latitude: 40.7505,
      longitude: -73.9934,
      accuracy: 2,
      timestamp: new Date().toISOString(),
    },
    isOnline: true,
    batteryLevel: 92,
    networkType: '5G',
    lastSeen: new Date().toISOString(),
    status: 'emergency' as const,
  },
];

const mockAnnotations = [
  {
    id: '1',
    type: 'marker' as const,
    coordinates: [40.7614, -73.9776],
    properties: {
      title: 'Command Post',
      description: 'Main command and control center',
      color: '#3b82f6',
      icon: 'command',
    },
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockGeofences = [
  {
    id: '1',
    name: 'Secure Zone Alpha',
    type: 'circle' as const,
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    radius: 200,
    triggerType: 'enter' as const,
    isActive: true,
    alertLevel: 'warning' as const,
  },
  {
    id: '2',
    name: 'Restricted Area',
    type: 'circle' as const,
    coordinates: { latitude: 40.7589, longitude: -73.9851 },
    radius: 150,
    triggerType: 'exit' as const,
    isActive: true,
    alertLevel: 'critical' as const,
  },
];

export default function TacticalTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTestResults(['✅ Tactical Map Components Loaded', '✅ Mock Data Initialized']);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDeviceClick = (device: any) => {
    setTestResults(prev => [...prev, `🎯 Device clicked: ${device.name} (${device.status})`]);
  };

  const handleMapClick = (coordinates: [number, number]) => {
    setTestResults(prev => [...prev, `📍 Map clicked: ${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}`]);
  };

  const handleAnnotationCreate = (annotation: any) => {
    setTestResults(prev => [...prev, `✏️ Annotation created: ${annotation.type}`]);
  };

  const handleGeofenceCreate = (geofence: any) => {
    setTestResults(prev => [...prev, `🛡️ Geofence created: ${geofence.name}`]);
  };

  const handleMapUpdate = (update: any) => {
    setTestResults(prev => [...prev, `🔄 Real-time update: ${update.type} by ${update.userName}`]);
  };

  const handleParticipantJoin = (participant: any) => {
    setTestResults(prev => [...prev, `👥 Participant joined: ${participant.name} (${participant.role})`]);
  };

  const handleParticipantLeave = (participantId: string) => {
    setTestResults(prev => [...prev, `👋 Participant left: ${participantId}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🎯 ATAK-Inspired Tactical Platform Test</h1>
          <p className="text-gray-400">
            Testing Leaflet mapping, real-time collaboration, and tactical features
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gray-900 border-gray-700">
            <div className="text-sm text-gray-400">Devices Online</div>
            <div className="text-2xl font-bold text-green-400">
              {mockDevices.filter(d => d.isOnline).length}
            </div>
          </Card>
          
          <Card className="p-4 bg-gray-900 border-gray-700">
            <div className="text-sm text-gray-400">Emergency Alerts</div>
            <div className="text-2xl font-bold text-red-400">
              {mockDevices.filter(d => d.status === 'emergency').length}
            </div>
          </Card>
          
          <Card className="p-4 bg-gray-900 border-gray-700">
            <div className="text-sm text-gray-400">Active Geofences</div>
            <div className="text-2xl font-bold text-blue-400">
              {mockGeofences.filter(g => g.isActive).length}
            </div>
          </Card>
          
          <Card className="p-4 bg-gray-900 border-gray-700">
            <div className="text-sm text-gray-400">Map Status</div>
            <div className="text-sm font-bold text-green-400">
              {isLoading ? 'Loading...' : 'Ready'}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Map Area */}
          <div className="lg:col-span-3">
            <Card className="p-4 bg-gray-900 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tactical Map (Leaflet)</h2>
                <div className="flex space-x-2">
                  <Badge variant="outline">Street View</Badge>
                  <Badge variant="outline">Real-time</Badge>
                  <Badge variant="outline">Collaborative</Badge>
                </div>
              </div>
              
              <div className="h-[600px] rounded-lg overflow-hidden border border-gray-700">
                <TacticalLeafletMap
                  devices={mockDevices}
                  annotations={mockAnnotations}
                  geofences={mockGeofences}
                  center={[40.7128, -74.0060]} // NYC
                  zoom={12}
                  onDeviceClick={handleDeviceClick}
                  onMapClick={handleMapClick}
                  onAnnotationCreate={handleAnnotationCreate}
                  onGeofenceCreate={handleGeofenceCreate}
                  className="w-full h-full"
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Collaboration Panel */}
            <Card className="p-4 bg-gray-900 border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Live Collaboration</h3>
              <MapCollaboration
                onMapUpdate={handleMapUpdate}
                onParticipantJoin={handleParticipantJoin}
                onParticipantLeave={handleParticipantLeave}
                currentUser={{
                  id: 'test-user',
                  name: 'Test Operator',
                  role: 'admin',
                }}
              />
            </Card>

            {/* Test Results */}
            <Card className="p-4 bg-gray-900 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearResults}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    Interact with the map to see test results...
                  </div>
                ) : (
                  testResults.map((result, index) => (
                    <div 
                      key={index} 
                      className="text-xs p-2 bg-gray-800 rounded border-l-2 border-blue-500"
                    >
                      {result}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Device List */}
            <Card className="p-4 bg-gray-900 border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Tactical Units</h3>
              <div className="space-y-2">
                {mockDevices.map((device) => (
                  <div 
                    key={device.id}
                    className="flex items-center justify-between p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                    onClick={() => handleDeviceClick(device)}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          device.status === 'emergency' ? 'bg-red-500 animate-pulse' :
                          device.status === 'active' ? 'bg-green-500' :
                          device.status === 'idle' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}
                      />
                      <span className="text-sm font-medium">{device.name}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {device.batteryLevel}%
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-6 p-4 bg-gray-900 border-gray-700">
          <h3 className="text-lg font-semibold mb-2">🧪 Testing Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">Map Interactions:</h4>
              <ul className="space-y-1">
                <li>• Click device markers to see details</li>
                <li>• Use drawing tools in the top-left</li>
                <li>• Switch map layers (Street/Satellite/Terrain)</li>
                <li>• Toggle layer visibility checkboxes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Expected Features:</h4>
              <ul className="space-y-1">
                <li>• Real-time device status updates</li>
                <li>• Emergency alerts (red pulsing markers)</li>
                <li>• Geofence visualization (colored circles)</li>
                <li>• Collaborative editing capabilities</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}