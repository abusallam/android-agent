/**
 * Tactical Map Data API
 * Provides comprehensive tactical data for the ATAK-inspired mapping system
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bbox = searchParams.get('bbox'); // Format: "minLng,minLat,maxLng,maxLat"
    const includeDevices = searchParams.get('devices') !== 'false';
    const includeAssets = searchParams.get('assets') !== 'false';
    const includeAlerts = searchParams.get('alerts') !== 'false';
    const includeOperations = searchParams.get('operations') !== 'false';
    const includeGeofences = searchParams.get('geofences') !== 'false';

    // Parse bounding box if provided
    let boundingBox = null;
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      boundingBox = {
        minLng, minLat, maxLng, maxLat
      };
    }

    const mapData: any = {};

    // Fetch devices with current locations
    if (includeDevices) {
      const devicesQuery = `
        SELECT 
          d.id,
          d.device_name as name,
          d.device_type,
          d.is_active,
          d.battery_level,
          d.network_type,
          d.last_seen,
          ST_X(d.current_location) as longitude,
          ST_Y(d.current_location) as latitude,
          d.location_accuracy as accuracy,
          d.altitude,
          d.heading,
          d.speed,
          d.location_updated_at as timestamp,
          d.capabilities,
          d.metadata,
          CASE 
            WHEN d.last_seen > NOW() - INTERVAL '5 minutes' AND d.is_active THEN 'active'
            WHEN d.last_seen > NOW() - INTERVAL '30 minutes' AND d.is_active THEN 'idle'
            WHEN d.is_active THEN 'offline'
            ELSE 'offline'
          END as status
        FROM devices d
        WHERE d.current_location IS NOT NULL
        ${boundingBox ? `
          AND ST_Within(
            d.current_location,
            ST_MakeEnvelope(${boundingBox.minLng}, ${boundingBox.minLat}, ${boundingBox.maxLng}, ${boundingBox.maxLat}, 4326)
          )
        ` : ''}
        ORDER BY d.last_seen DESC
      `;

      const devices = await prisma.$queryRawUnsafe(devicesQuery);
      mapData.devices = devices;
    }

    // Fetch tactical assets
    if (includeAssets) {
      const assetsQuery = `
        SELECT 
          ta.id,
          ta.name,
          ta.asset_type,
          ta.status,
          ST_X(ta.current_location) as longitude,
          ST_Y(ta.current_location) as latitude,
          ta.assigned_operation,
          ta.assigned_to,
          ta.capabilities,
          ta.specifications,
          ta.metadata,
          to_id.name as operation_name,
          u.username as assigned_user
        FROM tactical.assets ta
        LEFT JOIN tactical.operations to_id ON ta.assigned_operation = to_id.id
        LEFT JOIN users u ON ta.assigned_to = u.id
        WHERE ta.current_location IS NOT NULL
        ${boundingBox ? `
          AND ST_Within(
            ta.current_location,
            ST_MakeEnvelope(${boundingBox.minLng}, ${boundingBox.minLat}, ${boundingBox.maxLng}, ${boundingBox.maxLat}, 4326)
          )
        ` : ''}
        ORDER BY ta.updated_at DESC
      `;

      const assets = await prisma.$queryRawUnsafe(assetsQuery);
      mapData.tacticalAssets = assets;
    }

    // Fetch emergency alerts
    if (includeAlerts) {
      const alertsQuery = `
        SELECT 
          ea.id,
          ea.alert_type,
          ea.severity,
          ea.title,
          ea.description,
          ST_X(ea.location) as longitude,
          ST_Y(ea.location) as latitude,
          ea.address,
          ea.radius_meters,
          ea.status,
          ea.created_at,
          ea.assigned_to,
          ea.response_log,
          ea.metadata,
          u.username as created_by_user
        FROM emergency_alerts ea
        LEFT JOIN users u ON ea.created_by = u.id
        WHERE ea.location IS NOT NULL
          AND ea.status IN ('active', 'acknowledged', 'responding')
        ${boundingBox ? `
          AND ST_Within(
            ea.location,
            ST_MakeEnvelope(${boundingBox.minLng}, ${boundingBox.minLat}, ${boundingBox.maxLng}, ${boundingBox.maxLat}, 4326)
          )
        ` : ''}
        ORDER BY ea.created_at DESC
      `;

      const alerts = await prisma.$queryRawUnsafe(alertsQuery);
      mapData.emergencyAlerts = alerts;
    }

    // Fetch tactical operations
    if (includeOperations) {
      const operationsQuery = `
        SELECT 
          to_op.id,
          to_op.name,
          to_op.description,
          to_op.operation_type,
          to_op.status,
          to_op.priority,
          ST_AsGeoJSON(to_op.operation_area) as operation_area,
          ST_X(to_op.center_point) as center_longitude,
          ST_Y(to_op.center_point) as center_latitude,
          to_op.assigned_to,
          to_op.objectives,
          to_op.start_time,
          to_op.end_time,
          to_op.resources,
          to_op.metadata,
          u.username as created_by_user
        FROM tactical.operations to_op
        LEFT JOIN users u ON to_op.created_by = u.id
        WHERE to_op.status IN ('planning', 'active')
        ${boundingBox ? `
          AND (
            to_op.center_point IS NULL OR
            ST_Within(
              to_op.center_point,
              ST_MakeEnvelope(${boundingBox.minLng}, ${boundingBox.minLat}, ${boundingBox.maxLng}, ${boundingBox.maxLat}, 4326)
            )
          )
        ` : ''}
        ORDER BY to_op.created_at DESC
      `;

      const operations = await prisma.$queryRawUnsafe(operationsQuery);
      mapData.tacticalOperations = operations;
    }

    // Fetch geofences
    if (includeGeofences) {
      const geofencesQuery = `
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
          u.username as created_by_user
        FROM geospatial.geofences gf
        LEFT JOIN users u ON gf.created_by = u.id
        WHERE gf.is_active = true
        ${boundingBox ? `
          AND ST_Intersects(
            gf.geometry,
            ST_MakeEnvelope(${boundingBox.minLng}, ${boundingBox.minLat}, ${boundingBox.maxLng}, ${boundingBox.maxLat}, 4326)
          )
        ` : ''}
        ORDER BY gf.created_at DESC
      `;

      const geofences = await prisma.$queryRawUnsafe(geofencesQuery);
      mapData.geofences = geofences;
    }

    // Add metadata
    mapData.metadata = {
      timestamp: new Date().toISOString(),
      boundingBox,
      counts: {
        devices: mapData.devices?.length || 0,
        tacticalAssets: mapData.tacticalAssets?.length || 0,
        emergencyAlerts: mapData.emergencyAlerts?.length || 0,
        tacticalOperations: mapData.tacticalOperations?.length || 0,
        geofences: mapData.geofences?.length || 0,
      }
    };

    return NextResponse.json(mapData);

  } catch (error) {
    console.error('Error fetching tactical map data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tactical map data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'create_annotation':
        const annotation = await prisma.$queryRawUnsafe(`
          INSERT INTO geospatial.map_features (
            name, description, geometry, properties, created_by
          ) VALUES (
            $1, $2, ST_GeomFromGeoJSON($3), $4, $5
          ) RETURNING id
        `, data.name, data.description, data.geometry, data.properties, data.createdBy);
        
        return NextResponse.json({ success: true, id: annotation[0].id });

      case 'create_geofence':
        const geofence = await prisma.$queryRawUnsafe(`
          INSERT INTO geospatial.geofences (
            name, description, geometry, fence_type, alert_on_enter, alert_on_exit, created_by
          ) VALUES (
            $1, $2, ST_GeomFromGeoJSON($3), $4, $5, $6, $7
          ) RETURNING id
        `, data.name, data.description, data.geometry, data.fenceType, data.alertOnEnter, data.alertOnExit, data.createdBy);
        
        return NextResponse.json({ success: true, id: geofence[0].id });

      case 'update_device_location':
        await prisma.$queryRawUnsafe(`
          UPDATE devices 
          SET current_location = ST_GeomFromText($1, 4326),
              location_updated_at = NOW(),
              location_accuracy = $2,
              altitude = $3,
              heading = $4,
              speed = $5
          WHERE id = $6
        `, `POINT(${data.longitude} ${data.latitude})`, data.accuracy, data.altitude, data.heading, data.speed, data.deviceId);
        
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Unknown operation type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing tactical map operation:', error);
    return NextResponse.json(
      { error: 'Failed to process operation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}