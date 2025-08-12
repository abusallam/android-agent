"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Smartphone, 
  Activity, 
  AlertTriangle, 
  Plus, 
  Video, 
  Phone,
  Monitor,
  MapPin,
  Shield,
  Eye,
  Settings,
  Bell,
  UserPlus
} from 'lucide-react';
import { LogoWithText } from '@/components/logo';

interface ProjectMetrics {
  totalAssignedUsers: number;
  activeUsers: number;
  onlineDevices: number;
  totalDevices: number;
  emergencyAlerts: number;
  projectName: string;
}

interface AssignedUser {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  lastSeen: string;
  deviceStatus: {
    isOnline: boolean;
    deviceName: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  permissions: {
    canReceiveCalls: boolean;
    canShareLocation: boolean;
    canTriggerEmergency: boolean;
  };
}

interface EmergencyAlert {
  id: string;
  userId: string;
  username: string;
  type: string;
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export default function ProjectAdminPage() {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalAssignedUsers: 0,
    activeUsers: 0,
    onlineDevices: 0,
    totalDevices: 0,
    emergencyAlerts: 0,
    projectName: ''
  });
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    fetchProjectData();
    const interval = setInterval(fetchProjectData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProjectData = async () => {
    try {
      // Fetch project metrics
      const metricsResponse = await fetch('/api/project-admin/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data);
      }

      // Fetch assigned users
      const usersResponse = await fetch('/api/project-admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setAssignedUsers(usersData.data);
      }

      // Fetch emergency alerts
      const alertsResponse = await fetch('/api/project-admin/emergency-alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setEmergencyAlerts(alertsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch('/api/project-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewUser({ username: '', email: '', password: '' });
        fetchProjectData();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const initiateVideoCall = async (userId: string) => {
    try {
      const response = await fetch('/api/project-admin/initiate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'video' })
      });
      
      if (response.ok) {
        console.log('Video call initiated');
      }
    } catch (error) {
      console.error('Failed to initiate video call:', error);
    }
  };

  const initiateAudioCall = async (userId: string) => {
    try {
      const response = await fetch('/api/project-admin/initiate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'audio' })
      });
      
      if (response.ok) {
        console.log('Audio call initiated');
      }
    } catch (error) {
      console.error('Failed to initiate audio call:', error);
    }
  };

  const accessCamera = async (userId: string) => {
    try {
      const response = await fetch('/api/project-admin/access-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        console.log('Camera access requested');
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/project-admin/emergency-alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' })
      });
      
      if (response.ok) {
        fetchProjectData();
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  if (user?.role !== 'PROJECT_ADMIN') {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <Alert className="border-red-500/20 bg-red-500/10 max-w-md">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            Access denied. PROJECT_ADMIN privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-6">
              <LogoWithText size="md" />
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-2 text-base">
                <Shield className="h-4 w-4 mr-2" />
                PROJECT ADMIN
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-base text-green-300">Project: {metrics.projectName}</span>
              </div>
              
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 h-10 w-10">
                <Bell className="h-5 w-5" />
                {emergencyAlerts.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 text-sm bg-red-500 text-white animate-pulse">
                    {emergencyAlerts.length}
                  </Badge>
                )}
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
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Project Management</h1>
            <p className="text-blue-200/80 text-lg lg:text-xl">
              Monitor and manage your assigned users and their devices
            </p>
          </div>
        </div>

        {/* Emergency Alerts */}
        {emergencyAlerts.length > 0 && (
          <Card className="mb-8 bg-red-500/10 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Emergency Alerts ({emergencyAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emergencyAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">{alert.username}</p>
                      <p className="text-red-300">{alert.message}</p>
                      <p className="text-sm text-gray-400">{alert.timestamp}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        alert.status === 'active' ? 'bg-red-500/20 text-red-400' :
                        alert.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }>
                        {alert.status}
                      </Badge>
                      {alert.status === 'active' && (
                        <Button 
                          size="sm" 
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 transition-all duration-300 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold text-white">Assigned Users</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 p-3">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-white mb-2">{metrics.totalAssignedUsers}</div>
              <p className="text-base text-blue-400">{metrics.activeUsers} active</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-green-500/50 transition-all duration-300 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold text-white">Online Devices</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-green-500/20 p-3">
                <Smartphone className="h-6 w-6 text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-white mb-2">
                {metrics.onlineDevices}/{metrics.totalDevices}
              </div>
              <p className="text-base text-green-400">Devices monitored</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/50 transition-all duration-300 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold text-white">System Activity</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 p-3">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-white mb-2">Live</div>
              <p className="text-base text-purple-400">Real-time monitoring</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-red-500/50 transition-all duration-300 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold text-white">Emergency Alerts</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-red-500/20 p-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-white mb-2">{metrics.emergencyAlerts}</div>
              <p className="text-base text-red-400">Active alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-2xl font-bold">Assigned Users</CardTitle>
                <CardDescription className="text-slate-300 text-lg mt-2">
                  Monitor and manage users assigned to your project
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 h-12 px-6 text-base font-semibold"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCreateForm && (
              <Card className="mb-6 bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Create New User</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createUser} className="bg-green-600 hover:bg-green-700">
                      Create User
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                      className="border-gray-500 text-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedUsers.map((user) => (
                <Card key={user.id} className="bg-white/5 border-white/10 hover:border-blue-500/30 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{user.username}</CardTitle>
                        <CardDescription className="text-slate-400">{user.email}</CardDescription>
                      </div>
                      <Badge className={user.isActive ? 
                        "bg-green-500/20 text-green-400 border-green-500/30" : 
                        "bg-red-500/20 text-red-400 border-red-500/30"
                      }>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-400">Device Status</p>
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${user.deviceStatus.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <p className="text-white font-medium">
                            {user.deviceStatus.isOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                        <p className="text-sm text-slate-400">{user.deviceStatus.deviceName}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-400">Last Seen</p>
                        <p className="text-white font-medium">{user.lastSeen}</p>
                      </div>

                      {user.deviceStatus.location && (
                        <div>
                          <p className="text-sm text-slate-400">Location</p>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-blue-400" />
                            <p className="text-white font-medium text-sm">
                              {user.deviceStatus.location.latitude.toFixed(4)}, {user.deviceStatus.location.longitude.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button 
                          size="sm"
                          onClick={() => initiateVideoCall(user.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          disabled={!user.deviceStatus.isOnline}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Video
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => initiateAudioCall(user.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={!user.deviceStatus.isOnline}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Audio
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => accessCamera(user.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={!user.deviceStatus.isOnline}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Camera
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          disabled={!user.deviceStatus.isOnline}
                        >
                          <Monitor className="h-4 w-4 mr-1" />
                          Screen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}