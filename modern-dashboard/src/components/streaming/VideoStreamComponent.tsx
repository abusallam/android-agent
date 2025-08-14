/**
 * Video Stream Component
 * Displays participant video feeds with controls and quality indicators
 */
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Track, RemoteTrack, LocalTrack, RemoteVideoTrack, LocalVideoTrack } from 'livekit-client';
import { useLiveKit, useLiveKitParticipants } from './LiveKitProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Signal,
  Wifi,
  WifiOff
} from 'lucide-react';

interface VideoStreamProps {
  participantIdentity: string;
  track?: RemoteVideoTrack | LocalVideoTrack;
  isLocal?: boolean;
  showControls?: boolean;
  className?: string;
  onFullscreen?: () => void;
}

interface StreamQuality {
  resolution: { width: number; height: number };
  frameRate: number;
  bitrate: number;
  codec: string;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
}

export function VideoStreamComponent({
  participantIdentity,
  track,
  isLocal = false,
  showControls = true,
  className = '',
  onFullscreen
}: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamQuality, setStreamQuality] = useState<StreamQuality | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');

  const { participants, localParticipant } = useLiveKitParticipants();
  const { toggleCamera, toggleMicrophone, getStreamQuality } = useLiveKit();

  // Find participant info
  const participant = isLocal 
    ? localParticipant 
    : participants.find(p => p.identity === participantIdentity);

  // Attach video track to video element
  useEffect(() => {
    if (!track || !videoRef.current) return;

    track.attach(videoRef.current);
    setIsPlaying(true);

    return () => {
      track.detach();
      setIsPlaying(false);
    };
  }, [track]);

  // Monitor stream quality
  useEffect(() => {
    if (!track || !isLocal) return;

    const updateQuality = async () => {
      try {
        const quality = await getStreamQuality();
        if (quality) {
          setStreamQuality(quality);
        }
      } catch (error) {
        console.error('Failed to get stream quality:', error);
      }
    };

    const interval = setInterval(updateQuality, 2000);
    updateQuality(); // Initial update

    return () => clearInterval(interval);
  }, [track, isLocal, getStreamQuality]);

  // Update connection quality based on participant info
  useEffect(() => {
    if (participant) {
      setConnectionQuality(participant.connectionQuality);
    }
  }, [participant]);

  // Handle video controls
  const handleToggleCamera = useCallback(async () => {
    if (isLocal) {
      try {
        await toggleCamera();
      } catch (error) {
        console.error('Failed to toggle camera:', error);
      }
    }
  }, [isLocal, toggleCamera]);

  const handleToggleMicrophone = useCallback(async () => {
    if (isLocal) {
      try {
        await toggleMicrophone();
      } catch (error) {
        console.error('Failed to toggle microphone:', error);
      }
    }
  }, [isLocal, toggleMicrophone]);

  const handleToggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    if (onFullscreen) {
      onFullscreen();
    } else {
      setIsFullscreen(!isFullscreen);
    }
  }, [onFullscreen, isFullscreen]);

  // Get quality indicator color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get quality icon
  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <Wifi className="w-4 h-4" />;
      case 'good': return <Signal className="w-4 h-4" />;
      case 'poor': return <WifiOff className="w-4 h-4" />;
      default: return <Signal className="w-4 h-4" />;
    }
  };

  if (!participant) {
    return (
      <Card className={`bg-gray-900 border-gray-700 ${className}`}>
        <CardContent className="p-4 flex items-center justify-center h-48">
          <div className="text-center text-gray-400">
            <VideoOff className="w-8 h-8 mx-auto mb-2" />
            <p>Participant not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-900 border-gray-700 relative overflow-hidden ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardContent className="p-0 relative">
        {/* Video Element */}
        <div className="relative bg-black">
          {track && participant.videoEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isLocal || isMuted}
              className={`w-full ${isFullscreen ? 'h-screen object-contain' : 'h-48 object-cover'}`}
            />
          ) : (
            <div className={`flex items-center justify-center bg-gray-800 ${isFullscreen ? 'h-screen' : 'h-48'}`}>
              <div className="text-center text-gray-400">
                <VideoOff className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">{participant.name || participant.identity}</p>
                <p className="text-xs">Camera off</p>
              </div>
            </div>
          )}

          {/* Participant Info Overlay */}
          <div className="absolute top-2 left-2 flex items-center space-x-2">
            <Badge variant="secondary" className="bg-black/50 text-white">
              {participant.name || participant.identity}
            </Badge>
            {isLocal && (
              <Badge variant="outline" className="bg-black/50 text-green-400 border-green-400">
                You
              </Badge>
            )}
          </div>

          {/* Connection Quality Indicator */}
          <div className="absolute top-2 right-2 flex items-center space-x-1">
            <div className={`flex items-center space-x-1 ${getQualityColor(connectionQuality)}`}>
              {getQualityIcon(connectionQuality)}
              <span className="text-xs font-medium capitalize">{connectionQuality}</span>
            </div>
          </div>

          {/* Audio Indicator */}
          <div className="absolute bottom-2 left-2 flex items-center space-x-2">
            {participant.audioEnabled ? (
              <div className="flex items-center space-x-1 text-green-400">
                <Mic className="w-4 h-4" />
                {participant.isSpeaking && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-4 bg-green-400 rounded animate-pulse"></div>
                    <div className="w-1 h-3 bg-green-400 rounded animate-pulse delay-75"></div>
                    <div className="w-1 h-2 bg-green-400 rounded animate-pulse delay-150"></div>
                  </div>
                )}
              </div>
            ) : (
              <MicOff className="w-4 h-4 text-red-400" />
            )}
            {participant.screenShareEnabled && (
              <Monitor className="w-4 h-4 text-blue-400" />
            )}
          </div>

          {/* Stream Quality Info */}
          {streamQuality && isLocal && (
            <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
              {streamQuality.resolution.width}x{streamQuality.resolution.height} @ {streamQuality.frameRate}fps
            </div>
          )}
        </div>

        {/* Controls */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isLocal ? (
                  <>
                    <Button
                      size="sm"
                      variant={participant.videoEnabled ? "default" : "destructive"}
                      onClick={handleToggleCamera}
                    >
                      {participant.videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={participant.audioEnabled ? "default" : "destructive"}
                      onClick={handleToggleMicrophone}
                    >
                      {participant.audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant={isMuted ? "destructive" : "default"}
                    onClick={handleToggleMute}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost" onClick={handleFullscreen}>
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="ghost">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Multi-stream grid component
interface MultiStreamGridProps {
  maxStreams?: number;
  showLocalStream?: boolean;
  className?: string;
}

export function MultiStreamGrid({ 
  maxStreams = 9, 
  showLocalStream = true, 
  className = '' 
}: MultiStreamGridProps) {
  const { participants, localParticipant } = useLiveKitParticipants();
  const [fullscreenParticipant, setFullscreenParticipant] = useState<string | null>(null);

  // Combine local and remote participants
  const allParticipants = [
    ...(showLocalStream && localParticipant ? [localParticipant] : []),
    ...participants.slice(0, maxStreams - (showLocalStream ? 1 : 0))
  ];

  // Calculate grid layout
  const getGridCols = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-3';
  };

  const handleFullscreen = (participantIdentity: string) => {
    setFullscreenParticipant(
      fullscreenParticipant === participantIdentity ? null : participantIdentity
    );
  };

  if (fullscreenParticipant) {
    const participant = allParticipants.find(p => p.identity === fullscreenParticipant);
    if (participant) {
      return (
        <div className="fixed inset-0 z-50 bg-black">
          <VideoStreamComponent
            participantIdentity={participant.identity}
            isLocal={participant.isLocal}
            showControls={true}
            className="h-full"
            onFullscreen={() => setFullscreenParticipant(null)}
          />
        </div>
      );
    }
  }

  return (
    <div className={`grid gap-4 ${getGridCols(allParticipants.length)} ${className}`}>
      {allParticipants.map((participant) => (
        <VideoStreamComponent
          key={participant.identity}
          participantIdentity={participant.identity}
          isLocal={participant.isLocal}
          showControls={true}
          onFullscreen={() => handleFullscreen(participant.identity)}
        />
      ))}
      {allParticipants.length === 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <VideoOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Active Streams</h3>
            <p className="text-gray-400">Connect to a room to see participant streams</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VideoStreamComponent;