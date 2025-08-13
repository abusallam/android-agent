/**
 * Geofencing and Alert System API
 * Real-time geofence monitoring and automated alert generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const deviceId = searchParams.get('deviceId');
    const geofenceId = searchParams.get('geofenceId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    switch (action) {
      case 'check_violations':
        if (!deviceId || !lat || !lng) {
          return NextResponse.json(
            { error: 'Device ID, latitude, and longitude required' },
            { status: 400 }
          );
        }

        const violations = await checkGeofenceViolations(deviceId, parseFloat(lat), parseFloat(lng));
        return NextResponse.json({ violations });

      case 'get_active_geofences':
        const geofences = await getActiveGeofences();
        return NextResponse.json({ geofences });

      case 'get_violation_history':
        const history = await getViolationHistory(deviceId, geofenceId);
        return NextResponse.json({ history });

      default:
        // Get all geofences with statistics
        const allGeofences = await prisma.$queryRawUnsafe(`
          SELECT 
            gf.id,
            gf.name,
            gf.description,
            ST_AsGeoJSON(gf.geometry) as geometry,
            gf.fence_type,
            gf.alert_on_enter,
            gf.alert_on_exit,
            gf.alert_on_dwell,
            gf.dwell_time_minutes,
            gf.is_active,
            gf.metadata,
            gf.created_at,
            u.username as created_by_user,
            COUNT(DISTINCT sm.id) as violation_count,
            MAX(sm.timestamp) as last_violation
          FROM geospatial.geofences gf
          LEFT JOIN users u ON gf.created_by = u.id
          LEFT JOIN system_metrics sm ON sm.metric_name = 'geofence_violation' 
            AND sm.tags->>'geofenceId' = gf.id::text
          GROUP BY gf.id, u.username
          ORDER BY gf.created_at DESC
        `);

        return NextResponse.json({
          geofences: allGeofences,
          metadata: {
            total: allGeofences.length,
            active: allGeofences.filter(g => g.is_active).length,
            timestamp: new Date().toISOString()
          }
        });
    }

  } catch (error) {
    console.error('Error in geofencing API:', error);
    return NextResponse.json(
      { error: 'Failed to process geofencing request' },
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
      case 'create_geofence':
        const newGeofence = await createGeofence(data);
        return NextResponse.json({ success: true, geofenceId: newGeofence.id });

      case 'update_geofence':
        await updateGeofence(data.geofenceId, data);
        return NextResponse.json({ success: true });

      case 'check_device_location':
        const violations = await checkGeofenceViolations(data.deviceId, data.latitude, data.longitude);
        
        // Process violations and create alerts if needed
        for (const violation of violations) {
          await processGeofenceViolation(violation, data.deviceId, data.latitude, data.longitude);
        }

        return NextResponse.json({ 
          success: true, 
          violations: violations.length,
          alerts: violations.filter(v => v.alertLevel === 'critical').length
        });

      case 'bulk_location_check':
        const results = [];
        for (const location of data.locations) {
          const deviceViolations = await checkGeofenceViolations(
            location.deviceId, 
            location.latitude, 
            location.longitude
          );
          results.push({
            deviceId: location.deviceId,
            violations: deviceViolations.length,
            alerts: deviceViolations.filter(v => v.alertLevel === 'critical').length
          });

          // Process violations
          for (const violation of deviceViolations) {
            await processGeofenceViolation(violation, location.deviceId, location.latitude, location.longitude);
          }
        }

        return NextResponse.json({ success: true, results });

      case 'acknowledge_violation':
        await acknowledgeViolation(data.violationId, data.acknowledgedBy);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing geofencing operation:', error);
    return NextResponse.json(
      { error: 'Failed to process operation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const geofenceId = searchParams.get('geofenceId');

    if (!geofenceId) {
      return NextResponse.json(
        { error: 'Geofence ID required' },
        { status: 400 }
      );
    }

    await prisma.$queryRawUnsafe(`
      DELETE FROM geospatial.geofences WHERE id = $1
    `, geofenceId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting geofence:', error);
    return NextResponse.json(
      { error: 'Failed to delete geofence' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions

async function checkGeofenceViolations(deviceId: string, latitude: number, longitude: number) {
  const violations = await prisma.$queryRawUnsafe(`
    SELECT 
      gf.id as geofence_id,
      gf.name as geofence_name,
      gf.fence_type,
      gf.alert_on_enter,
      gf.alert_on_exit,
      gf.alert_on_dwell,
      gf.dwell_time_minutes,
      gf.metadata,
      CASE 
        WHEN gf.fence_type = 'inclusion' AND ST_Within(ST_GeomFromText($1, 4326), gf.geometry) THEN 'inside'
        WHEN gf.fence_type = 'exclusion' AND ST_Within(ST_GeomFromText($1, 4326), gf.geometry) THEN 'violation'
        WHEN gf.fence_type = 'inclusion' AND NOT ST_Within(ST_GeomFromText($1, 4326), gf.geometry) THEN 'violation'
        ELSE 'outside'
      END as violation_type,
      ST_Distance(ST_GeogFromText($1), ST_GeogFromText(ST_AsText(gf.geometry))) as distance_meters
    FROM geospatial.geofences gf
    WHERE gf.is_active = true
      AND (
        (gf.fence_type = 'inclusion' AND NOT ST_Within(ST_GeomFromText($1, 4326), gf.geometry))
        OR
        (gf.fence_type = 'exclusion' AND ST_Within(ST_GeomFromText($1, 4326), gf.geometry))
      )
  `, `POINT(${longitude} ${latitude})`);

  return violations.map(v => ({
    ...v,
    alertLevel: determineAlertLevel(v),
    deviceId,
    latitude,
    longitude,
    timestamp: new Date().toISOString()
  }));
}

async function createGeofence(data: any) {
  const result = await prisma.$queryRawUnsafe(`
    INSERT INTO geospatial.geofences (
      name, description, geometry, fence_type, alert_on_enter, 
      alert_on_exit, alert_on_dwell, dwell_time_minutes, 
      is_active, metadata, created_by
    ) VALUES (
      $1, $2, ST_GeomFromGeoJSON($3), $4, $5, $6, $7, $8, $9, $10, $11
    ) RETURNING id
  `,
    data.name,
    data.description,
    JSON.stringify(data.geometry),
    data.fenceType,
    data.alertOnEnter,
    data.alertOnExit,
    data.alertOnDwell,
    data.dwellTimeMinutes,
    data.isActive !== false,
    JSON.stringify(data.metadata || {}),
    data.createdBy
  );

  return result[0];
}

async function updateGeofence(geofenceId: string, data: any) {
  await prisma.$queryRawUnsafe(`
    UPDATE geospatial.geofences 
    SET name = $1,
        description = $2,
        geometry = ST_GeomFromGeoJSON($3),
        fence_type = $4,
        alert_on_enter = $5,
        alert_on_exit = $6,
        alert_on_dwell = $7,
        dwell_time_minutes = $8,
        is_active = $9,
        metadata = $10,
        updated_at = NOW()
    WHERE id = $11
  `,
    data.name,
    data.description,
    JSON.stringify(data.geometry),
    data.fenceType,
    data.alertOnEnter,
    data.alertOnExit,
    data.alertOnDwell,
    data.dwellTimeMinutes,
    data.isActive,
    JSON.stringify(data.metadata || {}),
    geofenceId
  );
}

async function processGeofenceViolation(violation: any, deviceId: string, latitude: number, longitude: number) {
  // Log the violation
  await prisma.$queryRawUnsafe(`
    INSERT INTO system_metrics (
      metric_name, metric_value, source, tags, metadata
    ) VALUES (
      'geofence_violation', 1, 'geofencing_system', $1, $2
    )
  `,
    JSON.stringify({
      geofenceId: violation.geofence_id,
      deviceId: deviceId,
      violationType: violation.violation_type
    }),
    JSON.stringify({
      geofenceName: violation.geofence_name,
      deviceId: deviceId,
      latitude: latitude,
      longitude: longitude,
      distance: violation.distance_meters,
      timestamp: violation.timestamp
    })
  );

  // Create emergency alert for critical violations
  if (violation.alertLevel === 'critical') {
    await prisma.$queryRawUnsafe(`
      INSERT INTO emergency_alerts (
        alert_type, severity, title, description, location, 
        radius_meters, status, created_by, metadata
      ) VALUES (
        'geofence_violation', 'high', $1, $2, ST_GeomFromText($3, 4326), 
        $4, 'active', 'system', $5
      )
    `,
      `Geofence Violation: ${violation.geofence_name}`,
      `Device ${deviceId} has violated ${violation.fence_type} geofence "${violation.geofence_name}"`,
      `POINT(${longitude} ${latitude})`,
      Math.round(violation.distance_meters),
      JSON.stringify({
        geofenceId: violation.geofence_id,
        deviceId: deviceId,
        violationType: violation.violation_type,
        autoGenerated: true
      })
    );
  }
}

async function getActiveGeofences() {
  return await prisma.$queryRawUnsafe(`
    SELECT 
      id,
      name,
      description,
      ST_AsGeoJSON(geometry) as geometry,
      fence_type,
      alert_on_enter,
      alert_on_exit,
      alert_on_dwell,
      dwell_time_minutes,
      metadata
    FROM geospatial.geofences
    WHERE is_active = true
    ORDER BY created_at DESC
  `);
}

async function getViolationHistory(deviceId?: string, geofenceId?: string) {
  let whereClause = "WHERE sm.metric_name = 'geofence_violation'";
  const params = [];
  let paramIndex = 1;

  if (deviceId) {
    whereClause += ` AND sm.tags->>'deviceId' = $${paramIndex}`;
    params.push(deviceId);
    paramIndex++;
  }

  if (geofenceId) {
    whereClause += ` AND sm.tags->>'geofenceId' = $${paramIndex}`;
    params.push(geofenceId);
    paramIndex++;
  }

  return await prisma.$queryRawUnsafe(`
    SELECT 
      sm.id,
      sm.timestamp,
      sm.tags,
      sm.metadata,
      gf.name as geofence_name,
      d.device_name
    FROM system_metrics sm
    LEFT JOIN geospatial.geofences gf ON gf.id::text = sm.tags->>'geofenceId'
    LEFT JOIN devices d ON d.id::text = sm.tags->>'deviceId'
    ${whereClause}
    ORDER BY sm.timestamp DESC
    LIMIT 100
  `, ...params);
}

async function acknowledgeViolation(violationId: string, acknowledgedBy: string) {
  await prisma.$queryRawUnsafe(`
    UPDATE system_metrics 
    SET metadata = metadata || $1
    WHERE id = $2 AND metric_name = 'geofence_violation'
  `,
    JSON.stringify({
      acknowledged: true,
      acknowledgedBy: acknowledgedBy,
      acknowledgedAt: new Date().toISOString()
    }),
    violationId
  );
}

function determineAlertLevel(violation: any): 'info' | 'warning' | 'critical' {
  // Determine alert level based on geofence metadata and violation type
  const metadata = violation.metadata || {};
  
  if (metadata.alertLevel) {
    return metadata.alertLevel;
  }

  if (violation.fence_type === 'exclusion' && violation.violation_type === 'violation') {
    return 'critical'; // Entering restricted area
  }

  if (violation.fence_type === 'inclusion' && violation.violation_type === 'violation') {
    return 'warning'; // Leaving safe area
  }

  return 'info';
}