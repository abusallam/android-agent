/**
 * LiveKit Provider Component
 * Provides LiveKit context and connection management for streaming features
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { RemoteParticipant, RemoteVideoTrack, RemoteAudioTrack } from 'livekit-client';
import { LiveKitConnectionManager, type StreamingSession, type ConnectionManagerEvents } from '@/lib/livekit-connection';
import { detectWebRTCSupport, type StreamingCapabilities } from '@/lib/livekit-config';

interface LiveKitContextType {
  connectionManager: LiveKitConnectionManager | null;
  currentSession: StreamingSession | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  capabilities: StreamingCapabilities;
  connect: (deviceId: string, sessionType?: string, isAdmin?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  publishCamera: () => Promise<void>;
  publishMicrophone: () => Promise<void>;
  publishScreen: () => Promise<void>;
  stopCamera: () => Promise<void>;
  stopMicrophone: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
}

const LiveKitContext = createContext<LiveKitContextType | null>(null);

export const useLiveKit = () => {
  const context = useContext(LiveKitContext);
  if (!context) {
    throw new Error('useLiveKit must be used within a LiveKitProvider');
  }
  return context;
};

interface LiveKitProviderProps {
  children: React.ReactNode;
}

export const LiveKitProvider: React.FC<LiveKitProviderProps> = ({ children }) => {
  const [connectionManager, setConnectionManager] = useState<LiveKitConnectionManager | null>(null);
  const [currentSession, setCurrentSession] = useState<StreamingSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities] = useState<StreamingCapabilities>(detectWebRTCSupport());

  // Initialize connection manager
  useEffect(() => {
    const eventHandlers: ConnectionManagerEvents = {
      onConnected: () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        console.log('LiveKit connected successfully');
      },
      onDisconnected: () => {
        setIsConnected(false);
        setIsConnecting(false);
        setCurrentSession(null);
        console.log('LiveKit disconnected');
      },
      onParticipantConnected: (participant: RemoteParticipant) => {
        console.log('Participant joined:', participant.identity);
      },
      onParticipantDisconnected: (participant: RemoteParticipant) => {
        console.log('Participant left:', participant.identity);
      },
      onTrackSubscribed: (track: RemoteVideoTrack | RemoteAudioTrack, participant: RemoteParticipant) => {
        console.log('Track subscribed:', track.kind, 'from', participant.identity);
      },
      onTrackUnsubscribed: (track: RemoteVideoTrack | RemoteAudioTrack, participant: RemoteParticipant) => {
        console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
      },
      onError: (error: Error) => {
        setError(error.message);
        setIsConnecting(false);
        console.error('LiveKit error:', error);
      },
      onConnectionQualityChanged: (quality: number) => {
        console.log('Connection quality:', quality);
      },
    };

    const manager = new LiveKitConnectionManager(eventHandlers);
    setConnectionManager(manager);

    return () => {
      manager.disconnect();
    };
  }, []);

  // Update current session when connection manager changes
  useEffect(() => {
    if (connectionManager) {
      const session = connectionManager.getCurrentSession();
      setCurrentSession(session);
    }
  }, [connectionManager, isConnected]);

  const connect = useCallback(async (deviceId: string, sessionType: string = 'monitoring', isAdmin: boolean = false) => {
    if (!connectionManager) {
      throw new Error('Connection manager not initialized');
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Generate room name
      const roomName = `android-agent-${sessionType}-${deviceId}-${Date.now()}`;

      // Get access token from API
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          roomName,
          isAdmin,
          sessionType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const { token } = await response.json();

      // Connect to LiveKit room
      await connectionManager.connect(token, roomName, deviceId, isAdmin);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setError(errorMessage);
      setIsConnecting(false);
      throw error;
    }
  }, [connectionManager]);

  const disconnect = useCallback(async () => {
    if (connectionManager) {
      await connectionManager.disconnect();
    }
  }, [connectionManager]);

  const publishCamera = useCallback(async () => {
    if (!connectionManager) {
      throw new Error('Not connected');
    }
    await connectionManager.publishCamera();
  }, [connectionManager]);

  const publishMicrophone = useCallback(async () => {
    if (!connectionManager) {
      throw new Error('Not connected');
    }
    await connectionManager.publishMicrophone();
  }, [connectionManager]);

  const publishScreen = useCallback(async () => {
    if (!connectionManager) {
      throw new Error('Not connected');
    }
    await connectionManager.publishScreen();
  }, [connectionManager]);

  const stopCamera = useCallback(async () => {
    if (connectionManager) {
      await connectionManager.stopCamera();
    }
  }, [connectionManager]);

  const stopMicrophone = useCallback(async () => {
    if (connectionManager) {
      await connectionManager.stopMicrophone();
    }
  }, [connectionManager]);

  const stopScreenShare = useCallback(async () => {
    if (connectionManager) {
      await connectionManager.stopScreenShare();
    }
  }, [connectionManager]);

  const contextValue: LiveKitContextType = {
    connectionManager,
    currentSession,
    isConnected,
    isConnecting,
    error,
    capabilities,
    connect,
    disconnect,
    publishCamera,
    publishMicrophone,
    publishScreen,
    stopCamera,
    stopMicrophone,
    stopScreenShare,
  };

  return (
    <LiveKitContext.Provider value={contextValue}>
      {children}
    </LiveKitContext.Provider>
  );
};