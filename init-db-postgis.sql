-- TacticalOps Platform - PostgreSQL + PostGIS Initialization Script
-- This script initializes the database with PostGIS extensions and tactical operations schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tactical operations schema
CREATE SCHEMA IF NOT EXISTS tactical;
CREATE SCHEMA IF NOT EXISTS geospatial;
CREATE SCHEMA IF NOT EXISTS storage;

-- Set search path to include our schemas
ALTER DATABASE tacticalops SET search_path TO public, tactical, geospatial, storage, postgis;

-- Create users table with geospatial capabilities
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    profile JSONB DEFAULT '{}',
    -- Geospatial fields
    location GEOMETRY(POINT, 4326),
    location_updated_at TIMESTAMP WITH TIME ZONE,
    location_accuracy FLOAT,
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create spatial index on user locations
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users (is_active);

-- Create devices table with geospatial tracking
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    version VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    -- Geospatial tracking
    current_location GEOMETRY(POINT, 4326),
    location_updated_at TIMESTAMP WITH TIME ZONE,
    location_accuracy FLOAT,
    altitude FLOAT,
    heading FLOAT,
    speed FLOAT,
    -- Device status
    battery_level INTEGER,
    network_type VARCHAR(50),
    signal_strength INTEGER,
    -- Metadata
    capabilities JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create spatial indexes on device locations
CREATE INDEX IF NOT EXISTS idx_devices_location ON devices USING GIST (current_location);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices (user_id);
CREATE INDEX IF NOT EXISTS idx_devices_active ON devices (is_active);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices (last_seen);

-- Create location history table for tracking movement
CREATE TABLE IF NOT EXISTS geospatial.location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location GEOMETRY(POINT, 4326) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accuracy FLOAT,
    altitude FLOAT,
    heading FLOAT,
    speed FLOAT,
    activity_type VARCHAR(50),
    -- Additional context
    battery_level INTEGER,
    network_type VARCHAR(50),
    metadata JSONB DEFAULT '{}'
);

-- Create spatial and temporal indexes on location history
CREATE INDEX IF NOT EXISTS idx_location_history_location ON geospatial.location_history USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_location_history_device_id ON geospatial.location_history (device_id);
CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON geospatial.location_history (timestamp);
CREATE INDEX IF NOT EXISTS idx_location_history_user_timestamp ON geospatial.location_history (user_id, timestamp);

-- Create geofences table for location-based alerts
CREATE TABLE IF NOT EXISTS geospatial.geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    geometry GEOMETRY(POLYGON, 4326) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    -- Geofence properties
    fence_type VARCHAR(50) NOT NULL DEFAULT 'inclusion', -- inclusion, exclusion, alert
    alert_on_enter BOOLEAN DEFAULT true,
    alert_on_exit BOOLEAN DEFAULT true,
    alert_on_dwell BOOLEAN DEFAULT false,
    dwell_time_minutes INTEGER DEFAULT 5,
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create spatial index on geofences
CREATE INDEX IF NOT EXISTS idx_geofences_geometry ON geospatial.geofences USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON geospatial.geofences (is_active);

-- Create tactical operations table
CREATE TABLE IF NOT EXISTS tactical.operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    operation_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planning',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    created_by UUID REFERENCES users(id),
    assigned_to UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    -- Geospatial operation area
    operation_area GEOMETRY(POLYGON, 4326),
    center_point GEOMETRY(POINT, 4326),
    -- Operation details
    objectives TEXT[],
    resources JSONB DEFAULT '{}',
    constraints JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create spatial indexes on tactical operations
CREATE INDEX IF NOT EXISTS idx_operations_area ON tactical.operations USING GIST (operation_area);
CREATE INDEX IF NOT EXISTS idx_operations_center ON tactical.operations USING GIST (center_point);
CREATE INDEX IF NOT EXISTS idx_operations_status ON tactical.operations (status);
CREATE INDEX IF NOT EXISTS idx_operations_priority ON tactical.operations (priority);

-- Create tactical assets table
CREATE TABLE IF NOT EXISTS tactical.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    current_location GEOMETRY(POINT, 4326),
    assigned_operation UUID REFERENCES tactical.operations(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Asset properties
    capabilities JSONB DEFAULT '[]',
    specifications JSONB DEFAULT '{}',
    maintenance_schedule JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create spatial indexes on tactical assets
CREATE INDEX IF NOT EXISTS idx_assets_location ON tactical.assets USING GIST (current_location);
CREATE INDEX IF NOT EXISTS idx_assets_operation ON tactical.assets (assigned_operation);
CREATE INDEX IF NOT EXISTS idx_assets_status ON tactical.assets (status);

-- Create emergency alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOMETRY(POINT, 4326),
    address TEXT,
    created_by UUID REFERENCES users(id),
    assigned_to UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- Alert properties
    radius_meters INTEGER DEFAULT 1000,
    affected_area GEOMETRY(POLYGON, 4326),
    response_required BOOLEAN DEFAULT true,
    estimated_response_time INTEGER, -- minutes
    -- Metadata
    metadata JSONB DEFAULT '{}',
    response_log JSONB DEFAULT '[]'
);

-- Create spatial indexes on emergency alerts
CREATE INDEX IF NOT EXISTS idx_alerts_location ON emergency_alerts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_alerts_area ON emergency_alerts USING GIST (affected_area);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON emergency_alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON emergency_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON emergency_alerts (created_at);

-- Create file storage metadata table for MinIO integration
CREATE TABLE IF NOT EXISTS storage.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    bucket_name VARCHAR(100) NOT NULL,
    object_key VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- File properties
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    -- Geospatial metadata (for images/videos with location)
    location GEOMETRY(POINT, 4326),
    -- File metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}'
);

-- Create indexes on file storage
CREATE INDEX IF NOT EXISTS idx_files_bucket_key ON storage.files (bucket_name, object_key);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON storage.files (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_location ON storage.files USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON storage.files (uploaded_at);

-- Create map layers table for geospatial data management
CREATE TABLE IF NOT EXISTS geospatial.map_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layer_type VARCHAR(100) NOT NULL, -- vector, raster, tile, wms, etc.
    data_source VARCHAR(500),
    geometry_type VARCHAR(50), -- point, linestring, polygon, multipolygon, etc.
    srid INTEGER DEFAULT 4326,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    -- Layer properties
    style_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    -- Spatial extent
    bbox GEOMETRY(POLYGON, 4326)
);

-- Create indexes on map layers
CREATE INDEX IF NOT EXISTS idx_map_layers_bbox ON geospatial.map_layers USING GIST (bbox);
CREATE INDEX IF NOT EXISTS idx_map_layers_type ON geospatial.map_layers (layer_type);
CREATE INDEX IF NOT EXISTS idx_map_layers_active ON geospatial.map_layers (is_active);

-- Create map features table for storing geospatial features
CREATE TABLE IF NOT EXISTS geospatial.map_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_id UUID REFERENCES geospatial.map_layers(id) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT,
    geometry GEOMETRY NOT NULL,
    properties JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    -- Feature metadata
    metadata JSONB DEFAULT '{}'
);

-- Create spatial index on map features
CREATE INDEX IF NOT EXISTS idx_map_features_geometry ON geospatial.map_features USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_map_features_layer ON geospatial.map_features (layer_id);
CREATE INDEX IF NOT EXISTS idx_map_features_active ON geospatial.map_features (is_active);

-- Create agent sessions table for AI agent management
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(255) NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    capabilities JSONB DEFAULT '[]',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    -- Agent context
    context JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create indexes on agent sessions
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_id ON agent_sessions (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions (status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_last_activity ON agent_sessions (last_activity);

-- Create system metrics table for monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(255),
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create indexes on system metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_timestamp ON system_metrics (metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics (timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_source ON system_metrics (source);

-- Create functions for common geospatial operations

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN ST_Distance(
        ST_GeogFromText('POINT(' || lon1 || ' ' || lat1 || ')'),
        ST_GeogFromText('POINT(' || lon2 || ' ' || lat2 || ')')
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a point is within a geofence
CREATE OR REPLACE FUNCTION point_in_geofence(
    point_lat DOUBLE PRECISION,
    point_lon DOUBLE PRECISION,
    geofence_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    geofence_geometry GEOMETRY;
    point_geometry GEOMETRY;
BEGIN
    -- Get the geofence geometry
    SELECT geometry INTO geofence_geometry
    FROM geospatial.geofences
    WHERE id = geofence_id AND is_active = true;
    
    IF geofence_geometry IS NULL THEN
        RETURN false;
    END IF;
    
    -- Create point geometry
    point_geometry := ST_GeomFromText('POINT(' || point_lon || ' ' || point_lat || ')', 4326);
    
    -- Check if point is within geofence
    RETURN ST_Within(point_geometry, geofence_geometry);
END;
$$ LANGUAGE plpgsql;

-- Function to get nearby devices
CREATE OR REPLACE FUNCTION get_nearby_devices(
    center_lat DOUBLE PRECISION,
    center_lon DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 1000
) RETURNS TABLE (
    device_id UUID,
    device_name VARCHAR(255),
    distance_meters DOUBLE PRECISION,
    last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.device_name,
        ST_Distance(
            ST_GeogFromText('POINT(' || center_lon || ' ' || center_lat || ')'),
            ST_GeogFromText(ST_AsText(d.current_location))
        ) as distance,
        d.last_seen
    FROM devices d
    WHERE d.current_location IS NOT NULL
      AND d.is_active = true
      AND ST_DWithin(
          ST_GeogFromText('POINT(' || center_lon || ' ' || center_lat || ')'),
          ST_GeogFromText(ST_AsText(d.current_location)),
          radius_meters
      )
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON tactical.operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON tactical.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON emergency_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_layers_updated_at BEFORE UPDATE ON geospatial.map_layers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_features_updated_at BEFORE UPDATE ON geospatial.map_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@tacticalops.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'admin'),
('system', 'system@tacticalops.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'system')
ON CONFLICT (username) DO NOTHING;

-- Create default geofence (example: headquarters area)
INSERT INTO geospatial.geofences (name, description, geometry, fence_type, created_by) VALUES
('Headquarters', 'Main headquarters security perimeter', 
 ST_GeomFromText('POLYGON((24.7136 46.6753, 24.7146 46.6753, 24.7146 46.6763, 24.7136 46.6763, 24.7136 46.6753))', 4326),
 'inclusion',
 (SELECT id FROM users WHERE username = 'admin' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tacticalops;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tactical TO tacticalops;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA geospatial TO tacticalops;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO tacticalops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tacticalops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA tactical TO tacticalops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA geospatial TO tacticalops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA storage TO tacticalops;

-- Create views for common queries
CREATE OR REPLACE VIEW active_devices_with_location AS
SELECT 
    d.id,
    d.device_name,
    d.device_type,
    d.platform,
    d.last_seen,
    ST_X(d.current_location) as longitude,
    ST_Y(d.current_location) as latitude,
    d.location_accuracy,
    d.battery_level,
    u.username,
    u.email
FROM devices d
JOIN users u ON d.user_id = u.id
WHERE d.is_active = true 
  AND d.current_location IS NOT NULL
  AND d.last_seen > NOW() - INTERVAL '1 hour';

CREATE OR REPLACE VIEW active_emergency_alerts AS
SELECT 
    ea.id,
    ea.alert_type,
    ea.severity,
    ea.title,
    ea.description,
    ST_X(ea.location) as longitude,
    ST_Y(ea.location) as latitude,
    ea.address,
    ea.created_at,
    ea.status,
    ea.radius_meters,
    u.username as created_by_username
FROM emergency_alerts ea
JOIN users u ON ea.created_by = u.id
WHERE ea.status = 'active';

-- Analyze tables for better query performance
ANALYZE users;
ANALYZE devices;
ANALYZE geospatial.location_history;
ANALYZE geospatial.geofences;
ANALYZE tactical.operations;
ANALYZE tactical.assets;
ANALYZE emergency_alerts;
ANALYZE storage.files;
ANALYZE geospatial.map_layers;
ANALYZE geospatial.map_features;

-- Log successful initialization
INSERT INTO system_metrics (metric_name, metric_value, metric_unit, source, metadata) VALUES
('database_initialization', 1, 'boolean', 'init-script', '{"version": "2.0.0", "features": ["postgis", "tactical", "geospatial", "storage"]}');

-- Display initialization summary
DO $$
BEGIN
    RAISE NOTICE 'TacticalOps Database Initialization Complete';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'PostGIS Version: %', postgis_version();
    RAISE NOTICE 'Schemas Created: public, tactical, geospatial, storage';
    RAISE NOTICE 'Tables Created: % tables', (SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('public', 'tactical', 'geospatial', 'storage'));
    RAISE NOTICE 'Spatial Indexes: % indexes', (SELECT count(*) FROM pg_indexes WHERE indexname LIKE '%gist%');
    RAISE NOTICE 'Default Users: admin, system';
    RAISE NOTICE 'Ready for TacticalOps Platform deployment!';
END $$;