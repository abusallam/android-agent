/**
 * Comprehensive Permissions Service
 * Handles all permission requests with tactical context and user-friendly explanations
 */

import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BaseService, ServiceConfig } from './BaseService';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
  expires?: 'never' | number;
}

export interface AllPermissions {
  location: PermissionStatus;
  locationBackground: PermissionStatus;
  camera: PermissionStatus;
  microphone: PermissionStatus;
  mediaLibrary: PermissionStatus;
  notifications: PermissionStatus;
}

export interface PermissionExplanation {
  title: string;
  message: string;
  tacticalContext: string;
  importance: 'critical' | 'important' | 'optional';
  features: string[];
}

const PERMISSION_STORAGE_KEY = '@permissions_asked';

class PermissionsService extends BaseService {
  private static instance: PermissionsService;
  private permissionsAsked: Set<string> = new Set();

  public static getInstance(config?: ServiceConfig): PermissionsService {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService(config);
    }
    return PermissionsService.instance;
  }

  private constructor(config?: ServiceConfig) {
    super(config);
    this.loadPermissionHistory();
  }

  /**
   * Initialize the permissions service
   */
  protected async onInitialize(): Promise<void> {
    await this.loadPermissionHistory();
    this.log('Permissions service initialized');
  }

  /**
   * Health check for permissions service
   */
  protected async onHealthCheck(): Promise<Record<string, any>> {
    const permissions = await this.checkAllPermissions();
    const essentialGranted = await this.areEssentialPermissionsGranted();
    const missingCritical = await this.getMissingCriticalPermissions();

    return {
      essentialPermissionsGranted: essentialGranted,
      missingCriticalPermissions: missingCritical,
      totalPermissions: Object.keys(permissions).length,
      grantedPermissions: Object.values(permissions).filter(p => p.granted).length,
    };
  }

  /**
   * Load permission request history
   */
  private async loadPermissionHistory(): Promise<void> {
    try {
      const history = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY);
      if (history) {
        this.permissionsAsked = new Set(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading permission history:', error);
    }
  }

  /**
   * Save permission request history
   */
  private async savePermissionHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PERMISSION_STORAGE_KEY,
        JSON.stringify(Array.from(this.permissionsAsked))
      );
    } catch (error) {
      console.error('Error saving permission history:', error);
    }
  }

  /**
   * Mark permission as asked
   */
  private async markPermissionAsked(permission: string): Promise<void> {
    this.permissionsAsked.add(permission);
    await this.savePermissionHistory();
  }

  /**
   * Check if permission was previously asked
   */
  private wasPermissionAsked(permission: string): boolean {
    return this.permissionsAsked.has(permission);
  }

  /**
   * Get permission explanations with tactical context
   */
  private getPermissionExplanations(): Record<string, PermissionExplanation> {
    return {
      location: {
        title: 'Location Permission Required',
        message: 'This tactical mapping application requires precise location access to provide essential operational capabilities.',
        tacticalContext: 'Location data is critical for tactical operations including position reporting, navigation, situational awareness, and emergency response coordination.',
        importance: 'critical',
        features: [
          'Real-time position tracking on tactical maps',
          'Navigation and route planning',
          'Geofencing and area monitoring',
          'Emergency location broadcasting',
          'Team coordination and situational awareness',
          'Automatic location updates for command centers'
        ]
      },
      locationBackground: {
        title: 'Background Location Permission',
        message: 'Background location access enables continuous tactical monitoring even when the app is not actively in use.',
        tacticalContext: 'Continuous location tracking is essential for maintaining operational security and enabling rapid response capabilities.',
        importance: 'critical',
        features: [
          'Continuous position monitoring during operations',
          'Automatic emergency alerts if position changes unexpectedly',
          'Geofence breach notifications',
          'Track recording for mission analysis',
          'Always-on tactical awareness'
        ]
      },
      camera: {
        title: 'Camera Permission Required',
        message: 'Camera access is needed for intelligence gathering, documentation, and tactical communication.',
        tacticalContext: 'Visual intelligence is crucial for tactical operations, enabling photo documentation, QR code scanning, and visual communication.',
        importance: 'important',
        features: [
          'Photo capture for intelligence documentation',
          'QR code scanning for equipment and location identification',
          'Visual evidence collection',
          'Tactical photo sharing with team members',
          'Augmented reality overlays on camera feed',
          'Barcode scanning for inventory management'
        ]
      },
      microphone: {
        title: 'Microphone Permission Required',
        message: 'Microphone access enables voice communication and audio recording capabilities essential for tactical coordination.',
        tacticalContext: 'Voice communication is fundamental to tactical operations, enabling real-time coordination and audio intelligence gathering.',
        importance: 'critical',
        features: [
          'Push-to-talk voice communication',
          'Voice messages and audio notes',
          'Live audio streaming during operations',
          'Voice commands for hands-free operation',
          'Audio recording for intelligence gathering',
          'Emergency voice alerts and distress calls'
        ]
      },
      mediaLibrary: {
        title: 'Media Library Permission Required',
        message: 'Media library access allows saving and organizing tactical photos, videos, and documents.',
        tacticalContext: 'Proper media management is essential for maintaining operational records and intelligence archives.',
        importance: 'important',
        features: [
          'Save tactical photos and videos to device',
          'Organize media by mission or operation',
          'Export media for intelligence analysis',
          'Backup important tactical documentation',
          'Share media files with authorized personnel'
        ]
      },
      notifications: {
        title: 'Notification Permission Required',
        message: 'Notifications are essential for receiving tactical alerts, emergency signals, and real-time updates.',
        tacticalContext: 'Immediate notification delivery can be critical for operational success and personnel safety.',
        importance: 'critical',
        features: [
          'Emergency alerts and distress signals',
          'Mission updates and status changes',
          'Geofence breach notifications',
          'Communication alerts from team members',
          'System status and connectivity alerts',
          'Time-sensitive tactical information'
        ]
      }
    };
  }

  /**
   * Request location permission (foreground)
   */
  async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      // Check current status first
      const currentStatus = await Location.getForegroundPermissionsAsync();
      if (currentStatus.status === 'granted') {
        return {
          granted: true,
          canAskAgain: currentStatus.canAskAgain,
          status: currentStatus.status,
          expires: currentStatus.expires,
        };
      }

      // Show explanation if not previously asked
      if (!this.wasPermissionAsked('location')) {
        await this.showPermissionExplanation('location');
        await this.markPermissionAsked('location');
      }

      // Request permission
      const result = await Location.requestForegroundPermissionsAsync();
      
      return {
        granted: result.status === 'granted',
        canAskAgain: result.canAskAgain,
        status: result.status,
        expires: result.expires,
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Request background location permission
   */
  async requestBackgroundLocationPermission(): Promise<PermissionStatus> {
    try {
      // First ensure foreground permission is granted
      const foregroundStatus = await this.requestLocationPermission();
      if (!foregroundStatus.granted) {
        return foregroundStatus;
      }

      // Check current background status
      const currentStatus = await Location.getBackgroundPermissionsAsync();
      if (currentStatus.status === 'granted') {
        return {
          granted: true,
          canAskAgain: currentStatus.canAskAgain,
          status: currentStatus.status,
          expires: currentStatus.expires,
        };
      }

      // Show explanation if not previously asked
      if (!this.wasPermissionAsked('locationBackground')) {
        await this.showPermissionExplanation('locationBackground');
        await this.markPermissionAsked('locationBackground');
      }

      // Request background permission
      const result = await Location.requestBackgroundPermissionsAsync();
      
      return {
        granted: result.status === 'granted',
        canAskAgain: result.canAskAgain,
        status: result.status,
        expires: result.expires,
      };
    } catch (error) {
      console.error('Error requesting background location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      // Check current status
      const currentStatus = await Camera.getCameraPermissionsAsync();
      if (currentStatus.status === 'granted') {
        return {
          granted: true,
          canAskAgain: currentStatus.canAskAgain,
          status: currentStatus.status,
        };
      }

      // Show explanation if not previously asked
      if (!this.wasPermissionAsked('camera')) {
        await this.showPermissionExplanation('camera');
        await this.markPermissionAsked('camera');
      }

      // Request permission
      const result = await Camera.requestCameraPermissionsAsync();
      
      return {
        granted: result.status === 'granted',
        canAskAgain: result.canAskAgain,
        status: result.status,
      };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<PermissionStatus> {
    try {
      // Check current status
      const currentStatus = await Camera.getMicrophonePermissionsAsync();
      if (currentStatus.status === 'granted') {
        return {
          granted: true,
          canAskAgain: currentStatus.canAskAgain,
          status: currentStatus.status,
        };
      }

      // Show explanation if not previously asked
      if (!this.wasPermissionAsked('microphone')) {
        await this.showPermissionExplanation('microphone');
        await this.markPermissionAsked('microphone');
      }

      // Request permission
      const result = await Camera.requestMicrophonePermissionsAsync();
      
      return {
        granted: result.status === 'granted',
        canAskAgain: result.canAskAgain,
        status: result.status,
      };
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Request media library permission
   */
  async requestMediaLibraryPermission(): Promise<PermissionStatus> {
    try {
      // Check current status
      const currentStatus = await MediaLibrary.getPermissionsAsync();
      if (currentStatus.status === 'granted') {
        return {
          granted: true,
          canAskAgain: currentStatus.canAskAgain,
          status: currentStatus.status,
        };
      }

      // Show explanation if not previously asked
      if (!this.wasPermissionAsked('mediaLibrary')) {
        await this.showPermissionExplanation('mediaLibrary');
        await this.markPermissionAsked('mediaLibrary');
      }

      // Request permission
      const result = await MediaLibrary.requestPermissionsAsync();
      
      return {
        granted: result.status === 'granted',
        canAskAgain: result.canAskAgain,
        status: result.status,
      };
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<PermissionStatus> {
    try {
      // Check current status
      const currentStatus = await Notifications.getPermissionsAsync();
      if (currentStatus.status === 'granted') {
        return {
          granted: true,
          canAskAgain: currentStatus.canAskAgain,
          status: currentStatus.status,
        };
      }

      // Show explanation if not previously asked
      if (!this.wasPermissionAsked('notifications')) {
        await this.showPermissionExplanation('notifications');
        await this.markPermissionAsked('notifications');
      }

      // Request permission
      const result = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      
      return {
        granted: result.status === 'granted',
        canAskAgain: result.canAskAgain,
        status: result.status,
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Check all permission statuses
   */
  async checkAllPermissions(): Promise<AllPermissions> {
    try {
      const [
        location,
        locationBackground,
        camera,
        microphone,
        mediaLibrary,
        notifications
      ] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
        Camera.getCameraPermissionsAsync(),
        Camera.getMicrophonePermissionsAsync(),
        MediaLibrary.getPermissionsAsync(),
        Notifications.getPermissionsAsync(),
      ]);

      return {
        location: {
          granted: location.status === 'granted',
          canAskAgain: location.canAskAgain,
          status: location.status,
          expires: location.expires,
        },
        locationBackground: {
          granted: locationBackground.status === 'granted',
          canAskAgain: locationBackground.canAskAgain,
          status: locationBackground.status,
          expires: locationBackground.expires,
        },
        camera: {
          granted: camera.status === 'granted',
          canAskAgain: camera.canAskAgain,
          status: camera.status,
        },
        microphone: {
          granted: microphone.status === 'granted',
          canAskAgain: microphone.canAskAgain,
          status: microphone.status,
        },
        mediaLibrary: {
          granted: mediaLibrary.status === 'granted',
          canAskAgain: mediaLibrary.canAskAgain,
          status: mediaLibrary.status,
        },
        notifications: {
          granted: notifications.status === 'granted',
          canAskAgain: notifications.canAskAgain,
          status: notifications.status,
        },
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      throw error;
    }
  }

  /**
   * Request all essential permissions for tactical operations
   */
  async requestAllEssentialPermissions(): Promise<AllPermissions> {
    try {
      // Request permissions in order of importance
      const location = await this.requestLocationPermission();
      const locationBackground = location.granted 
        ? await this.requestBackgroundLocationPermission()
        : location;
      
      const microphone = await this.requestMicrophonePermission();
      const notifications = await this.requestNotificationPermission();
      const camera = await this.requestCameraPermission();
      const mediaLibrary = await this.requestMediaLibraryPermission();

      return {
        location,
        locationBackground,
        camera,
        microphone,
        mediaLibrary,
        notifications,
      };
    } catch (error) {
      console.error('Error requesting all permissions:', error);
      throw error;
    }
  }

  /**
   * Show permission explanation dialog
   */
  private async showPermissionExplanation(permissionType: string): Promise<void> {
    const explanations = this.getPermissionExplanations();
    const explanation = explanations[permissionType];
    
    if (!explanation) {
      console.warn(`No explanation found for permission: ${permissionType}`);
      return;
    }

    return new Promise((resolve) => {
      const importanceIcon = {
        critical: '🔴',
        important: '🟡',
        optional: '🟢'
      }[explanation.importance];

      const message = `${explanation.message}\n\n${importanceIcon} ${explanation.tacticalContext}\n\nThis permission enables:\n${explanation.features.map(f => `• ${f}`).join('\n')}`;

      Alert.alert(
        explanation.title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Grant Permission',
            onPress: () => resolve(),
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Check if all essential permissions are granted
   */
  async areEssentialPermissionsGranted(): Promise<boolean> {
    try {
      const permissions = await this.checkAllPermissions();
      
      // Location and notifications are absolutely essential
      return permissions.location.granted && permissions.notifications.granted;
    } catch (error) {
      console.error('Error checking essential permissions:', error);
      return false;
    }
  }

  /**
   * Get missing critical permissions
   */
  async getMissingCriticalPermissions(): Promise<string[]> {
    try {
      const permissions = await this.checkAllPermissions();
      const missing: string[] = [];

      if (!permissions.location.granted) missing.push('location');
      if (!permissions.microphone.granted) missing.push('microphone');
      if (!permissions.notifications.granted) missing.push('notifications');

      return missing;
    } catch (error) {
      console.error('Error getting missing permissions:', error);
      return [];
    }
  }

  /**
   * Get all missing permissions
   */
  async getAllMissingPermissions(): Promise<string[]> {
    try {
      const permissions = await this.checkAllPermissions();
      const missing: string[] = [];

      if (!permissions.location.granted) missing.push('location');
      if (!permissions.locationBackground.granted) missing.push('locationBackground');
      if (!permissions.camera.granted) missing.push('camera');
      if (!permissions.microphone.granted) missing.push('microphone');
      if (!permissions.mediaLibrary.granted) missing.push('mediaLibrary');
      if (!permissions.notifications.granted) missing.push('notifications');

      return missing;
    } catch (error) {
      console.error('Error getting all missing permissions:', error);
      return [];
    }
  }

  /**
   * Open device settings for manual permission management
   */
  async openSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, we would use Linking.openURL('app-settings:')
        // But this requires additional setup
        Alert.alert(
          'Open Settings',
          'Please go to Settings > Privacy & Security to manage app permissions.',
          [{ text: 'OK' }]
        );
      } else {
        // For Android, we would use IntentLauncher or similar
        Alert.alert(
          'Open Settings',
          'Please go to Settings > Apps > Tactical Mapping > Permissions to manage permissions.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }

  /**
   * Reset permission request history (for testing)
   */
  async resetPermissionHistory(): Promise<void> {
    try {
      this.permissionsAsked.clear();
      await AsyncStorage.removeItem(PERMISSION_STORAGE_KEY);
      console.log('Permission history reset');
    } catch (error) {
      console.error('Error resetting permission history:', error);
    }
  }
}

export default PermissionsService;