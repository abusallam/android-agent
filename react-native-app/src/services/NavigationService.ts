import * as turf from '@turf/turf';
import { supabase, TABLES } from '../lib/supabase';
import { getTerrainAnalysisService } from './TerrainAnalysisService';

export interface Waypoint {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  elevation?: number;
  type: 'start' | 'waypoint' | 'destination' | 'checkpoint' | 'hazard' | 'poi';
  description?: string;
  arrivalRadius?: number; // meters
  metadata?: Record<string, any>;
}

export interface Route {
  id: string;
  name: string;
  waypoints: Waypoint[];
  coordinates: [number, number][];
  distance: number; // meters
  duration: number; // seconds
  elevationProfile?: {
    gain: number;
    loss: number;
    min: number;
    max: number;
  };
  navigationMode: NavigationMode;
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  surface: 'paved' | 'unpaved' | 'trail' | 'cross_country';
  restrictions?: string[];
  metadata?: Record<string, any>;
}

export interface NavigationInstruction {
  id: string;
  type: 'start' | 'turn' | 'continue' | 'waypoint' | 'destination' | 'warning';
  instruction: string;
  distance: number; // meters from start
  bearing: number; // degrees
  coordinates: [number, number];
  icon?: string;
  voice?: string; // text-to-speech instruction
}

export interface NavigationSession {
  id: string;
  route: Route;
  currentPosition: [number, number];
  currentWaypointIndex: number;
  distanceRemaining: number;
  timeRemaining: number;
  nextInstruction?: NavigationInstruction;
  isOffRoute: boolean;
  offRouteDistance: number;
  speed: number; // m/s
  bearing: number; // degrees
  accuracy: number; // meters
}

export type NavigationMode = 'walking' | 'driving' | 'cycling' | 'aircraft' | 'boat' | 'tactical';

export interface RouteOptions {
  mode: NavigationMode;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  avoidUnpaved?: boolean;
  maxSlope?: number; // degrees
  maxElevation?: number; // meters
  minClearance?: number; // meters (for aircraft)
  fuelRange?: number; // meters
  preferShortest?: boolean; // vs fastest
  waypoints?: Waypoint[];
}

export interface NavigationCallbacks {
  onPositionUpdate?: (session: NavigationSession) => void;
  onInstructionUpdate?: (instruction: NavigationInstruction) => void;
  onWaypointReached?: (waypoint: Waypoint) => void;
  onDestinationReached?: (route: Route) => void;
  onOffRoute?: (distance: number) => void;
  onRouteRecalculated?: (newRoute: Route) => void;
  onNavigationError?: (error: Error) => void;
}

export class NavigationService {
  private terrainService = getTerrainAnalysisService();
  private activeSession: NavigationSession | null = null;
  private callbacks: NavigationCallbacks = {};
  private positionWatcher: any = null;
  private routeCache: Map<string, Route> = new Map();

  /**
   * Initialize navigation service
   */
  async initialize(callbacks: NavigationCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;
    console.log('Navigation service initialized');
  }

  /**
   * Calculate route between points
   */
  async calculateRoute(
    start: [number, number],
    end: [number, number],
    options: RouteOptions = { mode: 'walking' }
  ): Promise<Route> {
    try {
      const cacheKey = this.generateRouteKey(start, end, options);
      
      if (this.routeCache.has(cacheKey)) {
        return this.routeCache.get(cacheKey)!;
      }

      let route: Route;

      switch (options.mode) {
        case 'walking':
          route = await this.calculateWalkingRoute(start, end, options);
          break;
        case 'driving':
          route = await this.calculateDrivingRoute(start, end, options);
          break;
        case 'cycling':
          route = await this.calculateCyclingRoute(start, end, options);
          break;
        case 'aircraft':
          route = await this.calculateAircraftRoute(start, end, options);
          break;
        case 'boat':
          route = await this.calculateBoatRoute(start, end, options);
          break;
        case 'tactical':
          route = await this.calculateTacticalRoute(start, end, options);
          break;
        default:
          route = await this.calculateDirectRoute(start, end, options);
      }

      // Add elevation profile
      route.elevationProfile = await this.calculateElevationProfile(route.coordinates);

      // Cache the route
      this.routeCache.set(cacheKey, route);

      return route;
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }

  /**
   * Calculate multi-waypoint route
   */
  async calculateMultiWaypointRoute(
    waypoints: Waypoint[],
    options: RouteOptions = { mode: 'walking' }
  ): Promise<Route> {
    try {
      if (waypoints.length < 2) {
        throw new Error('At least 2 waypoints required');
      }

      const segments: Route[] = [];
      let totalDistance = 0;
      let totalDuration = 0;
      let allCoordinates: [number, number][] = [];

      // Calculate route segments between consecutive waypoints
      for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i].coordinates;
        const end = waypoints[i + 1].coordinates;
        
        const segment = await this.calculateRoute(start, end, options);
        segments.push(segment);
        
        totalDistance += segment.distance;
        totalDuration += segment.duration;
        
        // Merge coordinates, avoiding duplicates at waypoints
        if (i === 0) {
          allCoordinates = [...segment.coordinates];
        } else {
          allCoordinates = [...allCoordinates, ...segment.coordinates.slice(1)];
        }
      }

      const route: Route = {
        id: `multi_${Date.now()}`,
        name: `Route via ${waypoints.length} waypoints`,
        waypoints,
        coordinates: allCoordinates,
        distance: totalDistance,
        duration: totalDuration,
        navigationMode: options.mode,
        difficulty: this.calculateRouteDifficulty(segments),
        surface: this.determinePrimarySurface(segments),
        elevationProfile: await this.calculateElevationProfile(allCoordinates),
      };

      return route;
    } catch (error) {
      console.error('Error calculating multi-waypoint route:', error);
      throw error;
    }
  }

  /**
   * Start navigation session
   */
  async startNavigation(route: Route): Promise<NavigationSession> {
    try {
      if (this.activeSession) {
        await this.stopNavigation();
      }

      const session: NavigationSession = {
        id: `nav_${Date.now()}`,
        route,
        currentPosition: route.coordinates[0],
        currentWaypointIndex: 0,
        distanceRemaining: route.distance,
        timeRemaining: route.duration,
        isOffRoute: false,
        offRouteDistance: 0,
        speed: 0,
        bearing: 0,
        accuracy: 0,
      };

      this.activeSession = session;
      
      // Start position tracking
      await this.startPositionTracking();

      // Generate initial instruction
      session.nextInstruction = this.generateNextInstruction(session);

      this.callbacks.onPositionUpdate?.(session);

      return session;
    } catch (error) {
      console.error('Error starting navigation:', error);
      throw error;
    }
  }

  /**
   * Stop navigation session
   */
  async stopNavigation(): Promise<void> {
    try {
      if (this.positionWatcher) {
        this.positionWatcher.remove();
        this.positionWatcher = null;
      }

      this.activeSession = null;
      console.log('Navigation stopped');
    } catch (error) {
      console.error('Error stopping navigation:', error);
    }
  }

  /**
   * Update current position during navigation
   */
  async updatePosition(
    latitude: number,
    longitude: number,
    accuracy: number = 10,
    speed: number = 0,
    bearing: number = 0
  ): Promise<void> {
    if (!this.activeSession) return;

    try {
      const session = this.activeSession;
      const newPosition: [number, number] = [longitude, latitude];
      
      session.currentPosition = newPosition;
      session.speed = speed;
      session.bearing = bearing;
      session.accuracy = accuracy;

      // Check if off route
      const { isOffRoute, distance: offRouteDistance } = this.checkOffRoute(session, newPosition);
      session.isOffRoute = isOffRoute;
      session.offRouteDistance = offRouteDistance;

      if (isOffRoute && offRouteDistance > 100) {
        this.callbacks.onOffRoute?.(offRouteDistance);
        
        // Recalculate route if significantly off course
        if (offRouteDistance > 500) {
          await this.recalculateRoute(session, newPosition);
        }
      }

      // Update progress
      this.updateNavigationProgress(session);

      // Check for waypoint arrival
      await this.checkWaypointArrival(session);

      // Update instruction
      session.nextInstruction = this.generateNextInstruction(session);

      this.callbacks.onPositionUpdate?.(session);
    } catch (error) {
      console.error('Error updating position:', error);
      this.callbacks.onNavigationError?.(error as Error);
    }
  }

  /**
   * Get navigation instructions for route
   */
  generateNavigationInstructions(route: Route): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];
    const coordinates = route.coordinates;

    if (coordinates.length < 2) return instructions;

    // Start instruction
    instructions.push({
      id: 'start',
      type: 'start',
      instruction: `Start ${route.navigationMode} on ${route.name}`,
      distance: 0,
      bearing: this.calculateBearing(coordinates[0], coordinates[1]),
      coordinates: coordinates[0],
      voice: `Starting navigation on ${route.name}`,
    });

    // Generate turn-by-turn instructions
    let cumulativeDistance = 0;
    
    for (let i = 1; i < coordinates.length - 1; i++) {
      const prev = coordinates[i - 1];
      const current = coordinates[i];
      const next = coordinates[i + 1];

      const segmentDistance = turf.distance(
        turf.point(prev),
        turf.point(current),
        { units: 'meters' }
      );
      cumulativeDistance += segmentDistance;

      const bearingIn = this.calculateBearing(prev, current);
      const bearingOut = this.calculateBearing(current, next);
      const turnAngle = this.calculateTurnAngle(bearingIn, bearingOut);

      if (Math.abs(turnAngle) > 30) {
        const turnDirection = turnAngle > 0 ? 'right' : 'left';
        const turnType = Math.abs(turnAngle) > 120 ? 'sharp' : 
                        Math.abs(turnAngle) > 60 ? 'turn' : 'slight';

        instructions.push({
          id: `turn_${i}`,
          type: 'turn',
          instruction: `${turnType} ${turnDirection}`,
          distance: cumulativeDistance,
          bearing: bearingOut,
          coordinates: current,
          voice: `In ${Math.round(segmentDistance)} meters, ${turnType} ${turnDirection}`,
        });
      }
    }

    // Destination instruction
    const totalDistance = turf.length(turf.lineString(coordinates), { units: 'meters' });
    instructions.push({
      id: 'destination',
      type: 'destination',
      instruction: 'You have arrived at your destination',
      distance: totalDistance,
      bearing: 0,
      coordinates: coordinates[coordinates.length - 1],
      voice: 'You have arrived at your destination',
    });

    return instructions;
  }

  /**
   * Save route to database
   */
  async saveRoute(route: Route, teamId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.ROUTES)
        .insert({
          name: route.name,
          description: `${route.navigationMode} route - ${route.distance}m`,
          route_type: route.navigationMode,
          coordinates: route.coordinates,
          distance: route.distance,
          duration: route.duration,
          elevation_gain: route.elevationProfile?.gain || 0,
          elevation_loss: route.elevationProfile?.loss || 0,
          difficulty: route.difficulty,
          team_id: teamId,
          metadata: {
            waypoints: route.waypoints,
            surface: route.surface,
            restrictions: route.restrictions,
            ...route.metadata,
          },
        });

      if (error) throw error;

      console.log('Route saved successfully');
    } catch (error) {
      console.error('Error saving route:', error);
      throw error;
    }
  }

  /**
   * Load saved routes
   */
  async loadRoutes(teamId?: string): Promise<Route[]> {
    try {
      let query = supabase
        .from(TABLES.ROUTES)
        .select('*')
        .order('created_at', { ascending: false });

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(this.mapDatabaseRouteToRoute) || [];
    } catch (error) {
      console.error('Error loading routes:', error);
      return [];
    }
  }

  // Private helper methods
  private async calculateWalkingRoute(
    start: [number, number],
    end: [number, number],
    options: RouteOptions
  ): Promise<Route> {
    // For walking routes, we can use more direct paths and consider terrain
    const directRoute = await this.calculateDirectRoute(start, end, options);
    
    // Adjust for walking-specific factors
    directRoute.duration = directRoute.distance / 1.4; // 1.4 m/s average walking speed
    directRoute.difficulty = await this.assessWalkingDifficulty(directRoute.coordinates);
    directRoute.surface = 'trail';

    return directRoute;
  }

  private async calculateDrivingRoute(
    start: [number, number],
    end: [number, number],
    options: RouteOptions
  ): Promise<Route> {
    // For driving routes, we'd typically use a routing service like OpenRouteService
    // For demo purposes, we'll create a simplified route
    const directRoute = await this.calculateDirectRoute(start, end, options);
    
    // Adjust for driving-specific factors
    directRoute.duration = directRoute.distance / 13.9; // 50 km/h average speed
    directRoute.difficulty = 'easy';
    directRoute.surface = 'paved';

    return directRoute;
  }

  private async calculateCyclingRoute(
    start: [number, number],
    end: [number, number],
    options: RouteOptions
  ): Promise<Route> {
    const directRoute = await this.calculateDirectRoute(start, end, options);
    
    // Adjust for cycling-specific factors
    directRoute.duration = directRoute.distance / 5.6; // 20 km/h average cycling speed
    directRoute.difficulty = await this.assessCyclingDifficulty(directRoute.coordinates);
    directRoute.surface = 'unpaved';

    return directRoute;
  }

  private async calculateAircraftRoute(
    start: [number, number],
    end: [number, number],
    options: RouteOptions
  ): Promise<Route> {
    // Aircraft routes are typically direct with altitude considerations
    const directRoute = await this.calculateDirectRoute(start, end, options);
    
    // Adjust for aircraft-specific factors
    directRoute.duration = directRoute.distance / 55.6; // 200 km/h average aircraft speed
    directRoute.difficulty = 'moderate';
    directRoute.surface = 'cross_country';

    return directRoute;
  }

  private async calculateBoatRoute(
    start: [number, number],
    end: [number, number],
    options: RouteOptions
  ): Promise<Route> {
    // Boat routes need to consider water bodies and channels
    const directRoute = await this.calculateDirectRoute(start, end, options);
    
    // Adjust for boat-specific factors
    directRoute.duration = directRoute.distance / 8.3; // 30 km/h average boat speed
    directRoute.difficulty = 'moderate';
    directRoute.surface = 'cross_country';

    return directRoute;
  }

  private async calculateTacticalRoute(
    start: [number, number],
    end: [number, number],
    options: RouteOptions
  ): Promise<Route> {
    // Tactical routes consider concealment, cover, and threat avoidance
    const directRoute = await this.calculateDirectRoute(start, end, options);
    
    // Add tactical considerations
    directRoute.duration = directRoute.distance / 0.8; // Slower tactical movement
    directRoute.difficulty = 'hard';
    directRoute.surface = 'cross_country';
    directRoute.restrictions = ['avoid_roads', 'use_cover', 'minimize_exposure'];

    return directRoute;
  }

  private async calculateDirectRoute(
    start: [number, number],
    end: [number, number],
    options: RouteOptions
  ): Promise<Route> {
    // Simple direct route calculation
    const line = turf.lineString([start, end]);
    const distance = turf.length(line, { units: 'meters' });
    
    // Create waypoints
    const waypoints: Waypoint[] = [
      {
        id: 'start',
        name: 'Start',
        coordinates: start,
        type: 'start',
      },
      {
        id: 'end',
        name: 'Destination',
        coordinates: end,
        type: 'destination',
      },
    ];

    // Add intermediate waypoints if specified
    if (options.waypoints) {
      waypoints.splice(1, 0, ...options.waypoints);
    }

    return {
      id: `route_${Date.now()}`,
      name: 'Direct Route',
      waypoints,
      coordinates: [start, end],
      distance,
      duration: distance / 1.4, // Default walking speed
      navigationMode: options.mode,
      difficulty: 'moderate',
      surface: 'unpaved',
    };
  }

  private async calculateElevationProfile(coordinates: [number, number][]) {
    try {
      const profile = await this.terrainService.getElevationProfile(coordinates);
      return {
        gain: profile.elevationGain,
        loss: profile.elevationLoss,
        min: profile.minElevation,
        max: profile.maxElevation,
      };
    } catch (error) {
      console.error('Error calculating elevation profile:', error);
      return { gain: 0, loss: 0, min: 0, max: 0 };
    }
  }

  private async assessWalkingDifficulty(coordinates: [number, number][]): Promise<Route['difficulty']> {
    // Assess difficulty based on terrain and elevation changes
    try {
      const profile = await this.terrainService.getElevationProfile(coordinates);
      const totalGain = profile.elevationGain;
      
      if (totalGain < 100) return 'easy';
      if (totalGain < 300) return 'moderate';
      if (totalGain < 600) return 'hard';
      return 'extreme';
    } catch (error) {
      return 'moderate';
    }
  }

  private async assessCyclingDifficulty(coordinates: [number, number][]): Promise<Route['difficulty']> {
    // Similar to walking but with different thresholds
    try {
      const profile = await this.terrainService.getElevationProfile(coordinates);
      const totalGain = profile.elevationGain;
      
      if (totalGain < 200) return 'easy';
      if (totalGain < 500) return 'moderate';
      if (totalGain < 1000) return 'hard';
      return 'extreme';
    } catch (error) {
      return 'moderate';
    }
  }

  private calculateRouteDifficulty(segments: Route[]): Route['difficulty'] {
    const difficulties = segments.map(s => s.difficulty);
    if (difficulties.includes('extreme')) return 'extreme';
    if (difficulties.includes('hard')) return 'hard';
    if (difficulties.includes('moderate')) return 'moderate';
    return 'easy';
  }

  private determinePrimarySurface(segments: Route[]): Route['surface'] {
    const surfaces = segments.map(s => s.surface);
    // Return the most restrictive surface type
    if (surfaces.includes('cross_country')) return 'cross_country';
    if (surfaces.includes('trail')) return 'trail';
    if (surfaces.includes('unpaved')) return 'unpaved';
    return 'paved';
  }

  private generateRouteKey(
    start: [number, number],
    end: [number, number],
    options: RouteOptions
  ): string {
    return `${start[0]},${start[1]}-${end[0]},${end[1]}-${options.mode}`;
  }

  private async startPositionTracking(): Promise<void> {
    // This would typically use the device's GPS
    // For demo purposes, we'll simulate position updates
    console.log('Position tracking started');
  }

  private checkOffRoute(
    session: NavigationSession,
    currentPosition: [number, number]
  ): { isOffRoute: boolean; distance: number } {
    const route = session.route;
    const routeLine = turf.lineString(route.coordinates);
    const currentPoint = turf.point(currentPosition);
    
    const nearestPoint = turf.nearestPointOnLine(routeLine, currentPoint);
    const distance = turf.distance(currentPoint, nearestPoint, { units: 'meters' });
    
    return {
      isOffRoute: distance > 50, // 50 meter tolerance
      distance,
    };
  }

  private updateNavigationProgress(session: NavigationSession): void {
    const route = session.route;
    const currentPoint = turf.point(session.currentPosition);
    const routeLine = turf.lineString(route.coordinates);
    
    // Find the nearest point on the route
    const nearestPoint = turf.nearestPointOnLine(routeLine, currentPoint);
    const distanceTraveled = nearestPoint.properties.location * route.distance;
    
    session.distanceRemaining = route.distance - distanceTraveled;
    session.timeRemaining = session.distanceRemaining / (session.speed || 1.4);
  }

  private async checkWaypointArrival(session: NavigationSession): Promise<void> {
    const currentWaypoint = session.route.waypoints[session.currentWaypointIndex];
    if (!currentWaypoint) return;

    const distance = turf.distance(
      turf.point(session.currentPosition),
      turf.point(currentWaypoint.coordinates),
      { units: 'meters' }
    );

    const arrivalRadius = currentWaypoint.arrivalRadius || 20;

    if (distance <= arrivalRadius) {
      this.callbacks.onWaypointReached?.(currentWaypoint);
      
      session.currentWaypointIndex++;
      
      if (session.currentWaypointIndex >= session.route.waypoints.length) {
        this.callbacks.onDestinationReached?.(session.route);
        await this.stopNavigation();
      }
    }
  }

  private generateNextInstruction(session: NavigationSession): NavigationInstruction | undefined {
    const instructions = this.generateNavigationInstructions(session.route);
    
    // Find the next instruction based on current progress
    const currentPoint = turf.point(session.currentPosition);
    const routeLine = turf.lineString(session.route.coordinates);
    const nearestPoint = turf.nearestPointOnLine(routeLine, currentPoint);
    const distanceTraveled = nearestPoint.properties.location * session.route.distance;
    
    return instructions.find(instruction => instruction.distance > distanceTraveled);
  }

  private async recalculateRoute(
    session: NavigationSession,
    currentPosition: [number, number]
  ): Promise<void> {
    try {
      const destination = session.route.waypoints[session.route.waypoints.length - 1].coordinates;
      const newRoute = await this.calculateRoute(currentPosition, destination, {
        mode: session.route.navigationMode,
      });

      session.route = newRoute;
      session.currentWaypointIndex = 0;
      
      this.callbacks.onRouteRecalculated?.(newRoute);
    } catch (error) {
      console.error('Error recalculating route:', error);
      this.callbacks.onNavigationError?.(error as Error);
    }
  }

  private calculateBearing(start: [number, number], end: [number, number]): number {
    const bearing = turf.bearing(turf.point(start), turf.point(end));
    return bearing < 0 ? bearing + 360 : bearing;
  }

  private calculateTurnAngle(bearingIn: number, bearingOut: number): number {
    let angle = bearingOut - bearingIn;
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    return angle;
  }

  private mapDatabaseRouteToRoute(dbRoute: any): Route {
    return {
      id: dbRoute.id,
      name: dbRoute.name,
      waypoints: dbRoute.metadata?.waypoints || [],
      coordinates: dbRoute.coordinates,
      distance: dbRoute.distance,
      duration: dbRoute.duration,
      elevationProfile: {
        gain: dbRoute.elevation_gain,
        loss: dbRoute.elevation_loss,
        min: 0,
        max: 0,
      },
      navigationMode: dbRoute.route_type,
      difficulty: dbRoute.difficulty,
      surface: dbRoute.metadata?.surface || 'unpaved',
      restrictions: dbRoute.metadata?.restrictions,
      metadata: dbRoute.metadata,
    };
  }

  /**
   * Get current navigation session
   */
  getCurrentSession(): NavigationSession | null {
    return this.activeSession;
  }

  /**
   * Clear route cache
   */
  clearCache(): void {
    this.routeCache.clear();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stopNavigation();
    this.clearCache();
    this.callbacks = {};
  }
}

// Singleton instance
let navigationServiceInstance: NavigationService | null = null;

export const getNavigationService = (): NavigationService => {
  if (!navigationServiceInstance) {
    navigationServiceInstance = new NavigationService();
  }
  return navigationServiceInstance;
};

export default NavigationService;