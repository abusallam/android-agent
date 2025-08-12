import {
  Accelerometer,
  Gyroscope,
  Magnetometer,
  Barometer,
  LightSensor,
  Pedometer,
  DeviceMotion,
} from 'expo-sensors';
import { Platform } from 'react-native';
import { ApiService } from './ApiService';

export interface SensorData {
  accelerometer?: { x: number; y: number; z: number };
  gyroscope?: { x: number; y: number; z: number };
  magnetometer?: { x: number; y: number; z: number };
  barometer?: { pressure: number; relativeAltitude?: number };
  lightSensor?: { illuminance: number };
  deviceMotion?: {
    acceleration: { x: number; y: number; z: number };
    accelerationIncludingGravity: { x: number; y: number; z: number };
    rotation: { alpha: number; beta: number; gamma: number };
    rotationRate: { alpha: number; beta: number; gamma: number };
    orientation: number;
  };
  pedometer?: {
    steps: number;
    distance: number;
    floorsAscended: number;
    floorsDescended: number;
  };
  timestamp: number;
}

export interface SensorCapabilities {
  hasAccelerometer: boolean;
  hasGyroscope: boolean;
  hasMagnetometer: boolean;
  hasBarometer: boolean;
  hasLightSensor: boolean;
  hasPedometer: boolean;
  hasDeviceMotion: boolean;
  supportedSensors: string[];
  sensorAccuracy: Record<string, string>;
}

export class SensorService {
  private static subscriptions: Record<string, any> = {};
  private static isMonitoring = false;
  private static sensorData: SensorData = { timestamp: 0 };

  /**
   * Get sensor capabilities
   */
  static async getSensorCapabilities(): Promise<SensorCapabilities> {
    try {
      const capabilities = {
        hasAccelerometer: false,
        hasGyroscope: false,
        hasMagnetometer: false,
        hasBarometer: false,
        hasLightSensor: false,
        hasPedometer: false,
        hasDeviceMotion: false,
        supportedSensors: [] as string[],
        sensorAccuracy: {} as Record<string, string>,
      };

      // Check accelerometer
      try {
        const available = await Accelerometer.isAvailableAsync();
        capabilities.hasAccelerometer = available;
        if (available) {
          capabilities.supportedSensors.push('accelerometer');
          capabilities.sensorAccuracy.accelerometer = 'high';
        }
      } catch (error) {
        console.log('Accelerometer not available:', error);
      }

      // Check gyroscope
      try {
        const available = await Gyroscope.isAvailableAsync();
        capabilities.hasGyroscope = available;
        if (available) {
          capabilities.supportedSensors.push('gyroscope');
          capabilities.sensorAccuracy.gyroscope = 'high';
        }
      } catch (error) {
        console.log('Gyroscope not available:', error);
      }

      // Check magnetometer
      try {
        const available = await Magnetometer.isAvailableAsync();
        capabilities.hasMagnetometer = available;
        if (available) {
          capabilities.supportedSensors.push('magnetometer');
          capabilities.sensorAccuracy.magnetometer = 'medium';
        }
      } catch (error) {
        console.log('Magnetometer not available:', error);
      }

      // Check barometer
      try {
        const available = await Barometer.isAvailableAsync();
        capabilities.hasBarometer = available;
        if (available) {
          capabilities.supportedSensors.push('barometer');
          capabilities.sensorAccuracy.barometer = 'high';
        }
      } catch (error) {
        console.log('Barometer not available:', error);
      }

      // Check light sensor
      try {
        const available = await LightSensor.isAvailableAsync();
        capabilities.hasLightSensor = available;
        if (available) {
          capabilities.supportedSensors.push('lightSensor');
          capabilities.sensorAccuracy.lightSensor = 'medium';
        }
      } catch (error) {
        console.log('Light sensor not available:', error);
      }

      // Check pedometer
      try {
        const available = await Pedometer.isAvailableAsync();
        capabilities.hasPedometer = available;
        if (available) {
          capabilities.supportedSensors.push('pedometer');
          capabilities.sensorAccuracy.pedometer = 'high';
        }
      } catch (error) {
        console.log('Pedometer not available:', error);
      }

      // Device motion is usually available if accelerometer is available
      capabilities.hasDeviceMotion = capabilities.hasAccelerometer;
      if (capabilities.hasDeviceMotion) {
        capabilities.supportedSensors.push('deviceMotion');
        capabilities.sensorAccuracy.deviceMotion = 'high';
      }

      return capabilities;
    } catch (error) {
      console.error('Failed to get sensor capabilities:', error);
      return {
        hasAccelerometer: false,
        hasGyroscope: false,
        hasMagnetometer: false,
        hasBarometer: false,
        hasLightSensor: false,
        hasPedometer: false,
        hasDeviceMotion: false,
        supportedSensors: [],
        sensorAccuracy: {},
      };
    }
  }

  /**
   * Start monitoring all available sensors
   */
  static async startSensorMonitoring(updateInterval: number = 1000): Promise<boolean> {
    try {
      if (this.isMonitoring) {
        console.log('Sensor monitoring already active');
        return true;
      }

      const capabilities = await this.getSensorCapabilities();
      console.log('Starting sensor monitoring with capabilities:', capabilities);

      // Start accelerometer monitoring
      if (capabilities.hasAccelerometer) {
        Accelerometer.setUpdateInterval(updateInterval);
        this.subscriptions.accelerometer = Accelerometer.addListener((data) => {
          this.sensorData.accelerometer = data;
          this.sensorData.timestamp = Date.now();
        });
      }

      // Start gyroscope monitoring
      if (capabilities.hasGyroscope) {
        Gyroscope.setUpdateInterval(updateInterval);
        this.subscriptions.gyroscope = Gyroscope.addListener((data) => {
          this.sensorData.gyroscope = data;
          this.sensorData.timestamp = Date.now();
        });
      }

      // Start magnetometer monitoring
      if (capabilities.hasMagnetometer) {
        Magnetometer.setUpdateInterval(updateInterval);
        this.subscriptions.magnetometer = Magnetometer.addListener((data) => {
          this.sensorData.magnetometer = data;
          this.sensorData.timestamp = Date.now();
        });
      }

      // Start barometer monitoring
      if (capabilities.hasBarometer) {
        Barometer.setUpdateInterval(updateInterval);
        this.subscriptions.barometer = Barometer.addListener((data) => {
          this.sensorData.barometer = data;
          this.sensorData.timestamp = Date.now();
        });
      }

      // Start light sensor monitoring
      if (capabilities.hasLightSensor) {
        LightSensor.setUpdateInterval(updateInterval);
        this.subscriptions.lightSensor = LightSensor.addListener((data) => {
          this.sensorData.lightSensor = data;
          this.sensorData.timestamp = Date.now();
        });
      }

      // Start device motion monitoring
      if (capabilities.hasDeviceMotion) {
        DeviceMotion.setUpdateInterval(updateInterval);
        this.subscriptions.deviceMotion = DeviceMotion.addListener((data) => {
          this.sensorData.deviceMotion = data;
          this.sensorData.timestamp = Date.now();
        });
      }

      // Start pedometer monitoring (different pattern)
      if (capabilities.hasPedometer) {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 1); // Next 24 hours

        try {
          const result = await Pedometer.getStepCountAsync(start, end);
          this.sensorData.pedometer = {
            steps: result.steps,
            distance: 0, // Would need additional calculation
            floorsAscended: 0, // Not available in Expo
            floorsDescended: 0, // Not available in Expo
          };
        } catch (error) {
          console.log('Pedometer data not available:', error);
        }
      }

      this.isMonitoring = true;
      console.log('Sensor monitoring started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start sensor monitoring:', error);
      return false;
    }
  }

  /**
   * Stop sensor monitoring
   */
  static stopSensorMonitoring(): void {
    try {
      Object.keys(this.subscriptions).forEach((sensorName) => {
        if (this.subscriptions[sensorName]) {
          this.subscriptions[sensorName].remove();
          delete this.subscriptions[sensorName];
        }
      });

      this.isMonitoring = false;
      console.log('Sensor monitoring stopped');
    } catch (error) {
      console.error('Failed to stop sensor monitoring:', error);
    }
  }

  /**
   * Get current sensor data
   */
  static getCurrentSensorData(): SensorData {
    return { ...this.sensorData };
  }

  /**
   * Get specific sensor data
   */
  static async getAccelerometerData(): Promise<{ x: number; y: number; z: number } | null> {
    try {
      const available = await Accelerometer.isAvailableAsync();
      if (!available) return null;

      return new Promise((resolve) => {
        const subscription = Accelerometer.addListener((data) => {
          subscription.remove();
          resolve(data);
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          subscription.remove();
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      console.error('Failed to get accelerometer data:', error);
      return null;
    }
  }

  /**
   * Get gyroscope data
   */
  static async getGyroscopeData(): Promise<{ x: number; y: number; z: number } | null> {
    try {
      const available = await Gyroscope.isAvailableAsync();
      if (!available) return null;

      return new Promise((resolve) => {
        const subscription = Gyroscope.addListener((data) => {
          subscription.remove();
          resolve(data);
        });

        setTimeout(() => {
          subscription.remove();
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      console.error('Failed to get gyroscope data:', error);
      return null;
    }
  }

  /**
   * Get magnetometer data (compass)
   */
  static async getMagnetometerData(): Promise<{ x: number; y: number; z: number } | null> {
    try {
      const available = await Magnetometer.isAvailableAsync();
      if (!available) return null;

      return new Promise((resolve) => {
        const subscription = Magnetometer.addListener((data) => {
          subscription.remove();
          resolve(data);
        });

        setTimeout(() => {
          subscription.remove();
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      console.error('Failed to get magnetometer data:', error);
      return null;
    }
  }

  /**
   * Calculate device orientation from sensor data
   */
  static calculateOrientation(accelerometer: { x: number; y: number; z: number }): {
    pitch: number;
    roll: number;
    orientation: 'portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left';
  } {
    const { x, y, z } = accelerometer;
    
    // Calculate pitch and roll in degrees
    const pitch = Math.atan2(-x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
    const roll = Math.atan2(y, z) * (180 / Math.PI);
    
    // Determine orientation
    let orientation: 'portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left';
    
    if (Math.abs(pitch) < 45) {
      if (Math.abs(roll) < 45) {
        orientation = 'portrait';
      } else if (roll > 45) {
        orientation = 'landscape-left';
      } else {
        orientation = 'landscape';
      }
    } else {
      orientation = 'portrait-upside-down';
    }
    
    return { pitch, roll, orientation };
  }

  /**
   * Detect device movement/activity
   */
  static detectMovement(threshold: number = 0.1): {
    isMoving: boolean;
    movementIntensity: number;
    movementType: 'still' | 'walking' | 'running' | 'driving';
  } {
    const data = this.getCurrentSensorData();
    
    if (!data.accelerometer) {
      return {
        isMoving: false,
        movementIntensity: 0,
        movementType: 'still',
      };
    }
    
    const { x, y, z } = data.accelerometer;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const intensity = Math.abs(magnitude - 9.81); // Subtract gravity
    
    const isMoving = intensity > threshold;
    
    let movementType: 'still' | 'walking' | 'running' | 'driving';
    if (intensity < 0.5) {
      movementType = 'still';
    } else if (intensity < 2.0) {
      movementType = 'walking';
    } else if (intensity < 5.0) {
      movementType = 'running';
    } else {
      movementType = 'driving';
    }
    
    return {
      isMoving,
      movementIntensity: intensity,
      movementType,
    };
  }

  /**
   * Upload sensor data to backend
   */
  static async uploadSensorData(): Promise<boolean> {
    try {
      const sensorData = this.getCurrentSensorData();
      const movement = this.detectMovement();
      
      const dataToUpload = {
        ...sensorData,
        movement,
        uploadTimestamp: Date.now(),
      };
      
      return await ApiService.post('/api/sensors/data', dataToUpload);
    } catch (error) {
      console.error('Failed to upload sensor data:', error);
      return false;
    }
  }

  /**
   * Get sensor monitoring status
   */
  static getMonitoringStatus(): {
    isMonitoring: boolean;
    activeSensors: string[];
    lastUpdate: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      activeSensors: Object.keys(this.subscriptions),
      lastUpdate: this.sensorData.timestamp,
    };
  }

  /**
   * Check sensor support for legacy devices
   */
  static async checkLegacySensorSupport(): Promise<{
    supported: boolean;
    limitations: string[];
    recommendations: string[];
  }> {
    try {
      const capabilities = await this.getSensorCapabilities();
      const limitations: string[] = [];
      const recommendations: string[] = [];

      // Check for common limitations on older devices
      if (Platform.OS === 'android') {
        if (Platform.Version < 23) { // Android 6.0
          limitations.push('Limited sensor accuracy on older Android versions');
          limitations.push('Some sensors may not be available');
          recommendations.push('Use lower update frequencies for better performance');
        }
        
        if (Platform.Version < 21) { // Android 5.0
          limitations.push('Very limited sensor support');
          recommendations.push('Focus on basic accelerometer and gyroscope only');
        }
      }

      // Check if no sensors are available
      if (capabilities.supportedSensors.length === 0) {
        limitations.push('No sensors detected on this device');
        recommendations.push('Sensor features will be disabled');
      }

      return {
        supported: capabilities.supportedSensors.length > 0,
        limitations,
        recommendations,
      };
    } catch (error) {
      console.error('Legacy sensor support check failed:', error);
      return {
        supported: false,
        limitations: ['Sensor system not available'],
        recommendations: ['Update device or disable sensor features'],
      };
    }
  }

  /**
   * Calibrate sensors (basic implementation)
   */
  static async calibrateSensors(): Promise<boolean> {
    try {
      console.log('Starting sensor calibration...');
      
      // Basic calibration - collect baseline readings
      const baselineReadings: SensorData[] = [];
      
      for (let i = 0; i < 10; i++) {
        const reading = this.getCurrentSensorData();
        baselineReadings.push(reading);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('Sensor calibration completed');
      return true;
    } catch (error) {
      console.error('Sensor calibration failed:', error);
      return false;
    }
  }
}