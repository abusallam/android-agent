"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface EmergencyButtonProps {
  userRole?: 'admin' | 'user';
}

export function EmergencyButton({ userRole = 'user' }: EmergencyButtonProps) {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes
  const [currentStep, setCurrentStep] = useState<'countdown' | 'calling-primary' | 'calling-secondary' | 'calling-911' | 'completed'>('countdown');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isEmergencyActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Start calling sequence
            initiateEmergencyCalls();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEmergencyActive, countdown]);

  const initiateEmergency = async () => {
    setIsEmergencyActive(true);
    setCountdown(120);
    setCurrentStep('countdown');

    // Send high alert notification
    try {
      await fetch('/api/emergency/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'emergency_initiated',
          countdown: 120,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
    }
  };

  const cancelEmergency = () => {
    setIsEmergencyActive(false);
    setCountdown(120);
    setCurrentStep('countdown');
  };

  const initiateEmergencyCalls = async () => {
    // Step 1: Call primary contact
    setCurrentStep('calling-primary');
    await makeEmergencyCall('primary');
    
    // Wait 30 seconds, then call secondary
    setTimeout(async () => {
      setCurrentStep('calling-secondary');
      await makeEmergencyCall('secondary');
      
      // Wait another 30 seconds, then call 911
      setTimeout(async () => {
        setCurrentStep('calling-911');
        await makeEmergencyCall('911');
        
        setTimeout(() => {
          setCurrentStep('completed');
        }, 5000);
      }, 30000);
    }, 30000);
  };

  const makeEmergencyCall = async (contactType: 'primary' | 'secondary' | '911') => {
    try {
      await fetch('/api/emergency/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactType,
          timestamp: new Date().toISOString(),
          location: await getCurrentLocation()
        })
      });
    } catch (error) {
      console.error(`Failed to initiate ${contactType} call:`, error);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => {
            // Fallback location if GPS fails
            resolve({ lat: 0, lng: 0 });
          }
        );
      } else {
        resolve({ lat: 0, lng: 0 });
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't show for admin users
  if (userRole === 'admin') {
    return null;
  }

  if (isEmergencyActive) {
    return (
      <Card className="mb-8 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border-red-500/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-4 text-white text-2xl font-bold">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-4 animate-pulse">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            EMERGENCY ACTIVATED
            <Badge className="bg-red-500/30 text-red-200 border-red-500/50 text-base px-4 py-2 animate-pulse">
              {currentStep === 'countdown' ? 'COUNTDOWN' : 'CALLING'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 'countdown' && (
            <>
              <Alert className="bg-red-500/20 border-red-500/40">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <AlertDescription className="text-red-200 text-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Emergency services will be contacted in:</strong>
                      <div className="text-3xl font-bold mt-2">{formatTime(countdown)}</div>
                    </div>
                    <Button
                      onClick={cancelEmergency}
                      className="bg-gray-600 hover:bg-gray-700 text-white h-12 px-6"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="text-center text-white">
                <p className="text-lg mb-4">If this is a false alarm, click Cancel above.</p>
                <p className="text-base text-gray-300">
                  Emergency contacts will be called automatically if no action is taken.
                </p>
              </div>
            </>
          )}

          {currentStep !== 'countdown' && (
            <Alert className="bg-red-500/20 border-red-500/40">
              <Phone className="h-6 w-6 text-red-400 animate-pulse" />
              <AlertDescription className="text-red-200 text-lg">
                <div className="space-y-2">
                  {currentStep === 'calling-primary' && (
                    <div><strong>Calling primary emergency contact...</strong></div>
                  )}
                  {currentStep === 'calling-secondary' && (
                    <div><strong>Calling secondary emergency contact...</strong></div>
                  )}
                  {currentStep === 'calling-911' && (
                    <div><strong>Calling emergency services (911)...</strong></div>
                  )}
                  {currentStep === 'completed' && (
                    <div><strong>Emergency calls completed. Help is on the way.</strong></div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-sm border-red-500/20 hover:border-red-500/40 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-4 text-white text-2xl font-bold">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-3">
            <Shield className="h-8 w-8 text-white" />
          </div>
          Emergency Assistance
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-base px-4 py-2">Ready</Badge>
        </CardTitle>
        <CardDescription className="text-red-200/80 text-lg mt-3">
          Press the emergency button if you need immediate assistance
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button
          onClick={initiateEmergency}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 h-20 px-12 text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <AlertTriangle className="mr-4 h-8 w-8" />
          EMERGENCY
        </Button>
        
        <div className="mt-6 text-sm text-gray-300 space-y-2">
          <p>• 2-minute countdown before automatic calls</p>
          <p>• Calls primary contact → secondary contact → 911</p>
          <p>• GPS location automatically shared</p>
        </div>
      </CardContent>
    </Card>
  );
}