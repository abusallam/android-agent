/**
 * Secure Storage Service
 * Handles encrypted storage for sensitive data using expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

interface StorageOptions {
  requireAuthentication?: boolean;
  keychainService?: string;
  encrypt?: boolean;
}

interface UserCredentials {
  username: string;
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

interface DeviceConfig {
  deviceId: string;
  serverUrl: string;
  wsUrl: string;
  livekitUrl?: string;
  pushToken?: string;
  preferences: {
    locationTracking: boolean;
    backgroundSync: boolean;
    pushNotifications: boolean;
    dataCollection: boolean;
  };
}

interface SecuritySettings {
  biometricEnabled: boolean;
  autoLockTimeout: number;
  encryptionLevel: 'basic' | 'enhanced';
  auditLogging: boolean;
}

export class SecureStorageService {
  private static instance: SecureStorageService;
  private readonly keychainService = 'android-agent-tactical';
  private readonly encryptionKey = 'android-agent-encryption-key';

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  // Authentication Token Management
  async storeAuthToken(token: string, refreshToken?: string, expiresIn?: number): Promise<boolean> {
    try {
      const expiresAt = expiresIn 
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours default

      const credentials: UserCredentials = {
        username: '', // Will be set separately
        token,
        refreshToken,
        expiresAt,
      };

      await SecureStore.setItemAsync('auth_credentials', JSON.stringify(credentials), {
        keychainService: this.keychainService,
        requireAuthentication: true,
      });

      return true;
    } catch (error) {
      console.error('Failed to store auth token:', error);
      return false;
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      const credentialsJson = await SecureStore.getItemAsync('auth_credentials', {
        keychainService: this.keychainService,
      });

      if (!credentialsJson) return null;

      const credentials: UserCredentials = JSON.parse(credentialsJson);
      
      // Check if token is expired
      if (new Date(credentials.expiresAt) <= new Date()) {
        await this.clearAuthToken();
        return null;
      }

      return credentials.token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      const credentialsJson = await SecureStore.getItemAsync('auth_credentials', {
        keychainService: this.keychainService,
      });

      if (!credentialsJson) return null;

      const credentials: UserCredentials = JSON.parse(credentialsJson);
      return credentials.refreshToken || null;
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  async clearAuthToken(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync('auth_credentials', {
        keychainService: this.keychainService,
      });
      return true;
    } catch (error) {
      console.error('Failed to clear auth token:', error);
      return false;
    }
  }

  // Device Configuration Management
  async storeDeviceConfig(config: DeviceConfig): Promise<boolean> {
    try {
      const encryptedConfig = await this.encryptData(JSON.stringify(config));
      
      await SecureStore.setItemAsync('device_config', encryptedConfig, {
        keychainService: this.keychainService,
        requireAuthentication: false, // Device config doesn't need biometric auth
      });

      return true;
    } catch (error) {
      console.error('Failed to store device config:', error);
      return false;
    }
  }

  async getDeviceConfig(): Promise<DeviceConfig | null> {
    try {
      const encryptedConfig = await SecureStore.getItemAsync('device_config', {
        keychainService: this.keychainService,
      });

      if (!encryptedConfig) return null;

      const decryptedConfig = await this.decryptData(encryptedConfig);
      return JSON.parse(decryptedConfig);
    } catch (error) {
      console.error('Failed to get device config:', error);
      return null;
    }
  }

  // Security Settings Management
  async storeSecuritySettings(settings: SecuritySettings): Promise<boolean> {
    try {
      await SecureStore.setItemAsync('security_settings', JSON.stringify(settings), {
        keychainService: this.keychainService,
        requireAuthentication: true,
      });

      return true;
    } catch (error) {
      console.error('Failed to store security settings:', error);
      return false;
    }
  }

  async getSecuritySettings(): Promise<SecuritySettings | null> {
    try {
      const settingsJson = await SecureStore.getItemAsync('security_settings', {
        keychainService: this.keychainService,
      });

      if (!settingsJson) {
        // Return default security settings
        return {
          biometricEnabled: false,
          autoLockTimeout: 300000, // 5 minutes
          encryptionLevel: 'basic',
          auditLogging: true,
        };
      }

      return JSON.parse(settingsJson);
    } catch (error) {
      console.error('Failed to get security settings:', error);
      return null;
    }
  }

  // Generic Secure Storage
  async storeSecureData(key: string, data: any, options?: StorageOptions): Promise<boolean> {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const finalData = options?.encrypt ? await this.encryptData(dataString) : dataString;

      await SecureStore.setItemAsync(key, finalData, {
        keychainService: options?.keychainService || this.keychainService,
        requireAuthentication: options?.requireAuthentication || false,
      });

      return true;
    } catch (error) {
      console.error(`Failed to store secure data for key ${key}:`, error);
      return false;
    }
  }

  async getSecureData(key: string, options?: StorageOptions): Promise<any | null> {
    try {
      const data = await SecureStore.getItemAsync(key, {
        keychainService: options?.keychainService || this.keychainService,
      });

      if (!data) return null;

      const finalData = options?.encrypt ? await this.decryptData(data) : data;
      
      // Try to parse as JSON, return as string if parsing fails
      try {
        return JSON.parse(finalData);
      } catch {
        return finalData;
      }
    } catch (error) {
      console.error(`Failed to get secure data for key ${key}:`, error);
      return null;
    }
  }

  async deleteSecureData(key: string, options?: StorageOptions): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key, {
        keychainService: options?.keychainService || this.keychainService,
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete secure data for key ${key}:`, error);
      return false;
    }
  }

  // Encryption/Decryption Utilities
  private async encryptData(data: string): Promise<string> {
    try {
      // Generate a random IV for each encryption
      const iv = await Crypto.getRandomBytesAsync(16);
      const ivString = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // For demo purposes, we'll use a simple XOR encryption
      // In production, use proper AES encryption
      const encrypted = this.xorEncrypt(data, this.encryptionKey);
      
      return `${ivString}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Return original data if encryption fails
    }
  }

  private async decryptData(encryptedData: string): Promise<string> {
    try {
      const [ivString, encrypted] = encryptedData.split(':');
      
      if (!ivString || !encrypted) {
        return encryptedData; // Return as-is if not properly formatted
      }

      // Decrypt using XOR (in production, use proper AES decryption)
      const decrypted = this.xorDecrypt(encrypted, this.encryptionKey);
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Return original data if decryption fails
    }
  }

  // Simple XOR encryption (for demo - use AES in production)
  private xorEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result); // Base64 encode
  }

  private xorDecrypt(encryptedText: string, key: string): string {
    try {
      const decoded = atob(encryptedText); // Base64 decode
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return encryptedText;
    }
  }

  // Backup and Restore
  async createSecureBackup(): Promise<string | null> {
    try {
      const backupData = {
        deviceConfig: await this.getDeviceConfig(),
        securitySettings: await this.getSecuritySettings(),
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      const backupString = JSON.stringify(backupData);
      const encryptedBackup = await this.encryptData(backupString);
      
      return encryptedBackup;
    } catch (error) {
      console.error('Failed to create secure backup:', error);
      return null;
    }
  }

  async restoreFromSecureBackup(encryptedBackup: string): Promise<boolean> {
    try {
      const decryptedBackup = await this.decryptData(encryptedBackup);
      const backupData = JSON.parse(decryptedBackup);

      if (backupData.deviceConfig) {
        await this.storeDeviceConfig(backupData.deviceConfig);
      }

      if (backupData.securitySettings) {
        await this.storeSecuritySettings(backupData.securitySettings);
      }

      return true;
    } catch (error) {
      console.error('Failed to restore from secure backup:', error);
      return false;
    }
  }

  // Utility Methods
  async isSecureStorageAvailable(): Promise<boolean> {
    try {
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }

  async clearAllSecureData(): Promise<boolean> {
    try {
      const keys = ['auth_credentials', 'device_config', 'security_settings'];
      
      for (const key of keys) {
        try {
          await SecureStore.deleteItemAsync(key, {
            keychainService: this.keychainService,
          });
        } catch (error) {
          console.warn(`Failed to delete ${key}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to clear all secure data:', error);
      return false;
    }
  }

  // Security Audit
  async getStorageAudit(): Promise<{
    hasAuthToken: boolean;
    hasDeviceConfig: boolean;
    hasSecuritySettings: boolean;
    isSecureStorageAvailable: boolean;
    lastAccess: string;
  }> {
    return {
      hasAuthToken: (await this.getAuthToken()) !== null,
      hasDeviceConfig: (await this.getDeviceConfig()) !== null,
      hasSecuritySettings: (await this.getSecuritySettings()) !== null,
      isSecureStorageAvailable: await this.isSecureStorageAvailable(),
      lastAccess: new Date().toISOString(),
    };
  }
}