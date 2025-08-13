/**
 * Real-time Tactical Map Updates API
 * WebSocket-like functionality for live tactical data updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Store active connections (in production, use Redis or similar)
const activeConnections = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const lastUpdate = searchParams.get('lastUpdate');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get updates since last timestamp
    const since = lastUpdate ? new Date(lastUpdate) : new Date(Date.now() - 60000); // Last minute

    const updates = await getRecentUpdates(since);

    return NextResponse.json({
      updates,
      timestamp: new Date().toISOString(),
      sessionId
    });

  } catch (error) {
    console.error('Error fetching real-time updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, type, data } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Process real-time update
    const result = await processRealtimeUpdate(type, data, sessionId);

    // Broadcast to other sessions (in production, use WebSocket or Server-Sent Events)
    broadcastUpdate(sessionId, { type, data, timestamp: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing real-time update:', error);
    return NextResponse.json(
      { error: 'Failed to process update' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function getRecentUpdates(since: Date) {
  const updates = [];

  // Device location updates
  const deviceUpdates = await prisma.$queryRawUnsafe(`
    SELECT 
      'device_location_update' as type,
      d.id as device_id,
      d.device_name as name,
      ST_X(d.current_location) as longitude,
      ST_Y(d.current_location) as latitude,
      d.location_accuracy as accuracy,
      d.altitude,
      d.heading,
      d.speed,
      d.battery_level,
      d.location_updated_at as timestamp
    FROM devices d
    WHERE d.location_updated_at > $1
      AND d.current_location IS NOT NULL
    ORDER BY d.location_updated_at DESC
  `, since);

  updates.push(...deviceUpdates);

  // Emergency alert updates
  const alertUpdates = await prisma.$queryRawUnsafe(`
    SELECT 
      'emergency_alert_update' as type,
      ea.id as alert_id,
      ea.alert_type,
      ea.severity,
      ea.title,
      ea.status,
      ST_X(ea.location) as longitude,
      ST_Y(ea.location) as latitude,
      ea.updated_at as timestamp
    FROM emergency_alerts ea
    WHERE ea.updated_at > $1
    ORDER BY ea.updated_at DESC
  `, since);

  updates.push(...alertUpdates);

  // Tactical asset updates
  const assetUpdates = await prisma.$queryRawUnsafe(`
    SELECT 
      'tactical_asset_update' as type,
      ta.id as asset_id,
      ta.name,
      ta.asset_type,
      ta.status,
      ST_X(ta.current_location) as longitude,
      ST_Y(ta.current_location) as latitude,
      ta.updated_at as timestamp
    FROM tactical.assets ta
    WHERE ta.updated_at > $1
      AND ta.current_location IS NOT NULL
    ORDER BY ta.updated_at DESC
  `, since);

  updates.push(...assetUpdates);

  // Operation status updates
  const operationUpdates = await prisma.$queryRawUnsafe(`
    SELECT 
      'operation_status_update' as type,
      to_op.id as operation_id,
      to_op.name,
      to_op.status,
      to_op.priority,
      ST_X(to_op.center_point) as longitude,
      ST_Y(to_op.center_point) as latitude,
      to_op.updated_at as timestamp
    FROM tactical.operations to_op
    WHERE to_op.updated_at > $1
    ORDER BY to_op.updated_at DESC
  `, since);

  updates.push(...operationUpdates);

  // Sort all updates by timestamp
  return updates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

async function processRealtimeUpdate(type: string, data: any, sessionId: string) {
  switch (type) {
    case 'device_location_update':
      return await prisma.$queryRawUnsafe(`
        UPDATE devices 
        SET current_location = ST_GeomFromText($1, 4326),
            location_updated_at = NOW(),
            location_accuracy = $2,
            altitude = $3,
            heading = $4,
            speed = $5,
            battery_level = $6
        WHERE id = $7
        RETURNING id
      `, 
        `POINT(${data.longitude} ${data.latitude})`,
        data.accuracy,
        data.altitude,
        data.heading,
        data.speed,
        data.batteryLevel,
        data.deviceId
      );

    case 'emergency_alert_create':
      return await prisma.$queryRawUnsafe(`
        INSERT INTO emergency_alerts (
          alert_type, severity, title, description, location, created_by, status
        ) VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326), $6, 'active')
        RETURNING id
      `,
        data.alertType,
        data.severity,
        data.title,
        data.description,
        `POINT(${data.longitude} ${data.latitude})`,
        data.createdBy
      );

    case 'tactical_asset_update':
      return await prisma.$queryRawUnsafe(`
        UPDATE tactical.assets 
        SET current_location = ST_GeomFromText($1, 4326),
            status = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING id
      `,
        `POINT(${data.longitude} ${data.latitude})`,
        data.status,
        data.assetId
      );

    case 'annotation_create':
      return await prisma.$queryRawUnsafe(`
        INSERT INTO geospatial.map_features (
          name, description, geometry, properties, created_by
        ) VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4, $5)
        RETURNING id
      `,
        data.name,
        data.description,
        JSON.stringify(data.geometry),
        JSON.stringify(data.properties),
        data.createdBy
      );

    case 'geofence_violation':
      // Log geofence violation and create alert if needed
      const violation = await prisma.$queryRawUnsafe(`
        INSERT INTO system_metrics (
          metric_name, metric_value, source, tags, metadata
        ) VALUES ('geofence_violation', 1, 'tactical_map', $1, $2)
        RETURNING id
      `,
        JSON.stringify({ geofenceId: data.geofenceId, deviceId: data.deviceId }),
        JSON.stringify({
          violationType: data.violationType,
          timestamp: new Date().toISOString(),
          sessionId
        })
      );

      // Create emergency alert for critical geofence violations
      if (data.alertLevel === 'critical') {
        await prisma.$queryRawUnsafe(`
          INSERT INTO emergency_alerts (
            alert_type, severity, title, description, location, created_by, status
          ) VALUES ('geofence_violation', 'high', $1, $2, ST_GeomFromText($3, 4326), $4, 'active')
        `,
          `Geofence Violation: ${data.geofenceName}`,
          `Device ${data.deviceName} has violated geofence ${data.geofenceName}`,
          `POINT(${data.longitude} ${data.latitude})`,
          'system'
        );
      }

      return violation;

    default:
      throw new Error(`Unknown update type: ${type}`);
  }
}

function broadcastUpdate(excludeSessionId: string, update: any) {
  // In production, this would use WebSocket or Server-Sent Events
  // For now, we'll store updates that can be polled
  for (const [sessionId, connection] of activeConnections.entries()) {
    if (sessionId !== excludeSessionId) {
      // Add update to connection's pending updates
      if (!connection.pendingUpdates) {
        connection.pendingUpdates = [];
      }
      connection.pendingUpdates.push(update);
    }
  }
}

// Utility function to register a session
export async function registerSession(sessionId: string, metadata: any) {
  activeConnections.set(sessionId, {
    sessionId,
    metadata,
    connectedAt: new Date(),
    pendingUpdates: []
  });
}

// Utility function to unregister a session
export async function unregisterSession(sessionId: string) {
  activeConnections.delete(sessionId);
}