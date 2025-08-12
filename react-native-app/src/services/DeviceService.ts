import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import { DeviceInfo } from '@/types';
import { API_CONFIG } from '@/constants';
import { StorageService } from './StorageService';
import { ApiService } from './ApiService';

export class DeviceService {
  private static deviceInfo: DeviceInfo | null = null;

  /**
   * Get comprehensive device information
   */
  static async getDeviceInfo(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    try {
      const deviceId = await Application.getAndroidId() || 
                      await Application.getIosIdForVendorAsync() || 
                      'unknown-device';
      
      this.deviceInfo = {
        deviceId,
        model: Device.modelName,
        manufacturer: Device.manufacturer,
        osVersion: Device.osVersion,
        platform: Device.osName,
        appVersion: Constants.expoConfig?.version,
        deviceType: await Device.getDeviceTypeAsync(),
        isDevice: Device.isDevice,
      };

      return this.deviceInfo;
    } catch (error) {
      console.error('Failed to get device info:', error);
      throw new Error('Unable to retrieve device information');
    }
  }

  /**
   * Register device with the backend
   */
  static async registerDevice(): Promise<boolean> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await StorageService.getToken()}`,
        },
        body: JSON.stringify(deviceInfo),
        timeout: API_CONFIG.TIMEOUT,
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Device registered successfully:', result.device);
        return true;
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Device registration failed:', error);
      return false;
    }
  }

  /**
   * Update device status (online/offline)
   */
  static async updateDeviceStatus(isOnline: boolean): Promise<boolean> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const response = await ApiService.post('/api/devices/status', {
        deviceId: deviceInfo.deviceId,
        isOnline,
        timestamp: new Date().toISOString(),
      });

      return response.success;
    } catch (error) {
      console.error('Failed to update device status:', error);
      return false;
    }
  }

  /**
   * Get device capabilities with backward compatibility
   */
  static async getDeviceCapabilities(): Promise<{
    hasCamera: boolean;
    hasMicrophone: boolean;
    hasGPS: boolean;
    hasAccelerometer: boolean;
    hasGyroscope: boolean;
    hasBluetooth: boolean;
    hasWifi: boolean;
    supportedAndroidVersion: number;
    isLegacyDevice: boolean;
  }> {
    try {
      const androidVersion = Platform.OS === 'android' ? Platform.Version : 0;
      const isLegacyDevice = Platform.OS === 'android' && androidVersion < 23; // Android 6.0

      return {
        hasCamera: Device.isDevice,
        hasMicrophone: Device.isDevice,
        hasGPS: Device.isDevice,
        hasAccelerometer: Device.isDevice,
        hasGyroscope: Device.isDevice && !isLegacyDevice, // Gyroscope less common on old devices
        hasBluetooth: Device.isDevice,
        hasWifi: Device.isDevice,
        supportedAndroidVersion: androidVersion,
        isLegacyDevice,
      };
    } catch (error) {
      console.error('Failed to get device capabilities:', error);
      return {
        hasCamera: false,
        hasMicrophone: false,
        hasGPS: false,
        hasAccelerometer: false,
        hasGyroscope: false,
        hasBluetooth: false,
        hasWifi: false,
        supportedAndroidVersion: 0,
        isLegacyDevice: true,
      };
    }
  }

  /**
   * Get battery information
   */
  static async getBatteryInfo(): Promise<{
    batteryLevel: number;
    batteryState: string;
    isCharging: boolean;
    powerMode: string;
  }> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();
      const powerMode = await Battery.getPowerStateAsync();

      return {
        batteryLevel: Math.round(batteryLevel * 100),
        batteryState: this.getBatteryStateString(batteryState),
        isCharging: batteryState === Battery.BatteryState.CHARGING,
        powerMode: powerMode.lowPowerMode ? 'low_power' : 'normal',
      };
    } catch (error) {
      console.error('Failed to get battery info:', error);
      return {
        batteryLevel: -1,
        batteryState: 'unknown',
        isCharging: false,
        powerMode: 'unknown',
      };
    }
  }

  /**
   * Get network information
   */
  static async getNetworkInfo(): Promise<{
    networkType: string;
    isConnected: boolean;
    isInternetReachable: boolean;
    ipAddress?: string;
    carrier?: string;
  }> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const ipAddress = await Network.getIpAddressAsync();

      return {
        networkType: networkState.type || 'unknown',
        isConnected: networkState.isConnected || false,
        isInternetReachable: networkState.isInternetReachable || false,
        ipAddress,
        carrier: undefined, // Would need additional native module
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return {
        networkType: 'unknown',
        isConnected: false,
        isInternetReachable: false,
      };
    }
  }

  /**
   * Get comprehensive device status
   */
  static async getDeviceStatus(): Promise<{
    deviceInfo: DeviceInfo;
    battery: any;
    network: any;
    capabilities: any;
    timestamp: string;
  }> {
    try {
      const [deviceInfo, battery, network, capabilities] = await Promise.all([
        this.getDeviceInfo(),
        this.getBatteryInfo(),
        this.getNetworkInfo(),
        this.getDeviceCapabilities(),
      ]);

      return {
        deviceInfo,
        battery,
        network,
        capabilities,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get device status:', error);
      throw error;
    }
  }

  /**
   * Check backward compatibility for older Android versions
   */
  static async checkBackwardCompatibility(): Promise<{
    isSupported: boolean;
    androidVersion: number;
    limitations: string[];
    recommendations: string[];
    supportedFeatures: string[];
  }> {
    try {
      const capabilities = await this.getDeviceCapabilities();
      const androidVersion = capabilities.supportedAndroidVersion;
      const limitations: string[] = [];
      const recommendations: string[] = [];
      const supportedFeatures: string[] = [];

      // Check Android version compatibility
      if (Platform.OS === 'android') {
        if (androidVersion >= 21) { // Android 5.0+
          supportedFeatures.push('basic_functionality', 'location_tracking', 'file_management');
          
          if (androidVersion >= 23) { // Android 6.0+
            supportedFeatures.push('runtime_permissions', 'background_tasks', 'camera_api2');
            
            if (androidVersion >= 26) { // Android 8.0+
              supportedFeatures.push('background_location', 'notification_channels');
              
              if (androidVersion >= 29) { // Android 10+
                supportedFeatures.push('scoped_storage', 'background_restrictions');
              }
            } else {
              limitations.push('Limited background processing');
              recommendations.push('Use foreground services for continuous tasks');
            }
          } else {
            limitations.push('No runtime permissions (uses install-time permissions)');
            limitations.push('Limited camera features');
            recommendations.push('Request all permissions at install time');
          }
        } else {
          limitations.push('Very limited functionality on Android < 5.0');
          limitations.push('No modern security features');
          recommendations.push('Consider upgrading device or using basic features only');
        }

        // Version-specific limitations
        if (androidVersion < 23) {
          limitations.push('No fingerprint authentication');
          limitations.push('Limited notification features');
        }
        
        if (androidVersion < 26) {
          limitations.push('No notification channels');
          limitations.push('Limited background execution');
        }
        
        if (androidVersion < 29) {
          limitations.push('No scoped storage');
          limitations.push('Different file access patterns');
        }
      } else {
        // iOS is generally more consistent across versions
        supportedFeatures.push('full_functionality');
      }

      return {
        isSupported: androidVersion >= 21 || Platform.OS === 'ios',
        androidVersion,
        limitations,
        recommendations,
        supportedFeatures,
      };
    } catch (error) {
      console.error('Backward compatibility check failed:', error);
      return {
        isSupported: false,
        androidVersion: 0,
        limitations: ['Unable to determine compatibility'],
        recommendations: ['Check device and try again'],
        supportedFeatures: [],
      };
    }
  }

  /**
   * Helper method to convert battery state to string
   */
  private static getBatteryStateString(state: Battery.BatteryState): string {
    switch (state) {
      case Battery.BatteryState.CHARGING:
        return 'charging';
      case Battery.BatteryState.FULL:
        return 'full';
      case Battery.BatteryState.UNPLUGGED:
        return 'unplugged';
      default:
        return 'unknown';
    }
  }

  /**
   * Get device memory and storage info
   */
  static async getDeviceResources(): Promise<{
    totalMemory?: number;
    availableMemory?: number;
    totalStorage?: number;
    availableStorage?: number;
  }> {
    try {
      // Note: This would require additional native modules for detailed info
      // For prototype, return basic info
      return {
        totalMemory: undefined, // Would need native module
        availableMemory: undefined, // Would need native module
        totalStorage: undefined, // Would need native module
        availableStorage: undefined, // Would need native module
      };
    } catch (error) {
      console.error('Failed to get device resources:', error);
      return {};
    }
  }

  /**
   * Clear cached device info (force refresh)
   */
  static clearCache(): void {
    this.deviceInfo = null;
  }

  /**
   * Get device unique identifier for secure operations
   */
  static async getSecureDeviceId(): Promise<string> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      // Create a more secure identifier by combining multiple factors
      const identifier = `${deviceInfo.deviceId}-${deviceInfo.model}-${deviceInfo.manufacturer}`;
      
      // In a real implementation, you might want to hash this
      return identifier;
    } catch (error) {
      console.error('Failed to get secure device ID:', error);
      return 'unknown-secure-id';
    }
  }
}