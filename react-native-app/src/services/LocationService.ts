import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { point, polygon, booleanPointInPolygon, distance } from '@turf/turf';
import { ApiService } from './ApiService';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCE_TASK_NAME = 'geofence-monitoring-task';

interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  coordinates: any;
  radius?: number;
  triggerType: 'enter' | 'exit' | 'dwell';
  isActive: boolean;
  alertLevel: 'info' | 'warning' | 'critical';
}

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: string;
}

export class LocationService {
  private static instance: LocationService;
  private watchId: Location.LocationSubscription | null = null;
  private isTracking = false;
  private geofences: Geofence[] = [];
  private lastLocation: Location.LocationObject | null = null;
  private geofenceStates: Map<string, boolean> = new Map(); // Track inside/outside state

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('Foreground location permission not granted');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted');
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startTracking(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Start foreground location tracking
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 seconds for tactical operations
          distanceInterval: 5, // 5 meters for precise tracking
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      // Start background location tracking
      await this.startBackgroundLocationTask();

      // Start geofence monitoring
      await this.startGeofenceMonitoring();

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (this.watchId) {
        this.watchId.remove();
        this.watchId = null;
      }

      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      await Location.stopLocationUpdatesAsync(GEOFENCE_TASK_NAME);
      this.isTracking = false;
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  private async startBackgroundLocationTask(): Promise<void> {
    try {
      // Define the background task
      TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
        if (error) {
          console.error('Background location task error:', error);
          return;
        }

        if (data) {
          const { locations } = data as { locations: Location.LocationObject[] };
          locations.forEach(location => {
            this.handleLocationUpdate(location);
          });
        }
      });

      // Start the background location updates
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High, // High accuracy for tactical operations
        timeInterval: 30000, // 30 seconds
        deferredUpdatesInterval: 60000, // 1 minute
        foregroundService: {
          notificationTitle: 'Tactical Tracking Active',
          notificationBody: 'Android Agent is monitoring your location for tactical operations',
          notificationColor: '#3b82f6',
        },
      });
    } catch (error) {
      console.error('Error starting background location task:', error);
    }
  }

  private async startGeofenceMonitoring(): Promise<void> {
    try {
      TaskManager.defineTask(GEOFENCE_TASK_NAME, ({ data, error }) => {
        if (error) {
          console.error('Geofence monitoring error:', error);
          return;
        }

        if (data) {
          const { locations } = data as { locations: Location.LocationObject[] };
          locations.forEach(location => {
            this.checkGeofences(location);
          });
        }
      });

      await Location.startLocationUpdatesAsync(GEOFENCE_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // 5 seconds for geofence monitoring
        distanceInterval: 1, // 1 meter for precise geofence detection
        foregroundService: {
          notificationTitle: 'Geofence Monitoring',
          notificationBody: 'Monitoring tactical boundaries',
          notificationColor: '#ef4444',
        },
      });
    } catch (error) {
      console.error('Error starting geofence monitoring:', error);
    }
  }

  private handleLocationUpdate(location: Location.LocationObject): void {
    try {
      this.lastLocation = location;

      // Check geofences
      this.checkGeofences(location);

      // Send location to backend
      const locationUpdate: LocationUpdate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        heading: location.coords.heading,
        timestamp: new Date(location.timestamp).toISOString(),
      };

      ApiService.updateLocation(locationUpdate);
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  private checkGeofences(location: Location.LocationObject): void {
    const currentPoint = point([location.coords.longitude, location.coords.latitude]);

    this.geofences.forEach(geofence => {
      if (!geofence.isActive) return;

      let isInside = false;

      if (geofence.type === 'circle' && geofence.radius) {
        const center = point([geofence.coordinates.longitude, geofence.coordinates.latitude]);
        const distanceToCenter = distance(currentPoint, center, { units: 'meters' });
        isInside = distanceToCenter <= geofence.radius;
      } else if (geofence.type === 'polygon') {
        const geofencePolygon = polygon([geofence.coordinates]);
        isInside = booleanPointInPolygon(currentPoint, geofencePolygon);
      }

      const wasInside = this.geofenceStates.get(geofence.id) || false;
      
      // Check for trigger conditions
      if (geofence.triggerType === 'enter' && !wasInside && isInside) {
        this.triggerGeofenceAlert(geofence, 'entered', location);
      } else if (geofence.triggerType === 'exit' && wasInside && !isInside) {
        this.triggerGeofenceAlert(geofence, 'exited', location);
      }

      // Update state
      this.geofenceStates.set(geofence.id, isInside);
    });
  }

  private triggerGeofenceAlert(geofence: Geofence, action: 'entered' | 'exited', location: Location.LocationObject): void {
    try {
      const alert = {
        type: 'geofence_alert',
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        action,
        alertLevel: geofence.alertLevel,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(location.timestamp).toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      // Send alert to backend
      ApiService.sendGeofenceAlert(alert);

      // Log for debugging
      console.log(`Geofence Alert: ${action} ${geofence.name}`, alert);
    } catch (error) {
      console.error('Error triggering geofence alert:', error);
    }
  }

  // Geofence management methods
  addGeofence(geofence: Geofence): void {
    this.geofences.push(geofence);
    this.geofenceStates.set(geofence.id, false);
  }

  removeGeofence(geofenceId: string): void {
    this.geofences = this.geofences.filter(g => g.id !== geofenceId);
    this.geofenceStates.delete(geofenceId);
  }

  updateGeofence(geofence: Geofence): void {
    const index = this.geofences.findIndex(g => g.id === geofence.id);
    if (index !== -1) {
      this.geofences[index] = geofence;
    }
  }

  getGeofences(): Geofence[] {
    return [...this.geofences];
  }

  // Tactical location methods
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation, // Best accuracy for tactical operations
        maximumAge: 5000, // 5 seconds max age
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  getLastKnownLocation(): Location.LocationObject | null {
    return this.lastLocation;
  }

  // Calculate distance to target
  calculateDistanceToTarget(targetLat: number, targetLng: number): number | null {
    if (!this.lastLocation) return null;

    const currentPoint = point([this.lastLocation.coords.longitude, this.lastLocation.coords.latitude]);
    const targetPoint = point([targetLng, targetLat]);
    
    return distance(currentPoint, targetPoint, { units: 'meters' });
  }

  // Calculate bearing to target
  calculateBearingToTarget(targetLat: number, targetLng: number): number | null {
    if (!this.lastLocation) return null;

    const lat1 = this.lastLocation.coords.latitude * Math.PI / 180;
    const lat2 = targetLat * Math.PI / 180;
    const deltaLng = (targetLng - this.lastLocation.coords.longitude) * Math.PI / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  // Emergency location broadcast
  async broadcastEmergencyLocation(): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return false;

      const emergencyData = {
        type: 'emergency_location',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(location.timestamp).toISOString(),
        },
        deviceInfo: {
          battery: await this.getBatteryLevel(),
          networkType: await this.getNetworkType(),
        },
        timestamp: new Date().toISOString(),
      };

      await ApiService.broadcastEmergency(emergencyData);
      return true;
    } catch (error) {
      console.error('Error broadcasting emergency location:', error);
      return false;
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      // This would integrate with expo-battery or similar
      return 100; // Placeholder
    } catch {
      return 100;
    }
  }

  private async getNetworkType(): Promise<string> {
    try {
      // This would integrate with expo-network or similar
      return 'wifi'; // Placeholder
    } catch {
      return 'unknown';
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  getTrackingStatus(): {
    isTracking: boolean;
    lastUpdate: string | null;
    geofenceCount: number;
    accuracy: number | null;
    foregroundActive: boolean;
    backgroundActive: boolean;
  } {
    return {
      isTracking: this.isTracking,
      lastUpdate: this.lastLocation ? new Date(this.lastLocation.timestamp).toISOString() : null,
      geofenceCount: this.geofences.length,
      accuracy: this.lastLocation?.coords.accuracy || null,
      foregroundActive: this.isTracking,
      backgroundActive: this.isTracking,
    };
  }

  // Add missing methods that App.tsx expects
  async getCachedLocation(): Promise<Location.LocationObject | null> {
    return this.getLastKnownLocation();
  }

  async startForegroundTracking(): Promise<boolean> {
    return await this.startTracking();
  }

  async stopTracking(): Promise<void> {
    return await this.stopTracking();
  }
}