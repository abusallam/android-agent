/**
 * Permissions Hook
 * Custom hook for managing app permissions
 */

import { useState, useEffect } from 'react';
import PermissionsService, { AllPermissions, PermissionStatus } from '../services/PermissionsService';

interface UsePermissionsState {
  permissions: AllPermissions | null;
  isLoading: boolean;
  error: string | null;
}

export const usePermissions = () => {
  const [state, setState] = useState<UsePermissionsState>({
    permissions: null,
    isLoading: true,
    error: null,
  });

  const permissionsService = PermissionsService.getInstance();

  /**
   * Load current permission statuses
   */
  const loadPermissions = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const permissions = await permissionsService.checkAllPermissions();
      setState({
        permissions,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check permissions';
      setState({
        permissions: null,
        isLoading: false,
        error: errorMessage,
      });
    }
  };

  /**
   * Request a specific permission
   */
  const requestPermission = async (permission: keyof AllPermissions): Promise<PermissionStatus> => {
    try {
      let result: PermissionStatus;
      
      switch (permission) {
        case 'location':
          result = await permissionsService.requestLocationPermission();
          break;
        case 'locationBackground':
          result = await permissionsService.requestBackgroundLocationPermission();
          break;
        case 'camera':
          result = await permissionsService.requestCameraPermission();
          break;
        case 'microphone':
          result = await permissionsService.requestMicrophonePermission();
          break;
        case 'mediaLibrary':
          result = await permissionsService.requestMediaLibraryPermission();
          break;
        case 'notifications':
          result = await permissionsService.requestNotificationPermission();
          break;
        default:
          throw new Error(`Unknown permission: ${permission}`);
      }

      // Reload all permissions after requesting one
      await loadPermissions();
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  /**
   * Request all essential permissions
   */
  const requestAllEssentialPermissions = async (): Promise<AllPermissions> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const permissions = await permissionsService.requestAllEssentialPermissions();
      setState({
        permissions,
        isLoading: false,
        error: null,
      });
      return permissions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permissions';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  /**
   * Check if all essential permissions are granted
   */
  const areEssentialPermissionsGranted = async (): Promise<boolean> => {
    try {
      return await permissionsService.areEssentialPermissionsGranted();
    } catch {
      return false;
    }
  };

  /**
   * Get missing critical permissions
   */
  const getMissingCriticalPermissions = async (): Promise<string[]> => {
    try {
      return await permissionsService.getMissingCriticalPermissions();
    } catch {
      return [];
    }
  };

  /**
   * Get all missing permissions
   */
  const getAllMissingPermissions = async (): Promise<string[]> => {
    try {
      return await permissionsService.getAllMissingPermissions();
    } catch {
      return [];
    }
  };

  /**
   * Open device settings
   */
  const openSettings = async () => {
    try {
      await permissionsService.openSettings();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open settings';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  /**
   * Reset permission history (for testing)
   */
  const resetPermissionHistory = async () => {
    try {
      await permissionsService.resetPermissionHistory();
      await loadPermissions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset permission history';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  /**
   * Get permission status description
   */
  const getPermissionStatusDescription = (permission: PermissionStatus): string => {
    if (permission.granted) return 'Granted';
    if (!permission.canAskAgain) return 'Permanently Denied';
    return 'Denied';
  };

  /**
   * Check if permission is critical
   */
  const isCriticalPermission = (permission: keyof AllPermissions): boolean => {
    return ['location', 'microphone', 'notifications'].includes(permission);
  };

  /**
   * Get permission importance level
   */
  const getPermissionImportance = (permission: keyof AllPermissions): 'critical' | 'important' | 'optional' => {
    const critical = ['location', 'microphone', 'notifications'];
    const important = ['camera', 'mediaLibrary'];
    
    if (critical.includes(permission)) return 'critical';
    if (important.includes(permission)) return 'important';
    return 'optional';
  };

  // Load permissions on mount
  useEffect(() => {
    loadPermissions();
  }, []);

  return {
    // State
    permissions: state.permissions,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    loadPermissions,
    requestPermission,
    requestAllEssentialPermissions,
    openSettings,
    resetPermissionHistory,
    
    // Utilities
    areEssentialPermissionsGranted,
    getMissingCriticalPermissions,
    getAllMissingPermissions,
    getPermissionStatusDescription,
    isCriticalPermission,
    getPermissionImportance,
  };
};

export default usePermissions;