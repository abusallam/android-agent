/**
 * Agent Tactical Operations API
 * Comprehensive tactical operations management for AI agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const operationId = searchParams.get('operationId');
    const agentId = request.headers.get('x-agent-id');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID required' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'get_active_operations':
        const operations = await prisma.$queryRawUnsafe(`
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
            to_op.resources,
            to_op.start_time,
            to_op.end_time,
            to_op.task_assignments,
            to_op.ai_analysis,
            COUNT(DISTINCT d.id) as assigned_devices,
            COUNT(DISTINCT ta.id) as assigned_assets,
            COUNT(DISTINCT t.id) as active_tasks
          FROM tactical.operations to_op
          LEFT JOIN devices d ON d.user_id = ANY(to_op.assigned_to)
          LEFT JOIN tactical.assets ta ON ta.assigned_operation = to_op.id
          LEFT JOIN agentic.tasks t ON t.operation_id = to_op.id AND t.status IN ('pending', 'in_progress')
          WHERE to_op.status IN ('planning', 'active')
          GROUP BY to_op.id
          ORDER BY to_op.priority DESC, to_op.created_at DESC
        `);

        return NextResponse.json({
          operations,
          metadata: {
            total: operations.length,
            agent_id: agentId,
            timestamp: new Date().toISOString()
          }
        });

      case 'get_operation_details':
        if (!operationId) {
          return NextResponse.json(
            { error: 'Operation ID required' },
            { status: 400 }
          );
        }

        const operationDetails = await prisma.$queryRawUnsafe(`
          SELECT 
            to_op.*,
            ST_AsGeoJSON(to_op.operation_area) as operation_area_geojson,
            ST_X(to_op.center_point) as center_longitude,
            ST_Y(to_op.center_point) as center_latitude,
            u.username as created_by_user,
            array_agg(DISTINCT d.device_name) as assigned_device_names,
            array_agg(DISTINCT ta.name) as assigned_asset_names,
            array_agg(DISTINCT t.title) as active_task_titles
          FROM tactical.operations to_op
          LEFT JOIN users u ON to_op.created_by = u.id
          LEFT JOIN devices d ON d.user_id = ANY(to_op.assigned_to)
          LEFT JOIN tactical.assets ta ON ta.assigned_operation = to_op.id
          LEFT JOIN agentic.tasks t ON t.operation_id = to_op.id AND t.status IN ('pending', 'in_progress')
          WHERE to_op.id = $1
          GROUP BY to_op.id, u.username
        `, operationId);

        if (operationDetails.length === 0) {
          return NextResponse.json(
            { error: 'Operation not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          operation: operationDetails[0],
          agent_id: agentId,
          timestamp: new Date().toISOString()
        });

      case 'get_tactical_intelligence':
        const intelligence = await prisma.$queryRawUnsafe(`
          SELECT 
            'emergency_alert' as intel_type,
            ea.id,
            ea.title as summary,
            ea.description,
            ea.severity as priority,
            ST_X(ea.location) as longitude,
            ST_Y(ea.location) as latitude,
            ea.created_at as timestamp,
            ea.metadata
          FROM emergency_alerts ea
          WHERE ea.status = 'active'
          
          UNION ALL
          
          SELECT 
            'device_anomaly' as intel_type,
            d.id,
            'Device Status Anomaly' as summary,
            'Device showing unusual behavior patterns' as description,
            'medium' as priority,
            ST_X(d.current_location) as longitude,
            ST_Y(d.current_location) as latitude,
            d.last_seen as timestamp,
            d.metadata
          FROM devices d
          WHERE d.last_seen < NOW() - INTERVAL '1 hour'
            AND d.is_active = true
          
          ORDER BY timestamp DESC
          LIMIT 50
        `);

        return NextResponse.json({
          intelligence,
          analysis: {
            threat_level: calculateThreatLevel(intelligence),
            recommendations: generateTacticalRecommendations(intelligence),
            priority_items: intelligence.filter(i => i.priority === 'critical' || i.priority === 'high').length
          },
          agent_id: agentId,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in agent tactical API:', error);
    return NextResponse.json(
      { error: 'Failed to process tactical request' },
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
    const agentId = request.headers.get('x-agent-id');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID required' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'create_operation':
        const newOperation = await prisma.$queryRawUnsafe(`
          INSERT INTO tactical.operations (
            name, description, operation_type, status, priority,
            created_by, assigned_to, operation_area, center_point,
            objectives, resources, constraints, ai_analysis
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, 
            ST_GeomFromGeoJSON($8), ST_GeomFromText($9, 4326),
            $10, $11, $12, $13
          ) RETURNING id
        `,
          data.name,
          data.description,
          data.operationType,
          data.status || 'planning',
          data.priority || 'medium',
          data.createdBy,
          data.assignedTo || [],
          JSON.stringify(data.operationArea),
          `POINT(${data.centerPoint.longitude} ${data.centerPoint.latitude})`,
          data.objectives || [],
          JSON.stringify(data.resources || {}),
          JSON.stringify(data.constraints || {}),
          JSON.stringify({
            created_by_agent: agentId,
            ai_confidence: data.confidence || 0.8,
            analysis_timestamp: new Date().toISOString()
          })
        );

        return NextResponse.json({
          success: true,
          operationId: newOperation[0].id,
          agent_id: agentId
        });

      case 'update_operation_status':
        await prisma.$queryRawUnsafe(`
          UPDATE tactical.operations 
          SET status = $1,
              ai_analysis = ai_analysis || $2,
              updated_at = NOW()
          WHERE id = $3
        `,
          data.status,
          JSON.stringify({
            status_updated_by_agent: agentId,
            status_change_reason: data.reason,
            confidence: data.confidence || 0.8,
            timestamp: new Date().toISOString()
          }),
          data.operationId
        );

        return NextResponse.json({ success: true });

      case 'analyze_tactical_situation':
        const situationData = await prisma.$queryRawUnsafe(`
          SELECT 
            COUNT(DISTINCT d.id) as total_devices,
            COUNT(DISTINCT CASE WHEN d.is_active THEN d.id END) as active_devices,
            COUNT(DISTINCT ea.id) as active_alerts,
            COUNT(DISTINCT to_op.id) as active_operations,
            COUNT(DISTINCT ta.id) as operational_assets,
            AVG(d.battery_level) as avg_battery_level
          FROM devices d
          FULL OUTER JOIN emergency_alerts ea ON ea.status = 'active'
          FULL OUTER JOIN tactical.operations to_op ON to_op.status = 'active'
          FULL OUTER JOIN tactical.assets ta ON ta.status = 'operational'
        `);

        const analysis = {
          situation_assessment: analyzeTacticalSituation(situationData[0]),
          threat_level: calculateThreatLevel(situationData[0]),
          recommendations: generateTacticalRecommendations(situationData[0]),
          resource_status: assessResourceStatus(situationData[0]),
          analyzed_by: agentId,
          analysis_timestamp: new Date().toISOString()
        };

        // Store analysis
        await prisma.$queryRawUnsafe(`
          INSERT INTO system_metrics (
            metric_name, metric_value, source, agent_id, metadata
          ) VALUES (
            'tactical_situation_analysis', 1, 'tactical_agent', $1, $2
          )
        `, agentId, JSON.stringify(analysis));

        return NextResponse.json({
          success: true,
          analysis,
          agent_id: agentId
        });

      case 'assign_resources':
        // Assign resources to operation
        await prisma.$queryRawUnsafe(`
          UPDATE tactical.assets 
          SET assigned_operation = $1,
              status = 'deployed',
              updated_at = NOW()
          WHERE id = ANY($2)
        `, data.operationId, data.assetIds);

        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing agent tactical operation:', error);
    return NextResponse.json(
      { error: 'Failed to process operation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions for AI analysis
function analyzeTacticalSituation(data: any) {
  const deviceReadiness = (data.active_devices / data.total_devices) * 100;
  const batteryHealth = data.avg_battery_level || 0;
  const alertLevel = data.active_alerts || 0;

  let assessment = 'NORMAL';
  if (alertLevel > 5 || deviceReadiness < 70 || batteryHealth < 30) {
    assessment = 'DEGRADED';
  }
  if (alertLevel > 10 || deviceReadiness < 50 || batteryHealth < 20) {
    assessment = 'CRITICAL';
  }

  return {
    overall_status: assessment,
    device_readiness: `${deviceReadiness.toFixed(1)}%`,
    battery_health: `${batteryHealth.toFixed(1)}%`,
    active_alerts: alertLevel,
    operational_capacity: deviceReadiness > 80 ? 'HIGH' : deviceReadiness > 60 ? 'MEDIUM' : 'LOW'
  };
}

function calculateThreatLevel(data: any) {
  const alertCount = data.active_alerts || 0;
  const deviceReadiness = (data.active_devices / data.total_devices) * 100;

  if (alertCount === 0 && deviceReadiness > 90) return 'GREEN';
  if (alertCount <= 2 && deviceReadiness > 70) return 'YELLOW';
  if (alertCount <= 5 && deviceReadiness > 50) return 'ORANGE';
  return 'RED';
}

function generateTacticalRecommendations(data: any) {
  const recommendations = [];
  
  if (data.avg_battery_level < 30) {
    recommendations.push({
      type: 'resource_management',
      priority: 'high',
      action: 'Initiate battery conservation protocols',
      details: 'Multiple devices showing low battery levels'
    });
  }

  if (data.active_alerts > 5) {
    recommendations.push({
      type: 'emergency_response',
      priority: 'critical',
      action: 'Escalate emergency response procedures',
      details: 'High number of active alerts requiring attention'
    });
  }

  if ((data.active_devices / data.total_devices) < 0.7) {
    recommendations.push({
      type: 'communication',
      priority: 'medium',
      action: 'Check communication systems',
      details: 'Significant number of devices offline'
    });
  }

  return recommendations;
}

function assessResourceStatus(data: any) {
  return {
    personnel: {
      total: data.total_devices,
      active: data.active_devices,
      readiness: ((data.active_devices / data.total_devices) * 100).toFixed(1) + '%'
    },
    equipment: {
      operational: data.operational_assets,
      status: data.operational_assets > 0 ? 'AVAILABLE' : 'LIMITED'
    },
    communications: {
      status: data.active_devices > 0 ? 'OPERATIONAL' : 'DEGRADED',
      coverage: 'FULL' // This would be calculated based on mesh network status
    }
  };
}