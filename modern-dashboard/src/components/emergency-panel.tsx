'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MessageSquare, MapPin, Shield } from 'lucide-react';

interface EmergencyAlert {
  id: string;
  type: 'panic' | 'low_battery' | 'location_lost' | 'no_movement' | 'manual';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export default function EmergencyPanel() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    // Simulate emergency alerts
    const interval = setInterval(() => {
      if (Math.random() > 0.95) { // 5% chance of alert every 30 seconds
        const alertTypes = ['low_battery', 'location_lost', 'no_movement'];
        const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)] as EmergencyAlert['type'];
        
        const newAlert: EmergencyAlert = {
          id: `alert_${Date.now()}`,
          type: randomType,
          message: getAlertMessage(randomType),
          timestamp: new Date().toISOString(),
          severity: getSeverity(randomType),
          acknowledged: false,
          location: {
            latitude: 31.2001,
            longitude: 29.9187,
            address: 'Alexandria, Egypt'
          }
        };

        setAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep only 5 most recent
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getAlertMessage = (type: EmergencyAlert['type']): string => {
    const messages = {
      panic: 'Emergency panic button activated!',
      low_battery: 'Device battery critically low (5%)',
      location_lost: 'GPS signal lost for over 10 minutes',
      no_movement: 'No movement detected for 2 hours',
      manual: 'Manual emergency alert triggered'
    };
    return messages[type];
  };

  const getSeverity = (type: EmergencyAlert['type']): EmergencyAlert['severity'] => {
    const severities = {
      panic: 'critical' as const,
      low_battery: 'medium' as const,
      location_lost: 'high' as const,
      no_movement: 'high' as const,
      manual: 'critical' as const
    };
    return severities[type];
  };

  const getSeverityColor = (severity: EmergencyAlert['severity']) => {
    const colors = {
      low: 'text-blue-600 bg-blue-50 border-blue-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      critical: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[severity];
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const triggerEmergency = async () => {
    setEmergencyMode(true);
    const emergencyAlert: EmergencyAlert = {
      id: `emergency_${Date.now()}`,
      type: 'manual',
      message: 'Manual emergency alert - Immediate assistance required',
      timestamp: new Date().toISOString(),
      severity: 'critical',
      acknowledged: false,
      location: {
        latitude: 31.2001,
        longitude: 29.9187,
        address: 'Alexandria, Egypt'
      }
    };
    
    setAlerts(prev => [emergencyAlert, ...prev]);
    
    // Send push notification
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-emergency',
          message: emergencyAlert.message,
          type: emergencyAlert.type,
          location: emergencyAlert.location
        })
      });
      
      // Also send to emergency alert API
      await fetch('/api/emergency/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emergencyAlert.type,
          message: emergencyAlert.message,
          level: emergencyAlert.severity,
          timestamp: emergencyAlert.timestamp,
          source: 'parent_dashboard'
        })
      });
      
      console.log('🚨 Emergency alert sent successfully');
    } catch (error) {
      console.error('❌ Failed to send emergency alert:', error);
    }
    
    // Auto-disable emergency mode after 30 seconds
    setTimeout(() => setEmergencyMode(false), 30000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Shield className="h-5 w-5 text-red-600 mr-2" />
            Emergency Center
          </h2>
          {emergencyMode && (
            <div className="flex items-center space-x-2 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-red-600 font-medium">EMERGENCY ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Emergency Button */}
        <button
          onClick={triggerEmergency}
          disabled={emergencyMode}
          className={`w-full p-4 rounded-lg font-semibold text-white transition-all ${
            emergencyMode 
              ? 'bg-red-800 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700 active:scale-95'
          }`}
        >
          {emergencyMode ? (
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
              <span>EMERGENCY ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>EMERGENCY ALERT</span>
            </div>
          )}
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button className="flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            <Phone className="h-4 w-4" />
            <span className="text-sm font-medium">Call Child</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Send SMS</span>
          </button>
        </div>

        {/* Recent Alerts */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Alerts</h3>
          
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No recent alerts</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">All systems monitoring normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} ${
                    alert.acknowledged ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{alert.severity}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      {alert.location && (
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{alert.location.address}</span>
                        </div>
                      )}
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="ml-2 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        Ack
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Emergency Contacts</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Parent 1:</span>
              <span className="text-gray-900 dark:text-white">+20 123 456 789</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Parent 2:</span>
              <span className="text-gray-900 dark:text-white">+20 987 654 321</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Emergency:</span>
              <span className="text-gray-900 dark:text-white">122</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}