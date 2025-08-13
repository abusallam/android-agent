-- TacticalOps Platform - Enhanced Database Schema
-- Comprehensive database schema with PostGIS support for tactical operations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS tactical;
CREATE SCHEMA IF NOT EXISTS geospatial;
CREATE SCHEMA IF NOT EXISTS storage;

-- Users table with enhanced security features
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'project_admin', 'root_admin', 'agent')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    security_tier VARCHAR(20) DEFAULT 'civilian' CHECK (security_tier IN ('civilian', 'government', 'military')),
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table for AI agent task management
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    operation_id UUID REFERENCES tactical.operations(id),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'needs_review', 'scheduled')),
    verification_methods JSONB DEFAULT '[]'::jsonb,
    geospatial_requirements JSONB DEFAULT '[]'::jsonb,
    time_requirements JSONB DEFAULT '{}'::jsonb,
    resource_requirements JSONB DEFAULT '[]'::jsonb,
    ai_verification_data JSONB DEFAULT '{}'::jsonb,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    is_automated BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task verification table
CREATE TABLE IF NOT EXISTS task_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,
    verification_data JSONB NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    is_valid BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Agent sessions table
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    capabilities JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'revoked', 'registered')),
    context JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6),
    source VARCHAR(100),
    tags JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    location GEOMETRY(POINT, 4326),
    reported_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication sessions table
CREATE TABLE IF NOT EXISTS communication_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_type VARCHAR(50) NOT NULL,
    participants JSONB DEFAULT '[]'::jsonb,
    operation_id UUID REFERENCES tactical.operations(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'paused')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tactical schema tables
CREATE TABLE IF NOT EXISTS tactical.operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tactical.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'deployed', 'maintenance', 'offline')),
    operation_id UUID REFERENCES tactical.operations(id),
    specifications JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geospatial schema tables
CREATE TABLE IF NOT EXISTS geospatial.location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    accuracy DECIMAL(8,2),
    altitude DECIMAL(10,2),
    speed DECIMAL(8,2),
    heading DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS geospatial.geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    geofence_type VARCHAR(50) NOT NULL,
    geometry GEOMETRY NOT NULL,
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS geospatial.map_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    feature_type VARCHAR(100) NOT NULL,
    geometry GEOMETRY NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS geospatial.map_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(100) NOT NULL,
    style_config JSONB DEFAULT '{}'::jsonb,
    is_visible BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS geospatial.map_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geometry GEOMETRY NOT NULL,
    annotation_type VARCHAR(100) NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    style JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage schema tables
CREATE TABLE IF NOT EXISTS storage.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks USING GIN (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_operation_id ON tasks(operation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

CREATE INDEX IF NOT EXISTS idx_task_verification_task_id ON task_verification(task_id);
CREATE INDEX IF NOT EXISTS idx_task_verification_type ON task_verification(verification_type);
CREATE INDEX IF NOT EXISTS idx_task_verification_confidence ON task_verification(confidence);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_type ON agent_sessions(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_source ON system_metrics(source);
CREATE INDEX IF NOT EXISTS idx_system_metrics_created_at ON system_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_type ON emergency_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_priority ON emergency_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_location ON emergency_alerts USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_location_history_device_id ON geospatial.location_history(device_id);
CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON geospatial.location_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_location_history_location ON geospatial.location_history USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_geofences_geometry ON geospatial.geofences USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_geofences_type ON geospatial.geofences(geofence_type);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON geospatial.geofences(is_active);

CREATE INDEX IF NOT EXISTS idx_map_features_geometry ON geospatial.map_features USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_map_features_type ON geospatial.map_features(feature_type);

CREATE INDEX IF NOT EXISTS idx_map_annotations_geometry ON geospatial.map_annotations USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_map_annotations_type ON geospatial.map_annotations(annotation_type);
CREATE INDEX IF NOT EXISTS idx_map_annotations_created_by ON geospatial.map_annotations(created_by);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role, status, security_tier) 
SELECT 'admin', 'admin@tacticalops.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'root_admin', 'active', 'military'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Insert sample data
INSERT INTO tactical.operations (name, description, status, priority) 
SELECT 'Operation Alpha', 'Primary tactical operation for sector Alpha', 'active', 'high'
WHERE NOT EXISTS (SELECT 1 FROM tactical.operations WHERE name = 'Operation Alpha');

INSERT INTO tactical.assets (name, asset_type, status, specifications) 
SELECT 'UAV-001', 'drone', 'available', '{"model": "Tactical Drone X1", "range": "10km", "flight_time": "45min"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM tactical.assets WHERE name = 'UAV-001');

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tactical TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA tactical TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA geospatial TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA geospatial TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA storage TO postgres;

COMMIT;