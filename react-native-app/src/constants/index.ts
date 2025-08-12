/**
 * Application Constants
 * Centralized configuration and constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [31.9686, 35.2033] as [number, number], // Jerusalem
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 1,
  MAX_ZOOM: 20,
  TILE_SIZE: 256,
  MAX_CACHE_SIZE: 500, // MB
} as const;

// Tactical Configuration
export const TACTICAL_CONFIG = {
  MAX_TARGETS: 1000,
  TRACKING_INTERVAL: 1000, // ms
  GEOFENCE_CHECK_INTERVAL: 5000, // ms
  EMERGENCY_TIMEOUT: 30000, // ms
  MAX_TRACK_POINTS: 10000,
} as const;

// Communication Configuration
export const COMMUNICATION_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov', 'avi'],
  SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'aac'],
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  ANIMATION_DURATION: 200,
  TRANSITION_EASING: 'ease-in-out',
  SHADOW_OPACITY: 0.1,
} as const;

// Permission Configuration
export const PERMISSION_CONFIG = {
  LOCATION_ACCURACY: 'high',
  BACKGROUND_LOCATION_INTERVAL: 60000, // 1 minute
  NOTIFICATION_CATEGORIES: ['emergency', 'tactical', 'communication', 'system'],
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  THEME: '@tactical_theme',
  LANGUAGE: '@tactical_language',
  USER_PREFERENCES: '@user_preferences',
  MAP_CACHE: '@map_cache',
  OFFLINE_DATA: '@offline_data',
  PERMISSIONS_ASKED: '@permissions_asked',
} as const;

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  LOCATION_UNAVAILABLE: 'LOCATION_UNAVAILABLE',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INVALID_DATA: 'INVALID_DATA',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_3D_TERRAIN: true,
  ENABLE_AI_TRACKING: true,
  ENABLE_MESH_NETWORKING: false,
  ENABLE_VPN_INTEGRATION: false,
  ENABLE_PLUGIN_SYSTEM: false,
  ENABLE_BALLISTICS: false,
} as const;

export default {
  API_CONFIG,
  MAP_CONFIG,
  TACTICAL_CONFIG,
  COMMUNICATION_CONFIG,
  THEME_CONFIG,
  PERMISSION_CONFIG,
  STORAGE_KEYS,
  ERROR_CODES,
  FEATURE_FLAGS,
};