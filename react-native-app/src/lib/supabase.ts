import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration - with fallback for testing
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://localhost:3000';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-key';

// Check if we're in test/development mode
const isTestMode = !supabaseUrl.includes('supabase.co') || supabaseUrl.includes('localhost');

// Create Supabase client with proper error handling
export const supabase = isTestMode ? 
  // Mock client for testing
  {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: '' }, error: null }),
      }),
    },
  } as any :
  // Real Supabase client
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

// Database table names for tactical mapping system
export const TABLES = {
  // User and authentication
  PROFILES: 'tactical_profiles',
  TEAMS: 'tactical_teams',
  TEAM_MEMBERS: 'tactical_team_members',
  
  // Mapping and geospatial
  MAPS: 'tactical_maps',
  MAP_LAYERS: 'tactical_map_layers',
  MAP_FEATURES: 'tactical_map_features',
  MAP_ANNOTATIONS: 'tactical_map_annotations',
  
  // Real-time collaboration
  SESSIONS: 'tactical_sessions',
  SESSION_PARTICIPANTS: 'tactical_session_participants',
  MAP_CHANGES: 'tactical_map_changes',
  USER_CURSORS: 'tactical_user_cursors',
  
  // Communication
  CHANNELS: 'tactical_channels',
  MESSAGES: 'tactical_messages',
  MESSAGE_ATTACHMENTS: 'tactical_message_attachments',
  VOICE_CALLS: 'tactical_voice_calls',
  
  // Navigation and tracking
  ROUTES: 'tactical_routes',
  WAYPOINTS: 'tactical_waypoints',
  TRACKS: 'tactical_tracks',
  TRACK_POINTS: 'tactical_track_points',
  TARGETS: 'tactical_targets',
  TARGET_POSITIONS: 'tactical_target_positions',
  
  // Geofencing and alerts
  GEOFENCES: 'tactical_geofences',
  GEOFENCE_EVENTS: 'tactical_geofence_events',
  ALERTS: 'tactical_alerts',
  
  // Emergency and safety
  EMERGENCY_BEACONS: 'tactical_emergency_beacons',
  EMERGENCY_CONTACTS: 'tactical_emergency_contacts',
  MEDICAL_INFO: 'tactical_medical_info',
  
  // 3D and media
  MODELS_3D: 'tactical_3d_models',
  PHOTO_REFERENCES: 'tactical_photo_references',
  MEDIA_FILES: 'tactical_media_files',
  
  // Plugins and extensions
  PLUGINS: 'tactical_plugins',
  PLUGIN_CONFIGS: 'tactical_plugin_configs',
  
  // Military extensions
  BALLISTICS: 'tactical_ballistics',
  FIRE_SUPPORT: 'tactical_fire_support',
  DRONE_MISSIONS: 'tactical_drone_missions',
  THREAT_ASSESSMENTS: 'tactical_threat_assessments',
} as const;

// Type definitions for database tables
export interface TacticalProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  role: 'civilian' | 'law_enforcement' | 'military' | 'admin';
  rank?: string;
  unit?: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'emergency';
  last_seen: string;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface TacticalTeam {
  id: string;
  name: string;
  description?: string;
  team_type: 'squad' | 'platoon' | 'company' | 'unit' | 'task_force';
  leader_id: string;
  status: 'active' | 'inactive' | 'deployed';
  created_at: string;
  updated_at: string;
}

export interface TacticalMap {
  id: string;
  name: string;
  description?: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  style_url?: string;
  offline_tiles?: boolean;
  created_by: string;
  team_id?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TacticalMapFeature {
  id: string;
  map_id: string;
  feature_type: 'point' | 'line' | 'polygon' | 'circle' | 'rectangle';
  geometry: any; // GeoJSON geometry
  properties: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    size?: number;
    opacity?: number;
    [key: string]: any;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TacticalSession {
  id: string;
  name: string;
  description?: string;
  map_id: string;
  host_id: string;
  status: 'active' | 'paused' | 'ended';
  max_participants?: number;
  is_private: boolean;
  password?: string;
  created_at: string;
  updated_at: string;
}

export interface TacticalMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location';
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  attachments?: string[];
  reply_to?: string;
  is_encrypted: boolean;
  created_at: string;
}

export interface TacticalTarget {
  id: string;
  name: string;
  target_type: 'person' | 'vehicle' | 'aircraft' | 'vessel' | 'structure' | 'unknown';
  description?: string;
  current_position: {
    lat: number;
    lng: number;
    altitude?: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
  status: 'active' | 'inactive' | 'lost' | 'eliminated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_by: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TacticalGeofence {
  id: string;
  name: string;
  description?: string;
  geometry: any; // GeoJSON geometry (polygon or circle)
  trigger_type: 'enter' | 'exit' | 'both';
  target_ids?: string[];
  is_active: boolean;
  created_by: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

// Utility functions for Supabase operations
export const supabaseUtils = {
  // Get current user profile
  async getCurrentProfile(): Promise<TacticalProfile | null> {
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
  },

  // Update user location
  async updateUserLocation(location: { lat: number; lng: number; accuracy?: number; heading?: number; speed?: number }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update({ 
        location,
        last_seen: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating location:', error);
      return null;
    }

    return data;
  },

  // Subscribe to real-time changes
  subscribeToMapChanges(mapId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`map-changes-${mapId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.MAP_CHANGES,
        filter: `map_id=eq.${mapId}`
      }, callback)
      .subscribe();
  },

  // Subscribe to team member locations
  subscribeToTeamLocations(teamId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`team-locations-${teamId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: TABLES.PROFILES,
        filter: `team_id=eq.${teamId}`
      }, callback)
      .subscribe();
  },

  // Upload media file to Supabase Storage
  async uploadMediaFile(file: File | Blob, bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { ...data, publicUrl };
  },

  // Get signed URL for private files
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  }
};

export default supabase;