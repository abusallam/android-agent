"use client";

import React from 'react';
import { 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Navigation,
  Zap,
  Shield,
  AlertTriangle,
  Users,
  Globe,
  Satellite
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Device {
  id: string;
  name: string;
  isOnline: boolean;
  position: { x: number; y: number };
  battery: number;
  alerts: number;
}

interface InteractiveMapProps {
  devices?: Device[];
  className?: string;
}

export function InteractiveMap({ devices = [], className }: InteractiveMapProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [mapStyle, setMapStyle] = React.useState<'street' | 'satellite' | 'hybrid'>('street');

  // Mock devices if none provided
  const mockDevices: Device[] = devices.length > 0 ? devices : [
    { id: '1', name: "Child's Phone", isOnline: true, position: { x: 45, y: 35 }, battery: 85, alerts: 0 },
    { id: '2', name: "Work Tablet", isOnline: true, position: { x: 65, y: 55 }, battery: 92, alerts: 0 },
    { id: '3', name: "Backup Device", isOnline: false, position: { x: 25, y: 70 }, battery: 23, alerts: 1 },
  ];

  const getMapBackground = () => {
    switch (mapStyle) {
      case 'satellite':
        return 'bg-gradient-to-br from-green-900/20 via-blue-900/20 to-brown-900/20';
      case 'hybrid':
        return 'bg-gradient-to-br from-slate-800/20 via-blue-800/20 to-green-800/20';
      default:
        return 'bg-gradient-to-br from-blue-500/10 to-purple-500/10';
    }
  };

  return (
    <Card className={`group hover:border-blue-500/30 transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 p-2">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Live Location Tracking</CardTitle>
              <p className="text-sm text-blue-200/80">Real-time device monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse mr-1" />
              Live
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {mockDevices.filter(d => d.isOnline).length}/{mockDevices.length} Online
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Map Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={mapStyle === 'street' ? 'default' : 'outline'}
              className={mapStyle === 'street' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
              onClick={() => setMapStyle('street')}
            >
              <Layers className="h-3 w-3 mr-1" />
              Street
            </Button>
            <Button
              size="sm"
              variant={mapStyle === 'satellite' ? 'default' : 'outline'}
              className={mapStyle === 'satellite' ? 'bg-green-600 hover:bg-green-700' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
              onClick={() => setMapStyle('satellite')}
            >
              <Satellite className="h-3 w-3 mr-1" />
              Satellite
            </Button>
            <Button
              size="sm"
              variant={mapStyle === 'hybrid' ? 'default' : 'outline'}
              className={mapStyle === 'hybrid' ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
              onClick={() => setMapStyle('hybrid')}
            >
              <Globe className="h-3 w-3 mr-1" />
              Hybrid
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Center
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Interactive Map */}
        <div className={`relative ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-80'} ${getMapBackground()} rounded-xl border border-blue-500/20 overflow-hidden`}>
          {/* Map Grid Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>

          {/* Device Markers */}
          {mockDevices.map((device) => (
            <div
              key={device.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{
                left: `${device.position.x}%`,
                top: `${device.position.y}%`,
              }}
            >
              {/* Device Marker */}
              <div className={`relative ${device.isOnline ? 'animate-pulse' : ''}`}>
                {/* Pulse Ring for Online Devices */}
                {device.isOnline && (
                  <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping scale-150"></div>
                )}
                
                {/* Main Marker */}
                <div className={`w-8 h-8 rounded-full border-2 ${
                  device.isOnline 
                    ? 'bg-green-500 border-green-300 shadow-lg shadow-green-500/50' 
                    : 'bg-red-500 border-red-300 shadow-lg shadow-red-500/50'
                } flex items-center justify-center transition-all duration-300 hover:scale-125`}>
                  {device.alerts > 0 ? (
                    <AlertTriangle className="h-3 w-3 text-white" />
                  ) : (
                    <Shield className="h-3 w-3 text-white" />
                  )}
                </div>

                {/* Device Info Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-black/90 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap border border-white/20">
                    <div className="font-medium">{device.name}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={device.isOnline ? 'text-green-400' : 'text-red-400'}>
                        {device.isOnline ? 'Online' : 'Offline'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-yellow-400">{device.battery}%</span>
                      {device.alerts > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-red-400">{device.alerts} Alert{device.alerts > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Map Center Indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-1 h-1 bg-white/50 rounded-full"></div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-1">
            <Button size="sm" variant="outline" className="w-8 h-8 p-0 bg-black/50 border-white/20 text-white hover:bg-black/70">
              +
            </Button>
            <Button size="sm" variant="outline" className="w-8 h-8 p-0 bg-black/50 border-white/20 text-white hover:bg-black/70">
              −
            </Button>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="text-xs text-white font-medium mb-2">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-green-400">Online Device</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-red-400">Offline Device</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400">Has Alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Online</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">
              {mockDevices.filter(d => d.isOnline).length}
            </p>
          </div>
          
          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Alerts</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">
              {mockDevices.reduce((sum, d) => sum + d.alerts, 0)}
            </p>
          </div>
          
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Accuracy</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">±5m</p>
          </div>
          
          <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Updates</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">Live</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}