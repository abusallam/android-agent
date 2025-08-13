/**
 * Map Layer Management API
 * Handles dynamic map layers, imports, and geospatial data management
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layerType = searchParams.get('type');
    const isActive = searchParams.get('active');
    const bbox = searchParams.get('bbox');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (layerType) {
      whereClause += ` AND ml.layer_type = $${paramIndex}`;
      params.push(layerType);
      paramIndex++;
    }

    if (isActive !== null) {
      whereClause += ` AND ml.is_active = $${paramIndex}`;
      params.push(isActive === 'true');
      paramIndex++;
    }

    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      whereClause += ` AND ST_Intersects(ml.bbox, ST_MakeEnvelope($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, 4326))`;
      params.push(minLng, minLat, maxLng, maxLat);
      paramIndex += 4;
    }

    const layersQuery = `
      SELECT 
        ml.id,
        ml.name,
        ml.description,
        ml.layer_type,
        ml.data_source,
        ml.geometry_type,
        ml.srid,
        ml.is_active,
        ml.is_public,
        ml.style_config,
        ml.metadata,
        ST_AsGeoJSON(ml.bbox) as bbox,
        ml.created_at,
        ml.updated_at,
        u.username as created_by_user,
        COUNT(mf.id) as feature_count
      FROM geospatial.map_layers ml
      LEFT JOIN users u ON ml.created_by = u.id
      LEFT JOIN geospatial.map_features mf ON ml.id = mf.layer_id AND mf.is_active = true
      ${whereClause}
      GROUP BY ml.id, u.username
      ORDER BY ml.created_at DESC
    `;

    const layers = await prisma.$queryRawUnsafe(layersQuery, ...params);

    return NextResponse.json({
      layers,
      metadata: {
        total: layers.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching map layers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map layers' },
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
      case 'create_layer':
        const newLayer = await prisma.$queryRawUnsafe(`
          INSERT INTO geospatial.map_layers (
            name, description, layer_type, data_source, geometry_type, 
            srid, is_active, is_public, style_config, metadata, created_by, bbox
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
            ST_GeomFromGeoJSON($12)
          ) RETURNING id
        `, 
          data.name,
          data.description,
          data.layerType,
          data.dataSource,
          data.geometryType,
          data.srid || 4326,
          data.isActive !== false,
          data.isPublic || false,
          JSON.stringify(data.styleConfig || {}),
          JSON.stringify(data.metadata || {}),
          data.createdBy,
          JSON.stringify(data.bbox)
        );

        return NextResponse.json({ 
          success: true, 
          layerId: newLayer[0].id 
        });

      case 'import_geojson':
        // Import GeoJSON data as features
        const layerId = data.layerId;
        const geojsonData = data.geojson;
        const createdBy = data.createdBy;

        if (!geojsonData.features || !Array.isArray(geojsonData.features)) {
          return NextResponse.json(
            { error: 'Invalid GeoJSON format' },
            { status: 400 }
          );
        }

        const importedFeatures = [];
        for (const feature of geojsonData.features) {
          const result = await prisma.$queryRawUnsafe(`
            INSERT INTO geospatial.map_features (
              layer_id, name, description, geometry, properties, created_by
            ) VALUES (
              $1, $2, $3, ST_GeomFromGeoJSON($4), $5, $6
            ) RETURNING id
          `,
            layerId,
            feature.properties?.name || 'Imported Feature',
            feature.properties?.description || '',
            JSON.stringify(feature.geometry),
            JSON.stringify(feature.properties || {}),
            createdBy
          );
          importedFeatures.push(result[0].id);
        }

        return NextResponse.json({
          success: true,
          importedCount: importedFeatures.length,
          featureIds: importedFeatures
        });

      case 'import_kml':
        // KML import would require additional parsing
        return NextResponse.json(
          { error: 'KML import not yet implemented' },
          { status: 501 }
        );

      case 'update_layer_style':
        await prisma.$queryRawUnsafe(`
          UPDATE geospatial.map_layers 
          SET style_config = $1, updated_at = NOW()
          WHERE id = $2
        `, JSON.stringify(data.styleConfig), data.layerId);

        return NextResponse.json({ success: true });

      case 'toggle_layer_visibility':
        await prisma.$queryRawUnsafe(`
          UPDATE geospatial.map_layers 
          SET is_active = $1, updated_at = NOW()
          WHERE id = $2
        `, data.isActive, data.layerId);

        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing map layer operation:', error);
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
    const layerId = searchParams.get('layerId');

    if (!layerId) {
      return NextResponse.json(
        { error: 'Layer ID required' },
        { status: 400 }
      );
    }

    // Delete all features in the layer first
    await prisma.$queryRawUnsafe(`
      DELETE FROM geospatial.map_features WHERE layer_id = $1
    `, layerId);

    // Delete the layer
    await prisma.$queryRawUnsafe(`
      DELETE FROM geospatial.map_layers WHERE id = $1
    `, layerId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting map layer:', error);
    return NextResponse.json(
      { error: 'Failed to delete layer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}