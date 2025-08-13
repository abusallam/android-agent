/**
 * Map Annotation and Collaboration API
 * Real-time collaborative map annotations with conflict resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Store active collaboration sessions (in production, use Redis)
const collaborationSessions = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layerId = searchParams.get('layerId');
    const bbox = searchParams.get('bbox');
    const annotationType = searchParams.get('type');
    const sessionId = searchParams.get('sessionId');

    let whereClause = 'WHERE mf.is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (layerId) {
      whereClause += ` AND mf.layer_id = $${paramIndex}`;
      params.push(layerId);
      paramIndex++;
    }

    if (annotationType) {
      whereClause += ` AND mf.properties->>'type' = $${paramIndex}`;
      params.push(annotationType);
      paramIndex++;
    }

    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      whereClause += ` AND ST_Intersects(mf.geometry, ST_MakeEnvelope($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, 4326))`;
      params.push(minLng, minLat, maxLng, maxLat);
      paramIndex += 4;
    }

    const annotationsQuery = `
      SELECT 
        mf.id,
        mf.layer_id,
        mf.name,
        mf.description,
        ST_AsGeoJSON(mf.geometry) as geometry,
        mf.properties,
        mf.created_at,
        mf.updated_at,
        mf.is_active,
        u.username as created_by_user,
        ml.name as layer_name
      FROM geospatial.map_features mf
      LEFT JOIN users u ON mf.created_by = u.id
      LEFT JOIN geospatial.map_layers ml ON mf.layer_id = ml.id
      ${whereClause}
      ORDER BY mf.updated_at DESC
    `;

    const annotations = await prisma.$queryRawUnsafe(annotationsQuery, ...params);

    // Get collaboration info if session ID provided
    let collaborationInfo = null;
    if (sessionId) {
      collaborationInfo = getCollaborationInfo(sessionId);
    }

    return NextResponse.json({
      annotations,
      collaboration: collaborationInfo,
      metadata: {
        total: annotations.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching map annotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, sessionId } = body;

    switch (action) {
      case 'create_annotation':
        const newAnnotation = await createAnnotation(data);
        
        // Broadcast to collaboration sessions
        if (sessionId) {
          broadcastCollaborationUpdate(sessionId, {
            type: 'annotation_created',
            data: newAnnotation,
            timestamp: new Date().toISOString()
          });
        }

        return NextResponse.json({ 
          success: true, 
          annotationId: newAnnotation.id,
          annotation: newAnnotation
        });

      case 'update_annotation':
        const updatedAnnotation = await updateAnnotation(data.annotationId, data);
        
        // Broadcast update
        if (sessionId) {
          broadcastCollaborationUpdate(sessionId, {
            type: 'annotation_updated',
            data: updatedAnnotation,
            timestamp: new Date().toISOString()
          });
        }

        return NextResponse.json({ 
          success: true,
          annotation: updatedAnnotation
        });

      case 'delete_annotation':
        await deleteAnnotation(data.annotationId);
        
        // Broadcast deletion
        if (sessionId) {
          broadcastCollaborationUpdate(sessionId, {
            type: 'annotation_deleted',
            data: { annotationId: data.annotationId },
            timestamp: new Date().toISOString()
          });
        }

        return NextResponse.json({ success: true });

      case 'start_collaboration':
        const session = startCollaborationSession(data);
        return NextResponse.json({ 
          success: true, 
          sessionId: session.id,
          session: session
        });

      case 'join_collaboration':
        const joinedSession = joinCollaborationSession(data.sessionId, data.user);
        return NextResponse.json({ 
          success: true,
          session: joinedSession
        });

      case 'leave_collaboration':
        leaveCollaborationSession(data.sessionId, data.userId);
        return NextResponse.json({ success: true });

      case 'collaboration_cursor_update':
        updateCollaborationCursor(data.sessionId, data.userId, data.cursor);
        return NextResponse.json({ success: true });

      case 'bulk_create_annotations':
        const createdAnnotations = [];
        for (const annotationData of data.annotations) {
          const annotation = await createAnnotation(annotationData);
          createdAnnotations.push(annotation);
        }

        // Broadcast bulk creation
        if (sessionId) {
          broadcastCollaborationUpdate(sessionId, {
            type: 'annotations_bulk_created',
            data: { annotations: createdAnnotations },
            timestamp: new Date().toISOString()
          });
        }

        return NextResponse.json({ 
          success: true,
          created: createdAnnotations.length,
          annotations: createdAnnotations
        });

      case 'resolve_conflict':
        const resolvedAnnotation = await resolveAnnotationConflict(data.annotationId, data.resolution);
        return NextResponse.json({ 
          success: true,
          annotation: resolvedAnnotation
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing annotation operation:', error);
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
    const annotationId = searchParams.get('annotationId');
    const sessionId = searchParams.get('sessionId');

    if (!annotationId) {
      return NextResponse.json(
        { error: 'Annotation ID required' },
        { status: 400 }
      );
    }

    await deleteAnnotation(annotationId);

    // Broadcast deletion
    if (sessionId) {
      broadcastCollaborationUpdate(sessionId, {
        type: 'annotation_deleted',
        data: { annotationId },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting annotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions

async function createAnnotation(data: any) {
  const result = await prisma.$queryRawUnsafe(`
    INSERT INTO geospatial.map_features (
      layer_id, name, description, geometry, properties, created_by, metadata
    ) VALUES (
      $1, $2, $3, ST_GeomFromGeoJSON($4), $5, $6, $7
    ) RETURNING id, created_at, updated_at
  `,
    data.layerId,
    data.name,
    data.description,
    JSON.stringify(data.geometry),
    JSON.stringify(data.properties || {}),
    data.createdBy,
    JSON.stringify({
      ...data.metadata,
      annotationType: data.type,
      collaborationId: data.collaborationId
    })
  );

  return {
    id: result[0].id,
    layerId: data.layerId,
    name: data.name,
    description: data.description,
    geometry: data.geometry,
    properties: data.properties,
    createdBy: data.createdBy,
    createdAt: result[0].created_at,
    updatedAt: result[0].updated_at
  };
}

async function updateAnnotation(annotationId: string, data: any) {
  const result = await prisma.$queryRawUnsafe(`
    UPDATE geospatial.map_features 
    SET name = $1,
        description = $2,
        geometry = ST_GeomFromGeoJSON($3),
        properties = $4,
        metadata = $5,
        updated_at = NOW()
    WHERE id = $6
    RETURNING id, updated_at
  `,
    data.name,
    data.description,
    JSON.stringify(data.geometry),
    JSON.stringify(data.properties || {}),
    JSON.stringify({
      ...data.metadata,
      lastModifiedBy: data.modifiedBy,
      version: (data.metadata?.version || 0) + 1
    }),
    annotationId
  );

  return {
    id: result[0].id,
    updatedAt: result[0].updated_at,
    ...data
  };
}

async function deleteAnnotation(annotationId: string) {
  await prisma.$queryRawUnsafe(`
    UPDATE geospatial.map_features 
    SET is_active = false, updated_at = NOW()
    WHERE id = $1
  `, annotationId);
}

function startCollaborationSession(data: any) {
  const sessionId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session = {
    id: sessionId,
    name: data.name || 'Tactical Collaboration',
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    participants: [{
      id: data.createdBy,
      name: data.creatorName,
      role: data.creatorRole || 'admin',
      joinedAt: new Date().toISOString(),
      cursor: null,
      isActive: true
    }],
    settings: {
      allowAnnotations: data.allowAnnotations !== false,
      allowEditing: data.allowEditing !== false,
      requireApproval: data.requireApproval || false,
      maxParticipants: data.maxParticipants || 50
    },
    pendingUpdates: []
  };

  collaborationSessions.set(sessionId, session);
  return session;
}

function joinCollaborationSession(sessionId: string, user: any) {
  const session = collaborationSessions.get(sessionId);
  if (!session) {
    throw new Error('Collaboration session not found');
  }

  // Check if user already in session
  const existingParticipant = session.participants.find(p => p.id === user.id);
  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.joinedAt = new Date().toISOString();
  } else {
    session.participants.push({
      id: user.id,
      name: user.name,
      role: user.role || 'participant',
      joinedAt: new Date().toISOString(),
      cursor: null,
      isActive: true
    });
  }

  // Broadcast participant joined
  broadcastCollaborationUpdate(sessionId, {
    type: 'participant_joined',
    data: { user },
    timestamp: new Date().toISOString()
  });

  return session;
}

function leaveCollaborationSession(sessionId: string, userId: string) {
  const session = collaborationSessions.get(sessionId);
  if (!session) return;

  const participant = session.participants.find(p => p.id === userId);
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date().toISOString();
  }

  // Broadcast participant left
  broadcastCollaborationUpdate(sessionId, {
    type: 'participant_left',
    data: { userId },
    timestamp: new Date().toISOString()
  });
}

function updateCollaborationCursor(sessionId: string, userId: string, cursor: any) {
  const session = collaborationSessions.get(sessionId);
  if (!session) return;

  const participant = session.participants.find(p => p.id === userId);
  if (participant) {
    participant.cursor = cursor;
    participant.lastActivity = new Date().toISOString();
  }

  // Broadcast cursor update (throttled)
  broadcastCollaborationUpdate(sessionId, {
    type: 'cursor_update',
    data: { userId, cursor },
    timestamp: new Date().toISOString()
  }, { throttle: true });
}

function broadcastCollaborationUpdate(sessionId: string, update: any, options: any = {}) {
  const session = collaborationSessions.get(sessionId);
  if (!session) return;

  // Add to pending updates for each participant
  session.participants.forEach(participant => {
    if (participant.isActive && participant.id !== update.data?.userId) {
      if (!participant.pendingUpdates) {
        participant.pendingUpdates = [];
      }
      
      // Throttle cursor updates
      if (options.throttle && update.type === 'cursor_update') {
        const lastCursorUpdate = participant.pendingUpdates
          .reverse()
          .find(u => u.type === 'cursor_update' && u.data?.userId === update.data?.userId);
        
        if (lastCursorUpdate && 
            new Date().getTime() - new Date(lastCursorUpdate.timestamp).getTime() < 100) {
          // Replace recent cursor update
          const index = participant.pendingUpdates.indexOf(lastCursorUpdate);
          participant.pendingUpdates[index] = update;
          return;
        }
      }
      
      participant.pendingUpdates.push(update);
      
      // Limit pending updates to prevent memory issues
      if (participant.pendingUpdates.length > 100) {
        participant.pendingUpdates = participant.pendingUpdates.slice(-50);
      }
    }
  });
}

function getCollaborationInfo(sessionId: string) {
  const session = collaborationSessions.get(sessionId);
  if (!session) return null;

  return {
    ...session,
    activeParticipants: session.participants.filter(p => p.isActive).length,
    totalParticipants: session.participants.length
  };
}

async function resolveAnnotationConflict(annotationId: string, resolution: any) {
  // Implement conflict resolution logic
  const result = await prisma.$queryRawUnsafe(`
    UPDATE geospatial.map_features 
    SET properties = $1,
        metadata = metadata || $2,
        updated_at = NOW()
    WHERE id = $3
    RETURNING id, updated_at
  `,
    JSON.stringify(resolution.properties),
    JSON.stringify({
      conflictResolved: true,
      resolvedBy: resolution.resolvedBy,
      resolvedAt: new Date().toISOString(),
      resolutionMethod: resolution.method
    }),
    annotationId
  );

  return result[0];
}