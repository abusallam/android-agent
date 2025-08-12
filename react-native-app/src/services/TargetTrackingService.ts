import * as turf from '@turf/turf';
import { supabase, TABLES } from '../lib/supabase';

export interface Target {
  id: string;
  name: string;
  type: 'person' | 'vehicle' | 'aircraft' | 'vessel' | 'equipment' | 'unknown';
  classification: 'friendly' | 'hostile' | 'neutral' | 'unknown';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'lost' | 'destroyed';
  position: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy: number;
    timestamp: Date;
  };
  movement: {
    speed: number; // m/s
    bearing: number; // degrees
    course?: [number, number][]; // historical positions
  };
  attributes: {
    size?: 'small' | 'medium' | 'large';
    color?: string;
    markings?: string;
    equipment?: string[];
    personnel?: number;
  };
  intelligence: {
    confidence: number; // 0-1
    source: string;
    reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // NATO reliability scale
    lastUpdated: Date;
  };
  metadata?: Record<string, any>;
}

export interface TrackingSession {
  id: string;
  name: string;
  targets: Map<string, Target>;
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  filters: {
    types?: Target['type'][];
    classifications?: Target['classification'][];
    priorities?: Target['priority'][];
    statuses?: Target['status'][];
  };
}

export interface TrackPrediction {
  targetId: string;
  predictedPositions: Array<{
    position: [number, number];
    timestamp: Date;
    confidence: number;
  }>;
  estimatedTimeOfArrival?: {
    destination: [number, number];
    eta: Date;
    confidence: number;
  };
  threatAssessment?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
}

export interface TargetAnalytics {
  targetId: string;
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  timeActive: number; // seconds
  frequentAreas: Array<{
    center: [number, number];
    radius: number;
    timeSpent: number;
  }>;
  movementPattern: 'stationary' | 'linear' | 'circular' | 'random' | 'patrol';
  behaviorScore: number; // 0-1, higher = more predictable
}

export interface TrackingCallbacks {
  onTargetAdded?: (target: Target) => void;
  onTargetUpdated?: (target: Target) => void;
  onTargetRemoved?: (targetId: string) => void;
  onTargetLost?: (target: Target) => void;
  onProximityAlert?: (target1: Target, target2: Target, distance: number) => void;
  onGeofenceViolation?: (target: Target, geofenceId: string) => void;
  onThreatDetected?: (target: Target, threatLevel: string) => void;
}

export class TargetTrackingService {
  private activeSessions: Map<string, TrackingSession> = new Map();
  private callbacks: TrackingCallbacks = {};
  private updateInterval: any = null;
  private kalmanFilters: Map<string, KalmanFilter> = new Map();

  /**
   * Initialize target tracking service
   */
  async initialize(callbacks: TrackingCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    console.log('Target tracking service initialized');
  }

  /**
   * Create a new tracking session
   */
  async createTrackingSession(
    name: string,
    bounds?: TrackingSession['bounds']
  ): Promise<TrackingSession> {
    try {
      const session: TrackingSession = {
        id: `session_${Date.now()}`,
        name,
        targets: new Map(),
        isActive: true,
        startTime: new Date(),
        bounds,
        filters: {},
      };

      this.activeSessions.set(session.id, session);

      // Save to database
      await supabase
        .from('tactical_tracking_sessions')
        .insert({
          id: session.id,
          name: session.name,
          is_active: session.isActive,
          start_time: session.startTime.toISOString(),
          bounds: bounds ? JSON.stringify(bounds) : null,
          filters: JSON.stringify(session.filters),
        });

      return session;
    } catch (error) {
      console.error('Error creating tracking session:', error);
      throw error;
    }
  }

  /**
   * Add target to tracking session
   */
  async addTarget(sessionId: string, target: Omit<Target, 'id'>): Promise<Target> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Tracking session not found');
      }

      const newTarget: Target = {
        ...target,
        id: `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Initialize Kalman filter for position tracking
      this.kalmanFilters.set(newTarget.id, new KalmanFilter());

      // Add to session
      session.targets.set(newTarget.id, newTarget);

      // Save to database
      await supabase
        .from(TABLES.TARGETS)
        .insert({
          id: newTarget.id,
          name: newTarget.name,
          target_type: newTarget.type,
          classification: newTarget.classification,
          priority: newTarget.priority,
          status: newTarget.status,
          position: `POINT(${newTarget.position.longitude} ${newTarget.position.latitude})`,
          altitude: newTarget.position.altitude,
          speed: newTarget.movement.speed,
          bearing: newTarget.movement.bearing,
          attributes: JSON.stringify(newTarget.attributes),
          intelligence: JSON.stringify(newTarget.intelligence),
          metadata: JSON.stringify(newTarget.metadata || {}),
          session_id: sessionId,
        });

      this.callbacks.onTargetAdded?.(newTarget);

      return newTarget;
    } catch (error) {
      console.error('Error adding target:', error);
      throw error;
    }
  }

  /**
   * Update target position and attributes
   */
  async updateTarget(
    sessionId: string,
    targetId: string,
    updates: Partial<Target>
  ): Promise<Target> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Tracking session not found');
      }

      const target = session.targets.get(targetId);
      if (!target) {
        throw new Error('Target not found');
      }

      // Apply Kalman filtering to position updates
      if (updates.position) {
        const filter = this.kalmanFilters.get(targetId);
        if (filter) {
          const filteredPosition = filter.update(
            updates.position.latitude,
            updates.position.longitude,
            updates.position.accuracy
          );
          updates.position.latitude = filteredPosition.latitude;
          updates.position.longitude = filteredPosition.longitude;
        }

        // Update movement course
        if (target.movement.course) {
          target.movement.course.push([
            updates.position.longitude,
            updates.position.latitude
          ]);
          
          // Keep only last 100 positions
          if (target.movement.course.length > 100) {
            target.movement.course = target.movement.course.slice(-100);
          }
        } else {
          target.movement.course = [[
            target.position.longitude,
            target.position.latitude
          ], [
            updates.position.longitude,
            updates.position.latitude
          ]];
        }

        // Calculate speed and bearing if we have previous position
        if (target.movement.course.length >= 2) {
          const prevPos = target.movement.course[target.movement.course.length - 2];
          const currPos = target.movement.course[target.movement.course.length - 1];
          
          const distance = turf.distance(
            turf.point(prevPos),
            turf.point(currPos),
            { units: 'meters' }
          );
          
          const timeDiff = (updates.position.timestamp.getTime() - target.position.timestamp.getTime()) / 1000;
          
          if (timeDiff > 0) {
            updates.movement = {
              ...target.movement,
              speed: distance / timeDiff,
              bearing: turf.bearing(turf.point(prevPos), turf.point(currPos)),
            };
          }
        }
      }

      // Merge updates
      const updatedTarget: Target = {
        ...target,
        ...updates,
        intelligence: {
          ...target.intelligence,
          ...updates.intelligence,
          lastUpdated: new Date(),
        },
      };

      session.targets.set(targetId, updatedTarget);

      // Update database
      await supabase
        .from(TABLES.TARGETS)
        .update({
          name: updatedTarget.name,
          target_type: updatedTarget.type,
          classification: updatedTarget.classification,
          priority: updatedTarget.priority,
          status: updatedTarget.status,
          position: `POINT(${updatedTarget.position.longitude} ${updatedTarget.position.latitude})`,
          altitude: updatedTarget.position.altitude,
          speed: updatedTarget.movement.speed,
          bearing: updatedTarget.movement.bearing,
          attributes: JSON.stringify(updatedTarget.attributes),
          intelligence: JSON.stringify(updatedTarget.intelligence),
          metadata: JSON.stringify(updatedTarget.metadata || {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId);

      // Record position history
      await supabase
        .from(TABLES.TARGET_POSITIONS)
        .insert({
          target_id: targetId,
          position: `POINT(${updatedTarget.position.longitude} ${updatedTarget.position.latitude})`,
          altitude: updatedTarget.position.altitude,
          speed: updatedTarget.movement.speed,
          bearing: updatedTarget.movement.bearing,
          accuracy: updatedTarget.position.accuracy,
          timestamp: updatedTarget.position.timestamp.toISOString(),
        });

      // Check for alerts
      await this.checkAlerts(sessionId, updatedTarget);

      this.callbacks.onTargetUpdated?.(updatedTarget);

      return updatedTarget;
    } catch (error) {
      console.error('Error updating target:', error);
      throw error;
    }
  }

  /**
   * Remove target from tracking
   */
  async removeTarget(sessionId: string, targetId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Tracking session not found');
      }

      session.targets.delete(targetId);
      this.kalmanFilters.delete(targetId);

      // Update database
      await supabase
        .from(TABLES.TARGETS)
        .update({ status: 'inactive' })
        .eq('id', targetId);

      this.callbacks.onTargetRemoved?.(targetId);
    } catch (error) {
      console.error('Error removing target:', error);
      throw error;
    }
  }

  /**
   * Get all targets in a session
   */
  getSessionTargets(sessionId: string): Target[] {
    const session = this.activeSessions.get(sessionId);
    return session ? Array.from(session.targets.values()) : [];
  }

  /**
   * Get targets within a geographic area
   */
  getTargetsInArea(
    sessionId: string,
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }
  ): Target[] {
    const targets = this.getSessionTargets(sessionId);
    
    return targets.filter(target => {
      const { latitude, longitude } = target.position;
      return latitude >= bounds.south &&
             latitude <= bounds.north &&
             longitude >= bounds.west &&
             longitude <= bounds.east;
    });
  }

  /**
   * Get targets within radius of a point
   */
  getTargetsNearPoint(
    sessionId: string,
    center: [number, number],
    radius: number // meters
  ): Array<{ target: Target; distance: number }> {
    const targets = this.getSessionTargets(sessionId);
    const centerPoint = turf.point(center);
    
    return targets
      .map(target => {
        const targetPoint = turf.point([
          target.position.longitude,
          target.position.latitude
        ]);
        const distance = turf.distance(centerPoint, targetPoint, { units: 'meters' });
        
        return { target, distance };
      })
      .filter(({ distance }) => distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Predict target movement
   */
  async predictTargetMovement(
    targetId: string,
    timeHorizon: number = 3600 // seconds
  ): Promise<TrackPrediction> {
    try {
      const target = this.findTargetById(targetId);
      if (!target) {
        throw new Error('Target not found');
      }

      const predictions: TrackPrediction['predictedPositions'] = [];
      const timeStep = 60; // 1 minute intervals
      const steps = Math.floor(timeHorizon / timeStep);

      let currentLat = target.position.latitude;
      let currentLon = target.position.longitude;
      let currentSpeed = target.movement.speed;
      let currentBearing = target.movement.bearing;

      // Simple linear prediction (could be enhanced with ML models)
      for (let i = 1; i <= steps; i++) {
        const timeOffset = i * timeStep;
        const distance = currentSpeed * timeOffset;
        
        const destination = this.calculateDestination(
          currentLat,
          currentLon,
          currentBearing,
          distance
        );

        // Confidence decreases over time
        const confidence = Math.max(0.1, 1 - (timeOffset / timeHorizon));

        predictions.push({
          position: [destination.longitude, destination.latitude],
          timestamp: new Date(Date.now() + timeOffset * 1000),
          confidence,
        });
      }

      return {
        targetId,
        predictedPositions: predictions,
        threatAssessment: await this.assessThreat(target),
      };
    } catch (error) {
      console.error('Error predicting target movement:', error);
      throw error;
    }
  }

  /**
   * Analyze target behavior and patterns
   */
  async analyzeTarget(targetId: string): Promise<TargetAnalytics> {
    try {
      const target = this.findTargetById(targetId);
      if (!target || !target.movement.course) {
        throw new Error('Target not found or insufficient data');
      }

      const course = target.movement.course;
      let totalDistance = 0;
      const speeds: number[] = [];
      const positions: [number, number][] = [];

      // Calculate total distance and speeds
      for (let i = 1; i < course.length; i++) {
        const prev = course[i - 1];
        const curr = course[i];
        
        const distance = turf.distance(
          turf.point(prev),
          turf.point(curr),
          { units: 'meters' }
        );
        
        totalDistance += distance;
        positions.push(curr);
        
        // Estimate speed (assuming 1-minute intervals)
        speeds.push(distance / 60);
      }

      const averageSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const maxSpeed = Math.max(...speeds);

      // Find frequent areas using clustering
      const frequentAreas = this.findFrequentAreas(positions);

      // Determine movement pattern
      const movementPattern = this.classifyMovementPattern(course, speeds);

      // Calculate behavior predictability score
      const behaviorScore = this.calculateBehaviorScore(course, speeds);

      return {
        targetId,
        totalDistance,
        averageSpeed,
        maxSpeed,
        timeActive: course.length * 60, // assuming 1-minute intervals
        frequentAreas,
        movementPattern,
        behaviorScore,
      };
    } catch (error) {
      console.error('Error analyzing target:', error);
      throw error;
    }
  }

  /**
   * Set up proximity alerts between targets
   */
  async setupProximityAlert(
    sessionId: string,
    target1Id: string,
    target2Id: string,
    distance: number // meters
  ): Promise<void> {
    try {
      await supabase
        .from('tactical_proximity_alerts')
        .insert({
          session_id: sessionId,
          target1_id: target1Id,
          target2_id: target2Id,
          alert_distance: distance,
          is_active: true,
        });
    } catch (error) {
      console.error('Error setting up proximity alert:', error);
      throw error;
    }
  }

  /**
   * Load historical target data
   */
  async loadTargetHistory(
    targetId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<Array<{
    position: [number, number];
    timestamp: Date;
    speed: number;
    bearing: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TARGET_POSITIONS)
        .select('*')
        .eq('target_id', targetId)
        .gte('timestamp', timeRange.start.toISOString())
        .lte('timestamp', timeRange.end.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data?.map(record => ({
        position: [record.longitude, record.latitude],
        timestamp: new Date(record.timestamp),
        speed: record.speed || 0,
        bearing: record.bearing || 0,
      })) || [];
    } catch (error) {
      console.error('Error loading target history:', error);
      return [];
    }
  }

  // Private helper methods
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.performPeriodicChecks();
    }, 30000); // 30 seconds
  }

  private async performPeriodicChecks(): Promise<void> {
    for (const session of this.activeSessions.values()) {
      if (!session.isActive) continue;

      for (const target of session.targets.values()) {
        // Check if target is lost (no updates for too long)
        const timeSinceUpdate = Date.now() - target.position.timestamp.getTime();
        if (timeSinceUpdate > 300000) { // 5 minutes
          target.status = 'lost';
          this.callbacks.onTargetLost?.(target);
        }
      }
    }
  }

  private async checkAlerts(sessionId: string, target: Target): Promise<void> {
    // Check proximity alerts
    const otherTargets = this.getSessionTargets(sessionId)
      .filter(t => t.id !== target.id);

    for (const otherTarget of otherTargets) {
      const distance = turf.distance(
        turf.point([target.position.longitude, target.position.latitude]),
        turf.point([otherTarget.position.longitude, otherTarget.position.latitude]),
        { units: 'meters' }
      );

      // Check if there's an active proximity alert
      const { data: alerts } = await supabase
        .from('tactical_proximity_alerts')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .or(`and(target1_id.eq.${target.id},target2_id.eq.${otherTarget.id}),and(target1_id.eq.${otherTarget.id},target2_id.eq.${target.id})`);

      if (alerts && alerts.length > 0) {
        const alert = alerts[0];
        if (distance <= alert.alert_distance) {
          this.callbacks.onProximityAlert?.(target, otherTarget, distance);
        }
      }
    }

    // Check threat level
    const threat = await this.assessThreat(target);
    if (threat && threat.level !== 'low') {
      this.callbacks.onThreatDetected?.(target, threat.level);
    }
  }

  private findTargetById(targetId: string): Target | null {
    for (const session of this.activeSessions.values()) {
      const target = session.targets.get(targetId);
      if (target) return target;
    }
    return null;
  }

  private calculateDestination(
    latitude: number,
    longitude: number,
    bearing: number,
    distance: number
  ): { latitude: number; longitude: number } {
    const destination = turf.destination(
      turf.point([longitude, latitude]),
      distance / 1000, // convert to km
      bearing,
      { units: 'kilometers' }
    );

    return {
      latitude: destination.geometry.coordinates[1],
      longitude: destination.geometry.coordinates[0],
    };
  }

  private async assessThreat(target: Target): Promise<TrackPrediction['threatAssessment']> {
    const factors: string[] = [];
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Classification-based threat
    if (target.classification === 'hostile') {
      factors.push('hostile_classification');
      level = 'high';
    }

    // Speed-based threat
    if (target.movement.speed > 20) { // 20 m/s = 72 km/h
      factors.push('high_speed');
      if (level === 'low') level = 'medium';
    }

    // Priority-based threat
    if (target.priority === 'critical') {
      factors.push('critical_priority');
      level = 'critical';
    } else if (target.priority === 'high') {
      factors.push('high_priority');
      if (level !== 'critical') level = 'high';
    }

    return { level, factors };
  }

  private findFrequentAreas(positions: [number, number][]): TargetAnalytics['frequentAreas'] {
    // Simple clustering to find frequent areas
    const clusters: Array<{
      center: [number, number];
      radius: number;
      timeSpent: number;
    }> = [];

    // This is a simplified implementation
    // In practice, you'd use a proper clustering algorithm like DBSCAN
    
    return clusters;
  }

  private classifyMovementPattern(
    course: [number, number][],
    speeds: number[]
  ): TargetAnalytics['movementPattern'] {
    if (speeds.every(s => s < 0.5)) return 'stationary';
    
    // Calculate bearing changes
    const bearings: number[] = [];
    for (let i = 1; i < course.length; i++) {
      const bearing = turf.bearing(
        turf.point(course[i - 1]),
        turf.point(course[i])
      );
      bearings.push(bearing);
    }

    const bearingChanges = bearings.slice(1).map((b, i) => {
      let change = Math.abs(b - bearings[i]);
      if (change > 180) change = 360 - change;
      return change;
    });

    const avgBearingChange = bearingChanges.reduce((a, b) => a + b, 0) / bearingChanges.length;

    if (avgBearingChange < 10) return 'linear';
    if (avgBearingChange > 90) return 'random';
    
    // Check for circular pattern
    const totalBearingChange = bearingChanges.reduce((a, b) => a + b, 0);
    if (Math.abs(totalBearingChange - 360) < 45) return 'circular';
    
    return 'patrol';
  }

  private calculateBehaviorScore(course: [number, number][], speeds: number[]): number {
    // Higher score = more predictable behavior
    const speedVariance = this.calculateVariance(speeds);
    const normalizedSpeedVariance = Math.min(speedVariance / 10, 1);
    
    return Math.max(0, 1 - normalizedSpeedVariance);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.activeSessions.clear();
    this.kalmanFilters.clear();
    this.callbacks = {};
  }
}

// Simple Kalman Filter implementation for position smoothing
class KalmanFilter {
  private x: number = 0; // latitude
  private y: number = 0; // longitude
  private vx: number = 0; // velocity x
  private vy: number = 0; // velocity y
  private P: number[][] = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]; // covariance
  private Q: number = 0.1; // process noise
  private initialized: boolean = false;

  update(latitude: number, longitude: number, accuracy: number): { latitude: number; longitude: number } {
    if (!this.initialized) {
      this.x = latitude;
      this.y = longitude;
      this.initialized = true;
      return { latitude, longitude };
    }

    // Simple implementation - in practice, you'd use a proper Kalman filter library
    const R = accuracy / 10; // measurement noise based on GPS accuracy
    
    // Prediction step (simplified)
    const predictedX = this.x + this.vx;
    const predictedY = this.y + this.vy;
    
    // Update step (simplified)
    const K = this.P[0][0] / (this.P[0][0] + R); // Kalman gain
    
    this.x = predictedX + K * (latitude - predictedX);
    this.y = predictedY + K * (longitude - predictedY);
    
    // Update velocity estimates
    this.vx = (this.x - predictedX) * 0.1;
    this.vy = (this.y - predictedY) * 0.1;
    
    // Update covariance (simplified)
    this.P[0][0] = (1 - K) * this.P[0][0];
    
    return { latitude: this.x, longitude: this.y };
  }
}

// Singleton instance
let targetTrackingServiceInstance: TargetTrackingService | null = null;

export const getTargetTrackingService = (): TargetTrackingService => {
  if (!targetTrackingServiceInstance) {
    targetTrackingServiceInstance = new TargetTrackingService();
  }
  return targetTrackingServiceInstance;
};

export default TargetTrackingService;