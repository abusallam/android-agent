"use client";

import React from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  AlertCircle,
  Bell,
  Clock,
  MapPin,
  Shield,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  persistent?: boolean;
  actions?: {
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }[];
}

interface NotificationManagerProps {
  notifications?: Notification[];
  maxNotifications?: number;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function NotificationManager({ 
  notifications = [], 
  maxNotifications = 5, 
  onDismiss,
  className 
}: NotificationManagerProps) {
  const [localNotifications, setLocalNotifications] = React.useState<Notification[]>([]);

  // Mock notifications if none provided
  React.useEffect(() => {
    if (notifications.length === 0) {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Device Connected',
          message: "Child's Phone has successfully connected to the monitoring system",
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          priority: 'medium'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Low Battery Alert',
          message: 'Backup Device battery level is below 25%',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          priority: 'high',
          actions: [
            { label: 'Locate Device', action: () => console.log('Locate device') },
            { label: 'Send Alert', action: () => console.log('Send alert'), variant: 'outline' }
          ]
        },
        {
          id: '3',
          type: 'info',
          title: 'System Update',
          message: 'AI analysis engine has been updated with new behavioral patterns',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          priority: 'low'
        }
      ];
      setLocalNotifications(mockNotifications);
    } else {
      setLocalNotifications(notifications);
    }
  }, [notifications]);

  const handleDismiss = (id: string) => {
    setLocalNotifications(prev => prev.filter(n => n.id !== id));
    onDismiss?.(id);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getNotificationColors = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const visibleNotifications = localNotifications.slice(0, maxNotifications);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-3 w-96 max-w-[calc(100vw-2rem)] ${className}`}>
      {visibleNotifications.map((notification) => (
        <Card 
          key={notification.id}
          className={`backdrop-blur-xl border ${getNotificationColors(notification.type)} shadow-xl animate-in slide-in-from-right-full duration-300`}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {notification.title}
                  </h4>
                  <div className="flex items-center space-x-2 ml-2">
                    {getPriorityBadge(notification.priority)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-white hover:bg-white/10"
                      onClick={() => handleDismiss(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-slate-300 mb-2 leading-relaxed">
                  {notification.message}
                </p>
                
                {/* Timestamp */}
                <div className="flex items-center text-xs text-slate-400 mb-3">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimestamp(notification.timestamp)}
                </div>
                
                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {notification.actions.map((action, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant={action.variant || 'default'}
                        className={`text-xs ${
                          action.variant === 'outline' 
                            ? 'border-white/20 text-white hover:bg-white/10' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        onClick={action.action}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Show more indicator */}
      {localNotifications.length > maxNotifications && (
        <Card className="backdrop-blur-xl border border-white/10 bg-white/5 shadow-xl">
          <CardContent className="p-3">
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-300">
              <Bell className="h-4 w-4" />
              <span>+{localNotifications.length - maxNotifications} more notifications</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}