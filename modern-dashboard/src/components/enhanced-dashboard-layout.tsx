"use client";

import React from 'react';
import { 
  Users, 
  MapPin, 
  Shield, 
  Battery, 
  AlertTriangle, 
  Clock, 
  Activity,
  Smartphone,
  Settings,
  Bell,
  Search,
  Menu,
  Home,
  BarChart3,
  FileText,
  Video,
  Zap,
  Globe,
  ChevronDown,
  Wifi,
  Signal
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/", active: true },
  { icon: Users, label: "Devices", href: "/devices", count: 3 },
  { icon: MapPin, label: "Location", href: "/location" },
  { icon: Video, label: "Streaming", href: "/streaming", badge: "Live" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: AlertTriangle, label: "Alerts", href: "/alerts", count: 0 },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function EnhancedDashboardLayout({ children }: EnhancedDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-1.5">
                  <Image
                    src="/logo.png"
                    alt="Android Agent AI"
                    width={20}
                    height={20}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Agent AI</h2>
                <p className="text-xs text-blue-300/60">Enterprise</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  item.active 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-4 w-4 ${item.active ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <Badge className={`text-xs ${item.count > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                    {item.count}
                  </Badge>
                )}
                {item.badge && (
                  <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                    {item.badge}
                  </Badge>
                )}
              </a>
            ))}
          </nav>

          {/* System Status */}
          <div className="p-4 border-t border-white/10">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-green-400">System Status</span>
              </div>
              <div className="space-y-1 text-xs text-green-300/80">
                <div className="flex justify-between">
                  <span>Devices Online</span>
                  <span>3/10</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Processing</span>
                  <span>Active</span>
                </div>
                <div className="flex justify-between">
                  <span>LiveKit</span>
                  <span>Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <span className="text-white font-medium">Dashboard</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-400">Overview</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* System Health Indicator */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="flex items-center space-x-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  <Wifi className="h-3 w-3 text-green-400" />
                  <Signal className="h-3 w-3 text-green-400" />
                </div>
                <span className="text-xs text-green-300 font-medium">All Systems Online</span>
              </div>
              
              {/* Quick Actions */}
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Search className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center">
                  3
                </Badge>
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-white/10">
                    <Avatar className="h-7 w-7 border border-blue-500/50">
                      <AvatarImage src="/logo.png" alt="Admin" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-medium">Administrator</p>
                      <p className="text-xs text-slate-400">admin@agent.ai</p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900/95 border-slate-700" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-white">Administrator</p>
                      <p className="text-xs text-slate-400">admin@androidagent.ai</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem className="text-slate-300 hover:bg-slate-800">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 hover:bg-slate-800">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem className="text-red-400 hover:bg-red-900/20">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}