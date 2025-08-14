/**
 * Streaming Dashboard
 * Main dashboard that integrates all LiveKit streaming components
 */
'use client';

import React, { useState, useEffect } from 'react';
import { LiveKitProvider } from './LiveKitProvider';
import { VideoStreamComponent, MultiStreamGrid } from './VideoStreamComponent';
import { AudioController } from './AudioController';
import { ScreenShareComponent } from './ScreenShareComponent';
import { EmergencyCommSystem } from './EmergencyCommSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, 
  Mic, 
  Monitor, 
  AlertTriangle, 
  Settings, 
  Users,
  Phone,
  PhoneOff,
  Maximize,
  Minimize,
  Activity
} from 'lucide-react';

interface StreamingDashboardProps {
  roomName?: string;
  userName?: string;
  userRole?: 'ROOT_ADMIN' | 'ADMIN' | 'USER';
}

export function StreamingDashboard({ 
  roomName = 'tactical-ops-room',
  userName = 'User',
  userRole = 'USER'
}: StreamingDashboardProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  // Handle connection status changes
  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    setConnectionStatus(connected ? 'connected' : 'disconnected');
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Get connection status color
  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400 border-green-400';
      case 'connecting': return 'text-yellow-400 border-yellow-400';
      case 'error': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <LiveKitProvider
      roomName={roomName}
      userName={userName}
      userRole={userRole}
      onConnectionChange={handleConnectionChange}
    >
      <div className={`min-h-screen bg-[#0d1117] text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* Header */}
        <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Video className="w-6 h-6 text-blue-400" />
                  <h1 className="text-xl font-bold">TacticalOps Streaming</h1>
                </div>
                <Badge variant="outline" className={getConnectionStatusColor(connectionStatus)}>
                  <Activity className="w-3 h-3 mr-1" />
                  {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                </Badge>
                <Badge variant="secondary">
                  Room: {roomName}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreenToggle}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          {!isConnected ? (
            /* Connection Screen */
            <Card className="bg-gray-900 border-gray-700 max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Connect to Streaming Room</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="text-gray-400">
                  <Video className="w-12 h-12 mx-auto mb-4" />
                  <p>Ready to join the tactical communication room</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Room: <span className="text-white">{roomName}</span></p>
                  <p className="text-sm text-gray-400">User: <span className="text-white">{userName}</span></p>
                  <p className="text-sm text-gray-400">Role: <span className="text-white">{userRole}</span></p>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => setConnectionStatus('connecting')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Connect to Room
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Connected Dashboard */
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    <Users className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="destructive" size="sm">
                    <PhoneOff className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>

              {/* Main Streaming Interface */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                  <TabsTrigger value="video" className="flex items-center space-x-2">
                    <Video className="w-4 h-4" />
                    <span>Video</span>
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="flex items-center space-x-2">
                    <Mic className="w-4 h-4" />
                    <span>Audio</span>
                  </TabsTrigger>
                  <TabsTrigger value="screen" className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <span>Screen</span>
                  </TabsTrigger>
                  <TabsTrigger value="emergency" className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergency</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="video" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Video Grid */}
                    <div className="lg:col-span-2">
                      <Card className="bg-gray-900 border-gray-700">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Video className="w-5 h-5" />
                            <span>Video Streams</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <MultiStreamGrid maxStreams={9} showLocalStream={true} />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Video Controls */}
                    <div className="space-y-4">
                      <Card className="bg-gray-900 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-sm">Video Controls</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button className="w-full" variant="outline">
                            <Video className="w-4 h-4 mr-2" />
                            Toggle Camera
                          </Button>
                          <Button className="w-full" variant="outline">
                            <Settings className="w-4 h-4 mr-2" />
                            Video Settings
                          </Button>
                          <Button className="w-full" variant="outline">
                            <Maximize className="w-4 h-4 mr-2" />
                            Fullscreen
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-900 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-sm">Stream Quality</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Resolution:</span>
                              <span>1920x1080</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Frame Rate:</span>
                              <span>30 fps</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Bitrate:</span>
                              <span>2.5 Mbps</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Latency:</span>
                              <span className="text-green-400">Low (45ms)</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="audio" className="space-y-6">
                  <AudioController />
                </TabsContent>

                <TabsContent value="screen" className="space-y-6">
                  <ScreenShareComponent />
                </TabsContent>

                <TabsContent value="emergency" className="space-y-6">
                  <EmergencyCommSystem />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </LiveKitProvider>
  );
}

export default StreamingDashboard;