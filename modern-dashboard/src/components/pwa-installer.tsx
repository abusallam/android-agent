'use client';

import { useState, useEffect } from 'react';
import { Shield, Download, Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [, setBackgroundMonitoring] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '', saveCredentials: true });

  useEffect(() => {
    // Check if PWA is supported
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Check auto-start status
    const autoStart = localStorage.getItem('auto-start-enabled') === 'true';
    const savedCreds = localStorage.getItem('saved-credentials');
    setAutoStartEnabled(autoStart);
    setBackgroundMonitoring(autoStart);

    if (savedCreds) {
      try {
        const creds = JSON.parse(savedCreds);
        setCredentials(prev => ({ ...prev, username: creds.username }));
      } catch {
        // Invalid saved credentials
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register enhanced service worker
    registerEnhancedServiceWorker();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const registerEnhancedServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/enhanced-sw.js');
        console.log('✅ Enhanced service worker registered:', registration);

        // Enable background sync
        if ('sync' in registration && registration.sync) {
          await (registration.sync as { register: (tag: string) => Promise<void> }).register('android-agent-sync');
          console.log('✅ Background sync registered');
        }

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        // Request persistent storage
        if ('storage' in navigator && 'persist' in navigator.storage) {
          const persistent = await navigator.storage.persist();
          console.log('📦 Persistent storage:', persistent);
        }

      } catch (error) {
        console.error('❌ Service worker registration failed:', error);
      }
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      alert('To install: Tap the menu button (⋮) and select "Add to Home screen"');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA installation accepted');
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('❌ PWA installation failed:', error);
    }
  };

  const handleAutoStartSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Test credentials first
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (!response.ok) {
        alert('❌ Invalid credentials. Please check your username and password.');
        return;
      }

      // Save credentials if requested
      if (credentials.saveCredentials) {
        localStorage.setItem('saved-credentials', JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }));
      }

      // Enable auto-start
      localStorage.setItem('auto-start-enabled', 'true');
      setAutoStartEnabled(true);
      setBackgroundMonitoring(true);

      // Send message to service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ENABLE_AUTO_START',
          credentials: credentials.saveCredentials ? {
            username: credentials.username,
            password: credentials.password
          } : null
        });
      }

      // Request additional permissions
      await requestPermissions();

      alert('✅ Auto-start configured successfully! The app will now start automatically when the device boots.');
      setShowSetup(false);

    } catch (error) {
      console.error('❌ Auto-start setup failed:', error);
      alert('❌ Setup failed: ' + (error as Error).message);
    }
  };

  const requestPermissions = async () => {
    const permissions = [];

    // Location permission
    if ('geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000
          });
        });
        permissions.push('📍 Location access granted');
      } catch {
        permissions.push('⚠️ Location access denied');
      }
    }

    // Notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        permissions.push('🔔 Notification access granted');
      } else {
        permissions.push('⚠️ Notification access denied');
      }
    }

    // Wake lock permission (keep screen on)
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<{ release: () => void }> } }).wakeLock.request('screen');
        permissions.push('⏰ Wake lock granted');
        // Release immediately, we'll request when needed
        wakeLock.release();
      } catch {
        permissions.push('⚠️ Wake lock not available');
      }
    }

    console.log('🔐 Permissions status:', permissions);
  };

  const disableAutoStart = () => {
    localStorage.removeItem('auto-start-enabled');
    localStorage.removeItem('saved-credentials');
    setAutoStartEnabled(false);
    setBackgroundMonitoring(false);

    // Send message to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'DISABLE_AUTO_START'
      });
    }

    alert('✅ Auto-start disabled');
  };

  if (!isSupported) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              PWA Not Supported
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              Your browser doesn&apos;t support Progressive Web App features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Installation Status */}
      <div className={`border rounded-lg p-4 ${
        isInstalled 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isInstalled ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
            ) : (
              <Download className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3" />
            )}
            <div>
              <h3 className={`text-sm font-medium ${
                isInstalled 
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-amber-800 dark:text-amber-300'
              }`}>
                {isInstalled ? '✅ PWA Installed' : '📱 Install Mobile App'}
              </h3>
              <p className={`text-sm mt-1 ${
                isInstalled 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-amber-700 dark:text-amber-400'
              }`}>
                {isInstalled 
                  ? 'App is installed and ready for background monitoring'
                  : 'Install as PWA for background monitoring and offline access'
                }
              </p>
            </div>
          </div>
          {!isInstalled && (
            <button
              onClick={handleInstall}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Install App
            </button>
          )}
        </div>
      </div>

      {/* Auto-Start Configuration */}
      {isInstalled && (
        <div className={`border rounded-lg p-4 ${
          autoStartEnabled
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className={`h-5 w-5 mr-3 ${
                autoStartEnabled 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
              <div>
                <h3 className={`text-sm font-medium ${
                  autoStartEnabled 
                    ? 'text-blue-800 dark:text-blue-300' 
                    : 'text-gray-800 dark:text-gray-300'
                }`}>
                  {autoStartEnabled ? '🔄 Auto-Start Enabled' : '⚙️ Auto-Start Setup'}
                </h3>
                <p className={`text-sm mt-1 ${
                  autoStartEnabled 
                    ? 'text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-400'
                }`}>
                  {autoStartEnabled 
                    ? 'App will start automatically on device boot with background monitoring'
                    : 'Configure automatic startup and continuous background monitoring'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {autoStartEnabled ? (
                <button
                  onClick={disableAutoStart}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={() => setShowSetup(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Setup Auto-Start
                </button>
              )}
            </div>
          </div>

          {/* Background Monitoring Status */}
          {autoStartEnabled && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span>Background Monitoring Active</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Location Tracking Enabled</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Emergency Alerts Ready</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Auto-Sync Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-Start Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Auto-Start Setup
              </h2>
            </div>

            <form onSubmit={handleAutoStartSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saveCredentials"
                  checked={credentials.saveCredentials}
                  onChange={(e) => setCredentials(prev => ({ ...prev, saveCredentials: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="saveCredentials" className="text-sm text-gray-700 dark:text-gray-300">
                  Save credentials for auto-login
                </label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  What will be enabled:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Automatic app startup on device boot</li>
                  <li>• Continuous background monitoring</li>
                  <li>• Location tracking every 5 minutes</li>
                  <li>• Emergency condition detection</li>
                  <li>• Automatic data synchronization</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSetup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Enable Auto-Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}