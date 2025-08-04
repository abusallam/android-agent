'use client';

import { useState } from 'react';
import { AlertTriangle, Phone, MapPin, Clock, Shield } from 'lucide-react';

interface EmergencyAlert {
  id: string;
  type: 'panic' | 'location' | 'battery' | 'offline';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  deviceId: string;
  deviceName: string;
}

export default function EmergencyPanel() {
  const [alerts] = useState<EmergencyAlert[]>([
    // No active alerts for demo
  ]);

  const [emergencyContacts] = useState([
    { name: 'Emergency Services', number: '911', type: 'emergency' },
    { name: 'Parent', number: '+1-555-0123', type: 'family' },
    { name: 'Guardian', number: '+1-555-0456', type: 'family' }
  ]);

  const triggerEmergencyAlert = async (type: string) => {
    try {
      const response = await fetch('/api/emergency/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: `Manual ${type} alert triggered from dashboard`,
          level: 'high',
          timestamp: new Date().toISOString(),
          source: 'dashboard'
        })
      });

      if (response.ok) {
        alert(`✅ ${type} alert sent successfully!`);
      } else {
        alert(`❌ Failed to send ${type} alert`);
      }
    } catch (error) {
      console.error('Emergency alert error:', error);
      alert('❌ Emergency alert failed');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-300';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-500 text-orange-800 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-300';
      default: return 'bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Shield className="h-5 w-5 text-red-600 mr-2" />
          Emergency Center
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Alerts */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Alerts</h3>
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="font-medium">{alert.deviceName}</span>
                    </div>
                    <span className="text-xs">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active alerts</p>
              <p className="text-xs">All devices are secure</p>
            </div>
          )}
        </div>

        {/* Emergency Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => triggerEmergencyAlert('panic')}
              className="flex items-center justify-center p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Panic Alert
            </button>
            <button
              onClick={() => triggerEmergencyAlert('location')}
              className="flex items-center justify-center p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Find Device
            </button>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Contacts</h3>
          <div className="space-y-2">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{contact.number}</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                  Call
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Status */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Emergency System Active</p>
              <div className="flex items-center text-xs text-green-700 dark:text-green-400 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>Last check: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}