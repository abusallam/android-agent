"use client";

import {
  Users,
  MapPin,
  Shield,
  Battery,
  AlertTriangle,
  Activity,
  Smartphone,
  Wifi,
  TrendingUp,
  Zap,
  Globe,
  Eye,
  Video,
  Phone,
  Monitor,
  Upload,
  Bell,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { LogoWithText } from "@/components/logo";
import { InteractiveMap } from "@/components/interactive-map";
import { EmergencyButton } from "@/components/emergency-button";
import { useLiveKit } from "@/components/streaming/LiveKitProvider";
import { useEffect, useState } from "react";

interface DeviceData {
  id: string;
  deviceId: string;
  name: string;
  model: string;
  manufacturer: string;
  isOnline: boolean;
  lastSeen: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  stats: {
    calls: number;
    sms: number;
    apps: number;
  };
}

interface DashboardData {
  devices: {
    total: number;
    online: number;
    offline: number;
    list: DeviceData[];
  };
  stats: {
    avgBattery: number;
    gpsAccuracy: string;
    networkStatus: string;
    alerts: number;
  };
}

export default function DashboardContent() {
  const { logout } = useAuth();
  const { startVideoCall, startAudioCall, startScreenShare, startEmergencyCall, isConnecting, error } = useLiveKit();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    devices: { total: 0, online: 0, offline: 0, list: [] },
    stats: { avgBattery: 85, gpsAccuracy: "±5m", networkStatus: "4G/WiFi", alerts: 2 }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch real dashboard data
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setDashboardData({
              devices: {
                total: result.data.devices.total,
                online: result.data.devices.online,
                offline: result.data.devices.offline,
                list: result.data.devices.list || []
              },
              stats: {
                avgBattery: result.data.stats.avgBattery,
                gpsAccuracy: result.data.stats.gpsAccuracy,
                networkStatus: result.data.stats.networkStatus,
                alerts: result.data.stats.alerts
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up periodic refresh
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-6">
              <LogoWithText size="md" />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-base text-green-300">System Online</span>
              </div>
              
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 focus-ring h-10 w-10">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 text-sm bg-red-500 text-white animate-pulse">
                  {dashboardData.stats.alerts}
                </Badge>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin'}
                className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 focus-ring px-4 py-2 text-base"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 focus-ring h-10 w-10">
                <Settings className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={logout}
                className="border-red-500/30 text-red-300 hover:bg-red-500/10 focus-ring px-6 py-2 text-base"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 animate-fade-in">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Security Dashboard</h1>
            <p className="text-blue-200/80 text-lg lg:text-xl">
              Real-time device monitoring and threat detection
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 text-base">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              System Online
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-2 text-base">
              <Zap className="h-4 w-4 mr-2" />
              AI Active
            </Badge>
          </div>
        </div>

        {/* Emergency Button - Only for Users */}
        <EmergencyButton userRole="user" />

        {/* LiveKit Streaming Panel - Enhanced with Larger Text */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 p-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-4 text-white text-2xl font-bold">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 p-3">
                <Video className="h-8 w-8 text-white" />
              </div>
              Live Streaming & Communication
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-base px-4 py-2">Ready</Badge>
            </CardTitle>
            <CardDescription className="text-blue-200/80 text-lg mt-3">
              Real-time video, audio, and screen sharing with LiveKit WebRTC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 h-14 text-base font-semibold"
                disabled={isConnecting}
                onClick={() => startVideoCall('demo-device-1')}
              >
                <Video className="mr-3 h-5 w-5" />
                {isConnecting ? 'Connecting...' : 'Video Call'}
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 h-14 text-base font-semibold"
                disabled={isConnecting}
                onClick={() => startAudioCall('demo-device-1')}
              >
                <Phone className="mr-3 h-5 w-5" />
                {isConnecting ? 'Connecting...' : 'Audio Call'}
              </Button>
              <Button 
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 h-14 text-base font-semibold"
                disabled={isConnecting}
                onClick={() => startScreenShare('demo-device-1')}
              >
                <Monitor className="mr-3 h-5 w-5" />
                {isConnecting ? 'Connecting...' : 'Screen Share'}
              </Button>
              <Button 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 h-16 text-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
                disabled={isConnecting}
                onClick={() => startEmergencyCall('demo-device-1')}
              >
                <AlertTriangle className="mr-3 h-6 w-6" />
                {isConnecting ? 'Connecting...' : 'EMERGENCY'}
              </Button>
            </div>

            {error && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <AlertDescription className="text-red-300 text-base">
                  <strong>Streaming Error:</strong> {error}
                </AlertDescription>
              </Alert>
            )}
            
            <Alert className="bg-green-500/10 border-green-500/20">
              <Shield className="h-5 w-5 text-green-400" />
              <AlertDescription className="text-green-300 text-base">
                <div className="flex items-center justify-between">
                  <span>LiveKit WebRTC Ready - Camera, microphone, and screen sharing capabilities detected</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-base px-3 py-1">Online</Badge>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Interactive Map */}
        <InteractiveMap />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 p-8 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <CardTitle className="text-xl font-semibold text-white">Connected Devices</CardTitle>
              <div className="h-16 w-16 rounded-xl bg-green-500/20 p-4 group-hover:bg-green-500/30 transition-colors">
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-5xl font-bold text-white mb-3">
                {isLoading ? "..." : `${dashboardData.devices.online}/${dashboardData.devices.total}`}
              </div>
              <p className="text-lg text-green-400 flex items-center">
                <TrendingUp className="h-5 w-5 mr-3" />
                {dashboardData.devices.offline} offline
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 p-8 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <CardTitle className="text-xl font-semibold text-white">GPS Tracking</CardTitle>
              <div className="h-16 w-16 rounded-xl bg-blue-500/20 p-4 group-hover:bg-blue-500/30 transition-colors">
                <MapPin className="h-8 w-8 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-5xl font-bold text-white mb-3">Live</div>
              <p className="text-lg text-blue-400 flex items-center">
                <Globe className="h-5 w-5 mr-3" />
                ±5m accuracy
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-yellow-500/50 p-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <CardTitle className="text-xl font-semibold text-white">Avg Battery</CardTitle>
              <div className="h-16 w-16 rounded-xl bg-yellow-500/20 p-4 group-hover:bg-yellow-500/30 transition-colors">
                <Battery className="h-8 w-8 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-5xl font-bold text-white mb-3">
                {isLoading ? "..." : `${dashboardData.stats.avgBattery}%`}
              </div>
              <p className="text-lg text-yellow-400 flex items-center">
                <Zap className="h-5 w-5 mr-3" />
                {dashboardData.devices.online} devices charging
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/50 p-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <CardTitle className="text-xl font-semibold text-white">Network Status</CardTitle>
              <div className="h-16 w-16 rounded-xl bg-purple-500/20 p-4 group-hover:bg-purple-500/30 transition-colors">
                <Wifi className="h-8 w-8 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-white">WiFi</span>
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-2 bg-green-400 rounded-sm"></div>
                  <div className="h-4 w-2 bg-green-400 rounded-sm"></div>
                  <div className="h-5 w-2 bg-green-400 rounded-sm"></div>
                  <div className="h-6 w-2 bg-green-400 rounded-sm"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-white">4G</span>
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-2 bg-blue-400 rounded-sm"></div>
                  <div className="h-4 w-2 bg-blue-400 rounded-sm"></div>
                  <div className="h-5 w-2 bg-gray-600 rounded-sm"></div>
                  <div className="h-6 w-2 bg-gray-600 rounded-sm"></div>
                </div>
              </div>
              <p className="text-base text-purple-400 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Primary: WiFi
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 p-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <CardTitle className="text-xl font-semibold text-white">Active Alerts</CardTitle>
              <div className="h-16 w-16 rounded-xl bg-red-500/20 p-4 group-hover:bg-red-500/30 transition-colors">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-5xl font-bold text-white mb-3">
                {isLoading ? "..." : dashboardData.stats.alerts}
              </div>
              <p className="text-lg text-red-400 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-3" />
                {dashboardData.stats.alerts > 0 ? "Active alerts" : "No alerts"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Testing Panel */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              System Testing & API Endpoints
            </CardTitle>
            <CardDescription className="text-slate-300">
              Test API functionality and system health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <Button variant="outline" asChild className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10">
                <a href="/api/health" target="_blank">
                  <Activity className="h-4 w-4 mr-2" />
                  Health Check
                </a>
              </Button>
              <Button variant="outline" asChild className="border-green-500/30 text-green-300 hover:bg-green-500/10">
                <a href="/api/sync" target="_blank">
                  <Upload className="h-4 w-4 mr-2" />
                  Sync API
                </a>
              </Button>
              <Button variant="outline" asChild className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                <a href="/api/device/sync" target="_blank">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Device API
                </a>
              </Button>
              <Button variant="outline" asChild className="border-red-500/30 text-red-300 hover:bg-red-500/10">
                <a href="/api/emergency/alert" target="_blank">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency
                </a>
              </Button>
              <Button variant="outline" asChild className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10">
                <a href="/api/livekit/token" target="_blank">
                  <Video className="h-4 w-4 mr-2" />
                  LiveKit Token
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}