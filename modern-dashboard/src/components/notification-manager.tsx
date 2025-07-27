'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle, AlertTriangle } from 'lucide-react';

interface NotificationState {
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  isSupported: boolean;
}

export default function NotificationManager() {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: 'default',
    subscription: null,
    isSupported: false
  });

  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    
    setNotificationState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'denied'
    }));

    if (isSupported) {
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setNotificationState(prev => ({
        ...prev,
        subscription
      }));
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (!notificationState.isSupported) {
      alert('Push notifications are not supported in this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await subscribeToPush();
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 3000);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
          'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLEaQC7-jCuLKR4dGfEoRqn6hsL7doVBEU6a7ckjBjdVvswGqMhQNdQ'
        )
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth'))
          }
        })
      });

      setNotificationState(prev => ({ ...prev, subscription }));
      
      // Send test notification
      await sendTestNotification();
      
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-notification',
          title: '🛡️ Family Safety Monitor',
          message: 'Emergency notifications are now enabled!',
          type: 'test'
        })
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (notificationState.subscription) {
        await notificationState.subscription.unsubscribe();
        setNotificationState(prev => ({ ...prev, subscription: null }));
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  };

  // Helper functions
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer | null) => {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const getStatusColor = () => {
    if (!notificationState.isSupported) return 'text-gray-500';
    if (notificationState.permission === 'granted' && notificationState.subscription) return 'text-green-600';
    if (notificationState.permission === 'denied') return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusText = () => {
    if (!notificationState.isSupported) return 'Not supported';
    if (notificationState.permission === 'granted' && notificationState.subscription) return 'Active';
    if (notificationState.permission === 'denied') return 'Blocked';
    return 'Disabled';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {notificationState.permission === 'granted' && notificationState.subscription ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-400" />
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Emergency Notifications
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Status: <span className={getStatusColor()}>{getStatusText()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {notificationState.permission === 'granted' && notificationState.subscription ? (
            <button
              onClick={unsubscribeFromPush}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-colors"
            >
              Disable
            </button>
          ) : (
            <button
              onClick={requestNotificationPermission}
              disabled={!notificationState.isSupported || notificationState.permission === 'denied'}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
            >
              Enable
            </button>
          )}
        </div>
      </div>

      {/* Status Message */}
      {showStatus && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 dark:text-green-300">
              Emergency notifications enabled successfully!
            </span>
          </div>
        </div>
      )}

      {/* Help Text */}
      {notificationState.permission === 'denied' && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 dark:text-yellow-300">
              Notifications blocked. Please enable in browser settings.
            </span>
          </div>
        </div>
      )}

      {!notificationState.isSupported && (
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Push notifications not supported in this browser.
          </span>
        </div>
      )}
    </div>
  );
}