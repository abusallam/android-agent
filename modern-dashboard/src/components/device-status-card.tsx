'use client';

import { useEffect, useState } from 'react';
import { Battery, Clock, Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';

interface DeviceStatus {
  id: string;
  name: string;
  model: string;
  isOnline: boolean;
  battery: number;
  isCharging: boolean;
  lastSeen: string;
  networkType: string;
  signalStrength: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  alerts: string[];
}

export default function DeviceStatusCard() {
  const [device, setDevice] = useState<DeviceStatus>({
    id: 'device_001',
    name: "Child's Phone",
    model: 'Samsung Galaxy A54',
    isOnline: true,
    battery: 85,
    isCharging: false,
    lastSeen: new Date().toISOString(),
    networkType: 'WiFi',
    signalStrength: 4,
    location: {
      latitude: 31.2001,
      longitude: 29.9187,
      address: 'Alexandria, Egypt'
    },
    alerts: []
  });

  useEffect(() => {
    // Simulate real-time device updates
    const interval = setInterval(() => {
      setDevice(prev => {
        const newBattery = Math.max(10, prev.battery - Math.random() * 0.5);
        const alerts = [];
        
        if (newBattery < 20) {
          alerts.push('Low battery warning');
        }
        
        if (Math.random() > 0.9) {
          alerts.push('Location update delayed');
        }

        return {
          ...prev,
          battery: newBattery,
          lastSeen: new Date().toISOString(),
          isOnline: Math.random() > 0.05, // 95% chance of being online
          signalStrength: Math.floor(Math.random() * 5) + 1,
          alerts
        };
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-600';
    if (battery > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSignalBars = (strength: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className={`w-1 bg-gray-300 dark:bg-gray-600 ${
          i < strength ? 'bg-green-500' : ''
        }`}
        style={{ height: `${(i + 1) * 3 + 2}px` }}
      />
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${device.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{device.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{device.model}</p>
          </div>
        </div>
        <Smartphone className="h-8 w-8 text-blue-600" />
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Battery */}
        <div className="flex items-center space-x-2">
          <Battery className={`h-5 w-5 ${getBatteryColor(device.battery)}`} />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.round(device.battery)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {device.isCharging ? 'Charging' : 'Battery'}
            </p>
          </div>
        </div>

        {/* Network */}
        <div className="flex items-center space-x-2">
          <div className="flex items-end space-x-0.5">
            {getSignalBars(device.signalStrength)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{device.networkType}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Signal</p>
          </div>
        </div>

        {/* Last Seen */}
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {new Date(device.lastSeen).toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last seen</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2">
          {device.isOnline ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {device.isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Current Location</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{device.location.address}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
        </p>
      </div>

      {/* Alerts */}
      {device.alerts.length > 0 && (
        <div className="space-y-2">
          {device.alerts.map((alert, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-300">{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
          Locate Device
        </button>
        <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
          Send Alert
        </button>
      </div>
    </div>
  );
}