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
  Search,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { NoSSR } from "@/components/NoSSR";
import { useEffect, useState } from "react";

interface DashboardData {
  devices: {
    total: number;
    online: number;
    offline: number;
  };
  stats: {
    avgBattery: number;
    gpsAccuracy: string;
    networkStatus: string;
    alerts: number;
  };
}

export default function Dashboard() {
  const { logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    devices: { total: 0, online: 0, offline: 0 },
    stats: { avgBattery: 0, gpsAccuracy: "N/A", networkStatus: "Unknown", alerts: 0 }
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
                offline: result.data.devices.offline
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
        // Fallback to mock data
        setDashboardData({
          devices: { total: 0, online: 0, offline: 0 },
          stats: { avgBattery: 0, gpsAccuracy: "N/A", networkStatus: "Unknown", alerts: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up periodic refresh
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
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
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 shadow-lg animate-glow">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Android Agent AI
                    </h1>
                    <p className="text-sm text-blue-300/80">Enterprise Security Platform</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-base text-green-300">System Online</span>
                </div>
                
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 focus-ring h-10 w-10">
                  <Search className="h-5 w-5" />
                </Button>
                
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 focus-ring h-10 w-10">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 text-sm bg-red-500 text-white animate-pulse">
                    {dashboardData.stats.alerts}
                  </Badge>
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
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">Dashboard Overview</h1>
              <p className="text-blue-200/80 text-lg lg:text-xl">
                Monitor and manage your Android devices with AI-powered intelligence
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

          {/* AI Intelligence Status */}
          <Alert className="mb-10 border-blue-500/20 bg-blue-500/5 backdrop-blur-sm animate-slide-up p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <Zap className="h-6 w-6 text-blue-400 animate-pulse" />
            </div>
            <AlertDescription className="ml-13 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-blue-300 text-lg">AI Intelligence System Active</strong>
                  <p className="text-base text-blue-400/80 mt-2">
                    Advanced monitoring with behavioral analysis, predictive alerts, and smart automation enabled.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm text-green-400">AI Processing</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-medium text-white">Connected Devices</CardTitle>
              <div className="h-12 w-12 rounded-lg bg-green-500/20 p-3 group-hover:bg-green-500/30 transition-colors">
                <Users className="h-6 w-6 text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-4xl font-bold text-white mb-2">
                {isLoading ? "..." : `${dashboardData.devices.online}/${dashboardData.devices.total}`}
              </div>
              <p className="text-base text-green-400 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                {dashboardData.devices.offline} offline
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-medium text-white">GPS Tracking</CardTitle>
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 p-3 group-hover:bg-blue-500/30 transition-colors">
                <MapPin className="h-6 w-6 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-4xl font-bold text-white mb-2">Live</div>
              <p className="text-base text-blue-400 flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                ±5m accuracy
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-yellow-500/50 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-medium text-white">Avg Battery</CardTitle>
              <div className="h-12 w-12 rounded-lg bg-yellow-500/20 p-3 group-hover:bg-yellow-500/30 transition-colors">
                <Battery className="h-6 w-6 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-4xl font-bold text-white mb-2">
                {isLoading ? "..." : `${dashboardData.stats.avgBattery}%`}
              </div>
              <p className="text-base text-yellow-400 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                {dashboardData.devices.online} devices charging
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/50 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-medium text-white">Network Status</CardTitle>
              <div className="h-12 w-12 rounded-lg bg-purple-500/20 p-3 group-hover:bg-purple-500/30 transition-colors">
                <Wifi className="h-6 w-6 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-4xl font-bold text-white mb-2">4G/WiFi</div>
              <p className="text-base text-purple-400 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Strong signal
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-medium text-white">Active Alerts</CardTitle>
              <div className="h-12 w-12 rounded-lg bg-red-500/20 p-3 group-hover:bg-red-500/30 transition-colors">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-4xl font-bold text-white mb-2">
                {isLoading ? "..." : dashboardData.stats.alerts}
              </div>
              <p className="text-base text-red-400 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {dashboardData.stats.alerts > 0 ? "Active alerts" : "No alerts"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* LiveKit Streaming Panel */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 p-2">
                <Video className="h-6 w-6 text-white" />
              </div>
              Live Streaming & Communication
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ready</Badge>
            </CardTitle>
            <CardDescription className="text-blue-200/80">
              Real-time video, audio, and screen sharing with LiveKit WebRTC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0">
                <Video className="mr-2 h-4 w-4" />
                Video Call
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0">
                <Phone className="mr-2 h-4 w-4" />
                Audio Call
              </Button>
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0">
                <Monitor className="mr-2 h-4 w-4" />
                Screen Share
              </Button>
              <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Emergency Call
              </Button>
            </div>
            
            <Alert className="bg-green-500/10 border-green-500/20">
              <Shield className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                <div className="flex items-center justify-between">
                  <span>LiveKit WebRTC Ready - Camera, microphone, and screen sharing capabilities detected</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Interactive Map Placeholder */}
        <Card className="mb-8 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 p-2">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              Live Location Tracking
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Real-time</Badge>
            </CardTitle>
            <CardDescription className="text-blue-200/80">
              Real-time device location monitoring and tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
              <div className="text-center z-10">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-4 mx-auto mb-4 animate-pulse">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <p className="text-lg font-medium text-white">Interactive Map</p>
                <p className="text-sm text-blue-300">Real-time device tracking</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Status Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Connected Devices</h2>
            <Button variant="outline" className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Device Card 1 */}
            <Card className="group hover:scale-[1.02] transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <CardTitle className="text-lg text-white">Child&apos;s Phone</CardTitle>
                      <p className="text-sm text-slate-400">Samsung Galaxy A54</p>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-3">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-fit">Online</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-blue-300">Current Location</span>
                  </div>
                  <p className="text-sm text-white">Alexandria, Egypt</p>
                  <p className="text-xs text-slate-400 mt-1">31.2001°N, 29.9187°E</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
                    <MapPin className="h-3 w-3 mr-1" />
                    Locate
                  </Button>
                  <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10">
                    <Bell className="h-3 w-3 mr-1" />
                    Alert
                  </Button>
                  <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Device Card 2 */}
            <Card className="group hover:scale-[1.02] transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <CardTitle className="text-lg text-white">Work Tablet</CardTitle>
                      <p className="text-sm text-slate-400">iPad Pro 11&quot;</p>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-3">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-fit">Online</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-blue-300">Current Location</span>
                  </div>
                  <p className="text-sm text-white">Cairo, Egypt</p>
                  <p className="text-xs text-slate-400 mt-1">30.0444°N, 31.2357°E</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
                    <MapPin className="h-3 w-3 mr-1" />
                    Locate
                  </Button>
                  <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10">
                    <Bell className="h-3 w-3 mr-1" />
                    Alert
                  </Button>
                  <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Device Card 3 */}
            <Card className="group hover:scale-[1.02] transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div>
                      <CardTitle className="text-lg text-white">Backup Device</CardTitle>
                      <p className="text-sm text-slate-400">Samsung Galaxy S21</p>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-3">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 w-fit">Offline</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    <span className="text-sm font-medium text-red-300">Low Battery Alert</span>
                  </div>
                  <p className="text-sm text-white">Last seen: 2 hours ago</p>
                  <p className="text-xs text-slate-400 mt-1">Battery: 23%</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
                    <MapPin className="h-3 w-3 mr-1" />
                    Locate
                  </Button>
                  <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10">
                    <Bell className="h-3 w-3 mr-1" />
                    Alert
                  </Button>
                  <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
    </ProtectedRoute>
  );
}