import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Tactical operation schemas
const mapAnalysisSchema = z.object({
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number()
  }),
  analysisType: z.enum(['terrain', 'threat', 'resource', 'route']).default('terrain'),
  parameters: z.record(z.any()).optional().default({})
});

const routePlanningSchema = z.object({
  waypoints: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string().optional(),
    type: z.enum(['start', 'waypoint', 'destination']).default('waypoint')
  })).min(2, 'At least 2 waypoints required'),
  preferences: z.object({
    routeType: z.enum(['fastest', 'shortest', 'safest', 'tactical']).default('tactical'),
    avoidAreas: z.array(z.object({
      lat: z.number(),
      lng: z.number(),
      radius: z.number()
    })).optional().default([]),
    vehicleType: z.enum(['foot', 'vehicle', 'aircraft']).default('foot'),
    maxDistance: z.number().optional(),
    maxTime: z.number().optional()
  }).optional().default({})
});

const missionPlanSchema = z.object({
  name: z.string().min(1, 'Mission name is required'),
  description: z.string().optional(),
  type: z.enum(['reconnaissance', 'patrol', 'rescue', 'transport', 'security']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    radius: z.number().optional().default(1000)
  }),
  timeline: z.object({
    startTime: z.string(),
    endTime: z.string().optional(),
    duration: z.number().optional()
  }),
  resources: z.object({
    personnel: z.number().optional().default(0),
    vehicles: z.array(z.string()).optional().default([]),
    equipment: z.array(z.string()).optional().default([])
  }).optional().default({}),
  objectives: z.array(z.string()).min(1, 'At least one objective is required'),
  constraints: z.array(z.string()).optional().default([])
});

const threatAssessmentSchema = z.object({
  area: z.object({
    center: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    radius: z.number().default(5000)
  }),
  threatTypes: z.array(z.enum(['hostile', 'environmental', 'infrastructure', 'cyber'])).optional().default(['hostile']),
  timeframe: z.enum(['current', '1h', '6h', '24h', '7d']).default('current'),
  confidenceLevel: z.enum(['low', 'medium', 'high']).optional()
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

// Map analysis endpoint
export async function POST(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has tactical operations capability
    if (!agent.capabilities.includes('tactical-operations')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have tactical-operations capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'analyze_map':
        return await handleMapAnalysis(body, agent);
      case 'plan_route':
        return await handleRoutePlanning(body, agent);
      case 'create_mission':
        return await handleMissionCreation(body, agent);
      case 'assess_threats':
        return await handleThreatAssessment(body, agent);
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'INVALID_ACTION', 
              message: 'Invalid tactical action specified' 
            } 
          },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Tactical operations error:', error);
    
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
          message: 'Failed to process tactical operation' 
        } 
      },
      { status: 500 }
    );
  }
}

// Get tactical information
export async function GET(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has tactical operations capability
    if (!agent.capabilities.includes('tactical-operations')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have tactical-operations capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const missionId = searchParams.get('missionId');
    
    if (missionId) {
      // Get specific mission
      const mission = await getMissionById(missionId);
      if (!mission) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'MISSION_NOT_FOUND', 
              message: 'Mission not found' 
            } 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: { mission },
        message: 'Mission retrieved successfully'
      });
    }
    
    switch (type) {
      case 'missions':
        return await handleGetMissions(agent);
      case 'active_operations':
        return await handleGetActiveOperations(agent);
      case 'threat_status':
        return await handleGetThreatStatus(agent);
      case 'resource_status':
        return await handleGetResourceStatus(agent);
      default:
        return await handleGetTacticalOverview(agent);
    }
    
  } catch (error) {
    console.error('Tactical information retrieval error:', error);
    
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
          message: 'Failed to retrieve tactical information' 
        } 
      },
      { status: 500 }
    );
  }
}

// Update mission status
export async function PUT(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has tactical operations capability
    if (!agent.capabilities.includes('tactical-operations')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have tactical-operations capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { missionId, status, updates } = body;
    
    if (!missionId || !status) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_PARAMETERS', 
            message: 'Mission ID and status are required' 
          } 
        },
        { status: 400 }
      );
    }
    
    const validStatuses = ['planned', 'active', 'paused', 'completed', 'cancelled', 'failed'];
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
    
    // Update mission (mock implementation)
    const updatedMission = {
      id: missionId,
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: agent.agentId,
      ...updates
    };
    
    console.log(`🎯 Mission ${missionId} status updated to ${status} by agent ${agent.agentId}`);
    
    return NextResponse.json({
      success: true,
      data: { mission: updatedMission },
      message: 'Mission status updated successfully'
    });
    
  } catch (error) {
    console.error('Mission update error:', error);
    
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
          message: 'Failed to update mission status' 
        } 
      },
      { status: 500 }
    );
  }
}

// Handler functions

async function handleMapAnalysis(body: any, agent: any) {
  const validatedData = mapAnalysisSchema.parse(body);
  
  // Perform map analysis (mock implementation)
  const analysis = {
    bounds: validatedData.bounds,
    analysisType: validatedData.analysisType,
    results: {
      terrain: {
        elevation: {
          min: 120,
          max: 450,
          average: 285
        },
        slope: {
          average: 12.5,
          maxSlope: 35.2,
          difficulty: 'moderate'
        },
        landCover: {
          forest: 45,
          urban: 25,
          water: 15,
          open: 15
        }
      },
      accessibility: {
        vehicleAccess: 'limited',
        footAccess: 'good',
        aircraftLanding: 'possible'
      },
      strategicValue: {
        visibility: 'high',
        coverConcealment: 'moderate',
        defensibility: 'good'
      }
    },
    recommendations: [
      'Primary approach from eastern ridge provides best cover',
      'Avoid southern approach due to open terrain exposure',
      'Consider helicopter insertion at coordinates 34.0522, -118.2437'
    ],
    timestamp: new Date().toISOString(),
    agentId: agent.agentId
  };
  
  return NextResponse.json({
    success: true,
    data: { analysis },
    message: 'Map analysis completed successfully'
  });
}

async function handleRoutePlanning(body: any, agent: any) {
  const validatedData = routePlanningSchema.parse(body);
  
  // Plan route (mock implementation)
  const route = {
    waypoints: validatedData.waypoints,
    preferences: validatedData.preferences,
    plannedRoute: {
      distance: 12.5, // km
      estimatedTime: 180, // minutes
      difficulty: 'moderate',
      riskLevel: 'low',
      coordinates: validatedData.waypoints.map((wp, index) => ({
        ...wp,
        order: index + 1,
        estimatedArrival: new Date(Date.now() + (index * 30 * 60 * 1000)).toISOString()
      }))
    },
    alternatives: [
      {
        name: 'Safer Route',
        distance: 15.2,
        estimatedTime: 220,
        riskLevel: 'very_low',
        description: 'Longer but avoids high-risk areas'
      },
      {
        name: 'Faster Route',
        distance: 10.8,
        estimatedTime: 150,
        riskLevel: 'medium',
        description: 'Shorter but through contested area'
      }
    ],
    hazards: [
      {
        type: 'checkpoint',
        location: { lat: 34.0522, lng: -118.2437 },
        severity: 'medium',
        description: 'Military checkpoint - expect delays'
      }
    ],
    recommendations: [
      'Depart during early morning hours for better concealment',
      'Carry extra water due to desert terrain',
      'Maintain radio silence in sector 7-9'
    ],
    timestamp: new Date().toISOString(),
    agentId: agent.agentId
  };
  
  return NextResponse.json({
    success: true,
    data: { route },
    message: 'Route planned successfully'
  });
}

async function handleMissionCreation(body: any, agent: any) {
  const validatedData = missionPlanSchema.parse(body);
  
  // Create mission (mock implementation)
  const missionId = `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const mission = {
    id: missionId,
    ...validatedData,
    status: 'planned',
    createdAt: new Date().toISOString(),
    createdBy: agent.agentId,
    estimatedDuration: validatedData.timeline.duration || 240, // minutes
    riskAssessment: {
      overall: 'medium',
      factors: [
        'Weather conditions favorable',
        'Moderate terrain difficulty',
        'Limited intelligence on area'
      ]
    },
    requiredApprovals: validatedData.priority === 'critical' ? ['commander', 'operations'] : ['operations'],
    contingencyPlans: [
      'Extraction plan Alpha - helicopter pickup',
      'Fallback position at coordinates 34.0500, -118.2400'
    ]
  };
  
  console.log(`🎯 Mission created: ${missionId} by agent ${agent.agentId}`);
  
  return NextResponse.json({
    success: true,
    data: { mission },
    message: 'Mission created successfully'
  });
}

async function handleThreatAssessment(body: any, agent: any) {
  const validatedData = threatAssessmentSchema.parse(body);
  
  // Assess threats (mock implementation)
  const assessment = {
    area: validatedData.area,
    threatTypes: validatedData.threatTypes,
    timeframe: validatedData.timeframe,
    threats: [
      {
        id: 'threat_001',
        type: 'hostile',
        severity: 'medium',
        confidence: 'high',
        location: {
          lat: validatedData.area.center.lat + 0.001,
          lng: validatedData.area.center.lng - 0.001
        },
        description: 'Unidentified armed group reported in sector',
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        movement: 'stationary',
        estimatedStrength: '8-12 personnel'
      },
      {
        id: 'threat_002',
        type: 'environmental',
        severity: 'low',
        confidence: 'high',
        description: 'Flash flood risk due to weather conditions',
        timeWindow: '6-12 hours',
        affectedAreas: ['valley_sector_3', 'river_crossing_alpha']
      }
    ],
    overallRiskLevel: 'medium',
    recommendations: [
      'Increase patrol frequency in sector 7',
      'Establish observation post on Hill 205',
      'Monitor weather conditions for flood risk',
      'Coordinate with local authorities for intelligence updates'
    ],
    nextAssessment: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
    timestamp: new Date().toISOString(),
    agentId: agent.agentId
  };
  
  return NextResponse.json({
    success: true,
    data: { assessment },
    message: 'Threat assessment completed successfully'
  });
}

async function handleGetMissions(agent: any) {
  // Mock missions data
  const missions = [
    {
      id: 'mission_001',
      name: 'Reconnaissance Alpha',
      type: 'reconnaissance',
      status: 'active',
      priority: 'high',
      location: { lat: 34.0522, lng: -118.2437 },
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      personnel: 4,
      progress: 65
    },
    {
      id: 'mission_002',
      name: 'Supply Run Bravo',
      type: 'transport',
      status: 'planned',
      priority: 'medium',
      location: { lat: 34.0600, lng: -118.2500 },
      startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      estimatedDuration: 180,
      personnel: 6,
      vehicles: ['truck_01', 'escort_01']
    }
  ];
  
  return NextResponse.json({
    success: true,
    data: { missions },
    message: 'Missions retrieved successfully'
  });
}

async function handleGetActiveOperations(agent: any) {
  const operations = {
    active: 3,
    planned: 5,
    completed_today: 2,
    operations: [
      {
        id: 'op_001',
        name: 'Sector Patrol',
        status: 'active',
        personnel: 8,
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        lastUpdate: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ]
  };
  
  return NextResponse.json({
    success: true,
    data: operations,
    message: 'Active operations retrieved successfully'
  });
}

async function handleGetThreatStatus(agent: any) {
  const threatStatus = {
    overallLevel: 'medium',
    activeThreats: 2,
    monitoredAreas: 5,
    lastUpdate: new Date().toISOString(),
    threats: [
      {
        id: 'threat_001',
        type: 'hostile',
        severity: 'medium',
        location: 'Sector 7',
        status: 'monitoring'
      }
    ]
  };
  
  return NextResponse.json({
    success: true,
    data: threatStatus,
    message: 'Threat status retrieved successfully'
  });
}

async function handleGetResourceStatus(agent: any) {
  const resourceStatus = {
    personnel: {
      available: 45,
      deployed: 23,
      reserve: 12,
      unavailable: 10
    },
    vehicles: {
      operational: 8,
      maintenance: 2,
      deployed: 6
    },
    equipment: {
      communications: 'good',
      medical: 'adequate',
      weapons: 'good',
      supplies: 'low'
    }
  };
  
  return NextResponse.json({
    success: true,
    data: resourceStatus,
    message: 'Resource status retrieved successfully'
  });
}

async function handleGetTacticalOverview(agent: any) {
  const overview = {
    operationalStatus: 'normal',
    activeMissions: 3,
    threatLevel: 'medium',
    resourceReadiness: 85,
    weatherConditions: 'favorable',
    communicationStatus: 'operational',
    lastUpdate: new Date().toISOString()
  };
  
  return NextResponse.json({
    success: true,
    data: overview,
    message: 'Tactical overview retrieved successfully'
  });
}

async function getMissionById(missionId: string) {
  // Mock mission retrieval
  return {
    id: missionId,
    name: 'Sample Mission',
    status: 'active',
    // ... other mission data
  };
}