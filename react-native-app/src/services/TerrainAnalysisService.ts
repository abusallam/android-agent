import * as turf from '@turf/turf';
import { supabase } from '../lib/supabase';

export interface ElevationPoint {
  latitude: number;
  longitude: number;
  elevation: number;
  accuracy?: number;
}

export interface ElevationProfile {
  points: ElevationPoint[];
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
  minElevation: number;
  maxElevation: number;
  averageElevation: number;
  averageGrade: number;
  maxGrade: number;
}

export interface ContourLine {
  elevation: number;
  coordinates: number[][];
  type: 'major' | 'minor';
}

export interface SlopeAnalysis {
  point: [number, number];
  slope: number; // in degrees
  aspect: number; // in degrees (0-360, 0 = North)
  classification: 'flat' | 'gentle' | 'moderate' | 'steep' | 'very_steep';
}

export interface ViewshedResult {
  observer: [number, number];
  observerElevation: number;
  radius: number;
  visibleArea: number; // in square meters
  visibilityGrid: number[][]; // 2D array of visibility values (0-1)
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface TerrainClassification {
  point: [number, number];
  elevation: number;
  slope: number;
  aspect: number;
  roughness: number;
  classification: 'water' | 'flat' | 'hills' | 'mountains' | 'valley' | 'ridge';
  trafficability: 'excellent' | 'good' | 'fair' | 'poor' | 'impassable';
}

export class TerrainAnalysisService {
  private elevationCache: Map<string, number> = new Map();
  private readonly EARTH_RADIUS = 6371000; // meters

  /**
   * Get elevation for a single point
   */
  async getElevation(latitude: number, longitude: number): Promise<number> {
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    
    if (this.elevationCache.has(cacheKey)) {
      return this.elevationCache.get(cacheKey)!;
    }

    try {
      // Try to get from local database first
      const { data: localData } = await supabase
        .from('tactical_elevation_data')
        .select('elevation')
        .eq('latitude', latitude)
        .eq('longitude', longitude)
        .single();

      if (localData) {
        this.elevationCache.set(cacheKey, localData.elevation);
        return localData.elevation;
      }

      // Fallback to external elevation service
      const elevation = await this.fetchElevationFromService(latitude, longitude);
      
      // Cache the result
      this.elevationCache.set(cacheKey, elevation);
      
      // Store in local database for future use
      await supabase
        .from('tactical_elevation_data')
        .upsert({
          latitude,
          longitude,
          elevation,
          source: 'external_api',
          created_at: new Date().toISOString(),
        });

      return elevation;
    } catch (error) {
      console.error('Error getting elevation:', error);
      return 0; // Default to sea level
    }
  }

  /**
   * Get elevation profile for a path
   */
  async getElevationProfile(
    coordinates: [number, number][],
    sampleDistance: number = 100 // meters
  ): Promise<ElevationProfile> {
    try {
      const line = turf.lineString(coordinates);
      const totalDistance = turf.length(line, { units: 'meters' });
      
      // Sample points along the line
      const samplePoints: ElevationPoint[] = [];
      const numSamples = Math.ceil(totalDistance / sampleDistance);
      
      for (let i = 0; i <= numSamples; i++) {
        const distance = (i / numSamples) * totalDistance;
        const point = turf.along(line, distance, { units: 'meters' });
        const [longitude, latitude] = point.geometry.coordinates;
        
        const elevation = await this.getElevation(latitude, longitude);
        samplePoints.push({
          latitude,
          longitude,
          elevation,
        });
      }

      // Calculate profile statistics
      const elevations = samplePoints.map(p => p.elevation);
      const minElevation = Math.min(...elevations);
      const maxElevation = Math.max(...elevations);
      const averageElevation = elevations.reduce((a, b) => a + b, 0) / elevations.length;

      let elevationGain = 0;
      let elevationLoss = 0;
      let totalGrade = 0;
      let maxGrade = 0;

      for (let i = 1; i < samplePoints.length; i++) {
        const prev = samplePoints[i - 1];
        const curr = samplePoints[i];
        const elevDiff = curr.elevation - prev.elevation;
        const distance = this.calculateDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        );
        
        if (elevDiff > 0) {
          elevationGain += elevDiff;
        } else {
          elevationLoss += Math.abs(elevDiff);
        }

        const grade = Math.abs(elevDiff / distance) * 100;
        totalGrade += grade;
        maxGrade = Math.max(maxGrade, grade);
      }

      const averageGrade = totalGrade / (samplePoints.length - 1);

      return {
        points: samplePoints,
        totalDistance,
        elevationGain,
        elevationLoss,
        minElevation,
        maxElevation,
        averageElevation,
        averageGrade,
        maxGrade,
      };
    } catch (error) {
      console.error('Error getting elevation profile:', error);
      throw error;
    }
  }

  /**
   * Generate contour lines for an area
   */
  async generateContours(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    interval: number = 10, // meters
    resolution: number = 100 // meters between sample points
  ): Promise<ContourLine[]> {
    try {
      // Create a grid of elevation points
      const latStep = resolution / 111000; // approximate meters to degrees
      const lonStep = resolution / (111000 * Math.cos(bounds.north * Math.PI / 180));
      
      const elevationGrid: number[][] = [];
      const latitudes: number[] = [];
      const longitudes: number[] = [];

      for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
        latitudes.push(lat);
        const row: number[] = [];
        for (let lon = bounds.west; lon <= bounds.east; lon += lonStep) {
          if (longitudes.length === 0 || lon > longitudes[longitudes.length - 1]) {
            longitudes.push(lon);
          }
          const elevation = await this.getElevation(lat, lon);
          row.push(elevation);
        }
        elevationGrid.push(row);
      }

      // Generate contour lines using marching squares algorithm
      const contours = this.generateContoursFromGrid(
        elevationGrid,
        latitudes,
        longitudes,
        interval
      );

      return contours;
    } catch (error) {
      console.error('Error generating contours:', error);
      return [];
    }
  }

  /**
   * Perform slope analysis for a point
   */
  async analyzeSlopeAtPoint(
    latitude: number,
    longitude: number,
    radius: number = 50 // meters
  ): Promise<SlopeAnalysis> {
    try {
      // Get elevation at center point and surrounding points
      const centerElevation = await this.getElevation(latitude, longitude);
      
      // Sample points in 8 directions
      const directions = [0, 45, 90, 135, 180, 225, 270, 315]; // degrees
      const elevations: number[] = [];
      
      for (const bearing of directions) {
        const point = this.calculateDestination(latitude, longitude, bearing, radius);
        const elevation = await this.getElevation(point.latitude, point.longitude);
        elevations.push(elevation);
      }

      // Calculate slope using the steepest gradient
      let maxSlope = 0;
      let slopeAspect = 0;

      for (let i = 0; i < directions.length; i++) {
        const elevDiff = elevations[i] - centerElevation;
        const slope = Math.atan(Math.abs(elevDiff) / radius) * (180 / Math.PI);
        
        if (slope > maxSlope) {
          maxSlope = slope;
          slopeAspect = elevDiff > 0 ? directions[i] : (directions[i] + 180) % 360;
        }
      }

      // Classify slope
      let classification: SlopeAnalysis['classification'];
      if (maxSlope < 2) classification = 'flat';
      else if (maxSlope < 5) classification = 'gentle';
      else if (maxSlope < 15) classification = 'moderate';
      else if (maxSlope < 30) classification = 'steep';
      else classification = 'very_steep';

      return {
        point: [longitude, latitude],
        slope: maxSlope,
        aspect: slopeAspect,
        classification,
      };
    } catch (error) {
      console.error('Error analyzing slope:', error);
      throw error;
    }
  }

  /**
   * Perform viewshed analysis
   */
  async calculateViewshed(
    observerLat: number,
    observerLon: number,
    observerHeight: number = 1.7, // meters above ground
    radius: number = 5000, // meters
    resolution: number = 50 // meters
  ): Promise<ViewshedResult> {
    try {
      const observerElevation = await this.getElevation(observerLat, observerLon);
      const observerTotalHeight = observerElevation + observerHeight;

      // Create bounds
      const bounds = this.calculateBounds(observerLat, observerLon, radius);
      
      // Create visibility grid
      const latStep = resolution / 111000;
      const lonStep = resolution / (111000 * Math.cos(observerLat * Math.PI / 180));
      
      const visibilityGrid: number[][] = [];
      let visibleArea = 0;
      const cellArea = resolution * resolution; // square meters

      for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
        const row: number[] = [];
        for (let lon = bounds.west; lon <= bounds.east; lon += lonStep) {
          const distance = this.calculateDistance(observerLat, observerLon, lat, lon);
          
          if (distance > radius) {
            row.push(0);
            continue;
          }

          const targetElevation = await this.getElevation(lat, lon);
          const isVisible = await this.isPointVisible(
            observerLat, observerLon, observerTotalHeight,
            lat, lon, targetElevation,
            resolution
          );

          const visibility = isVisible ? 1 : 0;
          row.push(visibility);
          
          if (isVisible) {
            visibleArea += cellArea;
          }
        }
        visibilityGrid.push(row);
      }

      return {
        observer: [observerLon, observerLat],
        observerElevation: observerTotalHeight,
        radius,
        visibleArea,
        visibilityGrid,
        bounds,
      };
    } catch (error) {
      console.error('Error calculating viewshed:', error);
      throw error;
    }
  }

  /**
   * Classify terrain type
   */
  async classifyTerrain(
    latitude: number,
    longitude: number,
    analysisRadius: number = 100
  ): Promise<TerrainClassification> {
    try {
      const elevation = await this.getElevation(latitude, longitude);
      const slopeAnalysis = await this.analyzeSlopeAtPoint(latitude, longitude, analysisRadius);
      
      // Calculate terrain roughness
      const roughness = await this.calculateRoughness(latitude, longitude, analysisRadius);
      
      // Classify terrain type
      let classification: TerrainClassification['classification'];
      if (elevation < 1) {
        classification = 'water';
      } else if (slopeAnalysis.slope < 2) {
        classification = 'flat';
      } else if (elevation < 500 && slopeAnalysis.slope < 15) {
        classification = 'hills';
      } else if (elevation >= 500) {
        classification = 'mountains';
      } else if (roughness > 0.5) {
        classification = 'ridge';
      } else {
        classification = 'valley';
      }

      // Assess trafficability
      let trafficability: TerrainClassification['trafficability'];
      if (classification === 'water' || slopeAnalysis.slope > 45) {
        trafficability = 'impassable';
      } else if (slopeAnalysis.slope > 30 || roughness > 0.8) {
        trafficability = 'poor';
      } else if (slopeAnalysis.slope > 15 || roughness > 0.5) {
        trafficability = 'fair';
      } else if (slopeAnalysis.slope > 5) {
        trafficability = 'good';
      } else {
        trafficability = 'excellent';
      }

      return {
        point: [longitude, latitude],
        elevation,
        slope: slopeAnalysis.slope,
        aspect: slopeAnalysis.aspect,
        roughness,
        classification,
        trafficability,
      };
    } catch (error) {
      console.error('Error classifying terrain:', error);
      throw error;
    }
  }

  // Private helper methods
  private async fetchElevationFromService(latitude: number, longitude: number): Promise<number> {
    try {
      // This would typically call an external elevation service like:
      // - USGS Elevation Point Query Service
      // - Open-Elevation API
      // - Google Elevation API
      // For demo purposes, we'll simulate elevation based on coordinates
      
      // Simple elevation simulation (not accurate, just for demo)
      const noise = Math.sin(latitude * 100) * Math.cos(longitude * 100) * 100;
      const baseElevation = Math.max(0, 100 + noise);
      
      return Math.round(baseElevation);
    } catch (error) {
      console.error('Error fetching elevation from service:', error);
      return 0;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = this.EARTH_RADIUS;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateDestination(
    latitude: number,
    longitude: number,
    bearing: number,
    distance: number
  ): { latitude: number; longitude: number } {
    const R = this.EARTH_RADIUS;
    const lat1 = latitude * Math.PI / 180;
    const lon1 = longitude * Math.PI / 180;
    const brng = bearing * Math.PI / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
    );

    const lon2 = lon1 + Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      latitude: lat2 * 180 / Math.PI,
      longitude: lon2 * 180 / Math.PI,
    };
  }

  private calculateBounds(latitude: number, longitude: number, radius: number) {
    const latOffset = radius / 111000; // approximate meters to degrees
    const lonOffset = radius / (111000 * Math.cos(latitude * Math.PI / 180));

    return {
      north: latitude + latOffset,
      south: latitude - latOffset,
      east: longitude + lonOffset,
      west: longitude - lonOffset,
    };
  }

  private async isPointVisible(
    observerLat: number,
    observerLon: number,
    observerHeight: number,
    targetLat: number,
    targetLon: number,
    targetElevation: number,
    sampleDistance: number = 50
  ): Promise<boolean> {
    try {
      const distance = this.calculateDistance(observerLat, observerLon, targetLat, targetLon);
      const numSamples = Math.ceil(distance / sampleDistance);
      
      if (numSamples <= 1) return true;

      // Check line of sight by sampling points along the path
      for (let i = 1; i < numSamples; i++) {
        const ratio = i / numSamples;
        const sampleLat = observerLat + (targetLat - observerLat) * ratio;
        const sampleLon = observerLon + (targetLon - observerLon) * ratio;
        const sampleDistance = distance * ratio;
        
        const sampleElevation = await this.getElevation(sampleLat, sampleLon);
        
        // Calculate required height for line of sight
        const requiredHeight = observerHeight + 
          (targetElevation - observerHeight) * ratio;
        
        // Account for earth curvature
        const curvature = (sampleDistance * sampleDistance) / (2 * this.EARTH_RADIUS);
        const adjustedRequiredHeight = requiredHeight - curvature;
        
        if (sampleElevation > adjustedRequiredHeight) {
          return false; // Line of sight blocked
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking point visibility:', error);
      return false;
    }
  }

  private async calculateRoughness(
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<number> {
    try {
      // Sample elevations in a grid around the point
      const samples = 9; // 3x3 grid
      const step = radius / (samples - 1);
      const elevations: number[] = [];

      for (let i = 0; i < samples; i++) {
        for (let j = 0; j < samples; j++) {
          const offsetLat = (i - 1) * step / 111000;
          const offsetLon = (j - 1) * step / (111000 * Math.cos(latitude * Math.PI / 180));
          const elevation = await this.getElevation(latitude + offsetLat, longitude + offsetLon);
          elevations.push(elevation);
        }
      }

      // Calculate standard deviation as roughness measure
      const mean = elevations.reduce((a, b) => a + b, 0) / elevations.length;
      const variance = elevations.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / elevations.length;
      const stdDev = Math.sqrt(variance);

      // Normalize roughness to 0-1 scale
      return Math.min(stdDev / 100, 1);
    } catch (error) {
      console.error('Error calculating roughness:', error);
      return 0;
    }
  }

  private generateContoursFromGrid(
    elevationGrid: number[][],
    latitudes: number[],
    longitudes: number[],
    interval: number
  ): ContourLine[] {
    // This is a simplified contour generation
    // In a real implementation, you'd use a proper marching squares algorithm
    const contours: ContourLine[] = [];
    
    const minElevation = Math.min(...elevationGrid.flat());
    const maxElevation = Math.max(...elevationGrid.flat());
    
    for (let elevation = Math.ceil(minElevation / interval) * interval; 
         elevation <= maxElevation; 
         elevation += interval) {
      
      const coordinates: number[][] = [];
      
      // Simple contour extraction (not accurate, just for demo)
      for (let i = 0; i < elevationGrid.length - 1; i++) {
        for (let j = 0; j < elevationGrid[i].length - 1; j++) {
          const e1 = elevationGrid[i][j];
          const e2 = elevationGrid[i][j + 1];
          const e3 = elevationGrid[i + 1][j];
          
          if ((e1 <= elevation && e2 >= elevation) || (e1 >= elevation && e2 <= elevation)) {
            coordinates.push([longitudes[j], latitudes[i]]);
          }
          if ((e1 <= elevation && e3 >= elevation) || (e1 >= elevation && e3 <= elevation)) {
            coordinates.push([longitudes[j], latitudes[i]]);
          }
        }
      }
      
      if (coordinates.length > 0) {
        contours.push({
          elevation,
          coordinates,
          type: elevation % (interval * 5) === 0 ? 'major' : 'minor',
        });
      }
    }
    
    return contours;
  }

  /**
   * Clear elevation cache
   */
  clearCache(): void {
    this.elevationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.elevationCache.size,
      keys: Array.from(this.elevationCache.keys()),
    };
  }
}

// Singleton instance
let terrainAnalysisServiceInstance: TerrainAnalysisService | null = null;

export const getTerrainAnalysisService = (): TerrainAnalysisService => {
  if (!terrainAnalysisServiceInstance) {
    terrainAnalysisServiceInstance = new TerrainAnalysisService();
  }
  return terrainAnalysisServiceInstance;
};

export default TerrainAnalysisService;