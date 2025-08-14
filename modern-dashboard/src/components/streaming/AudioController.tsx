/**
 * Audio Controller Component
 * Manages audio communication, push-to-talk, and audio level monitoring
 */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveKit, useLiveKitMedia, useLiveKitParticipants } from './LiveKitProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Headphones,
  Radio,
  Settings,
  Zap,
  Users,
  Activity
} from 'lucide-react';

interface AudioLevel {
  participantId: string;
  level: number;
  isSpeaking: boolean;
}

interface AudioSettings {
  inputVolume: number;
  outputVolume: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  pushToTalkEnabled: boolean;
  pushToTalkKey: string;
}

export function AudioController() {
  const { sendData, isConnected } = useLiveKit();
  const { 
    isMicrophoneEnabled, 
    toggleMicrophone 
  } = useLiveKitMedia();
  const { participants, localParticipant } = useLiveKitParticipants();

  // Audio state
  const [audioLevels, setAudioLevels] = useState<AudioLevel[]>([]);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    inputVolume: 80,
    outputVolume: 70,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    pushToTalkEnabled: false,
    pushToTalkKey: 'Space'
  });
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio monitoring
  useEffect(() => {
    if (!isConnected || !isMicrophoneEnabled) return;

    const initializeAudioMonitoring = async () => {
      try {
        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: audioSettings.echoCancellation,
            noiseSuppression: audioSettings.noiseSuppression,
            autoGainControl: audioSettings.autoGainControl
          } 
        });
        micStreamRef.current = stream;

        // Create audio context and analyser
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;

        // Start monitoring audio levels
        monitorAudioLevels();
      } catch (error) {
        console.error('Failed to initialize audio monitoring:', error);
      }
    };

    initializeAudioMonitoring();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isConnected, isMicrophoneEnabled, audioSettings]);

  // Monitor audio levels
  const monitorAudioLevels = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = (average / 255) * 100;

    // Update local participant audio level
    if (localParticipant) {
      setAudioLevels(prev => {
        const updated = prev.filter(level => level.participantId !== localParticipant.identity);
        return [
          ...updated,
          {
            participantId: localParticipant.identity,
            level: normalizedLevel,
            isSpeaking: normalizedLevel > 10 // Threshold for speaking detection
          }
        ];
      });
    }

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevels);
  }, [localParticipant]);

  // Push-to-talk functionality
  useEffect(() => {
    if (!audioSettings.pushToTalkEnabled) return;

    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.code === audioSettings.pushToTalkKey && !isPushToTalkActive) {
        setIsPushToTalkActive(true);
        if (!isMicrophoneEnabled) {
          await toggleMicrophone(true);
        }
      }
    };

    const handleKeyUp = async (event: KeyboardEvent) => {
      if (event.code === audioSettings.pushToTalkKey && isPushToTalkActive) {
        setIsPushToTalkActive(false);
        if (isMicrophoneEnabled) {
          await toggleMicrophone(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [audioSettings.pushToTalkEnabled, audioSettings.pushToTalkKey, isPushToTalkActive, isMicrophoneEnabled, toggleMicrophone]);

  // Handle microphone toggle
  const handleMicrophoneToggle = useCallback(async () => {
    if (audioSettings.pushToTalkEnabled) {
      // In push-to-talk mode, just toggle the setting
      setAudioSettings(prev => ({ ...prev, pushToTalkEnabled: false }));
    } else {
      await toggleMicrophone();
    }
  }, [audioSettings.pushToTalkEnabled, toggleMicrophone]);

  // Handle push-to-talk toggle
  const handlePushToTalkToggle = useCallback(async () => {
    const newPushToTalkEnabled = !audioSettings.pushToTalkEnabled;
    setAudioSettings(prev => ({ ...prev, pushToTalkEnabled: newPushToTalkEnabled }));

    if (newPushToTalkEnabled && isMicrophoneEnabled) {
      // Disable microphone when enabling push-to-talk
      await toggleMicrophone(false);
    }
  }, [audioSettings.pushToTalkEnabled, isMicrophoneEnabled, toggleMicrophone]);

  // Send emergency audio alert
  const handleEmergencyAlert = useCallback(async () => {
    if (!isConnected) return;

    const alertData = {
      type: 'emergency_audio_alert',
      from: localParticipant?.identity,
      timestamp: new Date().toISOString(),
      message: 'Emergency audio alert activated'
    };

    await sendData(JSON.stringify(alertData));

    // Force enable microphone for emergency
    if (!isMicrophoneEnabled) {
      await toggleMicrophone(true);
    }
  }, [isConnected, localParticipant, sendData, isMicrophoneEnabled, toggleMicrophone]);

  // Get audio level for participant
  const getAudioLevel = (participantId: string): number => {
    const level = audioLevels.find(l => l.participantId === participantId);
    return level?.level || 0;
  };

  // Get speaking status for participant
  const isSpeaking = (participantId: string): boolean => {
    const level = audioLevels.find(l => l.participantId === participantId);
    return level?.isSpeaking || false;
  };

  return (
    <div className="space-y-4">
      {/* Main Audio Controls */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Headphones className="w-5 h-5" />
            <span>Audio Communication</span>
            {isConnected && (
              <Badge variant="outline" className="text-green-400 border-green-400">
                Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                size="lg"
                variant={isMicrophoneEnabled ? "default" : "destructive"}
                onClick={handleMicrophoneToggle}
                className="relative"
              >
                {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                {isPushToTalkActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={audioSettings.pushToTalkEnabled}
                  onCheckedChange={handlePushToTalkToggle}
                />
                <span className="text-sm text-gray-300">Push to Talk</span>
                {audioSettings.pushToTalkEnabled && (
                  <Badge variant="secondary" className="text-xs">
                    {audioSettings.pushToTalkKey}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleEmergencyAlert}
              className="flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Emergency</span>
            </Button>
          </div>

          {/* Audio Levels */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Input Level</span>
              <span>{Math.round(getAudioLevel(localParticipant?.identity || ''))}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-100 ${
                  isSpeaking(localParticipant?.identity || '') 
                    ? 'bg-green-500' 
                    : 'bg-gray-500'
                }`}
                style={{ width: `${getAudioLevel(localParticipant?.identity || '')}%` }}
              />
            </div>
          </div>

          {/* Volume Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Input Volume</span>
                <span className="text-gray-400">{audioSettings.inputVolume}%</span>
              </div>
              <Slider
                value={[audioSettings.inputVolume]}
                onValueChange={([value]) => 
                  setAudioSettings(prev => ({ ...prev, inputVolume: value }))
                }
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Output Volume</span>
                <span className="text-gray-400">{audioSettings.outputVolume}%</span>
              </div>
              <Slider
                value={[audioSettings.outputVolume]}
                onValueChange={([value]) => 
                  setAudioSettings(prev => ({ ...prev, outputVolume: value }))
                }
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participant Audio Status */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Participant Audio</span>
            <Badge variant="outline">{participants.length + (localParticipant ? 1 : 0)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Local Participant */}
            {localParticipant && (
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {localParticipant.audioEnabled ? (
                      <Mic className="w-5 h-5 text-green-400" />
                    ) : (
                      <MicOff className="w-5 h-5 text-red-400" />
                    )}
                    {isSpeaking(localParticipant.identity) && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{localParticipant.name || 'You'}</p>
                    <p className="text-xs text-gray-400">Local</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-700 rounded-full h-1">
                    <div 
                      className="h-1 bg-green-500 rounded-full transition-all duration-100"
                      style={{ width: `${getAudioLevel(localParticipant.identity)}%` }}
                    />
                  </div>
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}

            {/* Remote Participants */}
            {participants.map((participant) => (
              <div key={participant.identity} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {participant.audioEnabled ? (
                      <Mic className="w-5 h-5 text-green-400" />
                    ) : (
                      <MicOff className="w-5 h-5 text-red-400" />
                    )}
                    {participant.isSpeaking && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{participant.name || participant.identity}</p>
                    <p className="text-xs text-gray-400 capitalize">{participant.connectionQuality}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-700 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-100 ${
                        participant.isSpeaking ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                      style={{ width: participant.isSpeaking ? '80%' : '20%' }}
                    />
                  </div>
                  <Button size="sm" variant="ghost">
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {participants.length === 0 && !localParticipant && (
              <div className="text-center py-8 text-gray-400">
                <Radio className="w-8 h-8 mx-auto mb-2" />
                <p>No participants in audio session</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Audio Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Noise Suppression</span>
              <Switch
                checked={audioSettings.noiseSuppression}
                onCheckedChange={(checked) => 
                  setAudioSettings(prev => ({ ...prev, noiseSuppression: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Echo Cancellation</span>
              <Switch
                checked={audioSettings.echoCancellation}
                onCheckedChange={(checked) => 
                  setAudioSettings(prev => ({ ...prev, echoCancellation: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Auto Gain Control</span>
              <Switch
                checked={audioSettings.autoGainControl}
                onCheckedChange={(checked) => 
                  setAudioSettings(prev => ({ ...prev, autoGainControl: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AudioController;