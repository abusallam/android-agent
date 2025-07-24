'use client';

import { useState, useEffect } from 'react';
import { Download, Bell, MapPin, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function PWAInstaller() {
  const {
    capabilities,
    installApp,
    requestNotificationPermission,
    requestLocationPermission,
    startBackgroundSync,
    subscribeToPushNotifications,
  } = usePWA();

  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const handleFullSetup = async () => {
    try {
      // Step 1: Install PWA
      if (capabilities.isInstallable) {
        await installApp();
      }

      // Step 2: Request permissions
      const notificationGranted = await requestNotificationPermission();
      const locationGranted = await requestLocationPermission();

      // Step 3: Start background sync
      if (notificationGranted && locationGranted) {
        await startBackgroundSync();
        await subscribeToPushNotifications();
        setIsSetupComplete(true);
      }
    } catch (error) {
      console.error('PWA setup failed:', error);
    }
  };

  if (capabilities.isInstalled && isSetupComplete) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
              PWA Active & Monitoring
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Background monitoring is active. Device data and location are being tracked securely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Download className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Install Mobile App
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Install as PWA for background monitoring, push notifications, and offline access.
            </p>
          </div>
        </div>
        <button
          onClick={handleFullSetup}
          className="ml-4 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Setup Mobile App
        </button>
      </div>
      
      {/* Capabilities Status */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className={`flex items-center ${capabilities.isOnline ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${capabilities.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          Online
        </div>
        <div className={`flex items-center ${capabilities.hasNotificationPermission ? 'text-green-600' : 'text-gray-500'}`}>
          <Bell className="w-3 h-3 mr-1" />
          Notifications
        </div>
        <div className={`flex items-center ${capabilities.hasLocationPermission ? 'text-green-600' : 'text-gray-500'}`}>
          <MapPin className="w-3 h-3 mr-1" />
          Location
        </div>
        <div className={`flex items-center ${capabilities.supportsBackgroundSync ? 'text-green-600' : 'text-gray-500'}`}>
          <Smartphone className="w-3 h-3 mr-1" />
          Background
        </div>
      </div>
    </div>
  );
}