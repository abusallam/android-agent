/**
 * Tactical Map API Routes
 * Handles map annotations, geofences, and collaborative features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db-init';
import { z } from 'zod';

// Validation schemas
const MapAnnotationSchema = z.object({
  type: z.enum(['marker', 'polygon', 'polyline', 'circle', 'rectangle']),
  coordinates: z.any(), // GeoJSON coordinates
  properties: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    strokeColor: z.string().optional(),
    fillColor: z.string().optional(),
    strokeWidth: z.number().optional(),
    icon: z.string().optional(),
  }).optional(),
  layerId: z.string().optional(),
});

const GeofenceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['circle', 'polygon']),
  coordinates: z.any(), // GeoJSON coordinates
  radius: z.number().optional(),
  triggerType: z.enum(['enter', 'exit', 'dwell']),
  alertLevel: z.enum(['info', 'warning', 'critical']),
  isActive: z.boolean().default(true),
});

const MapLayerSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['geojson', 'kml', 'raster', 'vector']),
  data: z.any(),
  isVisible: z.boolean().default(true),
  isPublic: z.boolean().default(false),
});

// GET /api/tactical/map - Get all map data
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const layerId = searchParams.get('layerId');
    const includeGeofences = searchParams.get('includeGeofences') === 'true';
    const includeAnnotations = searchParams.get('includeAnnotations') === 'true';

    const result: any = {};

    // Get map layers
    const layers = await prisma.mapLayer.findMany({
      where: {
        OR: [
          { isPublic: true },
          { createdBy: session.user.id },
        ],
        ...(layerId && { id: layerId }),
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
        annotations: includeAnnotations,
      },
      orderBy: { createdAt: 'desc' },
    });

    result.layers = layers;

    // Get annotations if requested
    if (includeAnnotations && !layerId) {
      const annotations = await prisma.mapAnnotation.findMany({
        where: {
          layer: {
            OR: [
              { isPublic: true },
              { createdBy: session.user.id },
            ],
          },
        },
        include: {
          user: {
            select: { id: true, username: true },
          },
          layer: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      result.annotations = annotations;
    }

    // Get geofences if requested
    if (includeGeofences) {
      const geofences = await prisma.geofence.findMany({
        where: {
          OR: [
            { createdBy: session.user.id },
            { isActive: true }, // Active geofences visible to all
          ],
        },
        include: {
          user: {
            select: { id: true, username: true },
          },
          triggers: {
            include: {
              device: {
                select: { id: true, name: true },
              },
            },
            orderBy: { triggeredAt: 'desc' },
            take: 10, // Last 10 triggers
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      result.geofences = geofences;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}

// POST /api/tactical/map - Create map annotation, geofence, or layer
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    switch (type) {
      case 'annotation':
        return await createAnnotation(data, session.user.id);
      case 'geofence':
        return await createGeofence(data, session.user.id);
      case 'layer':
        return await createLayer(data, session.user.id);
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be annotation, geofence, or layer' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating map item:', error);
    return NextResponse.json(
      { error: 'Failed to create map item' },
      { status: 500 }
    );
  }
}

// PUT /api/tactical/map - Update map annotation, geofence, or layer
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for updates' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'annotation':
        return await updateAnnotation(id, data, session.user.id);
      case 'geofence':
        return await updateGeofence(id, data, session.user.id);
      case 'layer':
        return await updateLayer(id, data, session.user.id);
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be annotation, geofence, or layer' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating map item:', error);
    return NextResponse.json(
      { error: 'Failed to update map item' },
      { status: 500 }
    );
  }
}

// DELETE /api/tactical/map - Delete map annotation, geofence, or layer
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'annotation':
        return await deleteAnnotation(id, session.user.id);
      case 'geofence':
        return await deleteGeofence(id, session.user.id);
      case 'layer':
        return await deleteLayer(id, session.user.id);
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be annotation, geofence, or layer' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error deleting map item:', error);
    return NextResponse.json(
      { error: 'Failed to delete map item' },
      { status: 500 }
    );
  }
}

// Helper functions
async function createAnnotation(data: any, userId: string) {
  const validatedData = MapAnnotationSchema.parse(data);
  
  const annotation = await prisma.mapAnnotation.create({
    data: {
      ...validatedData,
      coordinates: JSON.stringify(validatedData.coordinates),
      properties: JSON.stringify(validatedData.properties || {}),
      createdBy: userId,
      layerId: validatedData.layerId || await getDefaultLayerId(userId),
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
      layer: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(annotation);
}

async function createGeofence(data: any, userId: string) {
  const validatedData = GeofenceSchema.parse(data);
  
  const geofence = await prisma.geofence.create({
    data: {
      ...validatedData,
      geometry: JSON.stringify({
        type: validatedData.type === 'circle' ? 'Point' : 'Polygon',
        coordinates: validatedData.coordinates,
        ...(validatedData.radius && { radius: validatedData.radius }),
      }),
      createdBy: userId,
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });

  return NextResponse.json(geofence);
}

async function createLayer(data: any, userId: string) {
  const validatedData = MapLayerSchema.parse(data);
  
  const layer = await prisma.mapLayer.create({
    data: {
      ...validatedData,
      layerData: JSON.stringify(validatedData.data),
      createdBy: userId,
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });

  return NextResponse.json(layer);
}

async function updateAnnotation(id: string, data: any, userId: string) {
  const validatedData = MapAnnotationSchema.partial().parse(data);
  
  const annotation = await prisma.mapAnnotation.update({
    where: {
      id,
      createdBy: userId, // Ensure user owns the annotation
    },
    data: {
      ...validatedData,
      ...(validatedData.coordinates && {
        coordinates: JSON.stringify(validatedData.coordinates),
      }),
      ...(validatedData.properties && {
        properties: JSON.stringify(validatedData.properties),
      }),
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
      layer: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(annotation);
}

async function updateGeofence(id: string, data: any, userId: string) {
  const validatedData = GeofenceSchema.partial().parse(data);
  
  const geofence = await prisma.geofence.update({
    where: {
      id,
      createdBy: userId, // Ensure user owns the geofence
    },
    data: {
      ...validatedData,
      ...(validatedData.coordinates && {
        geometry: JSON.stringify({
          type: validatedData.type === 'circle' ? 'Point' : 'Polygon',
          coordinates: validatedData.coordinates,
          ...(validatedData.radius && { radius: validatedData.radius }),
        }),
      }),
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });

  return NextResponse.json(geofence);
}

async function updateLayer(id: string, data: any, userId: string) {
  const validatedData = MapLayerSchema.partial().parse(data);
  
  const layer = await prisma.mapLayer.update({
    where: {
      id,
      createdBy: userId, // Ensure user owns the layer
    },
    data: {
      ...validatedData,
      ...(validatedData.data && {
        layerData: JSON.stringify(validatedData.data),
      }),
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });

  return NextResponse.json(layer);
}

async function deleteAnnotation(id: string, userId: string) {
  await prisma.mapAnnotation.delete({
    where: {
      id,
      createdBy: userId, // Ensure user owns the annotation
    },
  });

  return NextResponse.json({ success: true });
}

async function deleteGeofence(id: string, userId: string) {
  await prisma.geofence.delete({
    where: {
      id,
      createdBy: userId, // Ensure user owns the geofence
    },
  });

  return NextResponse.json({ success: true });
}

async function deleteLayer(id: string, userId: string) {
  await prisma.mapLayer.delete({
    where: {
      id,
      createdBy: userId, // Ensure user owns the layer
    },
  });

  return NextResponse.json({ success: true });
}

async function getDefaultLayerId(userId: string): Promise<string> {
  let defaultLayer = await prisma.mapLayer.findFirst({
    where: {
      createdBy: userId,
      name: 'Default Layer',
    },
  });

  if (!defaultLayer) {
    defaultLayer = await prisma.mapLayer.create({
      data: {
        name: 'Default Layer',
        description: 'Default layer for map annotations',
        type: 'geojson',
        layerData: JSON.stringify({ type: 'FeatureCollection', features: [] }),
        isVisible: true,
        isPublic: false,
        createdBy: userId,
      },
    });
  }

  return defaultLayer.id;
}