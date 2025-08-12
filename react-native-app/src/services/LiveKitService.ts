import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  TrackPublication,
  VideoTrack,
  AudioTrack,
  ConnectionState,
  RoomOptions,
  VideoPresets,
  TrackSource,
} from '@livekit/react-native';

export interface LiveKitConfig {
  serverUrl: string;
  apiKey: string;
  apiSecret: string;
}

export interface ParticipantInfo {
  identity: string;
  name: string;
  metadata?: string;
  isLocal: boolean;
  isSpeaking: boolean;
  connectionQuality: string;
  tracks: {
    video?: VideoTrack;
    audio?: AudioTrack;
    screen?: VideoTrack;
  };
}

export interface CallSession {
  roomName: string;
  participants: ParticipantInfo[];
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionState: ConnectionState;
}

export class LiveKitService {
  private room: Room | null = null;
  private config: LiveKitConfig;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: LiveKitConfig) {
    this.config = config;
  }

  /**
   * Connect to a LiveKit room
   */
  async connectToRoom(
    roomName: string,
    participantName: string,
    token: string,
    options?: RoomOptions
  ): Promise<void> {
    try {
      if (this.room) {
        await this.disconnectFromRoom();
      }

      this.room = new Room(options);
      this.setupRoomEventListeners();

      await this.room.connect(this.config.serverUrl, token, {
        autoSubscribe: true,
        publishDefaults: {
          videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
          videoCodec: 'vp8',
          dtx: true,
          red: true,
        },
      });

      this.emit('connected', {
        roomName,
        participantName,
        room: this.room,
      });
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
      this.emit('error', { error, context: 'connect' });
      throw error;
    }
  }

  /**
   * Disconnect from the current room
   */
  async disconnectFromRoom(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
      this.emit('disconnected', {});
    }
  }

  /**
   * Enable/disable local audio
   */
  async setAudioEnabled(enabled: boolean): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to a room');
    }

    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
      this.emit('audioToggled', { enabled });
    } catch (error) {
      console.error('Failed to toggle audio:', error);
      this.emit('error', { error, context: 'audio' });
      throw error;
    }
  }

  /**
   * Enable/disable local video
   */
  async setVideoEnabled(enabled: boolean): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to a room');
    }

    try {
      await this.room.localParticipant.setCameraEnabled(enabled);
      this.emit('videoToggled', { enabled });
    } catch (error) {
      console.error('Failed to toggle video:', error);
      this.emit('error', { error, context: 'video' });
      throw error;
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to a room');
    }

    try {
      await this.room.localParticipant.setScreenShareEnabled(true);
      this.emit('screenShareStarted', {});
    } catch (error) {
      console.error('Failed to start screen share:', error);
      this.emit('error', { error, context: 'screenShare' });
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to a room');
    }

    try {
      await this.room.localParticipant.setScreenShareEnabled(false);
      this.emit('screenShareStopped', {});
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      this.emit('error', { error, context: 'screenShare' });
      throw error;
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to a room');
    }

    try {
      const videoTrack = this.room.localParticipant.getTrackPublication(TrackSource.Camera)?.track as VideoTrack;
      if (videoTrack) {
        await videoTrack.switchCamera();
        this.emit('cameraSwitched', {});
      }
    } catch (error) {
      console.error('Failed to switch camera:', error);
      this.emit('error', { error, context: 'camera' });
      throw error;
    }
  }

  /**
   * Get current call session information
   */
  getCurrentSession(): CallSession | null {
    if (!this.room) {
      return null;
    }

    const participants: ParticipantInfo[] = [];

    // Add local participant
    const localParticipant = this.room.localParticipant;
    participants.push(this.mapParticipantToInfo(localParticipant, true));

    // Add remote participants
    this.room.remoteParticipants.forEach((participant) => {
      participants.push(this.mapParticipantToInfo(participant, false));
    });

    return {
      roomName: this.room.name || '',
      participants,
      isConnected: this.room.state === ConnectionState.Connected,
      isAudioEnabled: localParticipant.isMicrophoneEnabled,
      isVideoEnabled: localParticipant.isCameraEnabled,
      isScreenSharing: localParticipant.isScreenShareEnabled,
      connectionState: this.room.state,
    };
  }

  /**
   * Get room statistics
   */
  async getRoomStats(): Promise<any> {
    if (!this.room) {
      return null;
    }

    try {
      // Get connection stats for local participant
      const stats = await this.room.engine.getStats();
      return stats;
    } catch (error) {
      console.error('Failed to get room stats:', error);
      return null;
    }
  }

  /**
   * Send data message to all participants
   */
  async sendDataMessage(data: Uint8Array, reliable: boolean = true): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to a room');
    }

    try {
      await this.room.localParticipant.publishData(data, reliable);
      this.emit('dataSent', { data, reliable });
    } catch (error) {
      console.error('Failed to send data message:', error);
      this.emit('error', { error, context: 'data' });
      throw error;
    }
  }

  /**
   * Generate access token for room (server-side function)
   */
  static async generateAccessToken(
    config: LiveKitConfig,
    roomName: string,
    participantName: string,
    permissions?: {
      canPublish?: boolean;
      canSubscribe?: boolean;
      canPublishData?: boolean;
      canUpdateMetadata?: boolean;
    }
  ): Promise<string> {
    // This would typically be done on your backend server
    // For demo purposes, we'll return a placeholder
    // In production, make an API call to your backend to generate the token
    
    const response = await fetch(`${config.serverUrl}/api/livekit/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName,
        participantName,
        permissions: permissions || {
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          canUpdateMetadata: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate access token');
    }

    const { token } = await response.json();
    return token;
  }

  /**
   * Event listener management
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private setupRoomEventListeners(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      console.log('Connected to LiveKit room');
      this.emit('roomConnected', { room: this.room });
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      console.log('Disconnected from LiveKit room:', reason);
      this.emit('roomDisconnected', { reason });
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('Participant connected:', participant.identity);
      this.emit('participantConnected', { participant });
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('Participant disconnected:', participant.identity);
      this.emit('participantDisconnected', { participant });
    });

    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      console.log('Track subscribed:', track.kind, participant.identity);
      this.emit('trackSubscribed', { track, publication, participant });
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      console.log('Track unsubscribed:', track.kind, participant.identity);
      this.emit('trackUnsubscribed', { track, publication, participant });
    });

    this.room.on(RoomEvent.TrackMuted, (publication: TrackPublication, participant: Participant) => {
      console.log('Track muted:', publication.kind, participant.identity);
      this.emit('trackMuted', { publication, participant });
    });

    this.room.on(RoomEvent.TrackUnmuted, (publication: TrackPublication, participant: Participant) => {
      console.log('Track unmuted:', publication.kind, participant.identity);
      this.emit('trackUnmuted', { publication, participant });
    });

    this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
      console.log('Data received from:', participant?.identity || 'unknown');
      this.emit('dataReceived', { payload, participant });
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality: string, participant: Participant) => {
      console.log('Connection quality changed:', quality, participant.identity);
      this.emit('connectionQualityChanged', { quality, participant });
    });

    this.room.on(RoomEvent.RoomMetadataChanged, (metadata: string) => {
      console.log('Room metadata changed:', metadata);
      this.emit('roomMetadataChanged', { metadata });
    });

    this.room.on(RoomEvent.ParticipantMetadataChanged, (metadata: string, participant: Participant) => {
      console.log('Participant metadata changed:', metadata, participant.identity);
      this.emit('participantMetadataChanged', { metadata, participant });
    });
  }

  private mapParticipantToInfo(participant: Participant, isLocal: boolean): ParticipantInfo {
    const videoTrack = participant.getTrackPublication(TrackSource.Camera)?.track as VideoTrack;
    const audioTrack = participant.getTrackPublication(TrackSource.Microphone)?.track as AudioTrack;
    const screenTrack = participant.getTrackPublication(TrackSource.ScreenShare)?.track as VideoTrack;

    return {
      identity: participant.identity,
      name: participant.name || participant.identity,
      metadata: participant.metadata,
      isLocal,
      isSpeaking: participant.isSpeaking,
      connectionQuality: participant.connectionQuality.toString(),
      tracks: {
        video: videoTrack,
        audio: audioTrack,
        screen: screenTrack,
      },
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.disconnectFromRoom();
    this.listeners.clear();
  }
}

// Singleton instance
let liveKitServiceInstance: LiveKitService | null = null;

export const getLiveKitService = (config?: LiveKitConfig): LiveKitService => {
  if (!liveKitServiceInstance && config) {
    liveKitServiceInstance = new LiveKitService(config);
  }
  
  if (!liveKitServiceInstance) {
    throw new Error('LiveKitService not initialized. Please provide config on first call.');
  }
  
  return liveKitServiceInstance;
};

export default LiveKitService;