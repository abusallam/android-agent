/**
 * Utility Functions
 * Common utility functions used throughout the application
 */

import { Coordinates, CoordinatesWithAltitude } from '../types';

// Geospatial Utilities
export const geospatial = {
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2[0] - coord1[0]);
    const dLon = this.toRadians(coord2[1] - coord1[1]);
    const lat1 = this.toRadians(coord1[0]);
    const lat2 = this.toRadians(coord2[0]);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  /**
   * Calculate bearing between two coordinates
   */
  calculateBearing(coord1: Coordinates, coord2: Coordinates): number {
    const dLon = this.toRadians(coord2[1] - coord1[1]);
    const lat1 = this.toRadians(coord1[0]);
    const lat2 = this.toRadians(coord2[0]);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = Math.atan2(y, x);
    return (this.toDegrees(bearing) + 360) % 360;
  },

  /**
   * Convert degrees to radians
   */
  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  /**
   * Convert radians to degrees
   */
  toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  },

  /**
   * Format coordinates for display
   */
  formatCoordinates(coord: Coordinates, precision: number = 6): string {
    return `${coord[0].toFixed(precision)}, ${coord[1].toFixed(precision)}`;
  },

  /**
   * Convert coordinates to MGRS format
   */
  toMGRS(coord: Coordinates): string {
    // Simplified MGRS conversion - in production, use a proper library
    const lat = coord[0];
    const lon = coord[1];
    
    // This is a placeholder - implement proper MGRS conversion
    const zone = Math.floor((lon + 180) / 6) + 1;
    const letter = String.fromCharCode(67 + Math.floor((lat + 80) / 8));
    
    return `${zone}${letter} ${Math.floor(Math.abs(lat * 1000))} ${Math.floor(Math.abs(lon * 1000))}`;
  },

  /**
   * Check if point is inside polygon
   */
  isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
    const x = point[1], y = point[0];
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][1], yi = polygon[i][0];
      const xj = polygon[j][1], yj = polygon[j][0];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  },
};

// Validation Utilities
export const validation = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate coordinates
   */
  isValidCoordinates(coord: Coordinates): boolean {
    const [lat, lon] = coord;
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  },

  /**
   * Validate phone number
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate required fields
   */
  validateRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
};

// Formatting Utilities
export const formatting = {
  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format duration
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Format date for display
   */
  formatDate(date: Date, format: 'short' | 'long' | 'time' = 'short'): string {
    const options: Intl.DateTimeFormatOptions = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
      time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
    }[format];

    return new Intl.DateTimeFormat('en-US', options).format(date);
  },

  /**
   * Format distance
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  },

  /**
   * Format bearing
   */
  formatBearing(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return `${Math.round(degrees)}° ${directions[index]}`;
  },
};

// Storage Utilities
export const storage = {
  /**
   * Safe JSON parse
   */
  safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch {
      return defaultValue;
    }
  },

  /**
   * Safe JSON stringify
   */
  safeJsonStringify(obj: any): string {
    try {
      return JSON.stringify(obj);
    } catch {
      return '{}';
    }
  },
};

// Array Utilities
export const arrays = {
  /**
   * Remove duplicates from array
   */
  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  },

  /**
   * Group array by key
   */
  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
};

// Debounce and Throttle
export const timing = {
  /**
   * Debounce function
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  },

  /**
   * Throttle function
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },
};

// Color Utilities
export const colors = {
  /**
   * Convert hex to rgba
   */
  hexToRgba(hex: string, alpha: number = 1): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Generate random color
   */
  randomColor(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  },

  /**
   * Get contrast color (black or white)
   */
  getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  },
};

// Error Handling
export const errors = {
  /**
   * Create standardized error
   */
  createError(code: string, message: string, details?: any): Error {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).details = details;
    return error;
  },

  /**
   * Handle async errors
   */
  handleAsync<T>(promise: Promise<T>): Promise<[Error | null, T | null]> {
    return promise
      .then<[null, T]>((data: T) => [null, data])
      .catch<[Error, null]>((error: Error) => [error, null]);
  },
};

// Export all utilities
export default {
  geospatial,
  validation,
  formatting,
  storage,
  arrays,
  timing,
  colors,
  errors,
};