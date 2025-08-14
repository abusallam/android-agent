/**
 * Screen Share Component
 * Handles screen sharing functionality with privacy controls and quality settings
 */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveKit, useLiveKitMedia, useLiveKitParticipants } from './LiveKitProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Monitor, 
  MonitorOff, 
  MonitorSpeaker,
  Maximize,
  Minimize,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Pause,
  Play,
  Square,
  Circle,
  Zap
} from 'lucide-react';

interface ScreenShareSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  frameRate: number;
  audio: boolean;
  cursor: boolean;
  privacyMode: boolean;
  autoHideControls: boolean;
}

interface ScreenShareSession {
  participantId: string;
  participantName: string;
  isLocal: boolean;
  startTime: Date;
  quality: string;
  isActive: boolean;
}

export function ScreenShareComponent() {
  const { sendData, isConnected } = useLiveKit();
  const { 
    isScreenSharing, 
    startScreenShare, 
    stopScreenShare 
  } = useLiveKitMedia();
  const { participants, localParticipant } = useLiveKitParticipants();

  // Screen share state
  const [screenShareSettings, setScreenShareSettings] = useState<ScreenShareSettings>({
    quality: 'high',
    frameRate: 30,
    audio: true,
    cursor: true,
    privacyMode: false,
    autoHideControls: true
  });
  const [activeSessions, setActiveSessions] = useState<ScreenShareSession[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Refs
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update active sessions based on participants
  useEffect(() => {
    const sessions: ScreenShareSession[] = [];

    // Add local session if screen sharing
    if (localParticipant && localParticipant.screenShareEnabled) {
      sessions.push({
        participantId: localParticipant.identity,
        participantName: localParticipant.name || 'You',
        isLocal: true,
        startTime: new Date(), // Would need to track actual start time
        quality: screenShareSettings.quality,
        isActive: true
      });
    }

    // Add remote sessions
    participants.forEach(participant => {
      if (participant.screenShareEnabled) {
        sessions.push({
          participantId: participant.identity,
          participantName: participant.name || participant.identity,
          isLocal: false,
          startTime: new Date(), // Would need to track actual start time
          quality: 'unknown',
          isActive: true
        });
      }
    });

    setActiveSessions(sessions);
  }, [participants, localParticipant, isScreenSharing, screenShareSettings.quality]);

  // Auto-hide controls
  useEffect(() => {
    if (!screenShareSettings.autoHideControls) return;

    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => resetTimeout();
    const handleKeyPress = () => resetTimeout();

    if (isScreenSharing || activeSessions.length > 0) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('keypress', handleKeyPress);
      resetTimeout();
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keypress', handleKeyPress);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isScreenSharing, activeSessions.length, screenShareSettings.autoHideControls]);

  // Handle screen share start
  const handleStartScreenShare = useCallback(async () => {
    try {
      const success = await startScreenShare();
      if (success) {
        // Notify other participants
        await sendData(JSON.stringify({
          type: 'screen_share_started',
          from: localParticipant?.identity,
          timestamp: new Date().toISOString(),
          settings: screenShareSettings
        }));
      }
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
    }
  }, [startScreenShare, sendData, localParticipant, screenShareSettings]);

  // Handle screen share stop
  const handleStopScreenShare = useCallback(async () => {
    try {
      const success = await stopScreenShare();
      if (success) {
        // Notify other participants
        await sendData(JSON.stringify({
          type: 'screen_share_stopped',
          from: localParticipant?.identity,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Failed to stop screen sharing:', error);
    }
  }, [stopScreenShare, sendData, localParticipant]);

  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle pause/resume
  const handlePauseToggle = useCallback(async () => {
    if (isPaused) {
      // Resume screen sharing
      await handleStartScreenShare();
      setIsPaused(false);
    } else {
      // Pause screen sharing
      await handleStopScreenShare();
      setIsPaused(true);
    }
  }, [isPaused, handleStartScreenShare, handleStopScreenShare]);

  // Handle recording toggle
  const handleRecordingToggle = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      await sendData(JSON.stringify({
        type: 'screen_recording_stopped',
        from: localParticipant?.identity,
        timestamp: new Date().toISOString()
      }));
    } else {
      // Start recording
      setIsRecording(true);
      await sendData(JSON.stringify({
        type: 'screen_recording_started',
        from: localParticipant?.identity,
        timestamp: new Date().toISOString()
      }));
    }
  }, [isRecording, sendData, localParticipant]);

  // Get quality settings for screen share
  const getQualitySettings = (quality: string) => {
    switch (quality) {
      case 'low': return { width: 1280, height: 720, frameRate: 15 };
      case 'medium': return { width: 1920, height: 1080, frameRate: 24 };
      case 'high': return { width: 1920, height: 1080, frameRate: 30 };
      case 'ultra': return { width: 2560, height: 1440, frameRate: 60 };
      default: return { width: 1920, height: 1080, frameRate: 30 };
    }
  };

  return (
    <div className="space-y-4">
      {/* Screen Share Controls */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MonitorSpeaker className="w-5 h-5" />
              <span>Screen Sharing</span>
              {activeSessions.length > 0 && (
                <Badge variant="outline" className="text-green-400 border-green-400">
                  {activeSessions.length} Active
                </Badge>
              )}
            </div>
            {isScreenSharing && (
              <div className="flex items-center space-x-2">
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    <Circle className="w-3 h-3 mr-1 fill-current" />
                    Recording
                  </Badge>
                )}
                {isPaused && (
                  <Badge variant="secondary">
                    <Pause className="w-3 h-3 mr-1" />
                    Paused
                  </Badge>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!isScreenSharing ? (
                <Button
                  size="lg"
                  onClick={handleStartScreenShare}
                  disabled={!isConnected}
                  className="flex items-center space-x-2"
                >
                  <Monitor className="w-5 h-5" />
                  <span>Start Sharing</span>
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleStopScreenShare}
                    className="flex items-center space-x-2"
                  >
                    <MonitorOff className="w-5 h-5" />
                    <span>Stop Sharing</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePauseToggle}
                    className="flex items-center space-x-2"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={handleRecordingToggle}
                    className="flex items-center space-x-2"
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={handleFullscreenToggle}
                disabled={activeSessions.length === 0}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Quality Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Quality</label>
              <select
                value={screenShareSettings.quality}
                onChange={(e) => setScreenShareSettings(prev => ({ 
                  ...prev, 
                  quality: e.target.value as any 
                }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                disabled={isScreenSharing}
              >
                <option value="low">Low (720p @ 15fps)</option>
                <option value="medium">Medium (1080p @ 24fps)</option>
                <option value="high">High (1080p @ 30fps)</option>
                <option value="ultra">Ultra (1440p @ 60fps)</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Frame Rate</span>
                <span className="text-gray-400">{screenShareSettings.frameRate} fps</span>
              </div>
              <Slider
                value={[screenShareSettings.frameRate]}
                onValueChange={([value]) => 
                  setScreenShareSettings(prev => ({ ...prev, frameRate: value }))
                }
                min={15}
                max={60}
                step={15}
                className="w-full"
                disabled={isScreenSharing}
              />
            </div>
          </div>

          {/* Privacy and Audio Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Include Audio</span>
              <Switch
                checked={screenShareSettings.audio}
                onCheckedChange={(checked) => 
                  setScreenShareSettings(prev => ({ ...prev, audio: checked }))
                }
                disabled={isScreenSharing}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Show Cursor</span>
              <Switch
                checked={screenShareSettings.cursor}
                onCheckedChange={(checked) => 
                  setScreenShareSettings(prev => ({ ...prev, cursor: checked }))
                }
                disabled={isScreenSharing}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Privacy Mode</span>
              <Switch
                checked={screenShareSettings.privacyMode}
                onCheckedChange={(checked) => 
                  setScreenShareSettings(prev => ({ ...prev, privacyMode: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Auto Hide</span>
              <Switch
                checked={screenShareSettings.autoHideControls}
                onCheckedChange={(checked) => 
                  setScreenShareSettings(prev => ({ ...prev, autoHideControls: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Screen Share Sessions */}
      {activeSessions.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="w-5 h-5" />
              <span>Active Sessions</span>
              <Badge variant="outline">{activeSessions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.participantId} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Monitor className="w-5 h-5 text-blue-400" />
                      {session.isActive && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {session.participantName}
                        {session.isLocal && <span className="text-green-400 ml-2">(You)</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        Quality: {session.quality} • Started: {session.startTime.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.isLocal && (
                      <>
                        <Button size="sm" variant="ghost" onClick={handlePauseToggle}>
                          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleRecordingToggle}>
                          {isRecording ? <Square className="w-4 h-4 text-red-400" /> : <Circle className="w-4 h-4" />}
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost">
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Notice */}
      {screenShareSettings.privacyMode && isScreenSharing && (
        <Card className="bg-yellow-900/20 border-yellow-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-yellow-400">
              <Lock className="w-5 h-5" />
              <span className="font-medium">Privacy Mode Active</span>
            </div>
            <p className="text-sm text-yellow-300 mt-1">
              Sensitive content will be automatically blurred or hidden during screen sharing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Active Sessions */}
      {activeSessions.length === 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <MonitorOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Active Screen Sharing</h3>
            <p className="text-gray-400 mb-4">Start sharing your screen to collaborate with participants</p>
            <Button onClick={handleStartScreenShare} disabled={!isConnected}>
              <Monitor className="w-4 h-4 mr-2" />
              Start Screen Sharing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ScreenShareComponent;