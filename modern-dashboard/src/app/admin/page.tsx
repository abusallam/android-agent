"use client";

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { LogoWithText } from "@/components/logo";

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: 'ROOT_ADMIN' | 'ADMIN' | 'USER';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  createdBy?: string;
  deviceCount?: number;
}

interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'ADMIN' | 'USER';
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!createForm.username.trim()) {
      errors.username = 'Username is required';
    } else if (createForm.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!createForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = 'Invalid email format';
    }

    if (!createForm.password) {
      errors.password = 'Password is required';
    } else if (createForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (createForm.password !== createForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: createForm.username,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateDialog(false);
        setCreateForm({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'USER'
        });
        setFormErrors({});
        fetchUsers();
      } else {
        setFormErrors({ general: data.message || 'Failed to create user' });
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      setFormErrors({ general: 'Failed to create user' });
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ROOT_ADMIN':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Crown className="h-3 w-3 mr-1" />Root Admin</Badge>;
      case 'ADMIN':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'USER':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Users className="h-3 w-3 mr-1" />User</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle className="h-3 w-3 mr-1" />Active
      </Badge>
    ) : (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <XCircle className="h-3 w-3 mr-1" />Inactive
      </Badge>
    );
  };

  // Check if current user is ROOT_ADMIN
  const isRootAdmin = user?.role === 'ROOT_ADMIN';
  const canManageUsers = user?.role === 'ROOT_ADMIN' || user?.role === 'ADMIN';

  if (!canManageUsers) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">
                You don't have permission to access the admin panel. Only administrators can manage users.
              </p>
              <Button onClick={() => window.history.back()} className="w-full">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0d1117] text-white">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <header className="relative z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div className="flex items-center space-x-6">
                <LogoWithText size="md" />
                <div className="hidden sm:flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">Admin Panel</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                  {getRoleBadge(user?.role || 'USER')}
                  <span className="text-white">{user?.username}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                >
                  Dashboard
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={logout}
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10"
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
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">User Management</h1>
              <p className="text-blue-200/80 text-lg lg:text-xl">
                Manage administrators and users for the Android Agent system
              </p>
            </div>
            
            {isRootAdmin && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Add a new administrator or user to the system
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {formErrors.general && (
                      <Alert className="bg-red-500/10 border-red-500/20">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300">
                          {formErrors.general}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={createForm.username}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="Enter username"
                      />
                      {formErrors.username && (
                        <p className="text-red-400 text-sm mt-1">{formErrors.username}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="Enter email address"
                      />
                      {formErrors.email && (
                        <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={createForm.password}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                          className="bg-slate-800 border-slate-600 text-white pr-10"
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                      {formErrors.password && (
                        <p className="text-red-400 text-sm mt-1">{formErrors.password}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={createForm.confirmPassword}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="Confirm password"
                      />
                      {formErrors.confirmPassword && (
                        <p className="text-red-400 text-sm mt-1">{formErrors.confirmPassword}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={createForm.role} onValueChange={(value: 'ADMIN' | 'USER') => setCreateForm(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="USER" className="text-white">User - Basic access</SelectItem>
                          <SelectItem value="ADMIN" className="text-white">Admin - Full system access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
                        Create User
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <p className="text-xs text-slate-400">
                  {users.filter(u => u.isActive).length} active
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.role === 'ADMIN' || u.role === 'ROOT_ADMIN').length}
                </div>
                <p className="text-xs text-slate-400">
                  {users.filter(u => u.role === 'ROOT_ADMIN').length} root admin
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Regular Users</CardTitle>
                <Users className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.role === 'USER').length}
                </div>
                <p className="text-xs text-slate-400">
                  Standard access level
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Active Sessions</CardTitle>
                <Settings className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </div>
                <p className="text-xs text-slate-400">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">System Users</CardTitle>
              <CardDescription className="text-slate-400">
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white">Loading users...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <div className="text-white mb-2">No users found</div>
                  <div className="text-slate-400">Create your first user to get started</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">User</TableHead>
                      <TableHead className="text-slate-300">Role</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Last Login</TableHead>
                      <TableHead className="text-slate-300">Created</TableHead>
                      {isRootAdmin && <TableHead className="text-slate-300">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-slate-700">
                        <TableCell>
                          <div>
                            <div className="font-medium text-white">{user.username}</div>
                            {user.email && (
                              <div className="text-sm text-slate-400">{user.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.isActive)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        {isRootAdmin && (
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {user.role !== 'ROOT_ADMIN' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  >
                                    {user.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {user.role === 'ROOT_ADMIN' && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  Protected
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}