/**
 * LiveKit Connection Manager for Android Agent AI
 * Handles WebRTC connections, participant management, and streaming
 */

import {
  Room,
  RoomEvent,
  LocalParticipant,
  RemoteParticipant,
  Track,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteVideoTrack,
  RemoteAudioTrack,
  ConnectionState,
  RoomOptions,
  VideoPresets,
  AudioPresets,
  TrackPublication,
} from 'livekit-client';

import {
  getLiveKitConfig,
  CONNECTION_TIMEOUTS,
  LIVEKIT_ERRORS,
  type StreamingCapabilities,
  type DeviceStreamConfig,
} from './livekit-config';

export interface ConnectionManagerEvents {
  onConnected: () => void;
  onDisconnected: () => void;
  onParticipantConnected: (participant: RemoteParticipant) => void;
  onParticipantDisconnected: (participant: RemoteParticipant) => void;
  onTrackSubscribed: (track: RemoteVideoTrack | RemoteAudioTrack, participant: RemoteParticipant) => void;
  onTrackUnsubscribed: (track: RemoteVideoTrack | RemoteAudioTrack, participant: RemoteParticipant) => void;
  onError: (error: Error) => void;
  onConnectionQualityChanged: (quality: number) => void;
}

export interface StreamingSession {
  id: string;
  roomName: string;
  deviceId: string;
  isAdmin: boolean;
  startTime: Date;
  participants: Map<string, RemoteParticipant>;
  localTracks: Map<string, LocalVideoTrack | LocalAudioTrack>;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export class LiveKitConnectionManager {
  private room: Room | null = null;
  private config = getLiveKitConfig();
  private currentSession: StreamingSession | null = null;
  private eventHandlers: Partial<ConnectionManagerEvents> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(eventHandlers: Partial<ConnectionManagerEvents> = {}) {
    this.eventHandlers = eventHandlers;
  }

  /**
   * Connect to a LiveKit room
   */
  async connect(
    token: string,
    roomName: string,
    deviceId: string,
    isAdmin: boolean = false
  ): Promise<void> {
    try {
      // Clean up existing connection
      if (this.room) {
        await this.disconnect();
      }

      // Create new room instance
      const roomOptions: RoomOptions = {
        adaptiveStream: this.config.defaultRoomOptions.adaptiveStream,
        dynacast: this.config.defaultRoomOptions.dynacast,
        videoCaptureDefaults: this.config.defaultRoomOptions.videoCaptureDefaults,
        audioCaptureDefaults: this.config.defaultRoomOptions.audioCaptureDefaults,
      };

      this.room = new Room(roomOptions);
      this.setupRoomEventHandlers();

      // Create session
      this.currentSession = {
        id: `session-${Date.now()}`,
        roomName,
        deviceId,
        isAdmin,
        startTime: new Date(),
        participants: new Map(),
        localTracks: new Map(),
        status: 'connecting',
      };

      // Connect to room with timeout
      const connectPromise = this.room.connect(this.config.serverUrl, token);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(LIVEKIT_ERRORS.CONNECTION_FAILED)), CONNECTION_TIMEOUTS.CONNECT)
      );

      await Promise.race([connectPromise, timeoutPromise]);

      this.currentSession.status = 'connected';
      this.reconnectAttempts = 0;
      this.eventHandlers.onConnected?.();

      console.log(`Connected to LiveKit room: ${roomName}`);
    } catch (error) {
      this.currentSession = null;
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      console.error('LiveKit connection failed:', errorMessage);
      this.eventHandlers.onError?.(new Error(errorMessage));
      throw error;
    }
  }

  /**
   * Disconnect from the current room
   */
  async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.room) {
        // Stop all local tracks
        if (this.currentSession) {
          for (const track of this.currentSession.localTracks.values()) {
            track.stop();
          }
          this.currentSession.localTracks.clear();
        }

        // Disconnect from room
        await this.room.disconnect();
        this.room = null;
      }

      if (this.currentSession) {
        this.currentSession.status = 'disconnected';
        this.currentSession = null;
      }

      this.eventHandlers.onDisconnected?.();
      console.log('Disconnected from LiveKit room');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  /**
   * Publish camera video
   */
  async publishCamera(deviceId?: string): Promise<LocalVideoTrack | null> {
    if (!this.room || !this.currentSession) {
      throw new Error('Not connected to room');
    }

    try {
      const publication = await this.room.localParticipant.setCameraEnabled(true, {
        deviceId,
        resolution: VideoPresets.h720.resolution,
        frameRate: 30,
      });

      const videoTrack = publication?.track as LocalVideoTrack;
      if (videoTrack) {
        this.currentSession.localTracks.set('camera', videoTrack);
        console.log('Camera published successfully');
      }

      return videoTrack;
    } catch (error) {
      console.error('Failed to publish camera:', error);
      this.eventHandlers.onError?.(new Error(LIVEKIT_ERRORS.PERMISSION_DENIED));
      return null;
    }
  }

  /**
   * Publish microphone audio
   */
  async publishMicrophone(deviceId?: string): Promise<LocalAudioTrack | null> {
    if (!this.room || !this.currentSession) {
      throw new Error('Not connected to room');
    }

    try {
      const publication = await this.room.localParticipant.setMicrophoneEnabled(true, {
        deviceId,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      const audioTrack = publication?.track as LocalAudioTrack;
      if (audioTrack) {
        this.currentSession.localTracks.set('microphone', audioTrack);
        console.log('Microphone published successfully');
      }

      return audioTrack;
    } catch (error) {
      console.error('Failed to publish microphone:', error);
      this.eventHandlers.onError?.(new Error(LIVEKIT_ERRORS.PERMISSION_DENIED));
      return null;
    }
  }

  /**
   * Publish screen share
   */
  async publishScreen(): Promise<LocalVideoTrack | null> {
    if (!this.room || !this.currentSession) {
      throw new Error('Not connected to room');
    }

    try {
      const publication = await this.room.localParticipant.setScreenShareEnabled(true, {
        resolution: VideoPresets.h1080.resolution,
      });

      const screenTrack = publication?.track as LocalVideoTrack;
      if (screenTrack) {
        this.currentSession.localTracks.set('screen', screenTrack);
        console.log('Screen share published successfully');
      }

      return screenTrack;
    } catch (error) {
      console.error('Failed to publish screen share:', error);
      this.eventHandlers.onError?.(new Error(LIVEKIT_ERRORS.PERMISSION_DENIED));
      return null;
    }
  }

  /**
   * Stop camera
   */
  async stopCamera(): Promise<void> {
    if (this.room && this.currentSession) {
      await this.room.localParticipant.setCameraEnabled(false);
      const cameraTrack = this.currentSession.localTracks.get('camera');
      if (cameraTrack) {
        cameraTrack.stop();
        this.currentSession.localTracks.delete('camera');
      }
    }
  }

  /**
   * Stop microphone
   */
  async stopMicrophone(): Promise<void> {
    if (this.room && this.currentSession) {
      await this.room.localParticipant.setMicrophoneEnabled(false);
      const micTrack = this.currentSession.localTracks.get('microphone');
      if (micTrack) {
        micTrack.stop();
        this.currentSession.localTracks.delete('microphone');
      }
    }
  }

  /**
   * Stop screen share
   */
  async stopScreenShare(): Promise<void> {
    if (this.room && this.currentSession) {
      await this.room.localParticipant.setScreenShareEnabled(false);
      const screenTrack = this.currentSession.localTracks.get('screen');
      if (screenTrack) {
        screenTrack.stop();
        this.currentSession.localTracks.delete('screen');
      }
    }
  }

  /**
   * Get current session info
   */
  getCurrentSession(): StreamingSession | null {
    return this.currentSession;
  }

  /**
   * Get room instance
   */
  getRoom(): Room | null {
    return this.room;
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.room?.state || ConnectionState.Disconnected;
  }

  /**
   * Setup room event handlers
   */
  private setupRoomEventHandlers(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      console.log('Room connected');
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      console.log('Room disconnected:', reason);
      if (this.currentSession) {
        this.currentSession.status = 'disconnected';
      }
      this.handleDisconnection();
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('Participant connected:', participant.identity);
      if (this.currentSession) {
        this.currentSession.participants.set(participant.identity, participant);
      }
      this.eventHandlers.onParticipantConnected?.(participant);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('Participant disconnected:', participant.identity);
      if (this.currentSession) {
        this.currentSession.participants.delete(participant.identity);
      }
      this.eventHandlers.onParticipantDisconnected?.(participant);
    });

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('Track subscribed:', track.kind, 'from', participant.identity);
      if (track instanceof RemoteVideoTrack || track instanceof RemoteAudioTrack) {
        this.eventHandlers.onTrackSubscribed?.(track, participant);
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
      if (track instanceof RemoteVideoTrack || track instanceof RemoteAudioTrack) {
        this.eventHandlers.onTrackUnsubscribed?.(track, participant);
      }
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      // Convert ConnectionQuality enum to number for simplicity
      const qualityNumber = quality as unknown as number;
      this.eventHandlers.onConnectionQualityChanged?.(qualityNumber);
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      console.log('Reconnecting to room...');
      if (this.currentSession) {
        this.currentSession.status = 'connecting';
      }
    });

    this.room.on(RoomEvent.Reconnected, () => {
      console.log('Reconnected to room');
      if (this.currentSession) {
        this.currentSession.status = 'connected';
      }
      this.reconnectAttempts = 0;
    });
  }

  /**
   * Handle disconnection and attempt reconnection
   */
  private handleDisconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimer = setTimeout(() => {
        // Reconnection logic would go here
        // For now, just notify about disconnection
        this.eventHandlers.onDisconnected?.();
      }, CONNECTION_TIMEOUTS.RECONNECT);
    } else {
      console.log('Max reconnection attempts reached');
      this.eventHandlers.onDisconnected?.();
    }
  }
}