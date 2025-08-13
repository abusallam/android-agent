/**
 * Comprehensive Tactical Dashboard
 * Complete ATAK-inspired tactical operations interface with real-time data
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Activity, 
  AlertTriangle, 
  Users, 
  Plane,
  Shield,
  Radio,
  Target,
  Eye,
  Settings,
  Layers,
  Navigation,
  Camera,
  Zap,
  Clock,
  TrendingUp,
  Database
} from 'lucide-react';

// Dynamic imports to avoid SSR issues
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

interface TacticalData {
  devices: any[];
  tacticalAssets: any[];
  emergencyAlerts: any[];
  tacticalOperations: any[];
  geofences: any[];
  annotations: any[];
  metadata: {
    timestamp: string;
    counts: {
      devices: number;
      tacticalAssets: number;
      emergencyAlerts: number;
      tacticalOperations: number;
      geofences: number;
    };
  };
}

export default function TacticalDashboard() {
  const [tacticalData, setTacticalData] = useState<TacticalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [selectedTab, setSelectedTab] = useState('map');
  const [mapCenter, setMapCenter] = useState<[number, number]>([24.7136, 46.6753]); // Riyadh, Saudi Arabia
  const [mapZoom, setMapZoom] = useState(12);

  // Fetch tactical data from API
  const fetchTacticalData = useCallback(async () => {
    try {
      const response = await fetch('/api/tactical/map-data?devices=true&assets=true&alerts=true&operations=true&geofences=true');
      if (!response.ok) {
        throw new Error('Failed to fetch tactical data');
      }
      
      const data = await response.json();
      setTacticalData(data);
      setLastUpdate(data.metadata.timestamp);
      setError(null);
    } catch (err) {
      console.error('Error fetching tactical data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch real-time updates
  const fetchRealtimeUpdates = useCallback(async () => {
    if (!isRealTimeEnabled || !lastUpdate) return;

    try {
      const sessionId = 'tactical-dashboard-' + Date.now();
      const response = await fetch(`/api/tactical/realtime?sessionId=${sessionId}&lastUpdate=${lastUpdate}`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.updates && data.updates.length > 0) {
        // Apply updates to current data
        console.log('Received real-time updates:', data.updates);
        setLastUpdate(data.timestamp);
        
        // Refresh full data periodically
        if (data.updates.length > 10) {
          fetchTacticalData();
        }
      }
    } catch (err) {
      console.error('Error fetching real-time updates:', err);
    }
  }, [isRealTimeEnabled, lastUpdate, fetchTacticalData]);

  // Initial data load
  useEffect(() => {
    fetchTacticalData();
  }, [fetchTacticalData]);

  // Real-time updates polling
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(fetchRealtimeUpdates, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchRealtimeUpdates, isRealTimeEnabled]);

  // Event handlers
  const handleDeviceClick = (device: any) => {
    console.log('Device clicked:', device);
    // Could open device details modal
  };

  const handleAssetClick = (asset: any) => {
    console.log('Asset clicked:', asset);
    // Could open asset control panel
  };

  const handleEmergencyAlertClick = (alert: any) => {
    console.log('Emergency alert clicked:', alert);
    // Could open emergency response interface
  };

  const handleOperationClick = (operation: any) => {
    console.log('Operation clicked:', operation);
    // Could open operation management interface
  };

  const handleMapUpdate = (update: any) => {
    console.log('Map update:', update);
    // Handle real-time collaboration updates
  };

  const handleParticipantJoin = (participant: any) => {
    console.log('Participant joined:', participant);
  };

  const handleParticipantLeave = (participantId: string) => {
    console.log('Participant left:', participantId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg">Loading Tactical Dashboard...</div>
          <div className="text-sm text-gray-400 mt-2">Initializing real-time tactical operations interface</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-lg text-red-400">Error Loading Tactical Data</div>
          <div className="text-sm text-gray-400 mt-2">{error}</div>
          <Button onClick={fetchTacticalData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const data = tacticalData!;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-400" />
                <h1 className="text-xl font-bold">TacticalOps Command Center</h1>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-sm text-gray-400">
                  {isRealTimeEnabled ? 'Live' : 'Static'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status Indicators */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-green-400" />
                  <span>{data.devices.filter(d => d.status === 'active').length} Active</span>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span>{data.emergencyAlerts.filter(a => a.status === 'active').length} Alerts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Plane className="h-4 w-4 text-blue-400" />
                  <span>{data.tacticalAssets.filter(a => a.status === 'operational').length} Assets</span>
                </div>
              </div>

              <Button
                variant={isRealTimeEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              >
                <Activity className="h-4 w-4 mr-1" />
                Real-time
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Map Area */}
        <div className="flex-1 relative">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full">
            <TabsList className="absolute top-4 left-4 z-[1000] bg-black/80 border-gray-700">
              <TabsTrigger value="map" className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Tactical Map</span>
              </TabsTrigger>
              <TabsTrigger value="operations" className="flex items-center space-x-1">
                <Target className="h-4 w-4" />
                <span>Operations</span>
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>Intelligence</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="h-full m-0">
              <TacticalLeafletMap
                devices={data.devices}
                tacticalAssets={data.tacticalAssets}
                annotations={data.annotations || []}
                geofences={data.geofences}
                emergencyAlerts={data.emergencyAlerts}
                tacticalOperations={data.tacticalOperations}
                center={mapCenter}
                zoom={mapZoom}
                onDeviceClick={handleDeviceClick}
                onAssetClick={handleAssetClick}
                onEmergencyAlertClick={handleEmergencyAlertClick}
                onOperationClick={handleOperationClick}
                isCollaborationEnabled={true}
                userRole="military"
                securityClearance="secret"
                className="w-full h-full"
              />
            </TabsContent>

            <TabsContent value="operations" className="h-full m-0 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                {/* Active Operations */}
                <Card className="p-4 bg-gray-900 border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Active Operations
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.tacticalOperations.filter(op => op.status === 'active').map((operation) => (
                      <div key={operation.id} className="p-3 bg-gray-800 rounded border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{operation.name}</span>
                          <Badge variant={operation.priority === 'critical' ? 'destructive' : 'default'}>
                            {operation.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          <div>Type: {operation.operation_type}</div>
                          <div>Personnel: {operation.assigned_to?.length || 0}</div>
                          {operation.start_time && (
                            <div>Started: {new Date(operation.start_time).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Asset Status */}
                <Card className="p-4 bg-gray-900 border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Plane className="h-5 w-5 mr-2" />
                    Tactical Assets
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.tacticalAssets.map((asset) => (
                      <div key={asset.id} className="p-3 bg-gray-800 rounded border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{asset.name}</span>
                          <Badge variant={asset.status === 'operational' ? 'default' : 'secondary'}>
                            {asset.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          <div>Type: {asset.asset_type?.replace(/_/g, ' ')}</div>
                          {asset.assigned_operation && (
                            <div>Operation: {asset.operation_name}</div>
                          )}
                          {asset.assigned_user && (
                            <div>Operator: {asset.assigned_user}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="intelligence" className="h-full m-0 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                {/* Threat Assessment */}
                <Card className="p-4 bg-gray-900 border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Threat Assessment
                  </h3>
                  <div className="space-y-3">
                    {data.emergencyAlerts.map((alert) => (
                      <div key={alert.id} className="p-3 bg-gray-800 rounded border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{alert.title}</span>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">
                          <div>Type: {alert.alert_type}</div>
                          <div>Status: {alert.status}</div>
                          <div>Created: {new Date(alert.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* System Metrics */}
                <Card className="p-4 bg-gray-900 border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    System Status
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Devices Online</span>
                        <span>{data.devices.filter(d => d.status === 'active').length}/{data.devices.length}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(data.devices.filter(d => d.status === 'active').length / data.devices.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Assets Operational</span>
                        <span>{data.tacticalAssets.filter(a => a.status === 'operational').length}/{data.tacticalAssets.length}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(data.tacticalAssets.filter(a => a.status === 'operational').length / data.tacticalAssets.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Active Geofences</span>
                        <span>{data.geofences.filter(g => g.is_active).length}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full w-full"></div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-4 bg-gray-900 border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Recent Activity
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>System initialized</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(data.metadata.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Tactical data loaded</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(data.metadata.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Real-time monitoring active</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-gray-800 bg-gray-900/50 backdrop-blur-sm p-4 space-y-4 overflow-y-auto">
          {/* Collaboration Panel */}
          <MapCollaboration
            onMapUpdate={handleMapUpdate}
            onParticipantJoin={handleParticipantJoin}
            onParticipantLeave={handleParticipantLeave}
            currentUser={{
              id: 'tactical-commander',
              name: 'Tactical Commander',
              role: 'admin',
            }}
          />

          {/* Quick Stats */}
          <Card className="p-4 bg-black/80 border-gray-700">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Data Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-lg font-bold text-green-400">{data.metadata.counts.devices}</div>
                <div className="text-xs text-gray-400">Devices</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-lg font-bold text-blue-400">{data.metadata.counts.tacticalAssets}</div>
                <div className="text-xs text-gray-400">Assets</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-lg font-bold text-red-400">{data.metadata.counts.emergencyAlerts}</div>
                <div className="text-xs text-gray-400">Alerts</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-lg font-bold text-purple-400">{data.metadata.counts.tacticalOperations}</div>
                <div className="text-xs text-gray-400">Operations</div>
              </div>
            </div>
          </Card>

          {/* Emergency Alerts */}
          {data.emergencyAlerts.length > 0 && (
            <Card className="p-4 bg-red-900/20 border-red-700">
              <h3 className="text-lg font-semibold mb-3 flex items-center text-red-400">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Active Alerts
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.emergencyAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-2 bg-red-900/30 rounded border border-red-800">
                    <div className="font-medium text-sm text-red-200">{alert.title}</div>
                    <div className="text-xs text-red-300">
                      {alert.severity} • {alert.status}
                    </div>
                    <div className="text-xs text-red-400 mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}