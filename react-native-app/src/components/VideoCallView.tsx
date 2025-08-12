import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Room,
  VideoView,
  AudioSession,
  TrackSource,
  VideoTrack,
  AudioTrack,
} from '@livekit/react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLiveKitService, ParticipantInfo, CallSession } from '../services/LiveKitService';

const { width, height } = Dimensions.get('window');

interface VideoCallViewProps {
  roomName: string;
  participantName: string;
  token: string;
  onCallEnd: () => void;
  onError?: (error: Error) => void;
}

export const VideoCallView: React.FC<VideoCallViewProps> = ({
  roomName,
  participantName,
  token,
  onCallEnd,
  onError,
}) => {
  const [session, setSession] = useState<CallSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<string>('good');
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  
  const liveKitService = useRef(getLiveKitService()).current;
  const room = useRef<Room | null>(null);

  useEffect(() => {
    initializeCall();
    setupEventListeners();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      setIsConnecting(true);
      
      // Start audio session
      await AudioSession.startAudioSession();
      
      // Connect to room
      await liveKitService.connectToRoom(roomName, participantName, token, {
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcastLayers: [
            { quality: 'high', width: 1280, height: 720 },
            { quality: 'medium', width: 640, height: 360 },
            { quality: 'low', width: 320, height: 180 },
          ],
        },
      });

      setIsConnecting(false);
    } catch (error) {
      console.error('Failed to initialize call:', error);
      setIsConnecting(false);
      onError?.(error as Error);
      Alert.alert('Connection Error', 'Failed to join the call. Please try again.');
    }
  };

  const setupEventListeners = () => {
    liveKitService.on('roomConnected', ({ room: connectedRoom }) => {
      room.current = connectedRoom;
      updateSession();
    });

    liveKitService.on('roomDisconnected', ({ reason }) => {
      console.log('Room disconnected:', reason);
      onCallEnd();
    });

    liveKitService.on('participantConnected', ({ participant }) => {
      console.log('Participant joined:', participant.identity);
      updateSession();
    });

    liveKitService.on('participantDisconnected', ({ participant }) => {
      console.log('Participant left:', participant.identity);
      updateSession();
    });

    liveKitService.on('trackSubscribed', ({ track, participant }) => {
      console.log('Track subscribed:', track.kind, participant.identity);
      updateSession();
    });

    liveKitService.on('trackUnsubscribed', ({ track, participant }) => {
      console.log('Track unsubscribed:', track.kind, participant.identity);
      updateSession();
    });

    liveKitService.on('connectionQualityChanged', ({ quality, participant }) => {
      if (participant.isLocal) {
        setConnectionQuality(quality);
      }
      updateSession();
    });

    liveKitService.on('error', ({ error, context }) => {
      console.error('LiveKit error:', context, error);
      onError?.(error);
    });
  };

  const updateSession = () => {
    const currentSession = liveKitService.getCurrentSession();
    if (currentSession) {
      setSession(currentSession);
      setParticipants(currentSession.participants);
      setIsAudioEnabled(currentSession.isAudioEnabled);
      setIsVideoEnabled(currentSession.isVideoEnabled);
      setIsScreenSharing(currentSession.isScreenSharing);
    }
  };

  const toggleAudio = async () => {
    try {
      await liveKitService.setAudioEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error('Failed to toggle audio:', error);
      Alert.alert('Error', 'Failed to toggle microphone');
    }
  };

  const toggleVideo = async () => {
    try {
      await liveKitService.setVideoEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Failed to toggle video:', error);
      Alert.alert('Error', 'Failed to toggle camera');
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await liveKitService.stopScreenShare();
      } else {
        await liveKitService.startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
      Alert.alert('Error', 'Failed to toggle screen sharing');
    }
  };

  const switchCamera = async () => {
    try {
      await liveKitService.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
      Alert.alert('Error', 'Failed to switch camera');
    }
  };

  const endCall = async () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end the call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Call', style: 'destructive', onPress: handleEndCall },
      ]
    );
  };

  const handleEndCall = async () => {
    await cleanup();
    onCallEnd();
  };

  const cleanup = async () => {
    try {
      await liveKitService.disconnectFromRoom();
      await AudioSession.stopAudioSession();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const renderParticipantVideo = (participant: ParticipantInfo, index: number) => {
    const videoTrack = participant.tracks.video;
    const isLocalParticipant = participant.isLocal;
    
    return (
      <View key={participant.identity} style={[
        styles.participantContainer,
        participants.length === 1 ? styles.fullScreenVideo : styles.gridVideo,
        isLocalParticipant && styles.localParticipant,
      ]}>
        {videoTrack ? (
          <VideoView
            style={styles.videoView}
            track={videoTrack}
            mirror={isLocalParticipant}
          />
        ) : (
          <View style={styles.noVideoContainer}>
            <Ionicons name="person-circle" size={80} color="#666" />
            <Text style={styles.participantName}>{participant.name}</Text>
          </View>
        )}
        
        {/* Participant info overlay */}
        <View style={styles.participantInfo}>
          <Text style={styles.participantNameOverlay}>
            {isLocalParticipant ? 'You' : participant.name}
          </Text>
          {participant.isSpeaking && (
            <View style={styles.speakingIndicator}>
              <Ionicons name="mic" size={12} color="#4CAF50" />
            </View>
          )}
          {!participant.tracks.audio && (
            <Ionicons name="mic-off" size={16} color="#f44336" />
          )}
        </View>
      </View>
    );
  };

  if (isConnecting) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.connectingContainer}>
          <Ionicons name="videocam" size={60} color="#2196F3" />
          <Text style={styles.connectingText}>Connecting to call...</Text>
          <Text style={styles.roomName}>Room: {roomName}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roomNameHeader}>{roomName}</Text>
        <View style={styles.connectionInfo}>
          <View style={[
            styles.connectionIndicator,
            { backgroundColor: connectionQuality === 'excellent' ? '#4CAF50' : 
                              connectionQuality === 'good' ? '#FFC107' : '#f44336' }
          ]} />
          <Text style={styles.participantCount}>
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Video Grid */}
      <View style={styles.videoContainer}>
        {participants.map((participant, index) => 
          renderParticipantVideo(participant, index)
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, !isAudioEnabled && styles.controlButtonDisabled]}
          onPress={toggleAudio}
        >
          <Ionicons 
            name={isAudioEnabled ? "mic" : "mic-off"} 
            size={24} 
            color={isAudioEnabled ? "#fff" : "#f44336"} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isVideoEnabled && styles.controlButtonDisabled]}
          onPress={toggleVideo}
        >
          <Ionicons 
            name={isVideoEnabled ? "videocam" : "videocam-off"} 
            size={24} 
            color={isVideoEnabled ? "#fff" : "#f44336"} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={switchCamera}
        >
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isScreenSharing && styles.controlButtonActive]}
          onPress={toggleScreenShare}
        >
          <Ionicons 
            name="desktop" 
            size={24} 
            color={isScreenSharing ? "#2196F3" : "#fff"} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  connectingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  roomName: {
    color: '#999',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  roomNameHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  participantCount: {
    color: '#999',
    fontSize: 14,
  },
  videoContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  participantContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
    margin: 4,
  },
  fullScreenVideo: {
    width: width - 8,
    height: height - 200,
  },
  gridVideo: {
    width: (width - 16) / 2,
    height: (height - 200) / 2,
  },
  localParticipant: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  videoView: {
    flex: 1,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  participantName: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },
  participantInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  participantNameOverlay: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  speakingIndicator: {
    marginLeft: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(244,67,54,0.2)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(33,150,243,0.3)',
  },
  endCallButton: {
    backgroundColor: '#f44336',
  },
});

export default VideoCallView;