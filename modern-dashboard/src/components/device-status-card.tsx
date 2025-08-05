"use client";

import React from 'react';
import { 
  Shield, 
  Battery, 
  MapPin, 
  Wifi, 
  Smartphone,
  AlertTriangle,
  Clock,
  Signal,
  Zap,
  Eye,
  Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DeviceStatusCardProps {
  device: {
    id: string;
    name: string;
    model: string;
    isOnline: boolean;
    battery: number;
    isCharging: boolean;
    location: {
      city: string;
      coordinates: string;
      accuracy: string;
    };
    network: {
      type: string;
      strength: number;
      ssid?: string;
    };
    lastSeen: string;
    alerts: number;
  };
  onLocate?: () => void;
  onAlert?: () => void;
  onView?: () => void;
}

export function DeviceStatusCard({ device, onLocate, onAlert, onView }: DeviceStatusCardProps) {
  const getSignalBars = (strength: number) => {
    const bars = [];
    for (let i = 1; i <= 5; i++) {
      bars.push(
        <div
          key={i}
          className={`w-1 rounded-full ${
            i <= Math.ceil(strength / 20) 
              ? 'bg-green-500' 
              : 'bg-slate-600'
          }`}
          style={{ height: `${8 + i * 2}px` }}
        />
      );
    }
    return bars;
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-400';
    if (level > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBatteryBgColor = (level: number) => {
    if (level > 60) return 'bg-green-500/20';
    if (level > 30) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  return (
    <Card className="group hover:scale-[1.02] transition-all duration-300 bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${device.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <div>
              <CardTitle className="text-lg text-white group-hover:text-blue-300 transition-colors">
                {device.name}
              </CardTitle>
              <p className="text-sm text-slate-400">{device.model}</p>
            </div>
          </div>
          <div className={`h-12 w-12 rounded-xl p-3 ${device.isOnline ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center justify-between mt-2">
          <Badge className={`${device.isOnline ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            {device.isOnline ? 'Online' : 'Offline'}
          </Badge>
          {device.alerts > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {device.alerts} Alert{device.alerts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Battery Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`h-8 w-8 rounded-lg p-2 ${getBatteryBgColor(device.battery)}`}>
                <Battery className={`h-4 w-4 ${getBatteryColor(device.battery)}`} />
              </div>
              <span className="text-sm text-white font-medium">Battery</span>
              {device.isCharging && (
                <Zap className="h-3 w-3 text-yellow-400 animate-pulse" />
              )}
            </div>
            <span className={`text-sm font-medium ${getBatteryColor(device.battery)}`}>
              {device.battery}%
            </span>
          </div>
          <Progress 
            value={device.battery} 
            className="h-2 bg-slate-700"
          />
        </div>

        {/* Network Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 p-2">
              <Wifi className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{device.network.type}</p>
              {device.network.ssid && (
                <p className="text-xs text-slate-400">{device.network.ssid}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {getSignalBars(device.network.strength)}
          </div>
        </div>

        {/* Location */}
        <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-300">Current Location</span>
          </div>
          <p className="text-sm text-white">{device.location.city}</p>
          <p className="text-xs text-slate-400 mt-1">{device.location.coordinates}</p>
          <p className="text-xs text-blue-300 mt-1">±{device.location.accuracy} accuracy</p>
        </div>

        {/* Last Seen */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          <span>Last seen {device.lastSeen}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
            onClick={onLocate}
          >
            <MapPin className="h-3 w-3 mr-1" />
            Locate
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
            onClick={onAlert}
          >
            <Bell className="h-3 w-3 mr-1" />
            Alert
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            onClick={onView}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}