-- Tactical Mapping System Database Schema for Supabase
-- This creates all necessary tables with PostGIS support for geospatial data

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('civilian', 'law_enforcement', 'military', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'emergency');
CREATE TYPE team_type AS ENUM ('squad', 'platoon', 'company', 'unit', 'task_force');
CREATE TYPE feature_type AS ENUM ('point', 'line', 'polygon', 'circle', 'rectangle');
CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'audio', 'file', 'location');
CREATE TYPE target_type AS ENUM ('person', 'vehicle', 'aircraft', 'vessel', 'structure', 'unknown');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE session_status AS ENUM ('active', 'paused', 'ended');
CREATE TYPE trigger_type AS ENUM ('enter', 'exit', 'both');

-- User profiles table
CREATE TABLE tactical_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'civilian',
    rank VARCHAR(50),
    unit VARCHAR(100),
    avatar_url TEXT,
    status user_status DEFAULT 'active',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location GEOGRAPHY(POINT, 4326),
    location_accuracy FLOAT,
    heading FLOAT,
    speed FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE tactical_teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    team_type team_type DEFAULT 'squad',
    leader_id UUID REFERENCES tactical_profiles(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members junction table
CREATE TABLE tactical_team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES tactical_teams(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES tactical_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, profile_id)
);

-- Maps table
CREATE TABLE tactical_maps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    bounds GEOGRAPHY(POLYGON, 4326),
    center GEOGRAPHY(POINT, 4326) NOT NULL,
    zoom INTEGER DEFAULT 10,
    style_url TEXT,
    offline_tiles BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES tactical_profiles(id),
    team_id UUID REFERENCES tactical_teams(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Map layers table
CREATE TABLE tactical_map_layers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    map_id UUID REFERENCES tactical_maps(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    layer_type VARCHAR(50) NOT NULL,
    source_url TEXT,
    style_config JSONB,
    is_visible BOOLEAN DEFAULT TRUE,
    opacity FLOAT DEFAULT 1.0,
    z_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Map features table (points, lines, polygons, etc.)
CREATE TABLE tactical_map_features (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    map_id UUID REFERENCES tactical_maps(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES tactical_map_layers(id) ON DELETE CASCADE,
    feature_type feature_type NOT NULL,
    geometry GEOGRAPHY NOT NULL,
    properties JSONB DEFAULT '{}',
    style JSONB DEFAULT '{}',
    created_by UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Map annotations table
CREATE TABLE tactical_map_annotations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    map_id UUID REFERENCES tactical_maps(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES tactical_map_features(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position GEOGRAPHY(POINT, 4326) NOT NULL,
    style JSONB DEFAULT '{}',
    created_by UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration sessions table
CREATE TABLE tactical_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    map_id UUID REFERENCES tactical_maps(id) ON DELETE CASCADE,
    host_id UUID REFERENCES tactical_profiles(id),
    status session_status DEFAULT 'active',
    max_participants INTEGER DEFAULT 50,
    is_private BOOLEAN DEFAULT FALSE,
    password VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session participants table
CREATE TABLE tactical_session_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES tactical_sessions(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES tactical_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(session_id, profile_id)
);

-- Map changes for real-time collaboration
CREATE TABLE tactical_map_changes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES tactical_sessions(id) ON DELETE CASCADE,
    map_id UUID REFERENCES tactical_maps(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL,
    feature_id UUID,
    change_data JSONB NOT NULL,
    created_by UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User cursors for real-time collaboration
CREATE TABLE tactical_user_cursors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES tactical_sessions(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES tactical_profiles(id) ON DELETE CASCADE,
    position GEOGRAPHY(POINT, 4326),
    cursor_data JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, profile_id)
);

-- Communication channels table
CREATE TABLE tactical_channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    channel_type VARCHAR(50) DEFAULT 'text',
    team_id UUID REFERENCES tactical_teams(id),
    session_id UUID REFERENCES tactical_sessions(id),
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE tactical_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID REFERENCES tactical_channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES tactical_profiles(id),
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    location GEOGRAPHY(POINT, 4326),
    location_accuracy FLOAT,
    reply_to UUID REFERENCES tactical_messages(id),
    is_encrypted BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message attachments table
CREATE TABLE tactical_message_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES tactical_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message reactions table
CREATE TABLE tactical_message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES tactical_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tactical_profiles(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Message threads table
CREATE TABLE tactical_message_threads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_message_id UUID REFERENCES tactical_messages(id) ON DELETE CASCADE,
    thread_name VARCHAR(255),
    created_by UUID REFERENCES tactical_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message search index
CREATE TABLE tactical_message_search (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES tactical_messages(id) ON DELETE CASCADE,
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create full-text search index
CREATE INDEX tactical_message_search_idx ON tactical_message_search USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tactical_message_search (message_id, search_vector)
    VALUES (NEW.id, to_tsvector('english', COALESCE(NEW.content, '')))
    ON CONFLICT (message_id) DO UPDATE SET
        search_vector = to_tsvector('english', COALESCE(NEW.content, '')),
        created_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
CREATE TRIGGER update_message_search_trigger
    AFTER INSERT OR UPDATE ON tactical_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_search_vector();

-- Elevation data table for terrain analysis
CREATE TABLE tactical_elevation_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    elevation DECIMAL(8, 3) NOT NULL,
    source VARCHAR(50) DEFAULT 'external_api',
    accuracy DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(latitude, longitude)
);

-- Create spatial index for elevation data
CREATE INDEX tactical_elevation_spatial_idx ON tactical_elevation_data USING GIST (
    ST_Point(longitude, latitude)
);

-- Tracking sessions table
CREATE TABLE tactical_tracking_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    bounds JSONB,
    filters JSONB DEFAULT '{}',
    created_by UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proximity alerts table
CREATE TABLE tactical_proximity_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES tactical_tracking_sessions(id) ON DELETE CASCADE,
    target1_id UUID REFERENCES tactical_targets(id) ON DELETE CASCADE,
    target2_id UUID REFERENCES tactical_targets(id) ON DELETE CASCADE,
    alert_distance DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geofence violations table
CREATE TABLE tactical_geofence_violations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    geofence_id UUID REFERENCES tactical_geofences(id) ON DELETE CASCADE,
    target_id UUID REFERENCES tactical_targets(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    position GEOMETRY(POINT, 4326) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES tactical_profiles(id),
    notes TEXT
);

-- Voice calls table
CREATE TABLE tactical_voice_calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID REFERENCES tactical_channels(id),
    initiator_id UUID REFERENCES tactical_profiles(id),
    participants JSONB DEFAULT '[]',
    call_type VARCHAR(50) DEFAULT 'voice',
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Routes table
CREATE TABLE tactical_routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    route_type VARCHAR(50) DEFAULT 'walking',
    geometry GEOGRAPHY(LINESTRING, 4326) NOT NULL,
    distance FLOAT,
    duration INTEGER,
    elevation_gain FLOAT,
    elevation_loss FLOAT,
    created_by UUID REFERENCES tactical_profiles(id),
    team_id UUID REFERENCES tactical_teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waypoints table
CREATE TABLE tactical_waypoints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    route_id UUID REFERENCES tactical_routes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    position GEOGRAPHY(POINT, 4326) NOT NULL,
    elevation FLOAT,
    waypoint_order INTEGER NOT NULL,
    waypoint_type VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracks table (for recording movement)
CREATE TABLE tactical_tracks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    profile_id UUID REFERENCES tactical_profiles(id),
    target_id UUID,
    track_type VARCHAR(50) DEFAULT 'gps',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    total_distance FLOAT,
    total_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track points table
CREATE TABLE tactical_track_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    track_id UUID REFERENCES tactical_tracks(id) ON DELETE CASCADE,
    position GEOGRAPHY(POINT, 4326) NOT NULL,
    elevation FLOAT,
    accuracy FLOAT,
    heading FLOAT,
    speed FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Targets table
CREATE TABLE tactical_targets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    target_type target_type DEFAULT 'unknown',
    description TEXT,
    current_position GEOGRAPHY(POINT, 4326) NOT NULL,
    altitude FLOAT,
    accuracy FLOAT,
    heading FLOAT,
    speed FLOAT,
    status VARCHAR(50) DEFAULT 'active',
    priority priority_level DEFAULT 'medium',
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES tactical_profiles(id),
    team_id UUID REFERENCES tactical_teams(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Target position history
CREATE TABLE tactical_target_positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    target_id UUID REFERENCES tactical_targets(id) ON DELETE CASCADE,
    position GEOGRAPHY(POINT, 4326) NOT NULL,
    altitude FLOAT,
    accuracy FLOAT,
    heading FLOAT,
    speed FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geofences table
CREATE TABLE tactical_geofences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    geometry GEOGRAPHY NOT NULL,
    trigger_type trigger_type DEFAULT 'both',
    target_ids JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES tactical_profiles(id),
    team_id UUID REFERENCES tactical_teams(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geofence events table
CREATE TABLE tactical_geofence_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    geofence_id UUID REFERENCES tactical_geofences(id) ON DELETE CASCADE,
    target_id UUID REFERENCES tactical_targets(id),
    profile_id UUID REFERENCES tactical_profiles(id),
    event_type VARCHAR(50) NOT NULL,
    position GEOGRAPHY(POINT, 4326) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Alerts table
CREATE TABLE tactical_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority priority_level DEFAULT 'medium',
    source_id UUID,
    source_type VARCHAR(50),
    location GEOGRAPHY(POINT, 4326),
    is_read BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    recipient_id UUID REFERENCES tactical_profiles(id),
    team_id UUID REFERENCES tactical_teams(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Emergency beacons table
CREATE TABLE tactical_emergency_beacons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES tactical_profiles(id),
    beacon_type VARCHAR(50) DEFAULT 'panic',
    status VARCHAR(50) DEFAULT 'active',
    position GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy FLOAT,
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES tactical_profiles(id)
);

-- Emergency contacts table
CREATE TABLE tactical_emergency_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES tactical_profiles(id),
    contact_name VARCHAR(100) NOT NULL,
    contact_type VARCHAR(50) DEFAULT 'personal',
    phone_number VARCHAR(20),
    email VARCHAR(100),
    relationship VARCHAR(50),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical information table
CREATE TABLE tactical_medical_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES tactical_profiles(id),
    blood_type VARCHAR(10),
    allergies TEXT,
    medications TEXT,
    medical_conditions TEXT,
    emergency_notes TEXT,
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3D models table
CREATE TABLE tactical_3d_models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    model_type VARCHAR(50) DEFAULT 'obj',
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    position GEOGRAPHY(POINT, 4326),
    rotation JSONB DEFAULT '{}',
    scale JSONB DEFAULT '{}',
    created_by UUID REFERENCES tactical_profiles(id),
    team_id UUID REFERENCES tactical_teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo references table (for georeferencing)
CREATE TABLE tactical_photo_references (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_path TEXT NOT NULL,
    thumbnail_path TEXT,
    original_position GEOGRAPHY(POINT, 4326),
    referenced_position GEOGRAPHY(POINT, 4326),
    ground_control_points JSONB DEFAULT '[]',
    transformation_matrix JSONB,
    accuracy_score FLOAT,
    created_by UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media files table
CREATE TABLE tactical_media_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    location GEOGRAPHY(POINT, 4326),
    metadata JSONB DEFAULT '{}',
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES tactical_profiles(id),
    team_id UUID REFERENCES tactical_teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plugins table
CREATE TABLE tactical_plugins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT,
    plugin_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    config_schema JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plugin configurations table
CREATE TABLE tactical_plugin_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    plugin_id UUID REFERENCES tactical_plugins(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES tactical_profiles(id),
    team_id UUID REFERENCES tactical_teams(id),
    config_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Military extensions - Ballistics table
CREATE TABLE tactical_ballistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    weapon_type VARCHAR(50) NOT NULL,
    ammunition_type VARCHAR(50) NOT NULL,
    firing_position GEOGRAPHY(POINT, 4326) NOT NULL,
    target_position GEOGRAPHY(POINT, 4326) NOT NULL,
    trajectory_data JSONB,
    environmental_factors JSONB,
    calculated_by UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fire support table
CREATE TABLE tactical_fire_support (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mission_name VARCHAR(100) NOT NULL,
    mission_type VARCHAR(50) NOT NULL,
    target_area GEOGRAPHY(POLYGON, 4326) NOT NULL,
    firing_positions JSONB,
    weapon_systems JSONB,
    timing JSONB,
    status VARCHAR(50) DEFAULT 'planned',
    requested_by UUID REFERENCES tactical_profiles(id),
    approved_by UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drone missions table
CREATE TABLE tactical_drone_missions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mission_name VARCHAR(100) NOT NULL,
    drone_type VARCHAR(50) NOT NULL,
    mission_type VARCHAR(50) DEFAULT 'reconnaissance',
    flight_path GEOGRAPHY(LINESTRING, 4326),
    waypoints JSONB,
    altitude FLOAT,
    duration INTEGER,
    status VARCHAR(50) DEFAULT 'planned',
    pilot_id UUID REFERENCES tactical_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Threat assessments table
CREATE TABLE tactical_threat_assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assessment_name VARCHAR(100) NOT NULL,
    threat_type VARCHAR(50) NOT NULL,
    threat_level priority_level DEFAULT 'medium',
    affected_area GEOGRAPHY(POLYGON, 4326),
    description TEXT,
    mitigation_measures TEXT,
    assessment_data JSONB,
    assessed_by UUID REFERENCES tactical_profiles(id),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tactical_profiles_user_id ON tactical_profiles(user_id);
CREATE INDEX idx_tactical_profiles_location ON tactical_profiles USING GIST(location);
CREATE INDEX idx_tactical_profiles_status ON tactical_profiles(status);

CREATE INDEX idx_tactical_map_features_map_id ON tactical_map_features(map_id);
CREATE INDEX idx_tactical_map_features_geometry ON tactical_map_features USING GIST(geometry);
CREATE INDEX idx_tactical_map_features_type ON tactical_map_features(feature_type);

CREATE INDEX idx_tactical_messages_channel_id ON tactical_messages(channel_id);
CREATE INDEX idx_tactical_messages_created_at ON tactical_messages(created_at);
CREATE INDEX idx_tactical_messages_location ON tactical_messages USING GIST(location);

CREATE INDEX idx_tactical_targets_position ON tactical_targets USING GIST(current_position);
CREATE INDEX idx_tactical_targets_status ON tactical_targets(status);
CREATE INDEX idx_tactical_targets_priority ON tactical_targets(priority);

CREATE INDEX idx_tactical_track_points_track_id ON tactical_track_points(track_id);
CREATE INDEX idx_tactical_track_points_position ON tactical_track_points USING GIST(position);
CREATE INDEX idx_tactical_track_points_timestamp ON tactical_track_points(timestamp);

CREATE INDEX idx_tactical_geofences_geometry ON tactical_geofences USING GIST(geometry);
CREATE INDEX idx_tactical_geofences_active ON tactical_geofences(is_active);

CREATE INDEX idx_tactical_alerts_recipient ON tactical_alerts(recipient_id);
CREATE INDEX idx_tactical_alerts_team ON tactical_alerts(team_id);
CREATE INDEX idx_tactical_alerts_priority ON tactical_alerts(priority);
CREATE INDEX idx_tactical_alerts_created_at ON tactical_alerts(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_tactical_profiles_updated_at BEFORE UPDATE ON tactical_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_teams_updated_at BEFORE UPDATE ON tactical_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_maps_updated_at BEFORE UPDATE ON tactical_maps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_map_layers_updated_at BEFORE UPDATE ON tactical_map_layers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_map_features_updated_at BEFORE UPDATE ON tactical_map_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_sessions_updated_at BEFORE UPDATE ON tactical_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_routes_updated_at BEFORE UPDATE ON tactical_routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_targets_updated_at BEFORE UPDATE ON tactical_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_geofences_updated_at BEFORE UPDATE ON tactical_geofences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_medical_info_updated_at BEFORE UPDATE ON tactical_medical_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_plugins_updated_at BEFORE UPDATE ON tactical_plugins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_plugin_configs_updated_at BEFORE UPDATE ON tactical_plugin_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tactical_threat_assessments_updated_at BEFORE UPDATE ON tactical_threat_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE tactical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_map_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_map_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_map_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_map_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_user_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_track_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_target_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_emergency_beacons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_3d_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_photo_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_plugin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_ballistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_fire_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_drone_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_threat_assessments ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these based on your security requirements)

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Users can view all profiles" ON tactical_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON tactical_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON tactical_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Teams: Team members can view team data
CREATE POLICY "Team members can view team data" ON tactical_teams FOR SELECT USING (
    id IN (
        SELECT team_id FROM tactical_team_members 
        WHERE profile_id IN (
            SELECT id FROM tactical_profiles WHERE user_id = auth.uid()
        )
    )
);

-- Maps: Users can view public maps or maps they have access to
CREATE POLICY "Users can view accessible maps" ON tactical_maps FOR SELECT USING (
    is_public = true OR 
    created_by IN (SELECT id FROM tactical_profiles WHERE user_id = auth.uid()) OR
    team_id IN (
        SELECT team_id FROM tactical_team_members 
        WHERE profile_id IN (
            SELECT id FROM tactical_profiles WHERE user_id = auth.uid()
        )
    )
);

-- Messages: Users can view messages in channels they have access to
CREATE POLICY "Users can view accessible messages" ON tactical_messages FOR SELECT USING (
    channel_id IN (
        SELECT id FROM tactical_channels WHERE 
        team_id IN (
            SELECT team_id FROM tactical_team_members 
            WHERE profile_id IN (
                SELECT id FROM tactical_profiles WHERE user_id = auth.uid()
            )
        )
    )
);

-- Add more policies as needed for other tables...

-- Create storage buckets for media files
INSERT INTO storage.buckets (id, name, public) VALUES 
('tactical-maps', 'tactical-maps', false),
('tactical-media', 'tactical-media', false),
('tactical-3d-models', 'tactical-3d-models', false),
('tactical-photos', 'tactical-photos', false);

-- Create storage policies
CREATE POLICY "Authenticated users can upload to tactical-maps" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tactical-maps' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view tactical-maps" ON storage.objects FOR SELECT USING (bucket_id = 'tactical-maps' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload to tactical-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tactical-media' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view tactical-media" ON storage.objects FOR SELECT USING (bucket_id = 'tactical-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload to tactical-3d-models" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tactical-3d-models' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view tactical-3d-models" ON storage.objects FOR SELECT USING (bucket_id = 'tactical-3d-models' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload to tactical-photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tactical-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view tactical-photos" ON storage.objects FOR SELECT USING (bucket_id = 'tactical-photos' AND auth.role() = 'authenticated');