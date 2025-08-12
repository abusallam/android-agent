"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { LogoWithText } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Building2, 
  Server, 
  Activity, 
  Plus, 
  Trash2, 
  Shield, 
  Database,
  Cpu,
  HardDrive,
  Network,
  Bell,
  Settings
} from "lucide-react";

interface SystemMetrics {
  totalProjectAdmins: number;
  totalUsers: number;
  totalProjects: number;
  totalDevices: number;
  onlineDevices: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  resourceUsage: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

interface ProjectAdmin {
  id: string;
  username: string;
  email: string;
  projectName: string;
  userCount: number;
  isActive: boolean;
  lastLogin?: string;
}

export default function RootAdminDashboard() {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalProjectAdmins: 0,
    totalUsers: 0,
    totalProjects: 0,
    totalDevices: 0,
    onlineDevices: 0,
    systemHealth: 'healthy',
    resourceUsage: { cpu: 0, memory: 0, storage: 0 }
  });
  const [projectAdmins, setProjectAdmins] = useState<ProjectAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      // Fetch system metrics
      const metricsResponse = await fetch('/api/root-admin/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Fetch project admins
      const adminsResponse = await fetch('/api/root-admin/project-admins');
      if (adminsResponse.ok) {
        const adminsData = await adminsResponse.json();
        setProjectAdmins(adminsData);
      }
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProjectAdmin = () => {
    // TODO: Open create project admin modal
    console.log('Create project admin');
  };

  const handleDeleteProjectAdmin = (adminId: string) => {
    // TODO: Implement delete with confirmation
    console.log('Delete project admin:', adminId);
  };

  if (user?.role !== 'ROOT_ADMIN') {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <Alert className="bg-red-500/10 border-red-500/20 max-w-md">
          <Shield className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-red-300">
            Access denied. ROOT_ADMIN privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0d1117] text-white">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <header className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div className="flex items-center space-x-6">
                <LogoWithText size="md" />
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-2 text-base">
                  <Shield className="h-4 w-4 mr-2" />
                  ROOT ADMIN
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-base text-green-300">System Online</span>
                </div>
                
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
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">System Administration</h1>
              <p className="text-purple-200/80 text-lg lg:text-xl">
                Manage project administrators and monitor system-wide metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={`px-4 py-2 text-base ${
                metrics.systemHealth === 'healthy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                metrics.systemHealth === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                <Activity className="h-4 w-4 mr-2" />
                System {metrics.systemHealth}
              </Badge>
            </div>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/50 transition-all duration-300 p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold text-white">Project Admins</CardTitle>
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 p-3">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-white mb-2">{metrics.totalProjectAdmins}</div>
                <p className="text-base text-purple-400">Active administrators</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 transition-all duration-300 p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold text-white">Total Users</CardTitle>
                <div className="h-12 w-12 rounded-xl bg-blue-500/20 p-3">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-white mb-2">{metrics.totalUsers}</div>
                <p className="text-base text-blue-400">System-wide users</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-green-500/50 transition-all duration-300 p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold text-white">Projects</CardTitle>
                <div className="h-12 w-12 rounded-xl bg-green-500/20 p-3">
                  <Building2 className="h-6 w-6 text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-white mb-2">{metrics.totalProjects}</div>
                <p className="text-base text-green-400">Active projects</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-yellow-500/50 transition-all duration-300 p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold text-white">Devices</CardTitle>
                <div className="h-12 w-12 rounded-xl bg-yellow-500/20 p-3">
                  <Server className="h-6 w-6 text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-white mb-2">
                  {metrics.onlineDevices}/{metrics.totalDevices}
                </div>
                <p className="text-base text-yellow-400">Online devices</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-cyan-500/50 transition-all duration-300 p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold text-white">System Load</CardTitle>
                <div className="h-12 w-12 rounded-xl bg-cyan-500/20 p-3">
                  <Activity className="h-6 w-6 text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-white mb-2">{metrics.resourceUsage.cpu}%</div>
                <p className="text-base text-cyan-400">CPU usage</p>
              </CardContent>
            </Card>
          </div>

          {/* Project Admins Management */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-2xl font-bold">Project Administrators</CardTitle>
                  <CardDescription className="text-slate-300 text-lg mt-2">
                    Manage project administrators and their assigned users
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleCreateProjectAdmin}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 h-12 px-6 text-base font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Project Admin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading project administrators...</p>
                </div>
              ) : projectAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No project administrators found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectAdmins.map((admin) => (
                    <Card key={admin.id} className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white text-lg">{admin.username}</CardTitle>
                            <CardDescription className="text-slate-400">{admin.email}</CardDescription>
                          </div>
                          <Badge className={admin.isActive ? 
                            "bg-green-500/20 text-green-400 border-green-500/30" : 
                            "bg-red-500/20 text-red-400 border-red-500/30"
                          }>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-slate-400">Project</p>
                            <p className="text-white font-medium">{admin.projectName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Assigned Users</p>
                            <p className="text-white font-medium">{admin.userCount} users</p>
                          </div>
                          {admin.lastLogin && (
                            <div>
                              <p className="text-sm text-slate-400">Last Login</p>
                              <p className="text-white font-medium">{admin.lastLogin}</p>
                            </div>
                          )}
                          <div className="flex space-x-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-red-500/30 text-red-300 hover:bg-red-500/10 flex-1"
                              onClick={() => handleDeleteProjectAdmin(admin.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Resources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Cpu className="h-5 w-5 mr-2 text-blue-400" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">{metrics.resourceUsage.cpu}%</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${metrics.resourceUsage.cpu}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Database className="h-5 w-5 mr-2 text-green-400" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">{metrics.resourceUsage.memory}%</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${metrics.resourceUsage.memory}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <HardDrive className="h-5 w-5 mr-2 text-yellow-400" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">{metrics.resourceUsage.storage}%</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${metrics.resourceUsage.storage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}