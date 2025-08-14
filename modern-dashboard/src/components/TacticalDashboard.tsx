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
  Video,
  Mic,
  Monitor,
  Settings,
  User,
  LogOut,
  Map,
  Zap,
  Globe
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardMetrics {
  connectedDevices: number;
  gpsTracking: number;
  avgBattery: number;
  networkStatus: string;
}

interface Alert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export default function TacticalDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    connectedDevices: 12,
    gpsTracking: 8,
    avgBattery: 78,
    networkStatus: 'Secure'
  });

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      message: 'Unit Alpha-7 entered restricted zone',
      severity: 'high',
      timestamp: '2 min ago'
    },
    {
      id: '2', 
      message: 'Communication check completed',
      severity: 'low',
      timestamp: '15 min ago'
    }
  ]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const texts = {
    en: {
      title: 'TacticalOps Command',
      systemOnline: 'System Online',
      connectedDevices: 'Connected Units',
      gpsTracking: 'GPS Tracking',
      avgBattery: 'Avg Battery',
      networkStatus: 'Network Status',
      liveStreaming: 'Live Streaming & Communication',
      ready: 'Ready',
      videoCall: 'Video Call',
      audioCall: 'Audio Call',
      screenShare: 'Screen Share',
      emergency: 'EMERGENCY',
      tacticalMap: 'Tactical Map',
      units: 'Units',
      tacticalMapInterface: 'Tactical Map Interface',
      realTimeUnits: 'Real-time unit positions and tactical overlays',
      activeUnits: 'Active Units',
      objectives: 'Objectives',
      threats: 'Threats',
      activeAlerts: 'Active Alerts',
      allClear: 'All Clear - No Active Alerts',
      systemStatus: 'System Status & API Endpoints',
      operational: 'Operational',
      apiHealth: 'API Health',
      systemStatusLabel: 'System Status',
      database: 'Database',
      healthy: 'Healthy',
      redisCache: 'Redis Cache',
      connected: 'Connected',
      livekit: 'LiveKit',
      sslCertificate: 'SSL Certificate',
      valid: 'Valid',
      quickActions: 'Quick Actions',
      adminPanel: 'Admin Panel',
      streamingCenter: 'Streaming Center',
      systemSettings: 'System Settings',
      viewLogs: 'View Logs',
      logout: 'Logout'
    },
    ar: {
      title: 'قيادة العمليات التكتيكية',
      systemOnline: 'النظام متصل',
      connectedDevices: 'الوحدات المتصلة',
      gpsTracking: 'تتبع GPS',
      avgBattery: 'متوسط البطارية',
      networkStatus: 'حالة الشبكة',
      liveStreaming: 'البث المباشر والاتصالات',
      ready: 'جاهز',
      videoCall: 'مكالمة فيديو',
      audioCall: 'مكالمة صوتية',
      screenShare: 'مشاركة الشاشة',
      emergency: 'طوارئ',
      tacticalMap: 'الخريطة التكتيكية',
      units: 'وحدات',
      tacticalMapInterface: 'واجهة الخريطة التكتيكية',
      realTimeUnits: 'مواقع الوحدات في الوقت الفعلي والطبقات التكتيكية',
      activeUnits: 'الوحدات النشطة',
      objectives: 'الأهداف',
      threats: 'التهديدات',
      activeAlerts: 'التنبيهات النشطة',
      allClear: 'الوضع آمن - لا توجد تنبيهات نشطة',
      systemStatus: 'حالة النظام ونقاط API',
      operational: 'تشغيلي',
      apiHealth: 'صحة API',
      systemStatusLabel: 'حالة النظام',
      database: 'قاعدة البيانات',
      healthy: 'سليم',
      redisCache: 'ذاكرة Redis',
      connected: 'متصل',
      livekit: 'LiveKit',
      sslCertificate: 'شهادة SSL',
      valid: 'صالح',
      quickActions: 'الإجراءات السريعة',
      adminPanel: 'لوحة الإدارة',
      streamingCenter: 'مركز البث',
      systemSettings: 'إعدادات النظام',
      viewLogs: 'عرض السجلات',
      logout: 'تسجيل الخروج'
    }
  };

  const t = texts[language];

  return (
    <div className="min-h-screen relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Tactical Camo Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-green-900/30 to-amber-800/20"></div>
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(85, 107, 47, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(160, 82, 45, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 60% 30%, rgba(107, 142, 35, 0.2) 0%, transparent 50%)
          `,
          backgroundSize: '400px 400px, 300px 300px, 500px 500px, 350px 350px'
        }}
      ></div>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-amber-600/30 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-amber-400" />
                <h1 className="text-2xl font-bold text-amber-400">{t.title}</h1>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">
                <Activity className="w-3 h-3 mr-1" />
                {t.systemOnline}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-600/10 border border-amber-600/30"
              >
                <Globe className="w-4 h-4 mr-2" />
                {language === 'en' ? 'العربية' : 'English'}
              </Button>
              
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-amber-200">{user?.username}</span>
                <Badge variant="secondary" className="text-xs bg-amber-600/20 text-amber-300 border-amber-600/50">
                  {user?.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-600/10 border border-amber-600/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t.logout}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Metrics */}
          <div className="lg:col-span-3 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-400">{t.connectedDevices}</p>
                      <p className="text-2xl font-bold text-amber-100">{metrics.connectedDevices}</p>
                    </div>
                    <Smartphone className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-400">{t.gpsTracking}</p>
                      <p className="text-2xl font-bold text-amber-100">{metrics.gpsTracking}</p>
                    </div>
                    <MapPin className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-400">{t.avgBattery}</p>
                      <p className="text-2xl font-bold text-amber-100">{metrics.avgBattery}%</p>
                    </div>
                    <Battery className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-400">{t.networkStatus}</p>
                      <p className="text-2xl font-bold text-amber-100">{metrics.networkStatus}</p>
                    </div>
                    <Wifi className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* LiveKit Streaming Panel */}
            <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-100">{t.liveStreaming}</span>
                  <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">
                    {t.ready}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-black font-semibold border border-amber-500/50">
                    <Video className="w-6 h-6" />
                    <span className="text-sm">{t.videoCall}</span>
                  </Button>
                  <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold border border-green-500/50">
                    <Mic className="w-6 h-6" />
                    <span className="text-sm">{t.audioCall}</span>
                  </Button>
                  <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold border border-blue-500/50">
                    <Monitor className="w-6 h-6" />
                    <span className="text-sm">{t.screenShare}</span>
                  </Button>
                  <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold border border-red-500/50 animate-pulse">
                    <AlertTriangle className="w-6 h-6" />
                    <span className="text-sm font-bold">{t.emergency}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Map */}
            <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Map className="w-5 h-5 text-green-400" />
                  <span className="text-amber-100">{t.tacticalMap}</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400 bg-black/50">
                    {metrics.connectedDevices} {t.units}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-black/60 rounded-lg flex items-center justify-center border border-amber-600/30 relative overflow-hidden">
                  {/* Tactical Grid Overlay */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div key={i} className="border border-amber-600/20"></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center text-amber-300 relative z-10">
                    <Map className="w-12 h-12 mx-auto mb-2 text-amber-400" />
                    <p className="text-sm font-semibold">{t.tacticalMapInterface}</p>
                    <p className="text-xs mt-1 text-amber-400/80">{t.realTimeUnits}</p>
                    <div className="mt-3 flex justify-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>{t.activeUnits}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>{t.objectives}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span>{t.threats}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Active Alerts */}
            <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="text-amber-100">{t.activeAlerts}</span>
                  <Badge variant="destructive" className="bg-red-600/80">{alerts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-black/60 rounded-lg border border-amber-600/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-100">{alert.message}</p>
                          <p className="text-xs text-amber-400/70 mt-1">{alert.timestamp}</p>
                        </div>
                        <Badge 
                          variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            alert.severity === 'high' ? 'bg-red-600/80' : 
                            alert.severity === 'medium' ? 'bg-amber-600/80' : 
                            'bg-gray-600/80'
                          }`}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-4 text-amber-400/70">
                      <Shield className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">{t.allClear}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Testing & API Endpoints */}
            <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-100">{t.systemStatus}</span>
                  <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">
                    {t.operational}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-amber-300">{t.apiHealth}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400/80 font-mono">/api/health</span>
                        <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">200</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400/80 font-mono">/api/sync</span>
                        <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">200</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400/80 font-mono">/api/device/sync</span>
                        <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">200</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400/80 font-mono">/api/livekit/token</span>
                        <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">200</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-amber-300">{t.systemStatusLabel}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400/80">{t.database}</span>
                        <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">{t.healthy}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400/80">{t.redisCache}</span>
                        <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">{t.connected}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400/80">{t.livekit}</span>
                        <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">{t.ready}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400/80">{t.sslCertificate}</span>
                        <Badge variant="outline" className="text-green-400 border-green-400 bg-black/50">{t.valid}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-amber-100">{t.quickActions}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left border-amber-600/50 hover:bg-amber-600/10 text-amber-200 hover:text-amber-100"
                    onClick={() => router.push('/admin')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t.adminPanel}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left border-amber-600/50 hover:bg-amber-600/10 text-amber-200 hover:text-amber-100"
                    onClick={() => router.push('/streaming')}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {t.streamingCenter}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left border-amber-600/50 hover:bg-amber-600/10 text-amber-200 hover:text-amber-100"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t.systemSettings}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left border-amber-600/50 hover:bg-amber-600/10 text-amber-200 hover:text-amber-100"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {t.viewLogs}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}