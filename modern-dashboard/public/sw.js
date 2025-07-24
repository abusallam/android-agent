// Android Agent Service Worker - Background Processing
const CACHE_NAME = 'android-agent-v1';
const API_CACHE = 'android-agent-api-v1';

// Background sync for device data
self.addEventListener('sync', event => {
  if (event.tag === 'device-sync') {
    event.waitUntil(syncDeviceData());
  }
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationData());
  }
});

// Push notifications for device alerts
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View Device',
          icon: '/logo.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/devices/' + event.notification.data.deviceId)
    );
  }
});

// Background location tracking
async function syncLocationData() {
  try {
    if ('geolocation' in navigator) {
      const position = await getCurrentPosition();
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };
      
      // Store locally first
      await storeLocationData(locationData);
      
      // Try to sync with server
      await fetch('/api/location/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });
    }
  } catch (error) {
    console.error('Background location sync failed:', error);
  }
}

// Background device data sync
async function syncDeviceData() {
  try {
    const deviceData = await collectDeviceData();
    
    // Store locally first
    await storeDeviceData(deviceData);
    
    // Try to sync with server
    await fetch('/api/device/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData)
    });
  } catch (error) {
    console.error('Background device sync failed:', error);
  }
}

// Collect device information
async function collectDeviceData() {
  const deviceData = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    timestamp: Date.now()
  };
  
  // Add battery info if available
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      deviceData.battery = {
        level: battery.level,
        charging: battery.charging
      };
    } catch (e) {
      // Battery API not available
    }
  }
  
  // Add connection info if available
  if ('connection' in navigator) {
    deviceData.connection = {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink
    };
  }
  
  return deviceData;
}

// Get current position with promise
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    });
  });
}

// Store data in IndexedDB
async function storeLocationData(data) {
  const db = await openDB();
  const transaction = db.transaction(['locations'], 'readwrite');
  const store = transaction.objectStore('locations');
  await store.add(data);
}

async function storeDeviceData(data) {
  const db = await openDB();
  const transaction = db.transaction(['devices'], 'readwrite');
  const store = transaction.objectStore('devices');
  await store.add(data);
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AndroidAgentDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('locations')) {
        const locationStore = db.createObjectStore('locations', { keyPath: 'timestamp' });
        locationStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('devices')) {
        const deviceStore = db.createObjectStore('devices', { keyPath: 'timestamp' });
        deviceStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Periodic background sync (every 5 minutes)
setInterval(() => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('device-sync');
      registration.sync.register('location-sync');
    });
  }
}, 5 * 60 * 1000); // 5 minutes