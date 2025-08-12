import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { PERMISSION_MESSAGES } from '@/constants';
import { ApiService } from './ApiService';

export interface CameraCapabilities {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  hasFlash: boolean;
  canRecordVideo: boolean;
  supportedRatios: string[];
}

export interface PhotoResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: any;
}

export interface VideoResult {
  uri: string;
  duration: number;
  size: number;
}

export class CameraService {
  private static cameraRef: Camera | null = null;

  /**
   * Request camera permissions
   */
  static async requestPermissions(): Promise<{
    camera: boolean;
    mediaLibrary: boolean;
  }> {
    try {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();

      return {
        camera: cameraPermission.status === 'granted',
        mediaLibrary: mediaLibraryPermission.status === 'granted',
      };
    } catch (error) {
      console.error('Camera permission request failed:', error);
      return { camera: false, mediaLibrary: false };
    }
  }

  /**
   * Check camera permissions status
   */
  static async getPermissionStatus(): Promise<{
    camera: string;
    mediaLibrary: string;
  }> {
    try {
      const cameraPermission = await Camera.getCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.getPermissionsAsync();

      return {
        camera: cameraPermission.status,
        mediaLibrary: mediaLibraryPermission.status,
      };
    } catch (error) {
      console.error('Permission status check failed:', error);
      return { camera: 'undetermined', mediaLibrary: 'undetermined' };
    }
  }

  /**
   * Get camera capabilities
   */
  static async getCameraCapabilities(): Promise<CameraCapabilities> {
    try {
      const permissions = await this.getPermissionStatus();
      
      if (permissions.camera !== 'granted') {
        return {
          hasCamera: false,
          hasFrontCamera: false,
          hasBackCamera: false,
          hasFlash: false,
          canRecordVideo: false,
          supportedRatios: [],
        };
      }

      // Basic capability detection (would need camera ref for detailed info)
      return {
        hasCamera: true,
        hasFrontCamera: true, // Most devices have front camera
        hasBackCamera: true, // Most devices have back camera
        hasFlash: Platform.OS === 'android' || Platform.OS === 'ios',
        canRecordVideo: true,
        supportedRatios: ['4:3', '16:9'], // Common ratios
      };
    } catch (error) {
      console.error('Camera capabilities check failed:', error);
      return {
        hasCamera: false,
        hasFrontCamera: false,
        hasBackCamera: false,
        hasFlash: false,
        canRecordVideo: false,
        supportedRatios: [],
      };
    }
  }

  /**
   * Take a photo
   */
  static async takePhoto(options?: {
    quality?: number;
    base64?: boolean;
    exif?: boolean;
    skipProcessing?: boolean;
  }): Promise<PhotoResult | null> {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.camera) {
        throw new Error('Camera permission not granted');
      }

      if (!this.cameraRef) {
        throw new Error('Camera reference not available');
      }

      const photo = await this.cameraRef.takePictureAsync({
        quality: options?.quality || 0.8,
        base64: options?.base64 || false,
        exif: options?.exif || false,
        skipProcessing: options?.skipProcessing || false,
      });

      // Save to media library if permission granted
      if (permissions.mediaLibrary) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }

      return {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        base64: photo.base64,
        exif: photo.exif,
      };
    } catch (error) {
      console.error('Take photo failed:', error);
      return null;
    }
  }

  /**
   * Record video
   */
  static async recordVideo(options?: {
    quality?: string;
    maxDuration?: number;
    mute?: boolean;
  }): Promise<VideoResult | null> {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.camera) {
        throw new Error('Camera permission not granted');
      }

      if (!this.cameraRef) {
        throw new Error('Camera reference not available');
      }

      const video = await this.cameraRef.recordAsync({
        quality: options?.quality as any || Camera.Constants.VideoQuality['720p'],
        maxDuration: options?.maxDuration || 60, // 60 seconds max
        mute: options?.mute || false,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(video.uri);
      
      // Save to media library if permission granted
      if (permissions.mediaLibrary) {
        await MediaLibrary.saveToLibraryAsync(video.uri);
      }

      return {
        uri: video.uri,
        duration: 0, // Would need to calculate from video metadata
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
      };
    } catch (error) {
      console.error('Record video failed:', error);
      return null;
    }
  }

  /**
   * Stop video recording
   */
  static async stopRecording(): Promise<void> {
    try {
      if (this.cameraRef) {
        this.cameraRef.stopRecording();
      }
    } catch (error) {
      console.error('Stop recording failed:', error);
    }
  }

  /**
   * Pick image from gallery
   */
  static async pickImageFromGallery(options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    base64?: boolean;
  }): Promise<PhotoResult | null> {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.allowsEditing || false,
        aspect: options?.aspect || [4, 3],
        quality: options?.quality || 0.8,
        base64: options?.base64 || false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        base64: asset.base64,
        exif: asset.exif,
      };
    } catch (error) {
      console.error('Pick image from gallery failed:', error);
      return null;
    }
  }

  /**
   * Upload photo to backend
   */
  static async uploadPhoto(
    photoUri: string,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      const actualFilename = filename || `photo_${Date.now()}.jpg`;
      return await ApiService.uploadFile(photoUri, actualFilename, onProgress);
    } catch (error) {
      console.error('Photo upload failed:', error);
      return false;
    }
  }

  /**
   * Upload video to backend
   */
  static async uploadVideo(
    videoUri: string,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      const actualFilename = filename || `video_${Date.now()}.mp4`;
      return await ApiService.uploadFile(videoUri, actualFilename, onProgress);
    } catch (error) {
      console.error('Video upload failed:', error);
      return false;
    }
  }

  /**
   * Get recent photos from device
   */
  static async getRecentPhotos(limit: number = 20): Promise<any[]> {
    try {
      const permission = await MediaLibrary.getPermissionsAsync();
      if (permission.status !== 'granted') {
        const newPermission = await MediaLibrary.requestPermissionsAsync();
        if (newPermission.status !== 'granted') {
          return [];
        }
      }

      const albums = await MediaLibrary.getAlbumsAsync();
      const cameraRoll = albums.find(album => album.title === 'Camera Roll') || albums[0];
      
      if (!cameraRoll) return [];

      const assets = await MediaLibrary.getAssetsAsync({
        album: cameraRoll,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: MediaLibrary.SortBy.creationTime,
        first: limit,
      });

      return assets.assets;
    } catch (error) {
      console.error('Get recent photos failed:', error);
      return [];
    }
  }

  /**
   * Delete photo from device
   */
  static async deletePhoto(assetId: string): Promise<boolean> {
    try {
      const permission = await MediaLibrary.getPermissionsAsync();
      if (permission.status !== 'granted') {
        return false;
      }

      await MediaLibrary.deleteAssetsAsync([assetId]);
      return true;
    } catch (error) {
      console.error('Delete photo failed:', error);
      return false;
    }
  }

  /**
   * Set camera reference (to be called from camera component)
   */
  static setCameraRef(ref: Camera | null): void {
    this.cameraRef = ref;
  }

  /**
   * Check if device supports camera features
   */
  static async checkCameraSupport(): Promise<{
    hasCamera: boolean;
    supportedFeatures: string[];
    recommendedSettings: any;
  }> {
    try {
      const capabilities = await this.getCameraCapabilities();
      const supportedFeatures: string[] = [];

      if (capabilities.hasCamera) supportedFeatures.push('basic_camera');
      if (capabilities.hasFrontCamera) supportedFeatures.push('front_camera');
      if (capabilities.hasBackCamera) supportedFeatures.push('back_camera');
      if (capabilities.hasFlash) supportedFeatures.push('flash');
      if (capabilities.canRecordVideo) supportedFeatures.push('video_recording');

      // Recommended settings based on device capabilities
      const recommendedSettings = {
        photoQuality: capabilities.hasCamera ? 0.8 : 0.5,
        videoQuality: capabilities.canRecordVideo ? '720p' : '480p',
        flashMode: capabilities.hasFlash ? FlashMode.auto : FlashMode.off,
        cameraType: capabilities.hasBackCamera ? CameraType.back : CameraType.front,
      };

      return {
        hasCamera: capabilities.hasCamera,
        supportedFeatures,
        recommendedSettings,
      };
    } catch (error) {
      console.error('Camera support check failed:', error);
      return {
        hasCamera: false,
        supportedFeatures: [],
        recommendedSettings: {},
      };
    }
  }
}