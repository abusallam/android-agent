-- TacticalOps PostgreSQL Database Initialization
-- This script sets up the database with all necessary extensions for tactical operations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create tactical database user with proper permissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tacticalops_agent') THEN
        CREATE ROLE tacticalops_agent WITH LOGIN PASSWORD 'TacticalAgent2024!';
    END IF;
END
$$;

-- Grant necessary permissions for tactical operations
GRANT CONNECT ON DATABASE tacticalops TO tacticalops_agent;
GRANT USAGE ON SCHEMA public TO tacticalops_agent;
GRANT CREATE ON SCHEMA public TO tacticalops_agent;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tacticalops_agent;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tacticalops_agent;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tacticalops_agent;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO tacticalops_agent;

-- Create tactical operations schema
CREATE SCHEMA IF NOT EXISTS tactical_ops;
GRANT USAGE ON SCHEMA tactical_ops TO tacticalops_agent;
GRANT CREATE ON SCHEMA tactical_ops TO tacticalops_agent;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA tactical_ops TO tacticalops_agent;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_is_online ON devices(is_online);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- Create tactical operations tables for agent interactions
CREATE TABLE IF NOT EXISTS tactical_ops.agent_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(255) NOT NULL,
    query_type VARCHAR(100) NOT NULL,
    query_text TEXT NOT NULL,
    parameters JSONB,
    result JSONB,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tactical_ops.data_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(100) NOT NULL, -- 'supabase_to_local', 'local_to_mobile', etc.
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id VARCHAR(255),
    sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS tactical_ops.agent_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capability_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sql_template TEXT, -- Template for SQL queries this capability can execute
    parameters JSONB, -- Expected parameters
    security_level VARCHAR(50) DEFAULT 'standard', -- 'standard', 'elevated', 'admin'
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions on tactical_ops schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA tactical_ops TO tacticalops_agent;
ALTER DEFAULT PRIVILEGES IN SCHEMA tactical_ops GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tacticalops_agent;

-- Insert default agent capabilities
INSERT INTO tactical_ops.agent_capabilities (capability_name, description, sql_template, parameters, security_level) VALUES
('device_status_query', 'Query device status and location', 'SELECT * FROM devices WHERE is_online = $1', '{"online": "boolean"}', 'standard'),
('user_management', 'Manage user accounts and permissions', 'SELECT * FROM users WHERE role = $1', '{"role": "string"}', 'elevated'),
('emergency_alerts', 'Handle emergency alert queries', 'SELECT * FROM emergency_alerts WHERE severity = $1 AND created_at > $2', '{"severity": "string", "since": "timestamp"}', 'standard'),
('tactical_routing', 'Calculate tactical routes and paths', 'SELECT * FROM gps_logs WHERE device_id = $1 ORDER BY timestamp DESC LIMIT $2', '{"device_id": "string", "limit": "number"}', 'standard'),
('data_analytics', 'Perform data analysis and reporting', 'SELECT COUNT(*) as total, AVG(battery_level) as avg_battery FROM devices WHERE created_at > $1', '{"since": "timestamp"}', 'standard')
ON CONFLICT (capability_name) DO NOTHING;

-- Create function for agent query logging
CREATE OR REPLACE FUNCTION log_agent_query(
    p_agent_id VARCHAR(255),
    p_query_type VARCHAR(100),
    p_query_text TEXT,
    p_parameters JSONB DEFAULT NULL,
    p_result JSONB DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    query_id UUID;
BEGIN
    INSERT INTO tactical_ops.agent_queries (
        agent_id, query_type, query_text, parameters, result, execution_time_ms
    ) VALUES (
        p_agent_id, p_query_type, p_query_text, p_parameters, p_result, p_execution_time_ms
    ) RETURNING id INTO query_id;
    
    RETURN query_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for data sync logging
CREATE OR REPLACE FUNCTION log_data_sync(
    p_sync_type VARCHAR(100),
    p_table_name VARCHAR(255),
    p_operation VARCHAR(50),
    p_record_id VARCHAR(255) DEFAULT NULL,
    p_sync_status VARCHAR(50) DEFAULT 'pending'
) RETURNS UUID AS $$
DECLARE
    sync_id UUID;
BEGIN
    INSERT INTO tactical_ops.data_sync_log (
        sync_type, table_name, operation, record_id, sync_status
    ) VALUES (
        p_sync_type, p_table_name, p_operation, p_record_id, p_sync_status
    ) RETURNING id INTO sync_id;
    
    RETURN sync_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for tactical operations
CREATE INDEX IF NOT EXISTS idx_agent_queries_agent_id ON tactical_ops.agent_queries(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_queries_created_at ON tactical_ops.agent_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_sync_type ON tactical_ops.data_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_table_name ON tactical_ops.data_sync_log(table_name);
CREATE INDEX IF NOT EXISTS idx_data_sync_log_sync_status ON tactical_ops.data_sync_log(sync_status);

-- Set up database configuration for tactical operations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Reload configuration
SELECT pg_reload_conf();

COMMENT ON DATABASE tacticalops IS 'TacticalOps Platform Database - Configured for tactical operations, agent interactions, and multi-platform sync';
COMMENT ON SCHEMA tactical_ops IS 'Schema for tactical operations, agent queries, and data synchronization';
COMMENT ON TABLE tactical_ops.agent_queries IS 'Log of all agent SQL queries and operations';
COMMENT ON TABLE tactical_ops.data_sync_log IS 'Log of data synchronization between Supabase, local PostgreSQL, and mobile SQLite';
COMMENT ON TABLE tactical_ops.agent_capabilities IS 'Defines what SQL operations agents can perform';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'TacticalOps PostgreSQL database initialized successfully!';
    RAISE NOTICE 'Database: tacticalops';
    RAISE NOTICE 'Agent user: tacticalops_agent';
    RAISE NOTICE 'Extensions: uuid-ossp, pgcrypto, btree_gin, btree_gist';
    RAISE NOTICE 'Tactical schema: tactical_ops';
    RAISE NOTICE 'Agent capabilities: 5 default capabilities configured';
END
$$;