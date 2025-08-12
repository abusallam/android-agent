/**
 * PermissionsService Unit Tests
 */

import PermissionsService from '../PermissionsService';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock external dependencies
jest.mock('expo-location');
jest.mock('expo-camera');
jest.mock('expo-media-library');
jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('PermissionsService', () => {
  let permissionsService: PermissionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    permissionsService = PermissionsService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PermissionsService.getInstance();
      const instance2 = PermissionsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Location Permissions', () => {
    it('should request location permission successfully', async () => {
      const mockResponse = {
        status: 'granted',
        canAskAgain: true,
        expires: 'never',
      };

      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(mockResponse);

      const result = await permissionsService.requestLocationPermission();

      expect(result.granted).toBe(true);
      expect(result.status).toBe('granted');
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle location permission denial', async () => {
      const mockResponse = {
        status: 'denied',
        canAskAgain: false,
      };

      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(mockResponse);

      const result = await permissionsService.requestLocationPermission();

      expect(result.granted).toBe(false);
      expect(result.canAskAgain).toBe(false);
      expect(result.status).toBe('denied');
    });

    it('should handle location permission errors', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Permission request failed')
      );

      const result = await permissionsService.requestLocationPermission();

      expect(result.granted).toBe(false);
      expect(result.status).toBe('error');
    });
  });

  describe('Background Location Permissions', () => {
    it('should request background location after foreground permission', async () => {
      const foregroundResponse = {
        status: 'granted',
        canAskAgain: true,
      };
      const backgroundResponse = {
        status: 'granted',
        canAskAgain: true,
      };

      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(foregroundResponse);
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
        canAskAgain: true,
      });
      (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue(backgroundResponse);

      const result = await permissionsService.requestBackgroundLocationPermission();

      expect(result.granted).toBe(true);
      expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should not request background permission if foreground is denied', async () => {
      const foregroundResponse = {
        status: 'denied',
        canAskAgain: false,
      };

      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(foregroundResponse);

      const result = await permissionsService.requestBackgroundLocationPermission();

      expect(result.granted).toBe(false);
      expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  describe('Camera Permissions', () => {
    it('should request camera permission successfully', async () => {
      const mockResponse = {
        status: 'granted',
        canAskAgain: true,
      };

      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
        canAskAgain: true,
      });
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue(mockResponse);

      const result = await permissionsService.requestCameraPermission();

      expect(result.granted).toBe(true);
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    it('should return existing camera permission if already granted', async () => {
      const mockResponse = {
        status: 'granted',
        canAskAgain: true,
      };

      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue(mockResponse);

      const result = await permissionsService.requestCameraPermission();

      expect(result.granted).toBe(true);
      expect(Camera.requestCameraPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  describe('All Permissions Check', () => {
    it('should check all permissions status', async () => {
      const mockPermissions = {
        location: { status: 'granted', canAskAgain: true },
        locationBackground: { status: 'granted', canAskAgain: true },
        camera: { status: 'granted', canAskAgain: true },
        microphone: { status: 'granted', canAskAgain: true },
        mediaLibrary: { status: 'granted', canAskAgain: true },
        notifications: { status: 'granted', canAskAgain: true },
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.location);
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.locationBackground);
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.camera);
      (Camera.getMicrophonePermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.microphone);
      (MediaLibrary.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.mediaLibrary);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.notifications);

      const result = await permissionsService.checkAllPermissions();

      expect(result.location.granted).toBe(true);
      expect(result.camera.granted).toBe(true);
      expect(result.microphone.granted).toBe(true);
      expect(result.notifications.granted).toBe(true);
    });
  });

  describe('Essential Permissions', () => {
    it('should identify when essential permissions are granted', async () => {
      const mockPermissions = {
        location: { status: 'granted', canAskAgain: true },
        notifications: { status: 'granted', canAskAgain: true },
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.location);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.notifications);

      const result = await permissionsService.areEssentialPermissionsGranted();

      expect(result).toBe(true);
    });

    it('should identify when essential permissions are missing', async () => {
      const mockPermissions = {
        location: { status: 'denied', canAskAgain: false },
        notifications: { status: 'granted', canAskAgain: true },
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.location);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.notifications);

      const result = await permissionsService.areEssentialPermissionsGranted();

      expect(result).toBe(false);
    });
  });

  describe('Missing Permissions', () => {
    it('should return list of missing critical permissions', async () => {
      const mockPermissions = {
        location: { status: 'denied', canAskAgain: true },
        microphone: { status: 'granted', canAskAgain: true },
        notifications: { status: 'denied', canAskAgain: true },
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.location);
      (Camera.getMicrophonePermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.microphone);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.notifications);

      const result = await permissionsService.getMissingCriticalPermissions();

      expect(result).toContain('location');
      expect(result).toContain('notifications');
      expect(result).not.toContain('microphone');
    });
  });

  describe('Permission History', () => {
    it('should load permission history from storage', async () => {
      const mockHistory = ['location', 'camera'];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

      // Create new instance to trigger history loading
      const newService = PermissionsService.getInstance();
      await newService.initialize();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@permissions_asked');
    });

    it('should reset permission history', async () => {
      await permissionsService.resetPermissionHistory();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@permissions_asked');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const mockPermissions = {
        location: { status: 'granted', canAskAgain: true },
        locationBackground: { status: 'granted', canAskAgain: true },
        camera: { status: 'granted', canAskAgain: true },
        microphone: { status: 'granted', canAskAgain: true },
        mediaLibrary: { status: 'granted', canAskAgain: true },
        notifications: { status: 'granted', canAskAgain: true },
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.location);
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.locationBackground);
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.camera);
      (Camera.getMicrophonePermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.microphone);
      (MediaLibrary.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.mediaLibrary);
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions.notifications);

      const health = await permissionsService.getHealthStatus();

      expect(health.healthy).toBe(true);
      expect(health.details.essentialPermissionsGranted).toBe(true);
      expect(health.details.totalPermissions).toBe(6);
      expect(health.details.grantedPermissions).toBe(6);
    });
  });
});