import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Agent authentication schema
const agentAuthSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  capabilities: z.array(z.string()).min(1, 'At least one capability is required'),
  version: z.string().optional().default('2.0.0'),
  metadata: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['monitoring', 'tactical', 'emergency', 'assistance', 'security']).optional(),
  }).optional()
});

// Agent capabilities validation
const validCapabilities = [
  'system-monitoring',
  'tactical-operations', 
  'emergency-response',
  'user-assistance',
  'task-automation',
  'security-management',
  'analytics',
  'communication-management'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = agentAuthSchema.parse(body);
    
    // Validate API key from headers
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_API_KEY', 
            message: 'API key is required for agent authentication' 
          } 
        },
        { status: 401 }
      );
    }
    
    // Validate API key (in production, check against database)
    const validApiKey = process.env.AGENT_API_KEY || 'tactical-ops-agent-key-2024';
    if (apiKey !== validApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_API_KEY', 
            message: 'Invalid API key provided' 
          } 
        },
        { status: 401 }
      );
    }
    
    // Validate capabilities
    const invalidCapabilities = validatedData.capabilities.filter(
      cap => !validCapabilities.includes(cap)
    );
    
    if (invalidCapabilities.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_CAPABILITIES', 
            message: `Invalid capabilities: ${invalidCapabilities.join(', ')}`,
            validCapabilities 
          } 
        },
        { status: 400 }
      );
    }
    
    // Generate JWT token for agent
    const jwtSecret = process.env.JWT_SECRET || 'tactical-ops-secret-2024';
    const agentToken = jwt.sign(
      {
        type: 'agent',
        agentId: validatedData.agentId,
        capabilities: validatedData.capabilities,
        version: validatedData.version,
        metadata: validatedData.metadata,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      jwtSecret
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        type: 'agent-refresh',
        agentId: validatedData.agentId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      },
      jwtSecret
    );
    
    // Log agent authentication
    console.log(`🤖 Agent authenticated: ${validatedData.agentId} with capabilities: ${validatedData.capabilities.join(', ')}`);
    
    return NextResponse.json({
      success: true,
      data: {
        token: agentToken,
        refreshToken: refreshToken,
        expiresIn: 86400, // 24 hours in seconds
        agentId: validatedData.agentId,
        capabilities: validatedData.capabilities,
        endpoints: {
          system: '/api/agent/system',
          tactical: '/api/agent/tactical',
          emergency: '/api/agent/emergency',
          tasks: '/api/agent/tasks',
          communication: '/api/agent/communication',
          assistance: '/api/agent/assistance',
          security: '/api/agent/security'
        },
        rateLimits: {
          requestsPerMinute: 1000,
          burstLimit: 100,
          concurrentConnections: 10
        }
      },
      message: 'Agent authenticated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Agent authentication error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data',
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
          message: 'Internal server error during agent authentication' 
        } 
      },
      { status: 500 }
    );
  }
}

// Agent token refresh endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;
    
    if (!refreshToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MISSING_REFRESH_TOKEN', 
            message: 'Refresh token is required' 
          } 
        },
        { status: 400 }
      );
    }
    
    // Verify refresh token
    const jwtSecret = process.env.JWT_SECRET || 'tactical-ops-secret-2024';
    const decoded = jwt.verify(refreshToken, jwtSecret) as any;
    
    if (decoded.type !== 'agent-refresh') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_TOKEN_TYPE', 
            message: 'Invalid refresh token type' 
          } 
        },
        { status: 401 }
      );
    }
    
    // Generate new access token (would typically fetch agent data from database)
    const newToken = jwt.sign(
      {
        type: 'agent',
        agentId: decoded.agentId,
        capabilities: [], // Would fetch from database
        version: '2.0.0',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      jwtSecret
    );
    
    return NextResponse.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: 86400
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_REFRESH_TOKEN', 
            message: 'Invalid or expired refresh token' 
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
          message: 'Internal server error during token refresh' 
        } 
      },
      { status: 500 }
    );
  }
}