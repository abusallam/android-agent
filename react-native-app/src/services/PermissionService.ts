// 🔐 Tactical Mapping System - Enhanced Permission Service
// Handles all device permissions with proper error handling and user guidance

import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import * as Contacts from 'expo-contacts';
import { getTranslation, DEFAULT_LANGUAGE, SupportedLanguage } from '../constants/i18n';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
  explanation?: string;
}

export interface AllPermissions {
  location: PermissionStatus;
  locationBackground: PermissionStatus;
  camera: PermissionStatus;
  mediaLibrary: PermissionStatus;
  notifications: PermissionStatus;
  contacts: PermissionStatus;
  microphone: PermissionStatus;
}

export interface PermissionRequest {
  type: keyof AllPermissions;
  required: boolean;
  explanation: string;
  fallback?: string;
}

class PermissionService {
  private static instance: PermissionService;
  private currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  private translate(key: string): string {
    return getTranslation(this.currentLanguage, key);
  }

  // Location permissions (foreground)
  async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
        explanation: this.getLocationExplanation(status)
      };

      if (!result.granted && result.canAskAgain) {
        await this.showPermissionDialog('location', 'Location access is required for tactical mapping and navigation features.');
      }

      return result;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
        explanation: 'Failed to request location permission'
      };
    }
  }

  // Background location permissions
  async requestBackgroundLocationPermission(): Promise<PermissionStatus> {
    try {
      // First ensure we have foreground permission
      const foregroundStatus = await this.requestLocationPermission();
      if (!foregroundStatus.granted) {
        return {
          granted: false,
          canAskAgain: false,
          status: 'denied',
          explanation: 'Foreground location permission required first'
        };
      }

      const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
        explanation: this.getBackgroundLocationExplanation(status)
      };

      if (!result.granted && result.canAskAgain) {
        await this.showPermissionDialog('locationBackground', 'Background location access enables continuous tracking and geofencing alerts.');
      }

      return result;
    } catch (error) {
      console.error('Error requesting background location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
        explanation: 'Failed to request background location permission'
      };
    }
  }

  // Camera permissions
  async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
        explanation: this.getCameraExplanation(status)
      };

      if (!result.granted && result.canAskAgain) {
        await this.showPermissionDialog('camera', 'Camera access is needed for photo capture and QR code scanning.');
      }

      return result;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
        explanation: 'Failed to request camera permission'
      };
    }
  }

  // Microphone permissions
  async requestMicrophonePermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.requestMicrophonePermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
        explanation: this.getMicrophoneExplanation(status)
      };

      if (!result.granted && result.canAskAgain) {
        await this.showPermissionDialog('microphone', 'Microphone access is required for voice communication and audio recording.');
      }

      return result;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
        explanation: 'Failed to request microphone permission'
      };
    }
  }

  // Media library permissions
  async requestMediaLibraryPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
        explanation: this.getMediaLibraryExplanation(status)
      };

      if (!result.granted && result.canAskAgain) {
        await this.showPermissionDialog('mediaLibrary', 'Media library access allows saving photos and videos to your device.');
      }

      return result;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
        explanation: 'Failed to request media library permission'
      };
    }
  }

  // Notification permissions
  async requestNotificationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
        explanation: this.getNotificationExplanation(status)
      };

      if (!result.granted && result.canAskAgain) {
        await this.showPermissionDialog('notifications', 'Notifications are essential for tactical alerts and emergency communications.');
      }

      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
        explanation: 'Failed to request notification permission'
      };
    }
  }

  // Contacts permissions
  async requestContactsPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
        explanation: this.getContactsExplanation(status)
      };

      if (!result.granted && result.canAskAgain) {
        await this.showPermissionDialog('contacts', 'Contacts access enables emergency contact management and team member selection.');
      }

      return result;
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
        explanation: 'Failed to request contacts permission'
      };
    }
  }

  // Request all permissions
  async requestAllPermissions(): Promise<AllPermissions> {
    const [
      location,
      locationBackground,
      camera,
      mediaLibrary,
      notifications,
      contacts,
      microphone
    ] = await Promise.all([
      this.requestLocationPermission(),
      this.requestBackgroundLocationPermission(),
      this.requestCameraPermission(),
      this.requestMediaLibraryPermission(),
      this.requestNotificationPermission(),
      this.requestContactsPermission(),
      this.requestMicrophonePermission()
    ]);

    return {
      location,
      locationBackground,
      camera,
      mediaLibrary,
      notifications,
      contacts,
      microphone
    };
  }

  // Check all permissions status
  async checkAllPermissions(): Promise<AllPermissions> {
    try {
      const [
        locationStatus,
        locationBackgroundStatus,
        cameraStatus,
        mediaLibraryStatus,
        notificationStatus,
        contactsStatus,
        microphoneStatus
      ] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
        Camera.getCameraPermissionsAsync(),
        MediaLibrary.getPermissionsAsync(),
        Notifications.getPermissionsAsync(),
        Contacts.getPermissionsAsync(),
        Camera.getMicrophonePermissionsAsync()
      ]);

      return {
        location: {
          granted: locationStatus.status === 'granted',
          canAskAgain: locationStatus.canAskAgain,
          status: locationStatus.status,
          explanation: this.getLocationExplanation(locationStatus.status)
        },
        locationBackground: {
          granted: locationBackgroundStatus.status === 'granted',
          canAskAgain: locationBackgroundStatus.canAskAgain,
          status: locationBackgroundStatus.status,
          explanation: this.getBackgroundLocationExplanation(locationBackgroundStatus.status)
        },
        camera: {
          granted: cameraStatus.status === 'granted',
          canAskAgain: cameraStatus.canAskAgain,
          status: cameraStatus.status,
          explanation: this.getCameraExplanation(cameraStatus.status)
        },
        mediaLibrary: {
          granted: mediaLibraryStatus.status === 'granted',
          canAskAgain: mediaLibraryStatus.canAskAgain,
          status: mediaLibraryStatus.status,
          explanation: this.getMediaLibraryExplanation(mediaLibraryStatus.status)
        },
        notifications: {
          granted: notificationStatus.status === 'granted',
          canAskAgain: notificationStatus.canAskAgain,
          status: notificationStatus.status,
          explanation: this.getNotificationExplanation(notificationStatus.status)
        },
        contacts: {
          granted: contactsStatus.status === 'granted',
          canAskAgain: contactsStatus.canAskAgain,
          status: contactsStatus.status,
          explanation: this.getContactsExplanation(contactsStatus.status)
        },
        microphone: {
          granted: microphoneStatus.status === 'granted',
          canAskAgain: microphoneStatus.canAskAgain,
          status: microphoneStatus.status,
          explanation: this.getMicrophoneExplanation(microphoneStatus.status)
        }
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      // Return default denied permissions
      const defaultPermission: PermissionStatus = {
        granted: false,
        canAskAgain: false,
        status: 'error',
        explanation: 'Unable to check permission status'
      };
      
      return {
        location: defaultPermission,
        locationBackground: defaultPermission,
        camera: defaultPermission,
        mediaLibrary: defaultPermission,
        notifications: defaultPermission,
        contacts: defaultPermission,
        microphone: defaultPermission
      };
    }
  }

  // Show permission explanation dialog
  private async showPermissionDialog(permissionType: string, explanation: string): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        'Permission Required',
        explanation,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Settings',
            onPress: () => {
              this.openSettings();
              resolve();
            },
          },
        ]
      );
    });
  }

  // Open device settings
  async openSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert(
        'Error',
        'Unable to open settings. Please manually go to Settings > Apps > Tactical Mapping to manage permissions.'
      );
    }
  }

  // Permission explanation helpers
  private getLocationExplanation(status: string): string {
    switch (status) {
      case 'granted':
        return 'Location access granted - tactical mapping features available';
      case 'denied':
        return 'Location access denied - mapping and navigation features limited';
      case 'undetermined':
        return 'Location permission not yet requested';
      default:
        return `Location permission status: ${status}`;
    }
  }

  private getBackgroundLocationExplanation(status: string): string {
    switch (status) {
      case 'granted':
        return 'Background location access granted - continuous tracking enabled';
      case 'denied':
        return 'Background location denied - geofencing and tracking limited';
      case 'undetermined':
        return 'Background location permission not yet requested';
      default:
        return `Background location permission status: ${status}`;
    }
  }

  private getCameraExplanation(status: string): string {
    switch (status) {
      case 'granted':
        return 'Camera access granted - photo capture available';
      case 'denied':
        return 'Camera access denied - photo features unavailable';
      case 'undetermined':
        return 'Camera permission not yet requested';
      default:
        return `Camera permission status: ${status}`;
    }
  }

  private getMicrophoneExplanation(status: string): string {
    switch (status) {
      case 'granted':
        return 'Microphone access granted - voice communication available';
      case 'denied':
        return 'Microphone access denied - voice features unavailable';
      case 'undetermined':
        return 'Microphone permission not yet requested';
      default:
        return `Microphone permission status: ${status}`;
    }
  }

  private getMediaLibraryExplanation(status: string): string {
    switch (status) {
      case 'granted':
        return 'Media library access granted - can save photos and videos';
      case 'denied':
        return 'Media library access denied - cannot save media to device';
      case 'undetermined':
        return 'Media library permission not yet requested';
      default:
        return `Media library permission status: ${status}`;
    }
  }

  private getNotificationExplanation(status: string): string {
    switch (status) {
      case 'granted':
        return 'Notifications enabled - tactical alerts available';
      case 'denied':
        return 'Notifications disabled - alerts and warnings unavailable';
      case 'undetermined':
        return 'Notification permission not yet requested';
      default:
        return `Notification permission status: ${status}`;
    }
  }

  private getContactsExplanation(status: string): string {
    switch (status) {
      case 'granted':
        return 'Contacts access granted - emergency contacts available';
      case 'denied':
        return 'Contacts access denied - emergency contact features limited';
      case 'undetermined':
        return 'Contacts permission not yet requested';
      default:
        return `Contacts permission status: ${status}`;
    }
  }

  // Get critical permissions that are required for core functionality
  getCriticalPermissions(): (keyof AllPermissions)[] {
    return ['location', 'notifications'];
  }

  // Get recommended permissions for full functionality
  getRecommendedPermissions(): (keyof AllPermissions)[] {
    return ['location', 'locationBackground', 'camera', 'microphone', 'notifications'];
  }

  // Check if all critical permissions are granted
  async hasCriticalPermissions(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    const critical = this.getCriticalPermissions();
    
    return critical.every(permission => permissions[permission].granted);
  }

  // Request only critical permissions
  async requestCriticalPermissions(): Promise<Partial<AllPermissions>> {
    const critical = this.getCriticalPermissions();
    const results: Partial<AllPermissions> = {};
    
    for (const permission of critical) {
      switch (permission) {
        case 'location':
          results.location = await this.requestLocationPermission();
          break;
        case 'notifications':
          results.notifications = await this.requestNotificationPermission();
          break;
      }
    }
    
    return results;
  }
}

export default PermissionService.getInstance();