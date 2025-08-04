/**
 * LiveKit Configuration for Android Agent AI
 * Handles WebRTC streaming for camera, microphone, and screen sharing
 */

export interface LiveKitConfig {
  serverUrl: string;
  apiKey: string;
  apiSecret: string;
  defaultRoomOptions: {
    adaptiveStream: boolean;
    dynacast: boolean;
    videoCaptureDefaults: {
      resolution: VideoResolution;
      frameRate: number;
    };
    audioCaptureDefaults: {
      echoCancellation: boolean;
      noiseSuppression: boolean;
      autoGainControl: boolean;
    };
  };
}

export interface VideoResolution {
  width: number;
  height: number;
}

export interface StreamingCapabilities {
  video: boolean;
  audio: boolean;
  screen: boolean;
  recording: boolean;
}

export interface DeviceStreamConfig {
  deviceId: string;
  capabilities: StreamingCapabilities;
  quality: 'low' | 'medium' | 'high' | 'auto';
  privacy: {
    blurBackground: boolean;
    hideScreen: boolean;
    muteByDefault: boolean;
  };
}

// LiveKit configuration
export const getLiveKitConfig = (): LiveKitConfig => {
  const serverUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!serverUrl || !apiKey || !apiSecret) {
    console.warn('LiveKit configuration incomplete. Some streaming features may not work.');
  }

  return {
    serverUrl: serverUrl || 'wss://localhost:7880',
    apiKey: apiKey || 'dev-api-key',
    apiSecret: apiSecret || 'dev-api-secret',
    defaultRoomOptions: {
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
    },
  };
};

// Video quality presets
export const VIDEO_QUALITY_PRESETS = {
  low: { width: 640, height: 360, frameRate: 15, bitrate: 300000 },
  medium: { width: 1280, height: 720, frameRate: 30, bitrate: 1000000 },
  high: { width: 1920, height: 1080, frameRate: 30, bitrate: 2500000 },
} as const;

// Audio quality presets
export const AUDIO_QUALITY_PRESETS = {
  low: { bitrate: 32000, sampleRate: 16000 },
  medium: { bitrate: 64000, sampleRate: 44100 },
  high: { bitrate: 128000, sampleRate: 48000 },
} as const;

// Room naming conventions
export const generateRoomName = (deviceId: string, sessionType: string): string => {
  const timestamp = Date.now();
  return `android-agent-${sessionType}-${deviceId}-${timestamp}`;
};

// Token generation parameters
export const getTokenOptions = (deviceId: string, isAdmin: boolean = false) => {
  return {
    identity: isAdmin ? `admin-${Date.now()}` : `device-${deviceId}`,
    name: isAdmin ? 'Admin User' : `Device ${deviceId}`,
    metadata: JSON.stringify({
      deviceId,
      role: isAdmin ? 'admin' : 'device',
      timestamp: Date.now(),
    }),
    ttl: '24h', // Token valid for 24 hours
  };
};

// Error messages
export const LIVEKIT_ERRORS = {
  CONNECTION_FAILED: 'Failed to connect to LiveKit server',
  PERMISSION_DENIED: 'Camera or microphone permission denied',
  DEVICE_NOT_FOUND: 'Camera or microphone device not found',
  NETWORK_ERROR: 'Network connection error',
  TOKEN_EXPIRED: 'Access token has expired',
  ROOM_FULL: 'Room has reached maximum capacity',
  UNSUPPORTED_BROWSER: 'Browser does not support required WebRTC features',
} as const;

// Feature detection
export const detectWebRTCSupport = (): StreamingCapabilities => {
  if (typeof window === 'undefined') {
    return { video: false, audio: false, screen: false, recording: false };
  }

  const hasWebRTC = !!(
    window.RTCPeerConnection ||
    (window as unknown as { webkitRTCPeerConnection?: unknown }).webkitRTCPeerConnection ||
    (window as unknown as { mozRTCPeerConnection?: unknown }).mozRTCPeerConnection
  );

  const hasGetUserMedia = !!(
    navigator.mediaDevices?.getUserMedia ||
    (navigator as unknown as { getUserMedia?: unknown }).getUserMedia ||
    (navigator as unknown as { webkitGetUserMedia?: unknown }).webkitGetUserMedia ||
    (navigator as unknown as { mozGetUserMedia?: unknown }).mozGetUserMedia
  );

  const hasScreenShare = !!(
    navigator.mediaDevices?.getDisplayMedia ||
    (navigator as unknown as { getDisplayMedia?: unknown }).getDisplayMedia
  );

  const hasMediaRecorder = !!(window as unknown as { MediaRecorder?: unknown }).MediaRecorder;

  return {
    video: hasWebRTC && hasGetUserMedia,
    audio: hasWebRTC && hasGetUserMedia,
    screen: hasWebRTC && hasScreenShare,
    recording: hasMediaRecorder,
  };
};

// Default streaming configuration
export const DEFAULT_STREAMING_CONFIG: DeviceStreamConfig = {
  deviceId: '',
  capabilities: detectWebRTCSupport(),
  quality: 'auto',
  privacy: {
    blurBackground: false,
    hideScreen: false,
    muteByDefault: true,
  },
};

// Connection timeout settings
export const CONNECTION_TIMEOUTS = {
  CONNECT: 10000, // 10 seconds
  RECONNECT: 5000, // 5 seconds
  TOKEN_REFRESH: 30000, // 30 seconds
} as const;

// Maximum concurrent streams
export const MAX_CONCURRENT_STREAMS = 9;

// Recording settings
export const RECORDING_CONFIG = {
  maxDuration: 3600000, // 1 hour in milliseconds
  formats: ['webm', 'mp4'] as const,
  quality: {
    video: { width: 1280, height: 720, frameRate: 30 },
    audio: { bitrate: 128000, sampleRate: 48000 },
  },
} as const;