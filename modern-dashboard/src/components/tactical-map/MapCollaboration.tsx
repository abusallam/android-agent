/**
 * Real-time Map Collaboration using LiveKit Data Channels
 * Enables multiple users to collaborate on tactical maps in real-time
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Room, DataPacket_Kind, RemoteParticipant, LocalParticipant } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Radio, 
  Share, 
  Eye, 
  EyeOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare
} from 'lucide-react';

interface MapUpdateData {
  type: 'marker_added' | 'marker_updated' | 'marker_deleted' | 
        'annotation_created' | 'annotation_updated' | 'annotation_deleted' |
        'geofence_created' | 'geofence_updated' | 'geofence_deleted' |
        'view_changed' | 'cursor_moved';
  data: any;
  userId: string;
  userName: string;
  timestamp: number;
  sessionId: string;
}

interface Participant {
  id: string;
  name: string;
  role: 'admin' | 'operator' | 'observer';
  isLocal: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  lastActivity: number;
  cursor?: {
    x: number;
    y: number;
    lat: number;
    lng: number;
  };
}

interface MapCollaborationProps {
  onMapUpdate: (update: MapUpdateData) => void;
  onParticipantJoin: (participant: Participant) => void;
  onParticipantLeave: (participantId: string) => void;
  currentUser: {
    id: string;
    name: string;
    role: 'admin' | 'operator' | 'observer';
  };
  className?: string;
}

export function MapCollaboration({
  onMapUpdate,
  onParticipantJoin,
  onParticipantLeave,
  currentUser,
  className = ''
}: MapCollaborationProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<MapUpdateData | null>(null);

  // Initialize LiveKit room
  const connectToRoom = useCallback(async (token: string, serverUrl: string) => {
    try {
      setConnectionStatus('connecting');
      
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 },
          frameRate: 30,
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up event listeners
      newRoom.on('participantConnected', handleParticipantConnected);
      newRoom.on('participantDisconnected', handleParticipantDisconnected);
      newRoom.on('dataReceived', handleDataReceived);
      newRoom.on('connectionStateChanged', handleConnectionStateChanged);
      newRoom.on('participantMetadataChanged', handleParticipantMetadataChanged);

      await newRoom.connect(serverUrl, token);
      
      setRoom(newRoom);
      setIsConnected(true);
      setConnectionStatus('connected');

      // Add local participant
      const localParticipant: Participant = {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        isLocal: true,
        isAudioEnabled: false,
        isVideoEnabled: false,
        isScreenSharing: false,
        lastActivity: Date.now(),
      };
      
      setParticipants(prev => new Map(prev.set(currentUser.id, localParticipant)));
      onParticipantJoin(localParticipant);

    } catch (error) {
      console.error('Failed to connect to collaboration room:', error);
      setConnectionStatus('disconnected');
    }
  }, [currentUser, onParticipantJoin]);

  // Handle participant connected
  const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
    const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
    
    const newParticipant: Participant = {
      id: participant.identity,
      name: metadata.name || participant.identity,
      role: metadata.role || 'observer',
      isLocal: false,
      isAudioEnabled: participant.isMicrophoneEnabled,
      isVideoEnabled: participant.isCameraEnabled,
      isScreenSharing: participant.isScreenShareEnabled,
      lastActivity: Date.now(),
    };

    setParticipants(prev => new Map(prev.set(participant.identity, newParticipant)));
    onParticipantJoin(newParticipant);
  }, [onParticipantJoin]);

  // Handle participant disconnected
  const handleParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
    setParticipants(prev => {
      const newMap = new Map(prev);
      newMap.delete(participant.identity);
      return newMap;
    });
    onParticipantLeave(participant.identity);
  }, [onParticipantLeave]);

  // Handle data received
  const handleDataReceived = useCallback((payload: Uint8Array, participant?: RemoteParticipant) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(payload)) as MapUpdateData;
      setLastUpdate(data);
      onMapUpdate(data);
    } catch (error) {
      console.error('Failed to parse collaboration data:', error);
    }
  }, [onMapUpdate]);

  // Handle connection state changes
  const handleConnectionStateChanged = useCallback((state: any) => {
    console.log('Connection state changed:', state);
    if (state === 'disconnected') {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  // Handle participant metadata changes
  const handleParticipantMetadataChanged = useCallback((metadata: string, participant: RemoteParticipant) => {
    try {
      const data = JSON.parse(metadata);
      setParticipants(prev => {
        const updated = new Map(prev);
        const existing = updated.get(participant.identity);
        if (existing) {
          updated.set(participant.identity, {
            ...existing,
            ...data,
            lastActivity: Date.now(),
          });
        }
        return updated;
      });
    } catch (error) {
      console.error('Failed to parse participant metadata:', error);
    }
  }, []);

  // Send map update to all participants
  const sendMapUpdate = useCallback((updateData: Omit<MapUpdateData, 'userId' | 'userName' | 'timestamp' | 'sessionId'>) => {
    if (!room || !isConnected) return;

    const fullUpdate: MapUpdateData = {
      ...updateData,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: Date.now(),
      sessionId: room.sid || '',
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(fullUpdate));

    room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
  }, [room, isConnected, currentUser]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (!room) return;

    try {
      if (isAudioEnabled) {
        await room.localParticipant.setMicrophoneEnabled(false);
      } else {
        await room.localParticipant.setMicrophoneEnabled(true);
      }
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  }, [room, isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!room) return;

    try {
      if (isVideoEnabled) {
        await room.localParticipant.setCameraEnabled(false);
      } else {
        await room.localParticipant.setCameraEnabled(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  }, [room, isVideoEnabled]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (!room) return;

    try {
      if (isScreenSharing) {
        await room.localParticipant.setScreenShareEnabled(false);
      } else {
        await room.localParticipant.setScreenShareEnabled(true);
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  }, [room, isScreenSharing]);

  // Disconnect from room
  const disconnect = useCallback(async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setParticipants(new Map());
    }
  }, [room]);

  // Auto-connect on mount (you'll need to provide token and server URL)
  useEffect(() => {
    // This would typically come from your authentication system
    const token = process.env.NEXT_PUBLIC_LIVEKIT_TOKEN;
    const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    
    if (token && serverUrl) {
      connectToRoom(token, serverUrl);
    }

    return () => {
      disconnect();
    };
  }, [connectToRoom, disconnect]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <Card className="p-3 bg-black/80 border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium text-white">
              {connectionStatus === 'connected' ? 'Live Collaboration' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
            </span>
          </div>
          
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {participants.size} participant{participants.size !== 1 ? 's' : ''}
          </Badge>
        </div>
      </Card>

      {/* Participants List */}
      {isConnected && (
        <Card className="p-3 bg-black/80 border-gray-700">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-white">Active Participants</span>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Array.from(participants.values()).map((participant) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {participant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white">
                      {participant.name}
                      {participant.isLocal && ' (You)'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {participant.role}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {participant.isAudioEnabled ? (
                      <Mic className="h-3 w-3 text-green-400" />
                    ) : (
                      <MicOff className="h-3 w-3 text-gray-500" />
                    )}
                    {participant.isVideoEnabled ? (
                      <Video className="h-3 w-3 text-green-400" />
                    ) : (
                      <VideoOff className="h-3 w-3 text-gray-500" />
                    )}
                    {participant.isScreenSharing && (
                      <Share className="h-3 w-3 text-blue-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Media Controls */}
      {isConnected && (
        <Card className="p-3 bg-black/80 border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Media Controls</span>
            
            <div className="flex space-x-2">
              <Button
                variant={isAudioEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={toggleAudio}
                className="h-8 w-8 p-0"
              >
                {isAudioEnabled ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant={isVideoEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={toggleVideo}
                className="h-8 w-8 p-0"
              >
                {isVideoEnabled ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <VideoOff className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant={isScreenSharing ? 'default' : 'outline'}
                size="sm"
                onClick={toggleScreenShare}
                className="h-8 w-8 p-0"
              >
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {lastUpdate && (
        <Card className="p-3 bg-black/80 border-gray-700">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-white">Recent Activity</span>
            </div>
            
            <div className="text-xs text-gray-300">
              <div className="flex justify-between">
                <span>{lastUpdate.userName}</span>
                <span>{new Date(lastUpdate.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-gray-400 mt-1">
                {lastUpdate.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default MapCollaboration;