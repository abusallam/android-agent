import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants';
import { DeviceConfig, AuthTokens } from '@/types';

export class StorageService {
  private static readonly KEYCHAIN_SERVICE = 'android-agent';

  // ===== SECURE STORAGE (for sensitive data) =====

  /**
   * Store authentication token securely
   */
  static async storeToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token, {
        keychainService: this.KEYCHAIN_SERVICE,
        encrypt: true,
      });
    } catch (error) {
      console.error('Token storage failed:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Retrieve authentication token
   */
  static async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN, {
        keychainService: this.KEYCHAIN_SERVICE,
      });
    } catch (error) {
      console.error('Token retrieval failed:', error);
      return null;
    }
  }

  /**
   * Remove authentication token
   */
  static async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN, {
        keychainService: this.KEYCHAIN_SERVICE,
      });
    } catch (error) {
      console.error('Token removal failed:', error);
    }
  }

  /**
   * Store authentication tokens (access + refresh)
   */
  static async storeAuthTokens(tokens: AuthTokens): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.AUTH_TOKEN, 
        JSON.stringify(tokens), 
        {
          keychainService: this.KEYCHAIN_SERVICE,
          encrypt: true,
        }
      );
    } catch (error) {
      console.error('Auth tokens storage failed:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Retrieve authentication tokens
   */
  static async getAuthTokens(): Promise<AuthTokens | null> {
    try {
      const tokensJson = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN, {
        keychainService: this.KEYCHAIN_SERVICE,
      });
      
      if (!tokensJson) return null;
      
      return JSON.parse(tokensJson) as AuthTokens;
    } catch (error) {
      console.error('Auth tokens retrieval failed:', error);
      return null;
    }
  }

  /**
   * Store device configuration securely
   */
  static async storeDeviceConfig(config: DeviceConfig): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.DEVICE_CONFIG, 
        JSON.stringify(config), 
        {
          keychainService: this.KEYCHAIN_SERVICE,
          encrypt: true,
        }
      );
    } catch (error) {
      console.error('Device config storage failed:', error);
      throw new Error('Failed to store device configuration');
    }
  }

  /**
   * Retrieve device configuration
   */
  static async getDeviceConfig(): Promise<DeviceConfig | null> {
    try {
      const configJson = await SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_CONFIG, {
        keychainService: this.KEYCHAIN_SERVICE,
      });
      
      if (!configJson) return null;
      
      return JSON.parse(configJson) as DeviceConfig;
    } catch (error) {
      console.error('Device config retrieval failed:', error);
      return null;
    }
  }

  // ===== REGULAR STORAGE (for non-sensitive data) =====

  /**
   * Store data in regular storage
   */
  static async storeData(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Data storage failed:', error);
      throw new Error(`Failed to store data for key: ${key}`);
    }
  }

  /**
   * Retrieve data from regular storage
   */
  static async getData<T = any>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Data retrieval failed:', error);
      return null;
    }
  }

  /**
   * Remove data from regular storage
   */
  static async removeData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Data removal failed:', error);
    }
  }

  /**
   * Store user preferences
   */
  static async storeUserPreferences(preferences: Record<string, any>): Promise<void> {
    await this.storeData(STORAGE_KEYS.USER_PREFERENCES, preferences);
  }

  /**
   * Retrieve user preferences
   */
  static async getUserPreferences(): Promise<Record<string, any> | null> {
    return await this.getData(STORAGE_KEYS.USER_PREFERENCES);
  }

  /**
   * Store cached data with expiration
   */
  static async storeCachedData(
    key: string, 
    data: any, 
    expirationMinutes: number = 60
  ): Promise<void> {
    const cacheData = {
      data,
      expiresAt: Date.now() + (expirationMinutes * 60 * 1000),
    };
    
    await this.storeData(`${STORAGE_KEYS.CACHED_DATA}_${key}`, cacheData);
  }

  /**
   * Retrieve cached data (returns null if expired)
   */
  static async getCachedData<T = any>(key: string): Promise<T | null> {
    try {
      const cacheData = await this.getData(`${STORAGE_KEYS.CACHED_DATA}_${key}`);
      
      if (!cacheData) return null;
      
      if (Date.now() > cacheData.expiresAt) {
        // Data expired, remove it
        await this.removeData(`${STORAGE_KEYS.CACHED_DATA}_${key}`);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.error('Cached data retrieval failed:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.CACHED_DATA));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  }

  /**
   * Clear all storage (use with caution)
   */
  static async clearAll(): Promise<void> {
    try {
      // Clear regular storage
      await AsyncStorage.clear();
      
      // Clear secure storage
      await this.removeToken();
      await SecureStore.deleteItemAsync(STORAGE_KEYS.DEVICE_CONFIG, {
        keychainService: this.KEYCHAIN_SERVICE,
      });
    } catch (error) {
      console.error('Storage clearing failed:', error);
    }
  }

  /**
   * Get storage usage info
   */
  static async getStorageInfo(): Promise<{
    totalKeys: number;
    cacheKeys: number;
    estimatedSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.CACHED_DATA));
      
      // Estimate size (rough calculation)
      let estimatedSize = 0;
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          estimatedSize += key.length + value.length;
        }
      }
      
      return {
        totalKeys: keys.length,
        cacheKeys: cacheKeys.length,
        estimatedSize, // in characters (rough estimate)
      };
    } catch (error) {
      console.error('Storage info retrieval failed:', error);
      return {
        totalKeys: 0,
        cacheKeys: 0,
        estimatedSize: 0,
      };
    }
  }
}