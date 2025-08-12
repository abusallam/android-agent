"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client';

interface LiveKitContextType {
  room: Room | null;
  isConnected: boolean;
  isConnecting: boolean;
  participants: (RemoteParticipant | LocalParticipant)[];
  error: string | null;
  connect: (token: string, serverUrl: string, roomName: string) => Promise<void>;
  disconnect: () => void;
  startVideoCall: (deviceId: string) => Promise<void>;
  startAudioCall: (deviceId: string) => Promise<void>;
  startScreenShare: (deviceId: string) => Promise<void>;
  startEmergencyCall: (deviceId: string) => Promise<void>;
}

const LiveKitContext = createContext<LiveKitContextType | null>(null);

export function LiveKitProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<(RemoteParticipant | LocalParticipant)[]>([]);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (token: string, serverUrl: string, roomName: string) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const newRoom = new Room();
      
      // Set up event listeners
      newRoom.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room');
        setIsConnected(true);
        setIsConnecting(false);
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from LiveKit room');
        setIsConnected(false);
        setParticipants([]);
      });

      newRoom.on(RoomEvent.ParticipantConnected, () => {
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        updateParticipants(newRoom);
      });

      // Connect to room
      await newRoom.connect(serverUrl, token);
      setRoom(newRoom);

    } catch (err) {
      console.error('Failed to connect to LiveKit room:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected]);

  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
    }
  }, [room]);

  const updateParticipants = (room: Room) => {
    const allParticipants = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
    setParticipants(allParticipants);
  };

  const generateToken = async (deviceId: string, sessionType: string) => {
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        roomName: `${sessionType}-${deviceId}-${Date.now()}`,
        isAdmin: true,
        sessionType
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate LiveKit token');
    }

    return response.json();
  };

  const startVideoCall = useCallback(async (deviceId: string) => {
    try {
      const tokenData = await generateToken(deviceId, 'video');
      await connect(tokenData.token, tokenData.serverUrl, tokenData.roomName);
      
      // Enable camera and microphone
      if (room) {
        await room.localParticipant.enableCameraAndMicrophone();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start video call');
    }
  }, [connect, room]);

  const startAudioCall = useCallback(async (deviceId: string) => {
    try {
      const tokenData = await generateToken(deviceId, 'audio');
      await connect(tokenData.token, tokenData.serverUrl, tokenData.roomName);
      
      // Enable microphone only
      if (room) {
        await room.localParticipant.setMicrophoneEnabled(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start audio call');
    }
  }, [connect, room]);

  const startScreenShare = useCallback(async (deviceId: string) => {
    try {
      const tokenData = await generateToken(deviceId, 'screen');
      await connect(tokenData.token, tokenData.serverUrl, tokenData.roomName);
      
      // Enable screen share
      if (room) {
        await room.localParticipant.setScreenShareEnabled(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start screen share');
    }
  }, [connect, room]);

  const startEmergencyCall = useCallback(async (deviceId: string) => {
    try {
      const tokenData = await generateToken(deviceId, 'emergency');
      await connect(tokenData.token, tokenData.serverUrl, tokenData.roomName);
      
      // Enable camera and microphone for emergency
      if (room) {
        await room.localParticipant.enableCameraAndMicrophone();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start emergency call');
    }
  }, [connect, room]);

  const value: LiveKitContextType = {
    room,
    isConnected,
    isConnecting,
    participants,
    error,
    connect,
    disconnect,
    startVideoCall,
    startAudioCall,
    startScreenShare,
    startEmergencyCall
  };

  return (
    <LiveKitContext.Provider value={value}>
      {children}
    </LiveKitContext.Provider>
  );
}

export function useLiveKit() {
  const context = useContext(LiveKitContext);
  if (!context) {
    throw new Error('useLiveKit must be used within a LiveKitProvider');
  }
  return context;
}