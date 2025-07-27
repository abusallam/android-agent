'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

export interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasNotificationPermission: boolean;
  hasLocationPermission: boolean;
  supportsPushNotifications: boolean;
  supportsBackgroundSync: boolean;
}

export function usePWA() {
  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    hasNotificationPermission: false,
    hasLocationPermission: false,
    supportsPushNotifications: false,
    supportsBackgroundSync: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if app is installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Check online status
    const updateOnlineStatus = () => {
      setCapabilities(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    // Check notification permission
    const checkNotificationPermission = () => {
      if ('Notification' in window) {
        return Notification.permission === 'granted';
      }
      return false;
    };

    // Check location permission
    const checkLocationPermission = async () => {
      if ('geolocation' in navigator && 'permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          return result.state === 'granted';
        } catch {
          return false;
        }
      }
      return false;
    };

    // Check PWA capabilities
    const checkCapabilities = async () => {
      const locationPermission = await checkLocationPermission();
      
      setCapabilities({
        isInstallable: !!deferredPrompt,
        isInstalled,
        isOnline: navigator.onLine,
        hasNotificationPermission: checkNotificationPermission(),
        hasLocationPermission: locationPermission,
        supportsPushNotifications: 'PushManager' in window && 'serviceWorker' in navigator,
        supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      });
    };

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCapabilities(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    checkCapabilities();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [deferredPrompt]);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCapabilities(prev => ({ ...prev, isInstallable: false, isInstalled: true }));
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setCapabilities(prev => ({ 
        ...prev, 
        hasNotificationPermission: permission === 'granted' 
      }));
      return permission === 'granted';
    }
    return false;
  };

  const requestLocationPermission = async () => {
    return new Promise<boolean>((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setCapabilities(prev => ({ ...prev, hasLocationPermission: true }));
            resolve(true);
          },
          () => {
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        resolve(false);
      }
    });
  };

  const startBackgroundSync = async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;
        await registration.sync.register('device-sync');
        await registration.sync.register('location-sync');
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  };

  const subscribeToPushNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        
        // Send subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });
        
        return true;
      } catch (error) {
        console.error('Push notification subscription failed:', error);
        return false;
      }
    }
    return false;
  };

  return {
    capabilities,
    installApp,
    requestNotificationPermission,
    requestLocationPermission,
    startBackgroundSync,
    subscribeToPushNotifications,
  };
}