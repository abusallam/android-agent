// Auto-Start Service Worker for Family Safety Monitor
// This service worker ensures the app runs continuously in background

const CACHE_NAME = 'family-safety-auto-v1';
const AUTO_START_KEY = 'auto-start-enabled';
const CREDENTIALS_KEY = 'saved-credentials';
const MONITORING_INTERVAL = 30000; // 30 seconds

// Install event - set up auto-start
self.addEventListener('install', (event) => {
  console.log('🔄 Installing auto-start service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/auto-start'
      ]);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  console.log('✅ Auto-start service worker activated');
  
  event.waitUntil(
    clients.claim().then(() => {
      // Start background monitoring immediately
      startBackgroundMonitoring();
    })
  );
});

// Background sync for continuous monitoring
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'family-safety-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

// Push notifications for emergency alerts
self.addEventListener('push', (event) => {
  console.log('🚨 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Family Safety Alert',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'family-safety',
    requireInteraction: true,
    persistent: true,
    actions: [
      {
        action: 'view-location',
        title: '📍 View Location'
      },
      {
        action: 'emergency-call',
        title: '📞 Emergency Call'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Family Safety Monitor', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view-location') {
    // Open app to location tab
    event.waitUntil(
      clients.openWindow('/?tab=location')
    );
  } else if (event.action === 'emergency-call') {
    // Trigger emergency call
    event.waitUntil(
      fetch('/api/emergency-call', { method: 'POST' })
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync
async function startBackgroundMonitoring() {
  console.log('🛡️ Starting continuous background monitoring...');
  
  // Register for periodic background sync
  if ('periodicSync' in self.registration) {
    try {
      await self.registration.periodicSync.register('family-safety-periodic', {
        minInterval: MONITORING_INTERVAL
      });
      console.log('✅ Periodic sync registered');
    } catch (error) {
      console.log('❌ Periodic sync not supported, using alternative');
      // Fallback to regular intervals
      setInterval(performBackgroundSync, MONITORING_INTERVAL);
    }
  } else {
    // Fallback for browsers without periodic sync
    setInterval(performBackgroundSync, MONITORING_INTERVAL);
  }
}

// Perform background monitoring tasks
async function performBackgroundSync() {
  try {
    console.log('🔄 Performing background sync...');
    
    // Check if credentials are saved
    const credentials = await getStoredCredentials();
    if (!credentials) {
      console.log('⚠️ No credentials stored, skipping sync');
      return;
    }
    
    // Send device status update
    await sendDeviceStatus();
    
    // Send location update
    await sendLocationUpdate();
    
    // Check for emergency conditions
    await checkEmergencyConditions();
    
    console.log('✅ Background sync completed');
    
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Send device status to server
async function sendDeviceStatus() {
  try {
    const deviceInfo = await getDeviceInfo();
    
    const response = await fetch('/api/device/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceInfo,
        timestamp: new Date().toISOString(),
        source: 'background-sync'
      })
    });
    
    if (response.ok) {
      console.log('📱 Device status sent successfully');
    }
  } catch (error) {
    console.error('❌ Failed to send device status:', error);
  }
}

// Send location update
async function sendLocationUpdate() {
  try {
    if ('geolocation' in navigator) {
      const position = await getCurrentPosition();
      
      const response = await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          source: 'background-sync'
        })
      });
      
      if (response.ok) {
        console.log('📍 Location sent successfully');
      }
    }
  } catch (error) {
    console.error('❌ Failed to send location:', error);
  }
}

// Check for emergency conditions
async function checkEmergencyConditions() {
  try {
    // Check battery level
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      if (battery.level < 0.15 && !battery.charging) {
        await sendEmergencyAlert('Low battery warning: ' + Math.round(battery.level * 100) + '%');
      }
    }
    
    // Check if device hasn't moved for too long (potential emergency)
    const lastLocation = await getLastKnownLocation();
    if (lastLocation && isLocationStale(lastLocation)) {
      await sendEmergencyAlert('Device location hasn\'t updated for extended period');
    }
    
  } catch (error) {
    console.error('❌ Emergency check failed:', error);
  }
}

// Helper functions
async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    });
  });
}

async function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    timestamp: new Date().toISOString()
  };
}

async function getStoredCredentials() {
  try {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

async function getLastKnownLocation() {
  try {
    const stored = localStorage.getItem('last-location');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

function isLocationStale(location) {
  const now = new Date();
  const locationTime = new Date(location.timestamp);
  const hoursSinceUpdate = (now - locationTime) / (1000 * 60 * 60);
  return hoursSinceUpdate > 2; // Alert if no location update for 2+ hours
}

async function sendEmergencyAlert(message) {
  try {
    const response = await fetch('/api/emergency/alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        timestamp: new Date().toISOString(),
        source: 'auto-monitoring'
      })
    });
    
    if (response.ok) {
      console.log('🚨 Emergency alert sent:', message);
      
      // Show local notification as backup
      self.registration.showNotification('Emergency Alert', {
        body: message,
        icon: '/logo.png',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true
      });
    }
  } catch (error) {
    console.error('❌ Failed to send emergency alert:', error);
  }
}

console.log('🛡️ Family Safety Auto-Start Service Worker loaded');