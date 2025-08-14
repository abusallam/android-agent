/**
 * Emergency Communication System
 * Handles emergency sessions, priority override, and incident recording
 */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveKit, useLiveKitMedia, useLiveKitParticipants } from './LiveKitProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Zap, 
  Shield, 
  Radio,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Clock,
  FileText,
  Users,
  Volume2,
  VolumeX,
  Circle,
  Square,
  Play,
  Pause,
  MapPin,
  Calendar
} from 'lucide-react';

interface EmergencySession {
  id: string;
  type: 'medical' | 'security' | 'fire' | 'evacuation' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  initiator: string;
  participants: string[];
  startTime: Date;
  status: 'active' | 'resolved' | 'escalated';
  description: string;
  location?: string;
  recordingEnabled: boolean;
}

interface EmergencyAlert {
  id: string;
  type: string;
  message: string;
  from: string;
  timestamp: Date;
  acknowledged: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface IncidentReport {
  id: string;
  sessionId: string;
  type: string;
  description: string;
  participants: string[];
  startTime: Date;
  endTime?: Date;
  actions: string[];
  outcome: string;
  recordingPath?: string;
}

export function EmergencyCommSystem() {
  const { sendData, isConnected } = useLiveKit();
  const { 
    isMicrophoneEnabled, 
    isCameraEnabled,
    toggleMicrophone, 
    toggleCamera 
  } = useLiveKitMedia();
  const { participants, localParticipant } = useLiveKitParticipants();

  // Emergency state
  const [activeSession, setActiveSession] = useState<EmergencySession | null>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [priorityOverride, setPriorityOverride] = useState(false);
  const [autoRecord, setAutoRecord] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  // Form state
  const [emergencyType, setEmergencyType] = useState<EmergencySession['type']>('general');
  const [emergencyPriority, setEmergencyPriority] = useState<EmergencySession['priority']>('medium');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [emergencyLocation, setEmergencyLocation] = useState('');

  // Refs
  const alertSoundRef = useRef<HTMLAudioElement | null>(null);
  const recordingRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize alert sound
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const createAlertSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };
    
    alertSoundRef.current = { play: createAlertSound } as any;
  }, []);

  // Handle incoming emergency data
  useEffect(() => {
    // This would be connected to the LiveKit data channel
    const handleEmergencyData = (data: any) => {
      try {
        const parsed = JSON.parse(data);
        switch (parsed.type) {
          case 'emergency_session_started':
            handleIncomingEmergencySession(parsed.session);
            break;
          case 'emergency_alert':
            handleIncomingAlert(parsed.alert);
            break;
          case 'emergency_session_ended':
            handleSessionEnded(parsed.sessionId);
            break;
          case 'priority_override':
            handlePriorityOverride(parsed);
            break;
        }
      } catch (error) {
        console.error('Failed to parse emergency data:', error);
      }
    };

    // In a real implementation, this would be connected to LiveKit data events
  }, []);

  // Start emergency session
  const startEmergencySession = useCallback(async () => {
    if (!isConnected || !localParticipant) return;

    const session: EmergencySession = {
      id: `emergency_${Date.now()}`,
      type: emergencyType,
      priority: emergencyPriority,
      initiator: localParticipant.identity,
      participants: [localParticipant.identity],
      startTime: new Date(),
      status: 'active',
      description: emergencyDescription,
      location: emergencyLocation,
      recordingEnabled: autoRecord
    };

    setActiveSession(session);
    setIsEmergencyMode(true);

    // Enable priority override for critical emergencies
    if (emergencyPriority === 'critical') {
      setPriorityOverride(true);
      // Force enable microphone and camera
      if (!isMicrophoneEnabled) await toggleMicrophone(true);
      if (!isCameraEnabled) await toggleCamera(true);
    }

    // Start recording if enabled
    if (autoRecord) {
      await startRecording();
    }

    // Broadcast emergency session to all participants
    await sendData(JSON.stringify({
      type: 'emergency_session_started',
      session,
      timestamp: new Date().toISOString()
    }));

    // Play alert sound
    if (alertSoundRef.current) {
      alertSoundRef.current.play();
    }

    console.log('🚨 Emergency session started:', session);
  }, [
    isConnected, 
    localParticipant, 
    emergencyType, 
    emergencyPriority, 
    emergencyDescription, 
    emergencyLocation, 
    autoRecord,
    isMicrophoneEnabled,
    isCameraEnabled,
    toggleMicrophone,
    toggleCamera,
    sendData
  ]);

  // End emergency session
  const endEmergencySession = useCallback(async () => {
    if (!activeSession) return;

    // Stop recording
    if (isRecording) {
      await stopRecording();
    }

    // Create incident report
    const report: IncidentReport = {
      id: `report_${Date.now()}`,
      sessionId: activeSession.id,
      type: activeSession.type,
      description: activeSession.description,
      participants: activeSession.participants,
      startTime: activeSession.startTime,
      endTime: new Date(),
      actions: [], // Would be populated with actions taken during session
      outcome: 'Session ended by user',
      recordingPath: isRecording ? `/recordings/${activeSession.id}.webm` : undefined
    };

    setIncidentReports(prev => [...prev, report]);

    // Broadcast session end
    await sendData(JSON.stringify({
      type: 'emergency_session_ended',
      sessionId: activeSession.id,
      timestamp: new Date().toISOString()
    }));

    // Reset state
    setActiveSession(null);
    setIsEmergencyMode(false);
    setPriorityOverride(false);
    setIsRecording(false);

    console.log('🚨 Emergency session ended:', report);
  }, [activeSession, isRecording, sendData]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      recordingRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      recordingRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recordingRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // In a real implementation, this would be uploaded to a server
        console.log('Recording saved:', url);
      };

      recordingRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (recordingRef.current && recordingRef.current.state !== 'inactive') {
      recordingRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  // Handle incoming emergency session
  const handleIncomingEmergencySession = useCallback((session: EmergencySession) => {
    setActiveSession(session);
    setIsEmergencyMode(true);
    
    // Play alert sound
    if (alertSoundRef.current) {
      alertSoundRef.current.play();
    }

    // Add alert
    const alert: EmergencyAlert = {
      id: `alert_${Date.now()}`,
      type: 'emergency_session',
      message: `Emergency session started: ${session.type}`,
      from: session.initiator,
      timestamp: new Date(),
      acknowledged: false,
      priority: session.priority
    };

    setEmergencyAlerts(prev => [...prev, alert]);
  }, []);

  // Handle incoming alert
  const handleIncomingAlert = useCallback((alert: EmergencyAlert) => {
    setEmergencyAlerts(prev => [...prev, alert]);
    
    // Play alert sound for high priority alerts
    if (alert.priority === 'high' || alert.priority === 'critical') {
      if (alertSoundRef.current) {
        alertSoundRef.current.play();
      }
    }
  }, []);

  // Handle session ended
  const handleSessionEnded = useCallback((sessionId: string) => {
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
      setIsEmergencyMode(false);
      setPriorityOverride(false);
      setIsRecording(false);
    }
  }, [activeSession]);

  // Handle priority override
  const handlePriorityOverride = useCallback((data: any) => {
    setPriorityOverride(data.enabled);
    
    if (data.enabled) {
      // Force enable audio/video
      if (!isMicrophoneEnabled) toggleMicrophone(true);
      if (!isCameraEnabled) toggleCamera(true);
    }
  }, [isMicrophoneEnabled, isCameraEnabled, toggleMicrophone, toggleCamera]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setEmergencyAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  }, []);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 border-red-500';
      case 'high': return 'text-orange-500 border-orange-500';
      case 'medium': return 'text-yellow-500 border-yellow-500';
      case 'low': return 'text-green-500 border-green-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return <AlertTriangle className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'fire': return <Zap className="w-4 h-4" />;
      case 'evacuation': return <Users className="w-4 h-4" />;
      default: return <Radio className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Emergency Status */}
      {isEmergencyMode && activeSession && (
        <Card className="bg-red-900/20 border-red-600">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>EMERGENCY SESSION ACTIVE</span>
              <Badge variant="destructive" className="animate-pulse">
                {activeSession.priority.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400">Type</p>
                <div className="flex items-center space-x-2 text-white">
                  {getTypeIcon(activeSession.type)}
                  <span className="capitalize">{activeSession.type}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p className="text-white">
                  {Math.floor((Date.now() - activeSession.startTime.getTime()) / 60000)} minutes
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Participants</p>
                <p className="text-white">{activeSession.participants.length}</p>
              </div>
            </div>
            
            {activeSession.description && (
              <div>
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-white">{activeSession.description}</p>
              </div>
            )}

            {activeSession.location && (
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <div className="flex items-center space-x-2 text-white">
                  <MapPin className="w-4 h-4" />
                  <span>{activeSession.location}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    <Circle className="w-3 h-3 mr-1 fill-current" />
                    Recording
                  </Badge>
                )}
                {priorityOverride && (
                  <Badge variant="outline" className="text-orange-400 border-orange-400">
                    Priority Override
                  </Badge>
                )}
              </div>
              <Button
                variant="destructive"
                onClick={endEmergencySession}
                className="flex items-center space-x-2"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Emergency</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Controls */}
      {!isEmergencyMode && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Emergency Communication</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency-type">Emergency Type</Label>
                <Select value={emergencyType} onValueChange={(value: any) => setEmergencyType(value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue placeholder="Select emergency type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="medical">Medical Emergency</SelectItem>
                    <SelectItem value="security">Security Incident</SelectItem>
                    <SelectItem value="fire">Fire Emergency</SelectItem>
                    <SelectItem value="evacuation">Evacuation</SelectItem>
                    <SelectItem value="general">General Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency-priority">Priority Level</Label>
                <Select value={emergencyPriority} onValueChange={(value: any) => setEmergencyPriority(value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="critical">Critical Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-location">Location (Optional)</Label>
              <Input
                id="emergency-location"
                value={emergencyLocation}
                onChange={(e) => setEmergencyLocation(e.target.value)}
                placeholder="Enter location details"
                className="bg-gray-800 border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-description">Description</Label>
              <Textarea
                id="emergency-description"
                value={emergencyDescription}
                onChange={(e) => setEmergencyDescription(e.target.value)}
                placeholder="Describe the emergency situation..."
                className="bg-gray-800 border-gray-600"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoRecord}
                  onCheckedChange={setAutoRecord}
                />
                <span className="text-sm text-gray-300">Auto-record session</span>
              </div>
              <Button
                variant="destructive"
                onClick={startEmergencySession}
                disabled={!isConnected || !emergencyDescription.trim()}
                className="flex items-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Start Emergency Session</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Alerts */}
      {emergencyAlerts.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Emergency Alerts</span>
              <Badge variant="outline">{emergencyAlerts.filter(a => !a.acknowledged).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyAlerts.slice(-5).map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${alert.acknowledged ? 'bg-gray-800 border-gray-600' : 'bg-red-900/20 border-red-600'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-1 ${getPriorityColor(alert.priority)}`}>
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">{alert.priority}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{alert.message}</p>
                        <p className="text-xs text-gray-400">
                          From: {alert.from} • {alert.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incident Reports */}
      {incidentReports.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Incident Reports</span>
              <Badge variant="outline">{incidentReports.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidentReports.slice(-3).map((report) => (
                <div key={report.id} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(report.type)}
                      <span className="font-medium text-white capitalize">{report.type}</span>
                      <Badge variant="secondary" className="text-xs">
                        {report.participants.length} participants
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{report.startTime.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{report.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Duration: {report.endTime ? Math.floor((report.endTime.getTime() - report.startTime.getTime()) / 60000) : 0} minutes</span>
                    {report.recordingPath && (
                      <Badge variant="outline" className="text-xs">
                        Recorded
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EmergencyCommSystem;