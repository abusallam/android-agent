import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Emergency alert schemas
const emergencyAlertSchema = z.object({
  type: z.enum(['panic', 'medical', 'fire', 'security', 'natural_disaster', 'man_down', 'evacuation']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
    landmark: z.string().optional()
  }),
  description: z.string().optional(),
  reportedBy: z.string().optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    radio: z.string().optional()
  }).optional(),
  casualties: z.object({
    injured: z.number().default(0),
    fatalities: z.number().default(0),
    missing: z.number().default(0),
    evacuated: z.number().default(0)
  }).optional(),
  resources: z.object({
    requested: z.array(z.string()).default([]),
    dispatched: z.array(z.string()).default([]),
    onScene: z.array(z.string()).default([])
  }).optional(),
  media: z.array(z.object({
    type: z.enum(['photo', 'video', 'audio']),
    url: z.string(),
    timestamp: z.string()
  })).optional().default([]),
  metadata: z.record(z.any()).optional().default({})
});

const emergencyResponseSchema = z.object({
  alertId: z.string().min(1, 'Alert ID is required'),
  responseType: z.enum(['acknowledge', 'dispatch', 'escalate', 'resolve', 'cancel']),
  responderId: z.string().optional(),
  resources: z.array(z.string()).optional().default([]),
  estimatedArrival: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

// Agent authentication middleware
function verifyAgentToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET || 'tactical-ops-secret-2024';
  
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    if (decoded.type !== 'agent') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// In-memory storage for demo (use database in production)
const emergencyAlerts = new Map();
const emergencyResponses = new Map();

// Create emergency alert
export async function POST(request: NextRequest) {
  try {
    // Check for agent authentication (optional for emergency alerts)
    let agent = null;
    try {
      agent = verifyAgentToken(request);
    } catch (error) {
      // Allow emergency alerts without agent authentication for civilian access
      console.log('Emergency alert created without agent authentication');
    }
    
    const body = await request.json();
    const { action } = body;
    
    if (action === 'create_alert') {
      return await handleCreateAlert(body, agent);
    } else if (action === 'respond_to_alert') {
      return await handleEmergencyResponse(body, agent);
    } else {
      // Default to creating alert for backward compatibility
      return await handleCreateAlert(body, agent);
    }
    
  } catch (error) {
    console.error('Emergency alert error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid emergency alert data',
            details: error.errors 
          } 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to process emergency alert' 
        } 
      },
      { status: 500 }
    );
  }
}

// Get emergency alerts
export async function GET(request: NextRequest) {
  try {
    // Verify agent authentication for retrieving alerts
    const agent = verifyAgentToken(request);
    
    // Check if agent has emergency response capability
    if (!agent.capabilities.includes('emergency-response')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have emergency-response capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (alertId) {
      // Get specific alert
      const alert = emergencyAlerts.get(alertId);
      if (!alert) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'ALERT_NOT_FOUND', 
              message: 'Emergency alert not found' 
            } 
          },
          { status: 404 }
        );
      }
      
      // Get responses for this alert
      const responses = Array.from(emergencyResponses.values())
        .filter(response => response.alertId === alertId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return NextResponse.json({
        success: true,
        data: {
          alert,
          responses
        },
        message: 'Emergency alert retrieved successfully'
      });
    }
    
    // List alerts with filters
    let alertList = Array.from(emergencyAlerts.values());
    
    if (status) {
      alertList = alertList.filter(alert => alert.status === status);
    }
    
    if (severity) {
      alertList = alertList.filter(alert => alert.severity === severity);
    }
    
    if (type) {
      alertList = alertList.filter(alert => alert.type === type);
    }
    
    // Sort by creation time (newest first)
    alertList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    const total = alertList.length;
    const paginatedAlerts = alertList.slice(offset, offset + limit);
    
    // Get summary statistics
    const summary = {
      total: emergencyAlerts.size,
      active: Array.from(emergencyAlerts.values()).filter(alert => alert.status === 'active').length,
      critical: Array.from(emergencyAlerts.values()).filter(alert => alert.severity === 'critical').length,
      resolved: Array.from(emergencyAlerts.values()).filter(alert => alert.status === 'resolved').length
    };
    
    return NextResponse.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        summary,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      message: 'Emergency alerts retrieved successfully'
    });
    
  } catch (error) {
    console.error('Emergency alert retrieval error:', error);
    
    if (error.message.includes('token') || error.message.includes('authorization')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'AUTHENTICATION_ERROR', 
            message: error.message 
          } 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to retrieve emergency alerts' 
        } 
      },
      { status: 500 }
    );
  }
}

// Update emergency alert status
export async function PUT(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has emergency response capability
    if (!agent.capabilities.includes('emergency-response')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have emergency-response capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { alertId, status, updates, responseNotes } = body;
    
    if (!alertId || !status) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_PARAMETERS', 
            message: 'Alert ID and status are required' 
          } 
        },
        { status: 400 }
      );
    }
    
    const alert = emergencyAlerts.get(alertId);
    if (!alert) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ALERT_NOT_FOUND', 
            message: 'Emergency alert not found' 
          } 
        },
        { status: 404 }
      );
    }
    
    const validStatuses = ['active', 'acknowledged', 'responding', 'on_scene', 'resolved', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_STATUS', 
            message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` 
          } 
        },
        { status: 400 }
      );
    }
    
    // Update alert
    const updatedAlert = {
      ...alert,
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: agent.agentId,
      ...updates
    };
    
    emergencyAlerts.set(alertId, updatedAlert);
    
    // Create response record
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const response = {
      id: responseId,
      alertId,
      agentId: agent.agentId,
      action: 'status_update',
      previousStatus: alert.status,
      newStatus: status,
      notes: responseNotes,
      timestamp: new Date().toISOString()
    };
    
    emergencyResponses.set(responseId, response);
    
    console.log(`🚨 Emergency alert ${alertId} status updated to ${status} by agent ${agent.agentId}`);
    
    return NextResponse.json({
      success: true,
      data: {
        alert: updatedAlert,
        response
      },
      message: 'Emergency alert status updated successfully'
    });
    
  } catch (error) {
    console.error('Emergency alert update error:', error);
    
    if (error.message.includes('token') || error.message.includes('authorization')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'AUTHENTICATION_ERROR', 
            message: error.message 
          } 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to update emergency alert' 
        } 
      },
      { status: 500 }
    );
  }
}

// Handler functions

async function handleCreateAlert(body: any, agent: any) {
  const validatedData = emergencyAlertSchema.parse(body);
  
  // Generate alert ID
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine initial status and priority based on type and severity
  let status = 'active';
  let priority = validatedData.severity;
  
  if (validatedData.type === 'panic' || validatedData.severity === 'critical') {
    priority = 'critical';
  }
  
  // Create alert object
  const alert = {
    id: alertId,
    ...validatedData,
    status,
    priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: agent?.agentId || 'system',
    responseTime: null,
    resolvedAt: null,
    estimatedResponseTime: calculateEstimatedResponseTime(validatedData.type, validatedData.severity),
    assignedResponders: [],
    timeline: [
      {
        timestamp: new Date().toISOString(),
        event: 'alert_created',
        description: `${validatedData.type} alert created`,
        actor: agent?.agentId || 'system'
      }
    ]
  };
  
  // Store alert
  emergencyAlerts.set(alertId, alert);
  
  // Trigger automatic responses based on alert type and severity
  await triggerAutomaticResponses(alert, agent);
  
  console.log(`🚨 Emergency alert created: ${alertId} (${validatedData.type}, ${validatedData.severity})`);
  
  return NextResponse.json({
    success: true,
    data: {
      alertId,
      alert,
      estimatedResponseTime: alert.estimatedResponseTime,
      automaticActions: [
        'Emergency contacts notified',
        'Nearest responders alerted',
        'Incident logged in system'
      ]
    },
    message: 'Emergency alert created successfully'
  });
}

async function handleEmergencyResponse(body: any, agent: any) {
  if (!agent) {
    throw new Error('Agent authentication required for emergency response');
  }
  
  const validatedData = emergencyResponseSchema.parse(body);
  
  const alert = emergencyAlerts.get(validatedData.alertId);
  if (!alert) {
    throw new Error('Emergency alert not found');
  }
  
  // Generate response ID
  const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create response object
  const response = {
    id: responseId,
    alertId: validatedData.alertId,
    agentId: agent.agentId,
    responseType: validatedData.responseType,
    responderId: validatedData.responderId,
    resources: validatedData.resources,
    estimatedArrival: validatedData.estimatedArrival,
    notes: validatedData.notes,
    priority: validatedData.priority,
    timestamp: new Date().toISOString()
  };
  
  // Store response
  emergencyResponses.set(responseId, response);
  
  // Update alert based on response type
  let updatedStatus = alert.status;
  const timeline = [...alert.timeline];
  
  switch (validatedData.responseType) {
    case 'acknowledge':
      updatedStatus = 'acknowledged';
      timeline.push({
        timestamp: new Date().toISOString(),
        event: 'alert_acknowledged',
        description: 'Alert acknowledged by responder',
        actor: agent.agentId
      });
      break;
      
    case 'dispatch':
      updatedStatus = 'responding';
      timeline.push({
        timestamp: new Date().toISOString(),
        event: 'resources_dispatched',
        description: `Resources dispatched: ${validatedData.resources?.join(', ') || 'unspecified'}`,
        actor: agent.agentId
      });
      break;
      
    case 'escalate':
      alert.severity = 'critical';
      timeline.push({
        timestamp: new Date().toISOString(),
        event: 'alert_escalated',
        description: 'Alert escalated to critical level',
        actor: agent.agentId
      });
      break;
      
    case 'resolve':
      updatedStatus = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      timeline.push({
        timestamp: new Date().toISOString(),
        event: 'alert_resolved',
        description: 'Alert resolved',
        actor: agent.agentId
      });
      break;
      
    case 'cancel':
      updatedStatus = 'cancelled';
      timeline.push({
        timestamp: new Date().toISOString(),
        event: 'alert_cancelled',
        description: 'Alert cancelled',
        actor: agent.agentId
      });
      break;
  }
  
  // Update alert
  const updatedAlert = {
    ...alert,
    status: updatedStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: agent.agentId,
    timeline
  };
  
  if (validatedData.resources && validatedData.resources.length > 0) {
    updatedAlert.resources = {
      ...alert.resources,
      dispatched: [...(alert.resources?.dispatched || []), ...validatedData.resources]
    };
  }
  
  emergencyAlerts.set(validatedData.alertId, updatedAlert);
  
  console.log(`🚨 Emergency response: ${validatedData.responseType} for alert ${validatedData.alertId} by agent ${agent.agentId}`);
  
  return NextResponse.json({
    success: true,
    data: {
      response,
      alert: updatedAlert
    },
    message: `Emergency response (${validatedData.responseType}) recorded successfully`
  });
}

// Helper functions

function calculateEstimatedResponseTime(type: string, severity: string): number {
  // Return estimated response time in minutes
  const baseTime = {
    panic: 5,
    medical: 8,
    fire: 6,
    security: 10,
    natural_disaster: 15,
    man_down: 5,
    evacuation: 20
  };
  
  const severityMultiplier = {
    critical: 0.5,
    high: 0.7,
    medium: 1.0,
    low: 1.5
  };
  
  return Math.round((baseTime[type] || 10) * (severityMultiplier[severity] || 1.0));
}

async function triggerAutomaticResponses(alert: any, agent: any) {
  // Simulate automatic responses (in production, would trigger real actions)
  
  const actions = [];
  
  // Critical alerts get immediate attention
  if (alert.severity === 'critical' || alert.type === 'panic') {
    actions.push('Immediate dispatcher notification');
    actions.push('Nearest unit auto-dispatch');
    actions.push('Supervisor alert');
  }
  
  // Medical alerts trigger medical response
  if (alert.type === 'medical' || alert.type === 'man_down') {
    actions.push('Medical unit notification');
    actions.push('Hospital pre-alert');
  }
  
  // Fire alerts trigger fire department
  if (alert.type === 'fire') {
    actions.push('Fire department notification');
    actions.push('Evacuation protocol initiated');
  }
  
  // Security alerts trigger security response
  if (alert.type === 'security') {
    actions.push('Security team notification');
    actions.push('Area lockdown protocol');
  }
  
  console.log(`🤖 Automatic responses triggered for alert ${alert.id}:`, actions);
  
  return actions;
}