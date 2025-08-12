import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  uri: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  duration?: number; // for audio/video
  dimensions?: { width: number; height: number }; // for images/video
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  metadata?: Record<string, any>;
}

export interface CompressionOptions {
  quality?: number; // 0-1 for images, bitrate for video
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class MediaService {
  private uploadProgressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();

  /**
   * Pick image from gallery or camera
   */
  async pickImage(source: 'gallery' | 'camera', options?: {
    allowsEditing?: boolean;
    quality?: number;
    includeLocation?: boolean;
  }): Promise<MediaFile | null> {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Camera permission denied');
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Media library permission denied');
        }
      }

      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: options?.allowsEditing ?? true,
            quality: options?.quality ?? 0.8,
            exif: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: options?.allowsEditing ?? true,
            quality: options?.quality ?? 0.8,
            exif: true,
          });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      let location = null;
      if (options?.includeLocation) {
        location = await this.getCurrentLocation();
      }

      return {
        id: Date.now().toString(),
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: 'image',
        uri: asset.uri,
        size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        mimeType: asset.mimeType || 'image/jpeg',
        dimensions: {
          width: asset.width,
          height: asset.height,
        },
        location,
        metadata: {
          exif: asset.exif,
        },
      };
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  /**
   * Pick video from gallery or camera
   */
  async pickVideo(source: 'gallery' | 'camera', options?: {
    allowsEditing?: boolean;
    quality?: number;
    maxDuration?: number;
  }): Promise<MediaFile | null> {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Camera permission denied');
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Media library permission denied');
        }
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: options?.allowsEditing ?? true,
            quality: options?.quality ?? 0.8,
            videoMaxDuration: options?.maxDuration ?? 60,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: options?.allowsEditing ?? true,
            quality: options?.quality ?? 0.8,
          });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      return {
        id: Date.now().toString(),
        name: asset.fileName || `video_${Date.now()}.mp4`,
        type: 'video',
        uri: asset.uri,
        size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        mimeType: asset.mimeType || 'video/mp4',
        duration: asset.duration,
        dimensions: {
          width: asset.width,
          height: asset.height,
        },
      };
    } catch (error) {
      console.error('Error picking video:', error);
      throw error;
    }
  }

  /**
   * Record audio
   */
  async recordAudio(maxDuration: number = 300): Promise<MediaFile | null> {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission denied');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      await recording.startAsync();

      // Return a promise that resolves when recording stops
      return new Promise((resolve, reject) => {
        const stopRecording = async () => {
          try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            
            if (!uri) {
              reject(new Error('Recording failed'));
              return;
            }

            const fileInfo = await FileSystem.getInfoAsync(uri);
            const status = await recording.getStatusAsync();

            resolve({
              id: Date.now().toString(),
              name: `audio_${Date.now()}.m4a`,
              type: 'audio',
              uri,
              size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
              mimeType: 'audio/m4a',
              duration: status.durationMillis ? status.durationMillis / 1000 : 0,
            });
          } catch (error) {
            reject(error);
          }
        };

        // Auto-stop after maxDuration
        setTimeout(stopRecording, maxDuration * 1000);

        // You would typically provide a way to manually stop recording
        // For now, we'll auto-stop after maxDuration
      });
    } catch (error) {
      console.error('Error recording audio:', error);
      throw error;
    }
  }

  /**
   * Pick document file
   */
  async pickDocument(): Promise<MediaFile | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];

      return {
        id: Date.now().toString(),
        name: asset.name,
        type: 'document',
        uri: asset.uri,
        size: asset.size || 0,
        mimeType: asset.mimeType || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Error picking document:', error);
      throw error;
    }
  }

  /**
   * Compress image
   */
  async compressImage(
    uri: string,
    options: CompressionOptions = {}
  ): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          ...(options.maxWidth || options.maxHeight ? [{
            resize: {
              width: options.maxWidth,
              height: options.maxHeight,
            }
          }] : [])
        ],
        {
          compress: options.quality ?? 0.8,
          format: options.format === 'png' 
            ? ImageManipulator.SaveFormat.PNG 
            : ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for video
   */
  async generateVideoThumbnail(videoUri: string): Promise<string> {
    try {
      // For now, return a placeholder
      // In a real implementation, you'd use a video processing library
      return videoUri; // Placeholder
    } catch (error) {
      console.error('Error generating video thumbnail:', error);
      throw error;
    }
  }

  /**
   * Upload media file to Supabase Storage
   */
  async uploadMediaFile(
    mediaFile: MediaFile,
    bucket: string = 'tactical-media',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Generate unique file path
      const fileExtension = mediaFile.name.split('.').pop() || 'bin';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `${mediaFile.type}/${fileName}`;

      // Store progress callback
      if (onProgress) {
        this.uploadProgressCallbacks.set(mediaFile.id, onProgress);
      }

      // Read file as blob
      const response = await fetch(mediaFile.uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: mediaFile.mimeType,
          upsert: false,
        });

      if (error) throw error;

      // Clean up progress callback
      this.uploadProgressCallbacks.delete(mediaFile.id);

      return data.path;
    } catch (error) {
      console.error('Error uploading media file:', error);
      this.uploadProgressCallbacks.delete(mediaFile.id);
      throw error;
    }
  }

  /**
   * Download media file from Supabase Storage
   */
  async downloadMediaFile(
    storagePath: string,
    bucket: string = 'tactical-media'
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(storagePath);

      if (error) throw error;

      // Convert blob to local file
      const fileUri = `${FileSystem.cacheDirectory}${storagePath.split('/').pop()}`;
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            resolve(fileUri);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });
    } catch (error) {
      console.error('Error downloading media file:', error);
      throw error;
    }
  }

  /**
   * Get media file URL from Supabase Storage
   */
  async getMediaFileUrl(
    storagePath: string,
    bucket: string = 'tactical-media',
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, expiresIn);

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting media file URL:', error);
      throw error;
    }
  }

  /**
   * Delete media file from Supabase Storage
   */
  async deleteMediaFile(
    storagePath: string,
    bucket: string = 'tactical-media'
  ): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([storagePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting media file:', error);
      throw error;
    }
  }

  /**
   * Save media to device gallery
   */
  async saveToGallery(mediaFile: MediaFile): Promise<void> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission denied');
      }

      await MediaLibrary.saveToLibraryAsync(mediaFile.uri);
    } catch (error) {
      console.error('Error saving to gallery:', error);
      throw error;
    }
  }

  /**
   * Get media file metadata
   */
  async getMediaMetadata(uri: string): Promise<Record<string, any>> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri, {
        md5: true,
        size: true,
      });

      return {
        size: fileInfo.exists ? (fileInfo as any).size : 0,
        md5: fileInfo.exists ? (fileInfo as any).md5 : null,
        exists: fileInfo.exists,
        isDirectory: fileInfo.isDirectory,
        modificationTime: fileInfo.exists ? (fileInfo as any).modificationTime : null,
      };
    } catch (error) {
      console.error('Error getting media metadata:', error);
      return {};
    }
  }

  /**
   * Encrypt media file (placeholder implementation)
   */
  async encryptMediaFile(uri: string, key: string): Promise<string> {
    try {
      // This is a placeholder implementation
      // In a real app, you'd use a proper encryption library
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Simple XOR encryption (NOT secure, just for demo)
      const encrypted = this.simpleXOREncrypt(fileContent, key);
      
      const encryptedUri = `${FileSystem.cacheDirectory}encrypted_${Date.now()}.enc`;
      await FileSystem.writeAsStringAsync(encryptedUri, encrypted, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return encryptedUri;
    } catch (error) {
      console.error('Error encrypting media file:', error);
      throw error;
    }
  }

  /**
   * Decrypt media file (placeholder implementation)
   */
  async decryptMediaFile(encryptedUri: string, key: string): Promise<string> {
    try {
      // This is a placeholder implementation
      const encryptedContent = await FileSystem.readAsStringAsync(encryptedUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Simple XOR decryption (NOT secure, just for demo)
      const decrypted = this.simpleXOREncrypt(encryptedContent, key);
      
      const decryptedUri = `${FileSystem.cacheDirectory}decrypted_${Date.now()}.bin`;
      await FileSystem.writeAsStringAsync(decryptedUri, decrypted, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return decryptedUri;
    } catch (error) {
      console.error('Error decrypting media file:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const tempFiles = files.filter(file => 
        file.startsWith('temp_') || 
        file.startsWith('compressed_') ||
        file.startsWith('encrypted_') ||
        file.startsWith('decrypted_')
      );

      for (const file of tempFiles) {
        try {
          await FileSystem.deleteAsync(`${cacheDir}${file}`);
        } catch (error) {
          console.warn('Failed to delete temp file:', file, error);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  // Private helper methods
  private async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  private simpleXOREncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result); // Base64 encode
  }
}

// Singleton instance
let mediaServiceInstance: MediaService | null = null;

export const getMediaService = (): MediaService => {
  if (!mediaServiceInstance) {
    mediaServiceInstance = new MediaService();
  }
  return mediaServiceInstance;
};

export default MediaService;