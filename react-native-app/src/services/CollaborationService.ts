import { supabase, TABLES, TacticalSession, TacticalMapFeature } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface MapChange {
  id: string;
  sessionId: string;
  mapId: string;
  changeType: 'feature_added' | 'feature_updated' | 'feature_deleted' | 'cursor_moved';
  featureId?: string;
  changeData: any;
  createdBy: string;
  timestamp: string;
}

export interface UserCursor {
  userId: string;
  username: string;
  position: [number, number];
  color: string;
  timestamp: string;
}

export interface CollaborationCallbacks {
  onMapChange?: (change: MapChange) => void;
  onUserJoined?: (user: any) => void;
  onUserLeft?: (userId: string) => void;
  onCursorUpdate?: (cursor: UserCursor) => void;
  onSessionUpdate?: (session: TacticalSession) => void;
}

export class CollaborationService {
  private sessionId: string | null = null;
  private mapId: string | null = null;
  private userId: string | null = null;
  private channels: RealtimeChannel[] = [];
  private callbacks: CollaborationCallbacks = {};
  private userCursors: Map<string, UserCursor> = new Map();
  private isConnected = false;

  constructor() {
    this.initializeUser();
  }

  private async initializeUser() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
  }

  // Join a collaboration session
  async joinSession(sessionId: string, mapId: string, callbacks: CollaborationCallbacks = {}) {
    try {
      this.sessionId = sessionId;
      this.mapId = mapId;
      this.callbacks = callbacks;

      // Get current user profile
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Add user to session participants
      await this.addSessionParticipant(sessionId, profile.id);

      // Set up real-time subscriptions
      await this.setupRealtimeChannels();

      this.isConnected = true;
      console.log(`Joined collaboration session: ${sessionId}`);

      return true;
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  }

  // Leave the current session
  async leaveSession() {
    try {
      if (!this.sessionId || !this.userId) return;

      // Remove user from session participants
      await supabase
        .from(TABLES.SESSION_PARTICIPANTS)
        .update({ 
          left_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('session_id', this.sessionId)
        .eq('profile_id', this.userId);

      // Clean up subscriptions
      this.cleanupChannels();

      // Notify other users
      this.callbacks.onUserLeft?.(this.userId);

      this.sessionId = null;
      this.mapId = null;
      this.isConnected = false;
      this.userCursors.clear();

      console.log('Left collaboration session');
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }

  // Broadcast a map change to other users
  async broadcastMapChange(changeType: MapChange['changeType'], changeData: any, featureId?: string) {
    if (!this.sessionId || !this.mapId || !this.userId) {
      throw new Error('Not connected to a session');
    }

    try {
      const change: Omit<MapChange, 'id' | 'timestamp'> = {
        sessionId: this.sessionId,
        mapId: this.mapId,
        changeType,
        featureId,
        changeData,
        createdBy: this.userId
      };

      const { data, error } = await supabase
        .from(TABLES.MAP_CHANGES)
        .insert(change)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error broadcasting map change:', error);
      throw error;
    }
  }

  // Update user cursor position
  async updateCursor(position: [number, number], additionalData: any = {}) {
    if (!this.sessionId || !this.userId) return;

    try {
      const cursorData = {
        position,
        ...additionalData,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from(TABLES.USER_CURSORS)
        .upsert({
          session_id: this.sessionId,
          profile_id: this.userId,
          position: `POINT(${position[0]} ${position[1]})`,
          cursor_data: cursorData,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }

  // Get all active session participants
  async getSessionParticipants(): Promise<any[]> {
    if (!this.sessionId) return [];

    try {
      const { data, error } = await supabase
        .from(TABLES.SESSION_PARTICIPANTS)
        .select(`
          *,
          profile:tactical_profiles(*)
        `)
        .eq('session_id', this.sessionId)
        .eq('is_active', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting session participants:', error);
      return [];
    }
  }

  // Get session information
  async getSession(): Promise<TacticalSession | null> {
    if (!this.sessionId) return null;

    try {
      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .eq('id', this.sessionId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Create a new collaboration session
  async createSession(name: string, mapId: string, options: {
    description?: string;
    maxParticipants?: number;
    isPrivate?: boolean;
    password?: string;
  } = {}): Promise<TacticalSession> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .insert({
          name,
          description: options.description,
          map_id: mapId,
          host_id: profile.id,
          max_participants: options.maxParticipants || 50,
          is_private: options.isPrivate || false,
          password: options.password,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Apply operational transformation for conflict resolution
  private applyOperationalTransformation(localChange: any, remoteChange: any): any {
    // Implement operational transformation logic
    // This is a simplified version - real OT is more complex
    
    if (localChange.timestamp > remoteChange.timestamp) {
      // Local change is newer, apply remote change first
      return this.transformChange(localChange, remoteChange);
    } else {
      // Remote change is newer, apply as-is
      return remoteChange;
    }
  }

  private transformChange(change: any, againstChange: any): any {
    // Transform change based on the type and conflict resolution rules
    switch (change.changeType) {
      case 'feature_updated':
        // Merge properties, with remote taking precedence for conflicts
        return {
          ...change,
          changeData: {
            ...change.changeData,
            properties: {
              ...change.changeData.properties,
              ...againstChange.changeData.properties
            }
          }
        };
      
      case 'feature_deleted':
        // If remote deleted the feature, ignore local updates
        if (againstChange.changeType === 'feature_deleted') {
          return againstChange;
        }
        return change;
      
      default:
        return change;
    }
  }

  // Private helper methods
  private async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  private async addSessionParticipant(sessionId: string, profileId: string) {
    const { error } = await supabase
      .from(TABLES.SESSION_PARTICIPANTS)
      .upsert({
        session_id: sessionId,
        profile_id: profileId,
        joined_at: new Date().toISOString(),
        is_active: true
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      throw error;
    }
  }

  private async setupRealtimeChannels() {
    if (!this.sessionId || !this.mapId) return;

    // Channel for map changes
    const mapChangesChannel = supabase
      .channel(`map-changes-${this.sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.MAP_CHANGES,
        filter: `session_id=eq.${this.sessionId}`
      }, (payload) => {
        this.handleMapChangeEvent(payload);
      })
      .subscribe();

    // Channel for user cursors
    const cursorsChannel = supabase
      .channel(`cursors-${this.sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.USER_CURSORS,
        filter: `session_id=eq.${this.sessionId}`
      }, (payload) => {
        this.handleCursorEvent(payload);
      })
      .subscribe();

    // Channel for session participants
    const participantsChannel = supabase
      .channel(`participants-${this.sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.SESSION_PARTICIPANTS,
        filter: `session_id=eq.${this.sessionId}`
      }, (payload) => {
        this.handleParticipantEvent(payload);
      })
      .subscribe();

    this.channels = [mapChangesChannel, cursorsChannel, participantsChannel];
  }

  private handleMapChangeEvent(payload: any) {
    const { new: newRecord } = payload;
    
    // Don't process our own changes
    if (newRecord.created_by === this.userId) return;

    const change: MapChange = {
      id: newRecord.id,
      sessionId: newRecord.session_id,
      mapId: newRecord.map_id,
      changeType: newRecord.change_type,
      featureId: newRecord.feature_id,
      changeData: newRecord.change_data,
      createdBy: newRecord.created_by,
      timestamp: newRecord.created_at
    };

    this.callbacks.onMapChange?.(change);
  }

  private handleCursorEvent(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'DELETE') {
      this.userCursors.delete(oldRecord.profile_id);
      return;
    }

    // Don't process our own cursor
    if (newRecord.profile_id === this.userId) return;

    const cursor: UserCursor = {
      userId: newRecord.profile_id,
      username: 'User', // Would need to join with profiles table
      position: [
        newRecord.position.coordinates[0],
        newRecord.position.coordinates[1]
      ],
      color: newRecord.cursor_data.color || '#007AFF',
      timestamp: newRecord.updated_at
    };

    this.userCursors.set(cursor.userId, cursor);
    this.callbacks.onCursorUpdate?.(cursor);
  }

  private handleParticipantEvent(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord.profile_id !== this.userId) {
          this.callbacks.onUserJoined?.(newRecord);
        }
        break;
      case 'UPDATE':
        if (!newRecord.is_active && oldRecord.is_active) {
          this.callbacks.onUserLeft?.(newRecord.profile_id);
        }
        break;
    }
  }

  private cleanupChannels() {
    this.channels.forEach(channel => {
      channel.unsubscribe();
    });
    this.channels = [];
  }

  // Public getters
  get connected(): boolean {
    return this.isConnected;
  }

  get currentSessionId(): string | null {
    return this.sessionId;
  }

  get currentMapId(): string | null {
    return this.mapId;
  }

  get activeCursors(): UserCursor[] {
    return Array.from(this.userCursors.values());
  }
}

export default CollaborationService;