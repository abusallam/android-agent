# 🎯 Tactical Mapping System - Coding Standards

## 📋 **Overview**

This document outlines the coding standards and best practices for the Tactical Mapping System. These standards ensure code consistency, maintainability, and quality across the entire codebase.

---

## 🏗️ **Architecture Principles**

### **1. Separation of Concerns**
- **Components**: UI logic only, no business logic
- **Services**: Business logic and external API interactions
- **Hooks**: Reusable stateful logic
- **Utils**: Pure functions and utilities
- **Types**: Comprehensive TypeScript definitions

### **2. Single Responsibility Principle**
- Each function/class should have one reason to change
- Components should focus on rendering UI
- Services should handle specific business domains

### **3. Dependency Injection**
- Use singleton pattern for services
- Inject dependencies through constructors or parameters
- Avoid tight coupling between modules

---

## 📝 **Naming Conventions**

### **Files and Directories**
```
✅ Good:
- TacticalMapView.tsx (PascalCase for React components)
- useLocation.ts (camelCase for hooks)
- PermissionsService.ts (PascalCase for classes)
- geospatial.utils.ts (camelCase with descriptive suffix)
- tactical.types.ts (camelCase with descriptive suffix)

❌ Bad:
- tacticalMapView.tsx
- Permissions-Service.ts
- use_location.ts
- utils.ts (too generic)
```

### **Variables and Functions**
```typescript
✅ Good:
const userName = 'john_doe';
const isLocationEnabled = true;
const calculateDistance = (coord1, coord2) => { ... };
const handleMapClick = () => { ... };

❌ Bad:
const user_name = 'john_doe';
const IsLocationEnabled = true;
const calculate_distance = (coord1, coord2) => { ... };
const HandleMapClick = () => { ... };
```

### **Constants**
```typescript
✅ Good:
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_MAP_ZOOM = 10;

❌ Bad:
const apiBaseUrl = 'https://api.example.com';
const maxRetryAttempts = 3;
```

### **Types and Interfaces**
```typescript
✅ Good:
interface TacticalMarker {
  id: string;
  position: Coordinates;
  type: MarkerType;
}

type MarkerType = 'friendly' | 'enemy' | 'neutral';

❌ Bad:
interface tacticalMarker {
  id: string;
  position: coordinates;
  type: markerType;
}

type markerType = 'friendly' | 'enemy' | 'neutral';
```

---

## 🎨 **Code Formatting**

### **Prettier Configuration**
- **Line Length**: 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Semicolons**: Always required
- **Quotes**: Single quotes for strings, double quotes for JSX
- **Trailing Commas**: ES5 compatible

### **ESLint Rules**
- **TypeScript**: Strict mode enabled
- **React Hooks**: Rules of hooks enforced
- **Import Order**: Alphabetical with grouping
- **No Console**: Warnings (use proper logging)

---

## 🔧 **TypeScript Standards**

### **Type Definitions**
```typescript
✅ Good:
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

type UserRole = 'admin' | 'operator' | 'viewer';

// Use generic types for reusability
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

❌ Bad:
interface User {
  id: any; // Avoid 'any' type
  name: string;
  email: string;
  role: string; // Use union types instead
  createdAt: any;
}
```

### **Function Signatures**
```typescript
✅ Good:
const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  // Implementation
};

// Async functions with proper error handling
const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};

❌ Bad:
const calculateDistance = (coord1, coord2) => {
  // No type annotations
};

const fetchUserData = async (userId) => {
  // No error handling
  const response = await api.get(`/users/${userId}`);
  return response.data;
};
```

---

## ⚛️ **React Component Standards**

### **Component Structure**
```typescript
✅ Good:
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { TacticalMarker } from '../types';

interface TacticalMapViewProps {
  markers: TacticalMarker[];
  onMarkerPress: (marker: TacticalMarker) => void;
  theme?: 'light' | 'dark';
}

export const TacticalMapView: React.FC<TacticalMapViewProps> = ({
  markers,
  onMarkerPress,
  theme = 'light',
}) => {
  const { colors } = useTheme();
  const [selectedMarker, setSelectedMarker] = useState<TacticalMarker | null>(null);

  useEffect(() => {
    // Effect logic
  }, [markers]);

  const handleMarkerPress = (marker: TacticalMarker) => {
    setSelectedMarker(marker);
    onMarkerPress(marker);
  };

  return (
    <View style={styles.container}>
      {/* JSX content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TacticalMapView;
```

### **Hooks Usage**
```typescript
✅ Good:
// Custom hook with proper typing
export const useLocation = (): LocationState => {
  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const getCurrentLocation = async () => {
      setIsLoading(true);
      try {
        const location = await Location.getCurrentPositionAsync();
        if (isMounted) {
          setPosition({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Location error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getCurrentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return { position, isLoading };
};

❌ Bad:
// No cleanup, no error handling
export const useLocation = () => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    Location.getCurrentPositionAsync().then(location => {
      setPosition({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    });
  }, []);

  return { position };
};
```

---

## 🏢 **Service Layer Standards**

### **Service Structure**
```typescript
✅ Good:
class PermissionsService {
  private static instance: PermissionsService;

  public static getInstance(): PermissionsService {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService();
    }
    return PermissionsService.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }

  public async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      return {
        granted: result.status === 'granted',
        canAskAgain: result.canAskAgain,
        status: result.status,
      };
    } catch (error) {
      console.error('Permission request failed:', error);
      throw new Error('Failed to request location permission');
    }
  }
}

export default PermissionsService;
```

### **Error Handling**
```typescript
✅ Good:
// Standardized error handling
export class TacticalError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TacticalError';
  }
}

// Service method with proper error handling
public async fetchTargets(): Promise<TacticalTarget[]> {
  try {
    const response = await this.api.get('/targets');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw new TacticalError(
      'Failed to fetch targets',
      'FETCH_TARGETS_ERROR',
      error
    );
  }
}

❌ Bad:
// Generic error handling
public async fetchTargets() {
  try {
    const response = await this.api.get('/targets');
    return response.data;
  } catch (error) {
    console.log('Error:', error);
    return null;
  }
}
```

---

## 📚 **Documentation Standards**

### **JSDoc Comments**
```typescript
✅ Good:
/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param coord1 - First coordinate [latitude, longitude]
 * @param coord2 - Second coordinate [latitude, longitude]
 * @returns Distance in kilometers
 * @example
 * ```typescript
 * const distance = calculateDistance([40.7128, -74.0060], [34.0522, -118.2437]);
 * console.log(distance); // 3944.42
 * ```
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  // Implementation
};

/**
 * Custom hook for managing location services
 * @returns Object containing location state and control functions
 */
export const useLocation = (): LocationHookReturn => {
  // Implementation
};
```

### **README Files**
- Each major directory should have a README.md
- Include purpose, usage examples, and API documentation
- Keep documentation up to date with code changes

---

## 🧪 **Testing Standards**

### **Test Structure**
```typescript
✅ Good:
describe('PermissionsService', () => {
  let permissionsService: PermissionsService;

  beforeEach(() => {
    permissionsService = PermissionsService.getInstance();
  });

  describe('requestLocationPermission', () => {
    it('should return granted status when permission is granted', async () => {
      // Mock the permission request
      jest.spyOn(Location, 'requestForegroundPermissionsAsync')
        .mockResolvedValue({
          status: 'granted',
          canAskAgain: true,
        });

      const result = await permissionsService.requestLocationPermission();

      expect(result.granted).toBe(true);
      expect(result.status).toBe('granted');
    });

    it('should handle permission denial gracefully', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync')
        .mockResolvedValue({
          status: 'denied',
          canAskAgain: false,
        });

      const result = await permissionsService.requestLocationPermission();

      expect(result.granted).toBe(false);
      expect(result.canAskAgain).toBe(false);
    });
  });
});
```

---

## 🚀 **Performance Standards**

### **React Performance**
```typescript
✅ Good:
// Use React.memo for expensive components
export const TacticalMarker = React.memo<TacticalMarkerProps>(({
  marker,
  onPress,
}) => {
  const handlePress = useCallback(() => {
    onPress(marker);
  }, [marker, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      {/* Marker content */}
    </TouchableOpacity>
  );
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);

❌ Bad:
// No memoization, recreates on every render
export const TacticalMarker = ({ marker, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(marker)}>
      {/* Marker content */}
    </TouchableOpacity>
  );
};
```

### **Bundle Size Optimization**
- Use dynamic imports for large dependencies
- Implement code splitting where appropriate
- Avoid importing entire libraries when only specific functions are needed

---

## 🔒 **Security Standards**

### **Input Validation**
```typescript
✅ Good:
const validateCoordinates = (coord: unknown): coord is Coordinates => {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    typeof coord[0] === 'number' &&
    typeof coord[1] === 'number' &&
    coord[0] >= -90 &&
    coord[0] <= 90 &&
    coord[1] >= -180 &&
    coord[1] <= 180
  );
};

export const addMarker = (coordinates: unknown, data: unknown) => {
  if (!validateCoordinates(coordinates)) {
    throw new Error('Invalid coordinates provided');
  }
  // Process valid coordinates
};
```

### **Sensitive Data Handling**
- Never log sensitive information
- Use secure storage for authentication tokens
- Implement proper error messages that don't expose system details

---

## 📊 **Code Quality Metrics**

### **Complexity Limits**
- **Cyclomatic Complexity**: Maximum 10 per function
- **Function Length**: Maximum 50 lines
- **File Length**: Maximum 500 lines
- **Parameter Count**: Maximum 5 parameters per function

### **Test Coverage**
- **Minimum Coverage**: 80% for services and utilities
- **Component Coverage**: 70% minimum
- **Critical Path Coverage**: 95% for security and data handling

---

## 🔄 **Git Workflow Standards**

### **Commit Messages**
```
✅ Good:
feat: add emergency beacon functionality
fix: resolve location permission request issue
docs: update API documentation for markers
refactor: extract geospatial utilities to separate module
test: add unit tests for PermissionsService

❌ Bad:
added stuff
fix bug
update
changes
```

### **Branch Naming**
```
✅ Good:
feature/emergency-beacon-system
bugfix/location-permission-issue
hotfix/critical-security-patch
refactor/extract-geospatial-utils

❌ Bad:
new-feature
fix
update-stuff
```

---

## 🎯 **Code Review Checklist**

### **Before Submitting PR**
- [ ] All tests pass
- [ ] ESLint and Prettier checks pass
- [ ] TypeScript compilation successful
- [ ] No console.log statements in production code
- [ ] Proper error handling implemented
- [ ] Documentation updated if needed

### **During Code Review**
- [ ] Code follows naming conventions
- [ ] Functions have single responsibility
- [ ] Proper TypeScript types used
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] Tests cover new functionality

---

## 📈 **Continuous Improvement**

### **Regular Reviews**
- Monthly code quality reviews
- Quarterly standards updates
- Annual architecture reviews

### **Metrics Tracking**
- Code coverage trends
- Build time optimization
- Bundle size monitoring
- Performance benchmarks

---

**Remember**: These standards are living guidelines that should evolve with the project. When in doubt, prioritize code readability, maintainability, and team consistency.