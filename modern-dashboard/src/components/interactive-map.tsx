"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface DeviceLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline';
  battery: number;
  lastSeen: string;
}

export function InteractiveMap() {
  const [devices, setDevices] = useState<DeviceLocation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate real device data - replace with actual API call
    const mockDevices: DeviceLocation[] = [
      {
        id: '1',
        name: "Child's Phone",
        lat: 31.2001,
        lng: 29.9187,
        status: 'online',
        battery: 78,
        lastSeen: 'Now'
      },
      {
        id: '2',
        name: 'Work Tablet',
        lat: 30.0444,
        lng: 31.2357,
        status: 'online',
        battery: 65,
        lastSeen: '2 min ago'
      },
      {
        id: '3',
        name: 'Backup Device',
        lat: 31.1975,
        lng: 29.9097,
        status: 'offline',
        battery: 23,
        lastSeen: '2 hours ago'
      }
    ];

    setDevices(mockDevices);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 p-2">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            Live Location Tracking
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Loading</Badge>
          </CardTitle>
          <CardDescription className="text-blue-200/80">
            Loading interactive map...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-4 mx-auto mb-4 animate-pulse">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg font-medium text-white">Loading Map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-blue-500/30 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-4 text-white text-2xl font-bold">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 p-3">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          Live Location Tracking
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-base px-4 py-2">Real-time</Badge>
        </CardTitle>
        <CardDescription className="text-blue-200/80 text-lg mt-3">
          Real-time device location monitoring and tracking with interactive maps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 rounded-xl overflow-hidden border border-blue-500/20">
          <MapContainer
            center={[30.5, 30.5]}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {devices.map((device) => (
              <Marker key={device.id} position={[device.lat, device.lng]}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900">{device.name}</h3>
                    <p className="text-sm text-gray-600">
                      Status: <span className={device.status === 'online' ? 'text-green-600' : 'text-red-600'}>
                        {device.status}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">Battery: {device.battery}%</p>
                    <p className="text-sm text-gray-600">Last seen: {device.lastSeen}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}