/**
 * Utility Functions Unit Tests
 */

import { geospatial, validation, formatting, storage, arrays, timing, colors, errors } from '../index';

describe('Geospatial Utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const coord1: [number, number] = [40.7128, -74.0060]; // New York
      const coord2: [number, number] = [34.0522, -118.2437]; // Los Angeles
      
      const distance = geospatial.calculateDistance(coord1, coord2);
      
      // Distance should be approximately 3944 km
      expect(distance).toBeCloseTo(3944, 0);
    });

    it('should return 0 for same coordinates', () => {
      const coord: [number, number] = [40.7128, -74.0060];
      
      const distance = geospatial.calculateDistance(coord, coord);
      
      expect(distance).toBe(0);
    });
  });

  describe('calculateBearing', () => {
    it('should calculate bearing between two coordinates', () => {
      const coord1: [number, number] = [40.7128, -74.0060]; // New York
      const coord2: [number, number] = [34.0522, -118.2437]; // Los Angeles
      
      const bearing = geospatial.calculateBearing(coord1, coord2);
      
      // Bearing should be approximately 258 degrees (west-southwest)
      expect(bearing).toBeCloseTo(258, 0);
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates with default precision', () => {
      const coord: [number, number] = [40.712345, -74.006789];
      
      const formatted = geospatial.formatCoordinates(coord);
      
      expect(formatted).toBe('40.712345, -74.006789');
    });

    it('should format coordinates with custom precision', () => {
      const coord: [number, number] = [40.712345, -74.006789];
      
      const formatted = geospatial.formatCoordinates(coord, 2);
      
      expect(formatted).toBe('40.71, -74.01');
    });
  });

  describe('isPointInPolygon', () => {
    it('should detect point inside polygon', () => {
      const point: [number, number] = [0, 0];
      const polygon: [number, number][] = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
      
      const result = geospatial.isPointInPolygon(point, polygon);
      
      expect(result).toBe(true);
    });

    it('should detect point outside polygon', () => {
      const point: [number, number] = [2, 2];
      const polygon: [number, number][] = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
      
      const result = geospatial.isPointInPolygon(point, polygon);
      
      expect(result).toBe(false);
    });
  });
});

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validation.isValidEmail('test@example.com')).toBe(true);
      expect(validation.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(validation.isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validation.isValidEmail('invalid-email')).toBe(false);
      expect(validation.isValidEmail('test@')).toBe(false);
      expect(validation.isValidEmail('@example.com')).toBe(false);
      expect(validation.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(validation.isValidCoordinates([40.7128, -74.0060])).toBe(true);
      expect(validation.isValidCoordinates([0, 0])).toBe(true);
      expect(validation.isValidCoordinates([90, 180])).toBe(true);
      expect(validation.isValidCoordinates([-90, -180])).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validation.isValidCoordinates([91, 0])).toBe(false);
      expect(validation.isValidCoordinates([-91, 0])).toBe(false);
      expect(validation.isValidCoordinates([0, 181])).toBe(false);
      expect(validation.isValidCoordinates([0, -181])).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should validate required values', () => {
      expect(validation.validateRequired('test')).toBe(true);
      expect(validation.validateRequired(123)).toBe(true);
      expect(validation.validateRequired([1, 2, 3])).toBe(true);
      expect(validation.validateRequired(true)).toBe(true);
    });

    it('should reject empty or null values', () => {
      expect(validation.validateRequired('')).toBe(false);
      expect(validation.validateRequired('   ')).toBe(false);
      expect(validation.validateRequired(null)).toBe(false);
      expect(validation.validateRequired(undefined)).toBe(false);
      expect(validation.validateRequired([])).toBe(false);
    });
  });
});

describe('Formatting Utilities', () => {
  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatting.formatFileSize(0)).toBe('0 Bytes');
      expect(formatting.formatFileSize(1024)).toBe('1 KB');
      expect(formatting.formatFileSize(1048576)).toBe('1 MB');
      expect(formatting.formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format durations correctly', () => {
      expect(formatting.formatDuration(30)).toBe('0:30');
      expect(formatting.formatDuration(90)).toBe('1:30');
      expect(formatting.formatDuration(3661)).toBe('1:01:01');
    });
  });

  describe('formatDistance', () => {
    it('should format distances correctly', () => {
      expect(formatting.formatDistance(500)).toBe('500 m');
      expect(formatting.formatDistance(1000)).toBe('1.0 km');
      expect(formatting.formatDistance(1500)).toBe('1.5 km');
    });
  });

  describe('formatBearing', () => {
    it('should format bearings correctly', () => {
      expect(formatting.formatBearing(0)).toBe('0° N');
      expect(formatting.formatBearing(90)).toBe('90° E');
      expect(formatting.formatBearing(180)).toBe('180° S');
      expect(formatting.formatBearing(270)).toBe('270° W');
    });
  });
});

describe('Storage Utilities', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = storage.safeJsonParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return default value for invalid JSON', () => {
      const defaultValue = { default: true };
      const result = storage.safeJsonParse('invalid json', defaultValue);
      expect(result).toBe(defaultValue);
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify valid objects', () => {
      const result = storage.safeJsonStringify({ key: 'value' });
      expect(result).toBe('{"key":"value"}');
    });

    it('should return empty object for circular references', () => {
      const circular: any = {};
      circular.self = circular;
      const result = storage.safeJsonStringify(circular);
      expect(result).toBe('{}');
    });
  });
});

describe('Array Utilities', () => {
  describe('unique', () => {
    it('should remove duplicates from array', () => {
      const result = arrays.unique([1, 2, 2, 3, 3, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      const result = arrays.unique([]);
      expect(result).toEqual([]);
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const data = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
      ];
      
      const result = arrays.groupBy(data, 'type');
      
      expect(result.A).toHaveLength(2);
      expect(result.B).toHaveLength(1);
    });
  });

  describe('chunk', () => {
    it('should chunk array into smaller arrays', () => {
      const result = arrays.chunk([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });
  });
});

describe('Timing Utilities', () => {
  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = timing.debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = timing.throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});

describe('Color Utilities', () => {
  describe('hexToRgba', () => {
    it('should convert hex to rgba', () => {
      expect(colors.hexToRgba('#FF0000')).toBe('rgba(255, 0, 0, 1)');
      expect(colors.hexToRgba('#00FF00', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
    });
  });

  describe('getContrastColor', () => {
    it('should return appropriate contrast colors', () => {
      expect(colors.getContrastColor('#FFFFFF')).toBe('#000000');
      expect(colors.getContrastColor('#000000')).toBe('#FFFFFF');
    });
  });

  describe('randomColor', () => {
    it('should generate valid hex color', () => {
      const color = colors.randomColor();
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe('Error Utilities', () => {
  describe('createError', () => {
    it('should create standardized error', () => {
      const error = errors.createError('TEST_ERROR', 'Test message', { detail: 'test' });
      
      expect(error.message).toBe('Test message');
      expect((error as any).code).toBe('TEST_ERROR');
      expect((error as any).details).toEqual({ detail: 'test' });
    });
  });

  describe('handleAsync', () => {
    it('should handle successful promise', async () => {
      const successPromise = Promise.resolve('success');
      const [error, data] = await errors.handleAsync(successPromise);
      
      expect(error).toBeNull();
      expect(data).toBe('success');
    });

    it('should handle rejected promise', async () => {
      const failPromise = Promise.reject(new Error('fail'));
      const [error, data] = await errors.handleAsync(failPromise);
      
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('fail');
      expect(data).toBeNull();
    });
  });
});