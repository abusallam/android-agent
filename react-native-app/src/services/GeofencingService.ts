import * as turf from '@turf/turf';
import { supabase, TABLES } from '../lib/supabase';

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: 'inclusion' | 'exclusion' | 'alert' | 'restricted' | 'safe_zone';
  shape: 'circle' | 'polygon' | 'rectangle';
  geometry: {
    coordinates: [number, number][] | [number, number]; // polygon coords or circle center
    radius?: number; // for circles
  };
  properties: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    color: string;
    strokeColor: string;
    strokeWidth: number;
    fillOpacity: number;
  };
  rules: {
    triggerOnEntry: boolean;
    triggerOnExit: boolean;
    triggerOnDwell: boolean;
    dwellTime?: number; // seconds
    allowedTargetTypes?: string[];
    allowedClassifications?: string[];
    timeRestrictions?: {
      startTime: string; // HH:MM
      endTime: string; // HH:MM
      daysOfWeek: number[]; // 0-6, Sunday = 0
    };
  };
  alerts: {
    sound: boolean;
    vibration: boolean;
    notification: boolean;
    email?: string[];
    sms?: string[];
    webhook?: string;
    customMessage?: string;
  };
  metadata?: Record<string, any>;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeofenceEvent {
  id: string;
  geofenceId: string;
  targetId: string;
  eventType: 'entry' | 'exit' | 'dwell' | 'violation';
  position: [number, number];
  timestamp: Date;
  duration?: number; // for dwell events
  metadata?: Record<string, any>;
}

export interface GeofenceViolation {
  id: string;
  geofenceId: string;
  targetId: string;
  violationType: 'unauthorized_entry' | 'unauthorized_exit' | 'time_restriction' | 'target_type_restriction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  position: [number, number];
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

export interface GeofenceAnalytics {
  geofenceId: string;
  totalEvents: number;
  entryEvents: number;
  exitEvents: number;
  dwellEvents: number;
  violations: number;
  averageDwellTime: number;
  mostActiveHours: number[];
  targetActivity: Array<{
    targetId: string;
    eventCount: number;
    lastActivity: Date;
  }>;
  heatmap: Array<{
    position: [number, number];
    intensity: number;
  }>;
}

export interface GeofencingCallbacks {
  onGeofenceEntry?: (event: GeofenceEvent) => void;
  onGeofenceExit?: (event: GeofenceEvent) => void;
  onGeofenceDwell?: (event: GeofenceEvent) => void;
  onGeofenceViolation?: (violation: GeofenceViolation) => void;
  onGeofenceCreated?: (geofence: Geofence) => void;
  onGeofenceUpdated?: (geofence: Geofence) => void;
  onGeofenceDeleted?: (geofenceId: string) => void;
}

export class GeofencingService {
  private activeGeofences: Map<string, Geofence> = new Map();
  private targetStates: Map<string, Map<string, {
    isInside: boolean;
    entryTime?: Date;
    lastPosition: [number, number];
  }>> = new Map(); // targetId -> geofenceId -> state
  private callbacks: GeofencingCallbacks = {};
  private monitoringInterval: any = null;

  /**
   * Initialize geofencing service
   */
  async initialize(callbacks: GeofencingCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;
    
    // Load existing geofences
    await this.loadGeofences();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('Geofencing service initialized');
  }

  /**
   * Create a new geofence
   */
  async createGeofence(geofenceData: Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>): Promise<Geofence> {
    try {
      const geofence: Geofence = {
        ...geofenceData,
        id: `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Validate geometry
      this.validateGeofenceGeometry(geofence);

      // Save to database
      await supabase
        .from(TABLES.GEOFENCES)
        .insert({
          id: geofence.id,
          name: geofence.name,
          description: geofence.description,
          geofence_type: geofence.type,
          shape: geofence.shape,
          geometry: geofence.shape === 'circle' 
            ? `POINT(${(geofence.geometry.coordinates as [number, number])[0]} ${(geofence.geometry.coordinates as [number, number])[1]})`
            : `POLYGON((${(geofence.geometry.coordinates as [number, number][]).map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`,
          radius: geofence.geometry.radius,
          properties: JSON.stringify(geofence.properties),
          rules: JSON.stringify(geofence.rules),
          alerts: JSON.stringify(geofence.alerts),
          is_active: geofence.isActive,
          created_by: geofence.createdBy,
          metadata: JSON.stringify(geofence.metadata || {}),
        });

      // Add to active geofences
      this.activeGeofences.set(geofence.id, geofence);

      this.callbacks.onGeofenceCreated?.(geofence);

      return geofence;
    } catch (error) {
      console.error('Error creating geofence:', error);
      throw error;
    }
  }

  /**
   * Update an existing geofence
   */
  async updateGeofence(geofenceId: string, updates: Partial<Geofence>): Promise<Geofence> {
    try {
      const existingGeofence = this.activeGeofences.get(geofenceId);
      if (!existingGeofence) {
        throw new Error('Geofence not found');
      }

      const updatedGeofence: Geofence = {
        ...existingGeofence,
        ...updates,
        updatedAt: new Date(),
      };

      // Validate geometry if updated
      if (updates.geometry || updates.shape) {
        this.validateGeofenceGeometry(updatedGeofence);
      }

      // Update database
      const updateData: any = {
        name: updatedGeofence.name,
        description: updatedGeofence.description,
        geofence_type: updatedGeofence.type,
        shape: updatedGeofence.shape,
        properties: JSON.stringify(updatedGeofence.properties),
        rules: JSON.stringify(updatedGeofence.rules),
        alerts: JSON.stringify(updatedGeofence.alerts),
        is_active: updatedGeofence.isActive,
        metadata: JSON.stringify(updatedGeofence.metadata || {}),
        updated_at: updatedGeofence.updatedAt.toISOString(),
      };

      if (updates.geometry) {
        updateData.geometry = updatedGeofence.shape === 'circle' 
          ? `POINT(${(updatedGeofence.geometry.coordinates as [number, number])[0]} ${(updatedGeofence.geometry.coordinates as [number, number])[1]})`
          : `POLYGON((${(updatedGeofence.geometry.coordinates as [number, number][]).map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
        updateData.radius = updatedGeofence.geometry.radius;
      }

      await supabase
        .from(TABLES.GEOFENCES)
        .update(updateData)
        .eq('id', geofenceId);

      // Update in memory
      this.activeGeofences.set(geofenceId, updatedGeofence);

      this.callbacks.onGeofenceUpdated?.(updatedGeofence);

      return updatedGeofence;
    } catch (error) {
      console.error('Error updating geofence:', error);
      throw error;
    }
  }

  /**
   * Delete a geofence
   */
  async deleteGeofence(geofenceId: string): Promise<void> {
    try {
      // Remove from database
      await supabase
        .from(TABLES.GEOFENCES)
        .delete()
        .eq('id', geofenceId);

      // Remove from memory
      this.activeGeofences.delete(geofenceId);
      
      // Clean up target states
      for (const targetStates of this.targetStates.values()) {
        targetStates.delete(geofenceId);
      }

      this.callbacks.onGeofenceDeleted?.(geofenceId);
    } catch (error) {
      console.error('Error deleting geofence:', error);
      throw error;
    }
  }

  /**
   * Get all active geofences
   */
  getActiveGeofences(): Geofence[] {
    return Array.from(this.activeGeofences.values()).filter(g => g.isActive);
  }

  /**
   * Get geofences that contain a point
   */
  getGeofencesContainingPoint(point: [number, number]): Geofence[] {
    return this.getActiveGeofences().filter(geofence => 
      this.isPointInGeofence(point, geofence)
    );
  }

  /**
   * Check if a target is currently inside any geofences
   */
  getTargetGeofenceStatus(targetId: string): Array<{
    geofence: Geofence;
    isInside: boolean;
    entryTime?: Date;
  }> {
    const targetStates = this.targetStates.get(targetId);
    if (!targetStates) return [];

    const status: Array<{
      geofence: Geofence;
      isInside: boolean;
      entryTime?: Date;
    }> = [];

    for (const [geofenceId, state] of targetStates.entries()) {
      const geofence = this.activeGeofences.get(geofenceId);
      if (geofence) {
        status.push({
          geofence,
          isInside: state.isInside,
          entryTime: state.entryTime,
        });
      }
    }

    return status;
  }

  /**
   * Process target position update for geofencing
   */
  async processTargetUpdate(
    targetId: string,
    position: [number, number],
    targetType?: string,
    classification?: string
  ): Promise<void> {
    try {
      if (!this.targetStates.has(targetId)) {
        this.targetStates.set(targetId, new Map());
      }

      const targetStates = this.targetStates.get(targetId)!;

      for (const geofence of this.getActiveGeofences()) {
        const currentState = targetStates.get(geofence.id) || {
          isInside: false,
          lastPosition: position,
        };

        const wasInside = currentState.isInside;
        const isNowInside = this.isPointInGeofence(position, geofence);

        // Check if target is allowed in this geofence
        const isAllowed = this.isTargetAllowed(geofence, targetType, classification);

        // Update state
        const newState = {
          isInside: isNowInside,
          lastPosition: position,
          entryTime: isNowInside && !wasInside ? new Date() : currentState.entryTime,
        };
        targetStates.set(geofence.id, newState);

        // Process events
        if (!wasInside && isNowInside) {
          // Entry event
          await this.handleGeofenceEntry(geofence, targetId, position, isAllowed);
        } else if (wasInside && !isNowInside) {
          // Exit event
          await this.handleGeofenceExit(geofence, targetId, position, isAllowed);
        } else if (wasInside && isNowInside && currentState.entryTime) {
          // Check for dwell event
          const dwellTime = (Date.now() - currentState.entryTime.getTime()) / 1000;
          if (geofence.rules.triggerOnDwell && 
              geofence.rules.dwellTime && 
              dwellTime >= geofence.rules.dwellTime) {
            await this.handleGeofenceDwell(geofence, targetId, position, dwellTime);
          }
        }
      }
    } catch (error) {
      console.error('Error processing target update:', error);
    }
  }

  /**
   * Get geofence analytics
   */
  async getGeofenceAnalytics(
    geofenceId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<GeofenceAnalytics> {
    try {
      let query = supabase
        .from(TABLES.GEOFENCE_EVENTS)
        .select('*')
        .eq('geofence_id', geofenceId);

      if (timeRange) {
        query = query
          .gte('timestamp', timeRange.start.toISOString())
          .lte('timestamp', timeRange.end.toISOString());
      }

      const { data: events, error } = await query;

      if (error) throw error;

      const analytics: GeofenceAnalytics = {
        geofenceId,
        totalEvents: events?.length || 0,
        entryEvents: events?.filter(e => e.event_type === 'entry').length || 0,
        exitEvents: events?.filter(e => e.event_type === 'exit').length || 0,
        dwellEvents: events?.filter(e => e.event_type === 'dwell').length || 0,
        violations: 0, // Would need to query violations table
        averageDwellTime: 0,
        mostActiveHours: [],
        targetActivity: [],
        heatmap: [],
      };

      // Calculate average dwell time
      const dwellEvents = events?.filter(e => e.event_type === 'dwell' && e.duration) || [];
      if (dwellEvents.length > 0) {
        analytics.averageDwellTime = dwellEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / dwellEvents.length;
      }

      // Calculate most active hours
      const hourCounts = new Array(24).fill(0);
      events?.forEach(event => {
        const hour = new Date(event.timestamp).getHours();
        hourCounts[hour]++;
      });
      analytics.mostActiveHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => item.hour);

      // Calculate target activity
      const targetCounts = new Map<string, { count: number; lastActivity: Date }>();
      events?.forEach(event => {
        const existing = targetCounts.get(event.target_id) || { count: 0, lastActivity: new Date(0) };
        targetCounts.set(event.target_id, {
          count: existing.count + 1,
          lastActivity: new Date(Math.max(existing.lastActivity.getTime(), new Date(event.timestamp).getTime())),
        });
      });

      analytics.targetActivity = Array.from(targetCounts.entries()).map(([targetId, data]) => ({
        targetId,
        eventCount: data.count,
        lastActivity: data.lastActivity,
      }));

      return analytics;
    } catch (error) {
      console.error('Error getting geofence analytics:', error);
      throw error;
    }
  }

  /**
   * Create a circular geofence
   */
  async createCircularGeofence(
    name: string,
    center: [number, number],
    radius: number,
    options: Partial<Omit<Geofence, 'id' | 'shape' | 'geometry' | 'createdAt' | 'updatedAt'>>
  ): Promise<Geofence> {
    return this.createGeofence({
      name,
      shape: 'circle',
      geometry: {
        coordinates: center,
        radius,
      },
      type: 'alert',
      properties: {
        priority: 'medium',
        color: '#3B82F6',
        strokeColor: '#1E40AF',
        strokeWidth: 2,
        fillOpacity: 0.2,
      },
      rules: {
        triggerOnEntry: true,
        triggerOnExit: true,
        triggerOnDwell: false,
      },
      alerts: {
        sound: true,
        vibration: true,
        notification: true,
      },
      isActive: true,
      createdBy: 'system',
      ...options,
    });
  }

  /**
   * Create a rectangular geofence
   */
  async createRectangularGeofence(
    name: string,
    bounds: { north: number; south: number; east: number; west: number },
    options: Partial<Omit<Geofence, 'id' | 'shape' | 'geometry' | 'createdAt' | 'updatedAt'>>
  ): Promise<Geofence> {
    const coordinates: [number, number][] = [
      [bounds.west, bounds.south],
      [bounds.east, bounds.south],
      [bounds.east, bounds.north],
      [bounds.west, bounds.north],
      [bounds.west, bounds.south], // Close the polygon
    ];

    return this.createGeofence({
      name,
      shape: 'rectangle',
      geometry: {
        coordinates,
      },
      type: 'alert',
      properties: {
        priority: 'medium',
        color: '#10B981',
        strokeColor: '#047857',
        strokeWidth: 2,
        fillOpacity: 0.2,
      },
      rules: {
        triggerOnEntry: true,
        triggerOnExit: true,
        triggerOnDwell: false,
      },
      alerts: {
        sound: true,
        vibration: true,
        notification: true,
      },
      isActive: true,
      createdBy: 'system',
      ...options,
    });
  }

  // Private helper methods
  private async loadGeofences(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.GEOFENCES)
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const record of data || []) {
        const geofence = this.mapDatabaseRecordToGeofence(record);
        this.activeGeofences.set(geofence.id, geofence);
      }

      console.log(`Loaded ${this.activeGeofences.size} active geofences`);
    } catch (error) {
      console.error('Error loading geofences:', error);
    }
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performPeriodicChecks();
    }, 10000); // 10 seconds
  }

  private async performPeriodicChecks(): Promise<void> {
    // Check for time-based restrictions
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    for (const geofence of this.activeGeofences.values()) {
      if (geofence.rules.timeRestrictions) {
        const { startTime, endTime, daysOfWeek } = geofence.rules.timeRestrictions;
        
        const isTimeAllowed = this.isTimeInRange(currentTime, startTime, endTime);
        const isDayAllowed = daysOfWeek.includes(currentDay);
        
        if (!isTimeAllowed || !isDayAllowed) {
          // Check for violations during restricted time
          await this.checkTimeRestrictionViolations(geofence);
        }
      }
    }
  }

  private validateGeofenceGeometry(geofence: Geofence): void {
    if (geofence.shape === 'circle') {
      if (!Array.isArray(geofence.geometry.coordinates) || 
          geofence.geometry.coordinates.length !== 2 ||
          !geofence.geometry.radius ||
          geofence.geometry.radius <= 0) {
        throw new Error('Invalid circle geometry');
      }
    } else if (geofence.shape === 'polygon' || geofence.shape === 'rectangle') {
      if (!Array.isArray(geofence.geometry.coordinates) ||
          geofence.geometry.coordinates.length < 3) {
        throw new Error('Invalid polygon geometry');
      }
    }
  }

  private isPointInGeofence(point: [number, number], geofence: Geofence): boolean {
    try {
      if (geofence.shape === 'circle') {
        const center = geofence.geometry.coordinates as [number, number];
        const distance = turf.distance(
          turf.point(point),
          turf.point(center),
          { units: 'meters' }
        );
        return distance <= (geofence.geometry.radius || 0);
      } else {
        const polygon = turf.polygon([geofence.geometry.coordinates as [number, number][]]);
        return turf.booleanPointInPolygon(turf.point(point), polygon);
      }
    } catch (error) {
      console.error('Error checking point in geofence:', error);
      return false;
    }
  }

  private isTargetAllowed(
    geofence: Geofence,
    targetType?: string,
    classification?: string
  ): boolean {
    const { allowedTargetTypes, allowedClassifications } = geofence.rules;

    if (allowedTargetTypes && targetType && !allowedTargetTypes.includes(targetType)) {
      return false;
    }

    if (allowedClassifications && classification && !allowedClassifications.includes(classification)) {
      return false;
    }

    return true;
  }

  private async handleGeofenceEntry(
    geofence: Geofence,
    targetId: string,
    position: [number, number],
    isAllowed: boolean
  ): Promise<void> {
    if (!geofence.rules.triggerOnEntry) return;

    const event: GeofenceEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      geofenceId: geofence.id,
      targetId,
      eventType: 'entry',
      position,
      timestamp: new Date(),
    };

    // Save event
    await this.saveGeofenceEvent(event);

    // Check for violations
    if (!isAllowed) {
      await this.createViolation(geofence, targetId, position, 'unauthorized_entry');
    }

    // Trigger alerts
    await this.triggerAlerts(geofence, event);

    this.callbacks.onGeofenceEntry?.(event);
  }

  private async handleGeofenceExit(
    geofence: Geofence,
    targetId: string,
    position: [number, number],
    isAllowed: boolean
  ): Promise<void> {
    if (!geofence.rules.triggerOnExit) return;

    const event: GeofenceEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      geofenceId: geofence.id,
      targetId,
      eventType: 'exit',
      position,
      timestamp: new Date(),
    };

    // Save event
    await this.saveGeofenceEvent(event);

    // Check for violations (e.g., leaving a safe zone)
    if (geofence.type === 'safe_zone' && !isAllowed) {
      await this.createViolation(geofence, targetId, position, 'unauthorized_exit');
    }

    // Trigger alerts
    await this.triggerAlerts(geofence, event);

    this.callbacks.onGeofenceExit?.(event);
  }

  private async handleGeofenceDwell(
    geofence: Geofence,
    targetId: string,
    position: [number, number],
    dwellTime: number
  ): Promise<void> {
    const event: GeofenceEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      geofenceId: geofence.id,
      targetId,
      eventType: 'dwell',
      position,
      timestamp: new Date(),
      duration: dwellTime,
    };

    // Save event
    await this.saveGeofenceEvent(event);

    // Trigger alerts
    await this.triggerAlerts(geofence, event);

    this.callbacks.onGeofenceDwell?.(event);
  }

  private async saveGeofenceEvent(event: GeofenceEvent): Promise<void> {
    try {
      await supabase
        .from(TABLES.GEOFENCE_EVENTS)
        .insert({
          id: event.id,
          geofence_id: event.geofenceId,
          target_id: event.targetId,
          event_type: event.eventType,
          position: `POINT(${event.position[0]} ${event.position[1]})`,
          timestamp: event.timestamp.toISOString(),
          duration: event.duration,
          metadata: JSON.stringify(event.metadata || {}),
        });
    } catch (error) {
      console.error('Error saving geofence event:', error);
    }
  }

  private async createViolation(
    geofence: Geofence,
    targetId: string,
    position: [number, number],
    violationType: GeofenceViolation['violationType']
  ): Promise<void> {
    try {
      const violation: GeofenceViolation = {
        id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        geofenceId: geofence.id,
        targetId,
        violationType,
        severity: geofence.properties.priority as GeofenceViolation['severity'],
        position,
        timestamp: new Date(),
        resolved: false,
      };

      await supabase
        .from('tactical_geofence_violations')
        .insert({
          id: violation.id,
          geofence_id: violation.geofenceId,
          target_id: violation.targetId,
          violation_type: violation.violationType,
          severity: violation.severity,
          position: `POINT(${violation.position[0]} ${violation.position[1]})`,
          timestamp: violation.timestamp.toISOString(),
          resolved: violation.resolved,
        });

      this.callbacks.onGeofenceViolation?.(violation);
    } catch (error) {
      console.error('Error creating violation:', error);
    }
  }

  private async triggerAlerts(geofence: Geofence, event: GeofenceEvent): Promise<void> {
    const { alerts } = geofence;

    // Trigger various alert types based on configuration
    if (alerts.notification) {
      // Would trigger push notification
      console.log(`Geofence alert: ${event.eventType} in ${geofence.name}`);
    }

    if (alerts.webhook) {
      // Would send webhook
      console.log(`Webhook alert for geofence ${geofence.name}`);
    }

    // Additional alert mechanisms would be implemented here
  }

  private async checkTimeRestrictionViolations(geofence: Geofence): Promise<void> {
    // Check if any targets are currently in restricted geofences during restricted time
    for (const [targetId, targetStates] of this.targetStates.entries()) {
      const state = targetStates.get(geofence.id);
      if (state && state.isInside) {
        await this.createViolation(
          geofence,
          targetId,
          state.lastPosition,
          'time_restriction'
        );
      }
    }
  }

  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Crosses midnight
      return current >= start || current <= end;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private mapDatabaseRecordToGeofence(record: any): Geofence {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      type: record.geofence_type,
      shape: record.shape,
      geometry: {
        coordinates: record.shape === 'circle' 
          ? [record.longitude, record.latitude]
          : JSON.parse(record.coordinates || '[]'),
        radius: record.radius,
      },
      properties: JSON.parse(record.properties || '{}'),
      rules: JSON.parse(record.rules || '{}'),
      alerts: JSON.parse(record.alerts || '{}'),
      metadata: JSON.parse(record.metadata || '{}'),
      isActive: record.is_active,
      createdBy: record.created_by,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.activeGeofences.clear();
    this.targetStates.clear();
    this.callbacks = {};
  }
}

// Singleton instance
let geofencingServiceInstance: GeofencingService | null = null;

export const getGeofencingService = (): GeofencingService => {
  if (!geofencingServiceInstance) {
    geofencingServiceInstance = new GeofencingService();
  }
  return geofencingServiceInstance;
};

export default GeofencingService;