-- Task Management Schema for Agentic AI System
-- Creates tables for AI-powered task monitoring and verification

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to JSONB DEFAULT '[]'::jsonb, -- Array of user IDs
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    operation_id UUID REFERENCES tactical.operations(id),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'needs_review', 'scheduled')),
    verification_methods JSONB DEFAULT '[]'::jsonb, -- Array of verification method objects
    geospatial_requirements JSONB DEFAULT '[]'::jsonb, -- Location-based requirements
    time_requirements JSONB DEFAULT '{}'::jsonb, -- Time-based requirements
    resource_requirements JSONB DEFAULT '[]'::jsonb, -- Resource requirements
    ai_verification_data JSONB DEFAULT '{}'::jsonb, -- AI analysis results
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
    verification_type VARCHAR(50) NOT NULL, -- 'location', 'activity', 'sensor', 'multi_modal', etc.
    verification_data JSONB NOT NULL, -- Raw verification data
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1), -- 0.00 to 1.00
    verified_by UUID REFERENCES users(id), -- Can be null for AI verification
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_analysis JSONB DEFAULT '{}'::jsonb, -- AI analysis results
    is_valid BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks USING GIN (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_operation_id ON tasks(operation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_for ON tasks(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_task_verification_task_id ON task_verification(task_id);
CREATE INDEX IF NOT EXISTS idx_task_verification_type ON task_verification(verification_type);
CREATE INDEX IF NOT EXISTS idx_task_verification_confidence ON task_verification(confidence);
CREATE INDEX IF NOT EXISTS idx_task_verification_verified_at ON task_verification(verified_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO tasks (title, description, assigned_to, created_by, operation_id, priority, verification_methods, geospatial_requirements, time_requirements) 
SELECT 
    'Patrol Checkpoint Alpha',
    'Conduct security patrol at checkpoint Alpha and verify all access points',
    '[\"550e8400-e29b-41d4-a716-446655440003\"]'::jsonb,
    '550e8400-e29b-41d4-a716-446655440001',
    '750e8400-e29b-41d4-a716-446655440001',
    'high',
    '[
        {"type": "location", "required": true, "accuracy": 10},
        {"type": "activity", "required": true, "duration": 1800},
        {"type": "sensor", "required": false, "sensors": ["accelerometer", "gps"]}
    ]'::jsonb,
    '[
        {
            "type": "within_area",
            "name": "Checkpoint Alpha Zone",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[46.6790, 24.7190], [46.6810, 24.7190], [46.6810, 24.7210], [46.6790, 24.7210], [46.6790, 24.7190]]]
            }
        }
    ]'::jsonb,
    '{
        "startTime": "06:00",
        "endTime": "18:00",
        "duration": 1800,
        "timezone": "Asia/Riyadh"
    }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Patrol Checkpoint Alpha');

INSERT INTO tasks (title, description, assigned_to, created_by, operation_id, priority, verification_methods, geospatial_requirements) 
SELECT 
    'UAV Reconnaissance Mission',
    'Deploy UAV for reconnaissance of sector Bravo-7 and collect intelligence data',
    '[\"550e8400-e29b-41d4-a716-446655440005\"]'::jsonb,
    '550e8400-e29b-41d4-a716-446655440002',
    '750e8400-e29b-41d4-a716-446655440001',
    'critical',
    '[
        {"type": "location", "required": true, "accuracy": 5},
        {"type": "sensor", "required": true, "sensors": ["camera", "gps", "altitude"]},
        {"type": "application", "required": true, "apps": ["uav_control", "camera_app"]}
    ]'::jsonb,
    '[
        {
            "type": "flight_path",
            "name": "Reconnaissance Route Bravo-7",
            "waypoints": [
                {"lat": 24.7150, "lng": 46.6750, "alt": 200},
                {"lat": 24.7170, "lng": 46.6770, "alt": 200},
                {"lat": 24.7190, "lng": 46.6790, "alt": 200}
            ],
            "minAltitude": 150,
            "maxAltitude": 400
        }
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'UAV Reconnaissance Mission');

INSERT INTO tasks (title, description, assigned_to, created_by, priority, verification_methods, is_automated, scheduled_for) 
SELECT 
    'Automated System Health Check',
    'Perform automated health check of all tactical systems and generate report',
    '[\"system\"]'::jsonb,
    '550e8400-e29b-41d4-a716-446655440001',
    'medium',
    '[
        {"type": "automated", "required": true, "checks": ["database", "network", "services"]}
    ]'::jsonb,
    true,
    NOW() + INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Automated System Health Check');

-- Sample task verification data
INSERT INTO task_verification (task_id, verification_type, verification_data, confidence, verified_by, ai_analysis)
SELECT 
    t.id,
    'location',
    '{
        "latitude": 24.7200,
        "longitude": 46.6800,
        "accuracy": 8.5,
        "timestamp": "2025-08-12T14:30:00Z",
        "withinRequiredArea": true
    }'::jsonb,
    0.92,
    '550e8400-e29b-41d4-a716-446655440003',
    '{
        "model": "qwen/qwen3-coder:free",
        "analysis": "Location verification successful - device within required checkpoint area",
        "confidence_factors": [
            "GPS accuracy within threshold",
            "Location matches geofence requirements",
            "Timestamp within operational hours"
        ],
        "risk_score": 0.1
    }'::jsonb
FROM tasks t 
WHERE t.title = 'Patrol Checkpoint Alpha'
AND NOT EXISTS (SELECT 1 FROM task_verification tv WHERE tv.task_id = t.id);

-- Create views for common queries
CREATE OR REPLACE VIEW task_summary AS
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.created_at,
    t.due_date,
    u_creator.username as created_by_user,
    to_op.name as operation_name,
    jsonb_array_length(t.assigned_to) as assigned_count,
    COUNT(tv.id) as verification_count,
    AVG(tv.confidence) as avg_verification_confidence,
    MAX(tv.verified_at) as last_verification
FROM tasks t
LEFT JOIN users u_creator ON t.created_by = u_creator.id
LEFT JOIN tactical.operations to_op ON t.operation_id = to_op.id
LEFT JOIN task_verification tv ON t.id = tv.task_id
GROUP BY t.id, u_creator.username, to_op.name;

CREATE OR REPLACE VIEW active_ai_monitoring AS
SELECT 
    ags.id as agent_session_id,
    ags.agent_id,
    ags.agent_type,
    ags.status as agent_status,
    ags.context->>'taskId' as task_id,
    t.title as task_title,
    t.status as task_status,
    t.priority as task_priority,
    ags.metadata->>'confidenceThreshold' as confidence_threshold,
    ags.created_at as monitoring_started
FROM agent_sessions ags
JOIN tasks t ON t.id::text = ags.context->>'taskId'
WHERE ags.agent_type = 'task-monitoring' 
AND ags.status = 'active';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_verification TO postgres;
GRANT SELECT ON task_summary TO postgres;
GRANT SELECT ON active_ai_monitoring TO postgres;

COMMIT;