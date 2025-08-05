"use client";

import React from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Phone, 
  MapPin, 
  Clock, 
  Users,
  Zap,
  Bell,
  Activity,
  Navigation,
  Heart,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: 'primary' | 'secondary' | 'emergency';
}

interface EmergencyIncident {
  id: string;
  type: 'panic' | 'location' | 'battery' | 'offline' | 'custom';
  deviceName: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'investigating';
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface EmergencyPanelProps {
  incidents?: EmergencyIncident[];
  contacts?: EmergencyContact[];
  onPanicAlert?: () => void;
  onEmergencyCall?: (contactId: string) => void;
  onLocateDevice?: (deviceId: string) => void;
  className?: string;
}

export function EmergencyPanel({ 
  incidents = [], 
  contacts = [], 
  onPanicAlert,
  onEmergencyCall,
  onLocateDevice,
  className 
}: EmergencyPanelProps) {
  const [isEmergencyMode, setIsEmergencyMode] = React.useState(false);
  const [panicButtonPressed, setPanicButtonPressed] = React.useState(false);

  // Mock data if none provided
  const mockContacts: EmergencyContact[] = contacts.length > 0 ? contacts : [
    { id: '1', name: 'Emergency Services', relationship: 'Emergency', phone: '911', priority: 'emergency' },
    { id: '2', name: 'John Doe', relationship: 'Parent', phone: '+1-555-0123', priority: 'primary' },
    { id: '3', name: 'Jane Smith', relationship: 'Guardian', phone: '+1-555-0456', priority: 'secondary' },
  ];

  const mockIncidents: EmergencyIncident[] = incidents.length > 0 ? incidents : [];

  const handlePanicButton = () => {
    setPanicButtonPressed(true);
    setIsEmergencyMode(true);
    onPanicAlert?.();
    
    // Reset panic button after 3 seconds
    setTimeout(() => {
      setPanicButtonPressed(false);
    }, 3000);
  };

  const getIncidentIcon = (type: EmergencyIncident['type']) => {
    switch (type) {
      case 'panic':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'location':
        return <MapPin className="h-4 w-4 text-orange-400" />;
      case 'battery':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'offline':
        return <Activity className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: EmergencyIncident['status']) => {
    switch (status) {
      case 'active':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'investigating':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: EmergencyContact['priority']) => {
    switch (priority) {
      case 'emergency':
        return 'border-red-500/30 text-red-300 hover:bg-red-500/10';
      case 'primary':
        return 'border-orange-500/30 text-orange-300 hover:bg-orange-500/10';
      default:
        return 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10';
    }
  };

  return (
    <div className={className}>
      <Card className={`transition-all duration-300 ${
        isEmergencyMode 
          ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/20' 
          : 'bg-white/5 backdrop-blur-sm border-white/10'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl p-2 ${
                isEmergencyMode 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }`}>
                {isEmergencyMode ? (
                  <AlertTriangle className="h-6 w-6 text-white" />
                ) : (
                  <Shield className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <CardTitle className="text-white">
                  {isEmergencyMode ? 'EMERGENCY MODE ACTIVE' : 'Emergency Center'}
                </CardTitle>
                <p className="text-sm text-slate-300">
                  {isEmergencyMode ? 'Emergency protocols activated' : 'Emergency response and alert management'}
                </p>
              </div>
            </div>
            
            <Badge className={
              isEmergencyMode 
                ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' 
                : 'bg-green-500/20 text-green-400 border-green-500/30'
            }>
              {isEmergencyMode ? 'EMERGENCY' : 'Secure'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Emergency Status */}
          {!isEmergencyMode && mockIncidents.length === 0 && (
            <div className="text-center py-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 p-4 mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <p className="font-medium text-green-400 text-lg">All Secure</p>
              <p className="text-sm text-green-300/80">No active alerts or emergencies</p>
            </div>
          )}

          {/* Active Incidents */}
          {mockIncidents.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
                Active Incidents
              </h3>
              {mockIncidents.map((incident) => (
                <Alert key={incident.id} className="bg-red-500/10 border-red-500/20">
                  <div className="flex items-center space-x-2">
                    {getIncidentIcon(incident.type)}
                    <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                  </div>
                  <AlertDescription className="ml-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-300 font-medium">{incident.deviceName}</p>
                        <p className="text-sm text-red-400/80">
                          {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} incident
                        </p>
                      </div>
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Panic Button */}
          <div className="text-center">
            <Button
              size="lg"
              className={`w-full h-16 text-lg font-bold transition-all duration-200 ${
                panicButtonPressed
                  ? 'bg-red-600 animate-pulse scale-105 shadow-lg shadow-red-500/50'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:scale-105'
              } text-white border-0`}
              onClick={handlePanicButton}
              disabled={panicButtonPressed}
            >
              <AlertTriangle className="h-6 w-6 mr-3" />
              {panicButtonPressed ? 'ALERT SENT!' : 'PANIC ALERT'}
            </Button>
            <p className="text-xs text-slate-400 mt-2">
              Press to send immediate emergency alert to all contacts
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
              onClick={() => onLocateDevice?.('all')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Find All Devices
            </Button>
            <Button 
              variant="outline" 
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Track Location
            </Button>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-400" />
              Emergency Contacts
            </h3>
            <div className="space-y-2">
              {mockContacts.map((contact) => (
                <div 
                  key={contact.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-8 w-8 rounded-lg p-2 ${
                      contact.priority === 'emergency' 
                        ? 'bg-red-500/20' 
                        : contact.priority === 'primary' 
                        ? 'bg-orange-500/20' 
                        : 'bg-blue-500/20'
                    }`}>
                      <Phone className={`h-4 w-4 ${
                        contact.priority === 'emergency' 
                          ? 'text-red-400' 
                          : contact.priority === 'primary' 
                          ? 'text-orange-400' 
                          : 'text-blue-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{contact.name}</p>
                      <p className="text-xs text-slate-400">{contact.relationship} • {contact.phone}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className={getPriorityColor(contact.priority)}
                    onClick={() => onEmergencyCall?.(contact.id)}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Info */}
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Heart className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <div className="flex items-center justify-between">
                <span>Emergency services: Available 24/7</span>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">Ready</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}