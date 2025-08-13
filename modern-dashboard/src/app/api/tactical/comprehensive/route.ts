/**
 * Comprehensive Tactical API
 * Unified API endpoint for all tactical operations, mapping, and asset management
 * Designed for both human users and AI agent control
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const scope = searchParams.get('scope') || 'all';

    switch (action) {
      case 'operations':
        return await getOperations(searchParams);
      
      case 'assets':
        return await getAssets(searchParams);
      
      case 'map_data':
        return await getMapData(searchParams);
      
      case 'geofences':
        return await getGeofences(searchParams);
      
      case 'locations':
        return await getLocationData(searchParams);
      
      case 'intelligence':
        return await getIntelligenceData(searchParams);
      
      case 'communications':
        return await getCommunicationSessions(searchParams);
      
      case 'tactical_overview':
        return await getTacticalOverview();
      
      default:
        return await getComprehensiveTacticalData();
    }

  } catch (error) {
    console.error('Error in comprehensive tactical API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tactical data', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create_operation':
        return await createOperation(data);
      
      case 'update_operation':
        return await updateOperation(data);
      
      case 'create_asset':
        return await createAsset(data);
      
      case 'update_asset':
        return await updateAsset(data);
      
      case 'create_geofence':
        return await createGeofence(data);
      
      case 'update_geofence':
        return await updateGeofence(data);
      
      case 'add_map_annotation':
        return await addMapAnnotation(data);
      
      case 'update_location':
        return await updateLocation(data);
      
      case 'process_intelligence':
        return await processIntelligence(data);
      
      case 'start_communication':
        return await startCommunicationSession(data);
      
      default:
        return NextResponse.json(
          { error: 'Unknown tactical action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing tactical operation:', error);
    return NextResponse.json(
      { error: 'Failed to process tactical operation', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET Functions

async function getOperations(searchParams: URLSearchParams) {
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const limit = parseInt(searchParams.get('limit') || '50');

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (priority) {
    whereClause += ` AND priority = $${paramIndex}`;
    params.push(priority);
    paramIndex++;
  }

  const operations = await prisma.$queryRawUnsafe(`
    SELECT 
      o.*,
      COUNT(t.id) as task_count,
      COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(ta.id) as asset_count,
      array_agg(DISTINCT ta.asset_type) FILTER (WHERE ta.asset_type IS NOT NULL) as asset_types
    FROM tactical.operations o
    LEFT JOIN tasks t ON o.id = t.operation_id
    LEFT JOIN tactical.assets ta ON o.id = ta.operation_id
    ${whereClause}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT $${paramIndex}
  `, ...params, limit);

  return NextResponse.json({ success: true, operations });
}

async function getAssets(searchParams: URLSearchParams) {
  const assetType = searchParams.get('asset_type');
  const status = searchParams.get('status');
  const operationId = searchParams.get('operation_id');
  const includeLocation = searchParams.get('include_location') === 'true';

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (assetType) {
    whereClause += ` AND asset_type = $${paramIndex}`;
    params.push(assetType);
    paramIndex++;
  }

  if (status) {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (operationId) {
    whereClause += ` AND operation_id = $${paramIndex}`;
    params.push(operationId);
    paramIndex++;
  }

  const locationJoin = includeLocation ? 
    'LEFT JOIN geospatial.location_history lh ON a.id::text = lh.device_id AND lh.id = (SELECT id FROM geospatial.location_history WHERE device_id = lh.device_id ORDER BY timestamp DESC LIMIT 1)' : '';
  
  const locationFields = includeLocation ? 
    ', ST_AsGeoJSON(lh.location) as current_location, lh.timestamp as location_timestamp' : '';

  const assets = await prisma.$queryRawUnsafe(`
    SELECT 
      a.*,
      o.name as operation_name
      ${locationFields}
    FROM tactical.assets a
    LEFT JOIN tactical.operations o ON a.operation_id = o.id
    ${locationJoin}
    ${whereClause}
    ORDER BY a.created_at DESC
  `, ...params);

  return NextResponse.json({ success: true, assets });
}

async function getMapData(searchParams: URLSearchParams) {
  const bounds = searchParams.get('bounds'); // "lat1,lng1,lat2,lng2"
  const layers = searchParams.get('layers')?.split(',') || ['all'];
  const includeAnnotations = searchParams.get('include_annotations') === 'true';

  let boundsFilter = '';
  const params: any[] = [];
  let paramIndex = 1;

  if (bounds) {
    const [lat1, lng1, lat2, lng2] = bounds.split(',').map(Number);
    boundsFilter = `AND ST_Intersects(geometry, ST_MakeEnvelope($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, 4326))`;
    params.push(lng1, lat1, lng2, lat2);
    paramIndex += 4;
  }

  // Get map features
  const mapFeatures = await prisma.$queryRawUnsafe(`
    SELECT 
      id,
      name,
      feature_type,
      ST_AsGeoJSON(geometry) as geometry,
      properties,
      metadata,
      created_at
    FROM geospatial.map_features
    WHERE 1=1 ${boundsFilter}
    ORDER BY created_at DESC
  `, ...params);

  // Get map layers
  const mapLayers = await prisma.$queryRawUnsafe(`
    SELECT 
      id,
      name,
      layer_type,
      style_config,
      is_visible,
      metadata
    FROM geospatial.map_layers
    WHERE is_active = true
    ORDER BY display_order ASC
  `);

  let annotations = [];
  if (includeAnnotations) {
    annotations = await prisma.$queryRawUnsafe(`
      SELECT 
        ma.*,
        ST_AsGeoJSON(ma.geometry) as geometry,
        u.username as created_by_user
      FROM geospatial.map_annotations ma
      LEFT JOIN users u ON ma.created_by = u.id
      WHERE 1=1 ${boundsFilter}
      ORDER BY ma.created_at DESC
    `, ...params);
  }

  return NextResponse.json({ 
    success: true, 
    mapFeatures,
    mapLayers,
    annotations
  });
}

async function getGeofences(searchParams: URLSearchParams) {
  const isActive = searchParams.get('active') === 'true';
  const geofenceType = searchParams.get('type');

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (isActive) {
    whereClause += ` AND is_active = true`;
  }

  if (geofenceType) {
    whereClause += ` AND geofence_type = $${paramIndex}`;
    params.push(geofenceType);
    paramIndex++;
  }

  const geofences = await prisma.$queryRawUnsafe(`
    SELECT 
      id,
      name,
      geofence_type,
      ST_AsGeoJSON(geometry) as geometry,
      trigger_conditions,
      actions,
      is_active,
      metadata,
      created_at
    FROM geospatial.geofences
    ${whereClause}
    ORDER BY created_at DESC
  `, ...params);

  return NextResponse.json({ success: true, geofences });
}

async function getLocationData(searchParams: URLSearchParams) {
  const deviceId = searchParams.get('device_id');
  const timeRange = searchParams.get('time_range') || '24h';
  const includeTrail = searchParams.get('include_trail') === 'true';

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (deviceId) {
    whereClause += ` AND device_id = $${paramIndex}`;
    params.push(deviceId);
    paramIndex++;
  }

  // Convert time range to SQL interval
  const timeInterval = timeRange.replace(/(\d+)([hmd])/, '$1 $2').replace('h', 'hour').replace('m', 'minute').replace('d', 'day');
  whereClause += ` AND timestamp > NOW() - INTERVAL '${timeInterval}'`;

  const locationData = await prisma.$queryRawUnsafe(`
    SELECT 
      device_id,
      ST_AsGeoJSON(location) as location,
      accuracy,
      altitude,
      speed,
      heading,
      timestamp,
      metadata
    FROM geospatial.location_history
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT 1000
  `, ...params);

  let trail = [];
  if (includeTrail && deviceId) {
    trail = await prisma.$queryRawUnsafe(`
      SELECT 
        ST_AsGeoJSON(ST_MakeLine(location ORDER BY timestamp)) as trail_geometry
      FROM geospatial.location_history
      WHERE device_id = $1 AND timestamp > NOW() - INTERVAL '${timeInterval}'
    `, deviceId);
  }

  return NextResponse.json({ 
    success: true, 
    locations: locationData,
    trail: trail[0]?.trail_geometry || null
  });
}

async function getIntelligenceData(searchParams: URLSearchParams) {
  const analysisType = searchParams.get('analysis_type');
  const priority = searchParams.get('priority');
  const limit = parseInt(searchParams.get('limit') || '50');

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (analysisType) {
    whereClause += ` AND tags->>'analysis_type' = $${paramIndex}`;
    params.push(analysisType);
    paramIndex++;
  }

  if (priority) {
    whereClause += ` AND tags->>'priority' = $${paramIndex}`;
    params.push(priority);
    paramIndex++;
  }

  const intelligence = await prisma.$queryRawUnsafe(`
    SELECT 
      metric_name as intelligence_type,
      metric_value,
      source,
      tags,
      metadata,
      created_at
    FROM system_metrics
    WHERE metric_name LIKE '%intelligence%' OR metric_name LIKE '%analysis%'
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex}
  `, ...params, limit);

  return NextResponse.json({ success: true, intelligence });
}

async function getCommunicationSessions(searchParams: URLSearchParams) {
  const sessionType = searchParams.get('session_type');
  const status = searchParams.get('status');
  const operationId = searchParams.get('operation_id');

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (sessionType) {
    whereClause += ` AND session_type = $${paramIndex}`;
    params.push(sessionType);
    paramIndex++;
  }

  if (status) {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (operationId) {
    whereClause += ` AND operation_id = $${paramIndex}`;
    params.push(operationId);
    paramIndex++;
  }

  const sessions = await prisma.$queryRawUnsafe(`
    SELECT 
      cs.*,
      o.name as operation_name
    FROM communication_sessions cs
    LEFT JOIN tactical.operations o ON cs.operation_id = o.id
    ${whereClause}
    ORDER BY cs.created_at DESC
    LIMIT 50
  `, ...params);

  return NextResponse.json({ success: true, sessions });
}

async function getTacticalOverview() {
  const overview = {
    timestamp: new Date().toISOString(),
    operations: {},
    assets: {},
    personnel: {},
    communications: {},
    intelligence: {}
  };

  // Operations summary
  const operationsData = await prisma.$queryRawUnsafe(`
    SELECT 
      status,
      priority,
      COUNT(*) as count
    FROM tactical.operations
    GROUP BY status, priority
  `);
  overview.operations = operationsData;

  // Assets summary
  const assetsData = await prisma.$queryRawUnsafe(`
    SELECT 
      asset_type,
      status,
      COUNT(*) as count
    FROM tactical.assets
    GROUP BY asset_type, status
  `);
  overview.assets = assetsData;

  // Personnel summary
  const personnelData = await prisma.$queryRawUnsafe(`
    SELECT 
      role,
      status,
      COUNT(*) as count,
      COUNT(CASE WHEN last_login > NOW() - INTERVAL '1 hour' THEN 1 END) as active_count
    FROM users
    GROUP BY role, status
  `);
  overview.personnel = personnelData;

  // Communications summary
  const communicationsData = await prisma.$queryRawUnsafe(`
    SELECT 
      session_type,
      status,
      COUNT(*) as count
    FROM communication_sessions
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY session_type, status
  `);
  overview.communications = communicationsData;

  return NextResponse.json({ success: true, overview });
}

async function getComprehensiveTacticalData() {
  // Return a comprehensive overview of all tactical data
  const data = {
    timestamp: new Date().toISOString(),
    summary: {}
  };

  // Get summary statistics
  const summary = await prisma.$queryRawUnsafe(`
    SELECT 
      (SELECT COUNT(*) FROM tactical.operations WHERE status = 'active') as active_operations,
      (SELECT COUNT(*) FROM tactical.assets WHERE status = 'operational') as operational_assets,
      (SELECT COUNT(*) FROM geospatial.geofences WHERE is_active = true) as active_geofences,
      (SELECT COUNT(*) FROM emergency_alerts WHERE status = 'active') as active_emergencies,
      (SELECT COUNT(*) FROM communication_sessions WHERE status = 'active') as active_communications,
      (SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '1 hour') as active_users
  `);

  data.summary = summary[0];

  return NextResponse.json({ success: true, data });
}

// POST Functions

async function createOperation(data: any) {
  const operation = await prisma.$queryRawUnsafe(`
    INSERT INTO tactical.operations (
      name, description, status, priority, start_time, end_time, metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    ) RETURNING id, name, status, created_at
  `,
    data.name,
    data.description,
    data.status || 'planning',
    data.priority || 'medium',
    data.startTime ? new Date(data.startTime) : null,
    data.endTime ? new Date(data.endTime) : null,
    JSON.stringify(data.metadata || {})
  );

  return NextResponse.json({ 
    success: true, 
    operation: operation[0],
    message: 'Operation created successfully'
  });
}

async function updateOperation(data: any) {
  const { operationId, updates } = data;

  await prisma.$queryRawUnsafe(`
    UPDATE tactical.operations 
    SET 
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      status = COALESCE($3, status),
      priority = COALESCE($4, priority),
      metadata = COALESCE($5, metadata),
      updated_at = NOW()
    WHERE id = $6
  `,
    updates.name,
    updates.description,
    updates.status,
    updates.priority,
    updates.metadata ? JSON.stringify(updates.metadata) : null,
    operationId
  );

  return NextResponse.json({ 
    success: true, 
    message: 'Operation updated successfully'
  });
}

async function createAsset(data: any) {
  const asset = await prisma.$queryRawUnsafe(`
    INSERT INTO tactical.assets (
      name, asset_type, status, operation_id, specifications, metadata
    ) VALUES (
      $1, $2, $3, $4, $5, $6
    ) RETURNING id, name, asset_type, status, created_at
  `,
    data.name,
    data.assetType,
    data.status || 'available',
    data.operationId,
    JSON.stringify(data.specifications || {}),
    JSON.stringify(data.metadata || {})
  );

  return NextResponse.json({ 
    success: true, 
    asset: asset[0],
    message: 'Asset created successfully'
  });
}

async function updateAsset(data: any) {
  const { assetId, updates } = data;

  await prisma.$queryRawUnsafe(`
    UPDATE tactical.assets 
    SET 
      name = COALESCE($1, name),
      status = COALESCE($2, status),
      specifications = COALESCE($3, specifications),
      metadata = COALESCE($4, metadata),
      updated_at = NOW()
    WHERE id = $5
  `,
    updates.name,
    updates.status,
    updates.specifications ? JSON.stringify(updates.specifications) : null,
    updates.metadata ? JSON.stringify(updates.metadata) : null,
    assetId
  );

  return NextResponse.json({ 
    success: true, 
    message: 'Asset updated successfully'
  });
}

async function createGeofence(data: any) {
  const geofence = await prisma.$queryRawUnsafe(`
    INSERT INTO geospatial.geofences (
      name, geofence_type, geometry, trigger_conditions, actions, is_active, metadata
    ) VALUES (
      $1, $2, ST_GeomFromGeoJSON($3), $4, $5, $6, $7
    ) RETURNING id, name, geofence_type, created_at
  `,
    data.name,
    data.geofenceType,
    JSON.stringify(data.geometry),
    JSON.stringify(data.triggerConditions || {}),
    JSON.stringify(data.actions || []),
    data.isActive !== false,
    JSON.stringify(data.metadata || {})
  );

  return NextResponse.json({ 
    success: true, 
    geofence: geofence[0],
    message: 'Geofence created successfully'
  });
}

async function updateGeofence(data: any) {
  const { geofenceId, updates } = data;

  await prisma.$queryRawUnsafe(`
    UPDATE geospatial.geofences 
    SET 
      name = COALESCE($1, name),
      geometry = COALESCE(ST_GeomFromGeoJSON($2), geometry),
      trigger_conditions = COALESCE($3, trigger_conditions),
      actions = COALESCE($4, actions),
      is_active = COALESCE($5, is_active),
      metadata = COALESCE($6, metadata),
      updated_at = NOW()
    WHERE id = $7
  `,
    updates.name,
    updates.geometry ? JSON.stringify(updates.geometry) : null,
    updates.triggerConditions ? JSON.stringify(updates.triggerConditions) : null,
    updates.actions ? JSON.stringify(updates.actions) : null,
    updates.isActive,
    updates.metadata ? JSON.stringify(updates.metadata) : null,
    geofenceId
  );

  return NextResponse.json({ 
    success: true, 
    message: 'Geofence updated successfully'
  });
}

async function addMapAnnotation(data: any) {
  const annotation = await prisma.$queryRawUnsafe(`
    INSERT INTO geospatial.map_annotations (
      geometry, annotation_type, content, style, created_by, metadata
    ) VALUES (
      ST_GeomFromGeoJSON($1), $2, $3, $4, $5, $6
    ) RETURNING id, annotation_type, created_at
  `,
    JSON.stringify(data.geometry),
    data.annotationType,
    JSON.stringify(data.content),
    JSON.stringify(data.style || {}),
    data.createdBy,
    JSON.stringify(data.metadata || {})
  );

  return NextResponse.json({ 
    success: true, 
    annotation: annotation[0],
    message: 'Map annotation added successfully'
  });
}

async function updateLocation(data: any) {
  const { deviceId, latitude, longitude, accuracy, altitude, speed, heading, metadata } = data;

  await prisma.$queryRawUnsafe(`
    INSERT INTO geospatial.location_history (
      device_id, location, accuracy, altitude, speed, heading, timestamp, metadata
    ) VALUES (
      $1, ST_GeomFromText($2, 4326), $3, $4, $5, $6, NOW(), $7
    )
  `,
    deviceId,
    `POINT(${longitude} ${latitude})`,
    accuracy,
    altitude,
    speed,
    heading,
    JSON.stringify(metadata || {})
  );

  return NextResponse.json({ 
    success: true, 
    message: 'Location updated successfully'
  });
}

async function processIntelligence(data: any) {
  await prisma.$queryRawUnsafe(`
    INSERT INTO system_metrics (
      metric_name, metric_value, source, tags, metadata
    ) VALUES (
      'intelligence_processed', 1, $1, $2, $3
    )
  `,
    data.source || 'tactical_system',
    JSON.stringify({
      analysis_type: data.analysisType,
      priority: data.priority,
      classification: data.classification
    }),
    JSON.stringify({
      intelligence_data: data.intelligenceData,
      analysis_results: data.analysisResults,
      processed_at: new Date().toISOString()
    })
  );

  return NextResponse.json({ 
    success: true, 
    message: 'Intelligence processed successfully'
  });
}

async function startCommunicationSession(data: any) {
  const session = await prisma.$queryRawUnsafe(`
    INSERT INTO communication_sessions (
      session_type, participants, operation_id, status, metadata
    ) VALUES (
      $1, $2, $3, 'active', $4
    ) RETURNING id, session_type, status, created_at
  `,
    data.sessionType,
    JSON.stringify(data.participants || []),
    data.operationId,
    JSON.stringify(data.metadata || {})
  );

  return NextResponse.json({ 
    success: true, 
    session: session[0],
    message: 'Communication session started successfully'
  });
}