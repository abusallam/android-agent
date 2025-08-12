/**
 * Location Hook
 * Custom hook for managing location services and tracking
 */

import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Position } from '../types';
import PermissionsService from '../services/PermissionsService';

interface LocationState {
  position: Position | null;
  isLoading: boolean;
  error: string | null;
  accuracy: number | null;
  isTracking: boolean;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceInterval?: number;
  timeInterval?: number;
  enableBackground?: boolean;
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    distanceInterval = 10,
    timeInterval = 5000,
    enableBackground = false,
  } = options;

  const [state, setState] = useState<LocationState>({
    position: null,
    isLoading: false,
    error: null,
    accuracy: null,
    isTracking: false,
  });

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const permissionsService = PermissionsService.getInstance();

  /**
   * Get current position once
   */
  const getCurrentPosition = async (): Promise<Position | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check permissions
      const permission = await permissionsService.requestLocationPermission();
      if (!permission.granted) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        timeout,
        maximumAge,
      });

      const position: Position = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        alt: location.coords.altitude || undefined,
        accuracy: location.coords.accuracy || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: new Date(location.timestamp),
      };

      setState(prev => ({
        ...prev,
        position,
        accuracy: location.coords.accuracy || null,
        isLoading: false,
        error: null,
      }));

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  };

  /**
   * Start location tracking
   */
  const startTracking = async (): Promise<boolean> => {
    try {
      // Check permissions
      const foregroundPermission = await permissionsService.requestLocationPermission();
      if (!foregroundPermission.granted) {
        throw new Error('Location permission denied');
      }

      // Request background permission if needed
      if (enableBackground) {
        const backgroundPermission = await permissionsService.requestBackgroundLocationPermission();
        if (!backgroundPermission.granted) {
          console.warn('Background location permission denied, continuing with foreground only');
        }
      }

      // Stop existing tracking
      if (watchRef.current) {
        watchRef.current.remove();
      }

      // Start new tracking
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval,
          distanceInterval,
        },
        (location) => {
          const position: Position = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            alt: location.coords.altitude || undefined,
            accuracy: location.coords.accuracy || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
            timestamp: new Date(location.timestamp),
          };

          setState(prev => ({
            ...prev,
            position,
            accuracy: location.coords.accuracy || null,
            error: null,
          }));
        }
      );

      setState(prev => ({ ...prev, isTracking: true, error: null }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start tracking';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isTracking: false,
      }));
      return false;
    }
  };

  /**
   * Stop location tracking
   */
  const stopTracking = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setState(prev => ({ ...prev, isTracking: false }));
  };

  /**
   * Check if location services are enabled
   */
  const checkLocationEnabled = async (): Promise<boolean> => {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch {
      return false;
    }
  };

  /**
   * Get location accuracy description
   */
  const getAccuracyDescription = (accuracy: number | null): string => {
    if (!accuracy) return 'Unknown';
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Good';
    if (accuracy <= 20) return 'Fair';
    return 'Poor';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  return {
    // State
    position: state.position,
    isLoading: state.isLoading,
    error: state.error,
    accuracy: state.accuracy,
    isTracking: state.isTracking,
    
    // Actions
    getCurrentPosition,
    startTracking,
    stopTracking,
    checkLocationEnabled,
    
    // Utilities
    getAccuracyDescription: () => getAccuracyDescription(state.accuracy),
  };
};

export default useLocation;