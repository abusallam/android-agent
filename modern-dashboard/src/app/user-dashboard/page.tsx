"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Smartphone, 
  Activity, 
  AlertTriangle, 
  Shield,
  Settings,
  Bell,
  Phone,
  Video,
  Battery,
  Wifi,
  Signal,
  Clock,
  User
} from 'lucide-react';
import { LogoWithText } from '@/components/logo';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  assignedAdmin: {
    username: string;
    projectName: string;
  };
  personalMetrics: {
    tasksCompleted: number;
    hoursActive: number;
    lastActivity: string;
  };
}

interface DeviceStatus {
  isOnline: boolean;
  deviceName: string;
  model: string;
  batteryLevel: number;
  networkType: string;
  signalStrength: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  lastSync: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  isAvailable: boolean;
}

export default function UserDashboardPage() {
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);

  useEffect(() => {
    fetchUserData();
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const profileResponse = await fetch('/api/user/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData.data);
      }

      // Fetch device status
      const deviceResponse = await fetch('/api/user/device-status');
      if (deviceResponse.ok) {
        const deviceData = await deviceResponse.json();
        setDeviceStatus(deviceData.data);
      }

      // Fetch emergency contacts
      const contactsResponse = await fetch('/api/user/emergency-contacts');
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setEmergencyContacts(contactsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerEmergency = async () => {
    try {
      setEmergencyTriggered(true);
      const response = await fetch('/api/user/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'panic',
          message: 'Emergency assistance requested',
          location: deviceStatus?.location
        })
      });

      if (response.ok) {
        console.log('Emergency alert sent');
        // Keep emergency state for 10 seconds
        setTimeout(() => setEmergencyTriggered(false), 10000);
      }
    } catch (error) {
      console.error('Failed to trigger emergency:', error);
      setEmergencyTriggered(false);
    }
  };

  const updateLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const response = await fetch('/api/user/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            })
          });

          if (response.ok) {
            fetchUserData(); // Refresh data
          }
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      });
    }
  };

  if (user?.role !== 'USER') {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <Alert className="border-red-500/20 bg-red-500/10 max-w-md">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            Access denied. USER privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-6">
              <LogoWithText size="md" />
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-4 py-2 text-base">
                <User className="h-4 w-4 mr-2" />
                USER
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {userProfile && (
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-base text-blue-300">
                    Managed by: {userProfile.assignedAdmin.username}
                  </span>
                </div>
              )}
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-10 w-10">
                <Bell className="h-5 w-5" />
              </Button>
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-10 w-10">
                <Settings className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={logout}
                className="border-red-500/30 text-red-300 hover:bg-red-500/10 px-6 py-2 text-base"
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Personal Dashboard</h1>
            <p className="text-green-200/80 text-lg lg:text-xl">
              Your personal device status and emergency tools
            </p>
          </div>
        </div>

        {/* Emergency Button - Prominent */}
        <Card className={`mb-8 transition-all duration-300 ${
          emergencyTriggered 
            ? 'bg-red-500/20 border-red-500/50 animate-pulse' 
            : 'bg-red-500/10 border-red-500/20 hover:border-red-500/40'
        }`}>
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-4 text-2xl font-bold">
              <div className="h-16 w-16 rounded-xl bg-red-500/20 p-4">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              Emergency Assistance
              {emergencyTriggered && (
                <Badge className="bg-red-500/30 text-red-300 border-red-500/50 animate-pulse">
                  ALERT SENT
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-red-200/80 text-lg mt-3">
              {emergencyTriggered 
                ? 'Emergency alert has been sent to your administrator. Help is on the way.'
                : 'Press the button below if you need immediate assistance'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={triggerEmergency}
              disabled={emergencyTriggered}
              className={`w-full h-20 text-2xl font-bold transition-all duration-300 ${
                emergencyTriggered
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transform hover:scale-105 shadow-lg'
              }`}
            >
              <AlertTriangle className="mr-4 h-8 w-8" />
              {emergencyTriggered ? 'EMERGENCY ALERT SENT' : 'EMERGENCY'}
            </Button>
          </CardContent>
        </Card>

        {/* Personal Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-green-500/50 transition-all duration-300 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold text-white">Device Status</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-green-500/20 p-3">
                <Smartphone className="h-6 w-6 text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-white mb-2">
                {deviceStatus?.isOnline ? 'Online' : 'Offline'}
              </div>
              <p className="text-base text-green-400">{deviceStatus?.deviceName}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-yellow-500/50 transition-all duration-300 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold text-white">Battery Level</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-yellow-500/20 p-3">
                <Battery className="h-6 w-6 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-white mb-2">
                {deviceStatus?.batteryLevel || 0}%
              </div>
              <p className="text-base text-yellow-400">Battery remaining</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 transition-all duration-300 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold text-white">Network</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 p-3">
                <Wifi className="h-6 w-6 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-white mb-2">
                {deviceStatus?.networkType || 'N/A'}
              </div>
              <p className="text-base text-blue-400">
                Signal: {deviceStatus?.signalStrength || 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/50 transition-all duration-300 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold text-white">Last Sync</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 p-3">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg font-bold text-white mb-2">
                {deviceStatus?.lastSync || 'Never'}
              </div>
              <p className="text-base text-purple-400">Data synchronized</p>
            </CardContent>
          </Card>
        </div>

        {/* Location & Map */}
        <Card className="mb-8 bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-2xl font-bold flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-blue-400" />
                  Location Tracking
                </CardTitle>
                <CardDescription className="text-slate-300 text-lg mt-2">
                  Your current location and movement history
                </CardDescription>
              </div>
              <Button 
                onClick={updateLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Update Location
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {deviceStatus?.location ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Latitude</p>
                    <p className="text-white font-mono text-lg">
                      {deviceStatus.location.latitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Longitude</p>
                    <p className="text-white font-mono text-lg">
                      {deviceStatus.location.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Accuracy</p>
                    <p className="text-white font-mono text-lg">
                      ±{deviceStatus.location.accuracy}m
                    </p>
                  </div>
                </div>
                <div className="h-64 bg-slate-800 rounded-lg flex items-center justify-center">
                  <p className="text-slate-400">Interactive map will be displayed here</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Location not available</p>
                <p className="text-slate-500">Enable location services to see your position</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-2xl font-bold flex items-center gap-2">
              <Phone className="h-6 w-6 text-green-400" />
              Emergency Contacts
            </CardTitle>
            <CardDescription className="text-slate-300 text-lg mt-2">
              Your assigned administrators and emergency contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {emergencyContacts.map((contact) => (
                <Card key={contact.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Phone className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                          <p className="text-slate-400">{contact.role}</p>
                          <p className="text-blue-300 font-mono">{contact.phone}</p>
                        </div>
                      </div>
                      <Badge className={contact.isAvailable ? 
                        "bg-green-500/20 text-green-400 border-green-500/30" : 
                        "bg-red-500/20 text-red-400 border-red-500/30"
                      }>
                        {contact.isAvailable ? 'Available' : 'Busy'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Communication Panel */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-2xl font-bold flex items-center gap-2">
              <Video className="h-6 w-6 text-purple-400" />
              Communication
            </CardTitle>
            <CardDescription className="text-slate-300 text-lg mt-2">
              Receive calls and messages from your administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Shield className="h-5 w-5 text-blue-400" />
              <AlertDescription className="text-blue-300 text-base">
                Your administrator can initiate video or audio calls with you when needed. 
                You will receive notifications when calls are incoming.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}