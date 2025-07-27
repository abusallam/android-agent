'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, Clock, Battery, Wifi } from 'lucide-react';

interface DeviceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  battery: number;
  isOnline: boolean;
}

export default function InteractiveMap() {
  const [devices, setDevices] = useState<DeviceLocation[]>([
    {
      id: 'device_001',
      name: "Child's Phone",
      latitude: 31.2001,
      longitude: 29.9187,
      accuracy: 10,
      timestamp: new Date().toISOString(),
      battery: 85,
      isOnline: true
    }
  ]);

  const [selectedDevice, setSelectedDevice] = useState<DeviceLocation | null>(null);
  // const [mapCenter, setMapCenter] = useState({ lat: 31.2001, lng: 29.9187 });

  useEffect(() => {
    // Simulate real-time location updates
    const interval = setInterval(() => {
      setDevices(prev => prev.map(device => ({
        ...device,
        // Simulate small location changes
        latitude: device.latitude + (Math.random() - 0.5) * 0.001,
        longitude: device.longitude + (Math.random() - 0.5) * 0.001,
        timestamp: new Date().toISOString(),
        battery: Math.max(10, device.battery - Math.random() * 0.5),
        isOnline: Math.random() > 0.1 // 90% chance of being online
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            Live Location Tracking
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Real-time</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Map Container */}
        <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-gradient-to-br from-blue-200 via-green-200 to-yellow-200"></div>
            {/* Grid lines to simulate map */}
            <div className="absolute inset-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="absolute border-gray-300 dark:border-gray-500">
                  <div 
                    className="w-full border-t border-dashed opacity-30"
                    style={{ top: `${i * 10}%` }}
                  />
                  <div 
                    className="h-full border-l border-dashed opacity-30"
                    style={{ left: `${i * 10}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Device Markers */}
          {devices.map((device, index) => (
            <div
              key={device.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${50 + index * 10}%`,
                top: `${50 + index * 5}%`
              }}
              onClick={() => setSelectedDevice(device)}
            >
              {/* Device Marker */}
              <div className={`relative ${device.isOnline ? 'animate-pulse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  device.isOnline ? 'bg-green-500' : 'bg-gray-400'
                } shadow-lg`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                
                {/* Accuracy Circle */}
                <div className={`absolute inset-0 rounded-full border-2 ${
                  device.isOnline ? 'border-green-300' : 'border-gray-300'
                } opacity-50`} 
                style={{
                  width: `${Math.max(20, device.accuracy)}px`,
                  height: `${Math.max(20, device.accuracy)}px`,
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%'
                }}></div>
              </div>

              {/* Device Label */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg border text-xs font-medium whitespace-nowrap">
                {device.name}
              </div>
            </div>
          ))}

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border hover:bg-gray-50 dark:hover:bg-gray-700">
              <Navigation className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border hover:bg-gray-50 dark:hover:bg-gray-700">
              <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Device Info Panel */}
        {selectedDevice && (
          <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">{selectedDevice.name}</h3>
              <button 
                onClick={() => setSelectedDevice(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 dark:text-gray-300">
                  {selectedDevice.latitude.toFixed(4)}, {selectedDevice.longitude.toFixed(4)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-gray-600 dark:text-gray-300">
                  {new Date(selectedDevice.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Battery className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-600 dark:text-gray-300">
                  {Math.round(selectedDevice.battery)}%
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Wifi className={`h-4 w-4 ${selectedDevice.isOnline ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-gray-600 dark:text-gray-300">
                  {selectedDevice.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}