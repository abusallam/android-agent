import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { ApiService } from './ApiService';

export interface AudioRecordingOptions {
  android: {
    extension: string;
    outputFormat: number;
    audioEncoder: number;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
  };
  ios: {
    extension: string;
    outputFormat: string;
    audioQuality: number;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
    linearPCMBitDepth: number;
    linearPCMIsBigEndian: boolean;
    linearPCMIsFloat: boolean;
  };
}

export interface RecordingResult {
  uri: string;
  duration: number;
  size: number;
  status: 'completed' | 'stopped' | 'error';
}

export interface AudioCapabilities {
  canRecord: boolean;
  canPlayback: boolean;
  supportedFormats: string[];
  maxRecordingDuration: number;
}

export class AudioService {
  private static recording: Audio.Recording | null = null;
  private static sound: Audio.Sound | null = null;
  private static isRecording = false;
  private static isPlaying = false;

  /**
   * Initialize audio system
   */
  static async initialize(): Promise<boolean> {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      return false;
    }
  }

  /**
   * Request audio permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Audio permission request failed:', error);
      return false;
    }
  }

  /**
   * Get audio capabilities
   */
  static async getAudioCapabilities(): Promise<AudioCapabilities> {
    try {
      const hasPermission = await this.requestPermissions();
      
      return {
        canRecord: hasPermission,
        canPlayback: true, // Most devices can play audio
        supportedFormats: Platform.OS === 'ios' 
          ? ['m4a', 'wav', 'mp3', 'aac']
          : ['3gp', 'mp4', 'wav', 'mp3'],
        maxRecordingDuration: 3600, // 1 hour max
      };
    } catch (error) {
      console.error('Audio capabilities check failed:', error);
      return {
        canRecord: false,
        canPlayback: false,
        supportedFormats: [],
        maxRecordingDuration: 0,
      };
    }
  }

  /**
   * Get recording options based on platform
   */
  private static getRecordingOptions(): AudioRecordingOptions {
    return {
      android: {
        extension: '.3gp',
        outputFormat: Audio.AndroidOutputFormat.THREE_GPP,
        audioEncoder: Audio.AndroidAudioEncoder.AMR_NB,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };
  }

  /**
   * Start audio recording
   */
  static async startRecording(maxDuration?: number): Promise<boolean> {
    try {
      if (this.isRecording) {
        console.log('Recording already in progress');
        return false;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio recording permission not granted');
      }

      await this.initialize();

      // Stop any existing recording
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
      }

      // Create new recording
      this.recording = new Audio.Recording();
      const options = this.getRecordingOptions();
      
      await this.recording.prepareToRecordAsync(
        Platform.OS === 'ios' ? options.ios : options.android
      );

      await this.recording.startAsync();
      this.isRecording = true;

      // Set max duration if specified
      if (maxDuration) {
        setTimeout(async () => {
          if (this.isRecording) {
            await this.stopRecording();
          }
        }, maxDuration * 1000);
      }

      console.log('Audio recording started');
      return true;
    } catch (error) {
      console.error('Start recording failed:', error);
      this.isRecording = false;
      return false;
    }
  }

  /**
   * Stop audio recording
   */
  static async stopRecording(): Promise<RecordingResult | null> {
    try {
      if (!this.isRecording || !this.recording) {
        console.log('No recording in progress');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      this.isRecording = false;

      const uri = this.recording.getURI();
      if (!uri) {
        throw new Error('Recording URI not available');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const status = await this.recording.getStatusAsync();

      const result: RecordingResult = {
        uri,
        duration: status.durationMillis || 0,
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
        status: 'completed',
      };

      // Clean up
      this.recording = null;

      console.log('Audio recording stopped:', result);
      return result;
    } catch (error) {
      console.error('Stop recording failed:', error);
      this.isRecording = false;
      this.recording = null;
      return {
        uri: '',
        duration: 0,
        size: 0,
        status: 'error',
      };
    }
  }

  /**
   * Play audio file
   */
  static async playAudio(uri: string): Promise<boolean> {
    try {
      if (this.isPlaying) {
        await this.stopPlayback();
      }

      await this.initialize();

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: false }
      );

      this.sound = sound;
      this.isPlaying = true;

      // Set up playback status update
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.isPlaying = false;
          this.sound = null;
        }
      });

      console.log('Audio playback started');
      return true;
    } catch (error) {
      console.error('Play audio failed:', error);
      return false;
    }
  }

  /**
   * Stop audio playback
   */
  static async stopPlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isPlaying = false;
      console.log('Audio playback stopped');
    } catch (error) {
      console.error('Stop playback failed:', error);
    }
  }

  /**
   * Pause audio playback
   */
  static async pausePlayback(): Promise<boolean> {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.pauseAsync();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Pause playback failed:', error);
      return false;
    }
  }

  /**
   * Resume audio playback
   */
  static async resumePlayback(): Promise<boolean> {
    try {
      if (this.sound && !this.isPlaying) {
        await this.sound.playAsync();
        this.isPlaying = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Resume playback failed:', error);
      return false;
    }
  }

  /**
   * Get recording status
   */
  static async getRecordingStatus(): Promise<{
    isRecording: boolean;
    duration: number;
    canRecord: boolean;
  }> {
    try {
      let duration = 0;
      
      if (this.recording && this.isRecording) {
        const status = await this.recording.getStatusAsync();
        duration = status.durationMillis || 0;
      }

      const capabilities = await this.getAudioCapabilities();

      return {
        isRecording: this.isRecording,
        duration,
        canRecord: capabilities.canRecord,
      };
    } catch (error) {
      console.error('Get recording status failed:', error);
      return {
        isRecording: false,
        duration: 0,
        canRecord: false,
      };
    }
  }

  /**
   * Get playback status
   */
  static getPlaybackStatus(): {
    isPlaying: boolean;
    canPlayback: boolean;
  } {
    return {
      isPlaying: this.isPlaying,
      canPlayback: true, // Most devices can play audio
    };
  }

  /**
   * Upload audio recording to backend
   */
  static async uploadRecording(
    audioUri: string,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      const actualFilename = filename || `recording_${Date.now()}.${Platform.OS === 'ios' ? 'm4a' : '3gp'}`;
      return await ApiService.uploadFile(audioUri, actualFilename, onProgress);
    } catch (error) {
      console.error('Audio upload failed:', error);
      return false;
    }
  }

  /**
   * Convert audio format (basic implementation)
   */
  static async convertAudioFormat(
    inputUri: string,
    outputFormat: 'mp3' | 'wav' | 'm4a'
  ): Promise<string | null> {
    try {
      // Note: This would require a native audio conversion library
      // For prototype, we'll just return the original URI
      console.log(`Audio conversion requested: ${outputFormat}`);
      return inputUri;
    } catch (error) {
      console.error('Audio conversion failed:', error);
      return null;
    }
  }

  /**
   * Get audio file duration
   */
  static async getAudioDuration(uri: string): Promise<number> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      
      if (status.isLoaded) {
        return status.durationMillis || 0;
      }
      return 0;
    } catch (error) {
      console.error('Get audio duration failed:', error);
      return 0;
    }
  }

  /**
   * Clean up audio resources
   */
  static async cleanup(): Promise<void> {
    try {
      if (this.isRecording && this.recording) {
        await this.stopRecording();
      }
      
      if (this.isPlaying && this.sound) {
        await this.stopPlayback();
      }
      
      console.log('Audio service cleaned up');
    } catch (error) {
      console.error('Audio cleanup failed:', error);
    }
  }

  /**
   * Check audio support for older Android versions
   */
  static async checkLegacySupport(): Promise<{
    supported: boolean;
    limitations: string[];
    recommendations: string[];
  }> {
    try {
      const capabilities = await this.getAudioCapabilities();
      const limitations: string[] = [];
      const recommendations: string[] = [];

      // Check for common limitations on older devices
      if (Platform.OS === 'android') {
        if (Platform.Version < 23) { // Android 6.0
          limitations.push('Limited audio quality options');
          limitations.push('No real-time audio processing');
          recommendations.push('Use lower sample rates for better compatibility');
        }
        
        if (Platform.Version < 21) { // Android 5.0
          limitations.push('Limited audio codec support');
          recommendations.push('Use 3GP format for maximum compatibility');
        }
      }

      return {
        supported: capabilities.canRecord,
        limitations,
        recommendations,
      };
    } catch (error) {
      console.error('Legacy support check failed:', error);
      return {
        supported: false,
        limitations: ['Audio system not available'],
        recommendations: ['Update device or use alternative methods'],
      };
    }
  }
}