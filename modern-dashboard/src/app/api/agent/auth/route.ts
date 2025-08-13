/**
 * Agent Authentication API
 * Handles authentication and authorization for AI agents
 * Provides secure access tokens and capability management
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret';
const AGENT_API_KEY = process.env.AGENT_API_KEY || 'default-agent-key';

// Agent capability levels
const AGENT_CAPABILITIES = {
  'basic': [
    'read_system_status',
    'read_tasks',
    'read_operations'
  ],
  'advanced': [
    'read_system_status',
    'read_tasks',
    'read_operations',
    'create_tasks',
    'update_tasks',
    'read_users',
    'read_assets'
  ],
  'full': [
    'read_system_status',
    'read_tasks',
    'read_operations',
    'create_tasks',
    'update_tasks',
    'read_users',
    'read_assets',
    'manage_users',
    'control_assets',
    'manage_operations',
    'emergency_response',
    'system_control',
    'intelligence_analysis'
  ]
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'authenticate':
        return await authenticateAgent(data);
      
      case 'refresh_token':
        return await refreshAgentToken(data);
      
      case 'register_agent':
        return await registerAgent(data);
      
      case 'revoke_token':
        return await revokeAgentToken(data);
      
      case 'get_capabilities':
        return await getAgentCapabilities(data);
      
      case 'update_capabilities':
        return await updateAgentCapabilities(data);
      
      default:
        return NextResponse.json(
          { error: 'Unknown authentication action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in agent authentication API:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    switch (action) {
      case 'verify_token':
        return await verifyAgentToken(token);
      
      case 'get_session_info':
        return await getAgentSessionInfo(token);
      
      case 'list_active_agents':
        return await listActiveAgents();
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in agent authentication GET:', error);
    return NextResponse.json(
      { error: 'Request failed', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Authentication Functions

async function authenticateAgent(data: any) {
  const { agentId, apiKey, capabilities, metadata } = data;

  // Verify API key
  if (apiKey !== AGENT_API_KEY) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }

  // Generate unique session ID
  const sessionId = crypto.randomUUID();
  
  // Create JWT token with agent information
  const tokenPayload = {
    agentId,
    sessionId,
    capabilities: capabilities || 'basic',
    type: 'agent',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET);

  // Store agent session in database
  await prisma.$queryRawUnsafe(`
    INSERT INTO agent_sessions (
      agent_id, agent_type, capabilities, status, context, metadata
    ) VALUES (
      $1, 'authenticated_agent', $2, 'active', $3, $4
    )
  `,
    agentId,
    JSON.stringify(AGENT_CAPABILITIES[capabilities] || AGENT_CAPABILITIES.basic),
    JSON.stringify({
      sessionId,
      authenticatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }),
    JSON.stringify({
      ...metadata,
      authenticationMethod: 'api_key',
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
  );

  // Log authentication event
  await prisma.$queryRawUnsafe(`
    INSERT INTO system_metrics (
      metric_name, metric_value, source, tags, metadata
    ) VALUES (
      'agent_authentication', 1, 'auth_system', $1, $2
    )
  `,
    JSON.stringify({ agentId, capabilities }),
    JSON.stringify({
      sessionId,
      authenticatedAt: new Date().toISOString(),
      ipAddress: metadata?.ipAddress
    })
  );

  return NextResponse.json({
    success: true,
    token,
    sessionId,
    capabilities: AGENT_CAPABILITIES[capabilities] || AGENT_CAPABILITIES.basic,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
}

async function refreshAgentToken(data: any) {
  const { token } = data;

  try {
    // Verify existing token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if agent session is still active
    const session = await prisma.$queryRawUnsafe(`
      SELECT * FROM agent_sessions 
      WHERE agent_id = $1 AND status = 'active'
      AND context->>'sessionId' = $2
    `, decoded.agentId, decoded.sessionId);

    if (!session || session.length === 0) {
      return NextResponse.json(
        { error: 'Agent session not found or inactive' },
        { status: 401 }
      );
    }

    // Generate new token
    const newTokenPayload = {
      ...decoded,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const newToken = jwt.sign(newTokenPayload, JWT_SECRET);

    // Update session activity
    await prisma.$queryRawUnsafe(`
      UPDATE agent_sessions 
      SET context = jsonb_set(context, '{lastActivity}', $1),
          updated_at = NOW()
      WHERE agent_id = $2 AND context->>'sessionId' = $3
    `,
      JSON.stringify(new Date().toISOString()),
      decoded.agentId,
      decoded.sessionId
    );

    return NextResponse.json({
      success: true,
      token: newToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

async function registerAgent(data: any) {
  const { agentId, agentType, description, capabilities, metadata } = data;

  // Check if agent already exists
  const existingAgent = await prisma.$queryRawUnsafe(`
    SELECT * FROM agent_sessions WHERE agent_id = $1
  `, agentId);

  if (existingAgent && existingAgent.length > 0) {
    return NextResponse.json(
      { error: 'Agent already registered' },
      { status: 409 }
    );
  }

  // Register new agent
  await prisma.$queryRawUnsafe(`
    INSERT INTO agent_sessions (
      agent_id, agent_type, capabilities, status, context, metadata
    ) VALUES (
      $1, $2, $3, 'registered', $4, $5
    )
  `,
    agentId,
    agentType || 'general_agent',
    JSON.stringify(AGENT_CAPABILITIES[capabilities] || AGENT_CAPABILITIES.basic),
    JSON.stringify({
      registeredAt: new Date().toISOString(),
      description: description || 'AI Agent'
    }),
    JSON.stringify({
      ...metadata,
      registrationMethod: 'api',
      initialCapabilities: capabilities || 'basic'
    })
  );

  return NextResponse.json({
    success: true,
    message: 'Agent registered successfully',
    agentId,
    capabilities: AGENT_CAPABILITIES[capabilities] || AGENT_CAPABILITIES.basic
  });
}

async function revokeAgentToken(data: any) {
  const { agentId, sessionId } = data;

  // Deactivate agent session
  await prisma.$queryRawUnsafe(`
    UPDATE agent_sessions 
    SET status = 'revoked', updated_at = NOW()
    WHERE agent_id = $1 AND context->>'sessionId' = $2
  `, agentId, sessionId);

  // Log revocation event
  await prisma.$queryRawUnsafe(`
    INSERT INTO system_metrics (
      metric_name, metric_value, source, tags, metadata
    ) VALUES (
      'agent_token_revoked', 1, 'auth_system', $1, $2
    )
  `,
    JSON.stringify({ agentId, sessionId }),
    JSON.stringify({
      revokedAt: new Date().toISOString(),
      reason: 'manual_revocation'
    })
  );

  return NextResponse.json({
    success: true,
    message: 'Agent token revoked successfully'
  });
}

async function getAgentCapabilities(data: any) {
  const { agentId } = data;

  const agent = await prisma.$queryRawUnsafe(`
    SELECT capabilities, metadata FROM agent_sessions 
    WHERE agent_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `, agentId);

  if (!agent || agent.length === 0) {
    return NextResponse.json(
      { error: 'Agent not found or inactive' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    agentId,
    capabilities: agent[0].capabilities,
    metadata: agent[0].metadata
  });
}

async function updateAgentCapabilities(data: any) {
  const { agentId, capabilities, updatedBy } = data;

  // Update agent capabilities
  await prisma.$queryRawUnsafe(`
    UPDATE agent_sessions 
    SET capabilities = $1, 
        metadata = jsonb_set(metadata, '{lastCapabilityUpdate}', $2),
        updated_at = NOW()
    WHERE agent_id = $3 AND status = 'active'
  `,
    JSON.stringify(AGENT_CAPABILITIES[capabilities] || AGENT_CAPABILITIES.basic),
    JSON.stringify(new Date().toISOString()),
    agentId
  );

  // Log capability update
  await prisma.$queryRawUnsafe(`
    INSERT INTO system_metrics (
      metric_name, metric_value, source, tags, metadata
    ) VALUES (
      'agent_capabilities_updated', 1, 'auth_system', $1, $2
    )
  `,
    JSON.stringify({ agentId, newCapabilities: capabilities }),
    JSON.stringify({
      updatedBy: updatedBy || 'system',
      updatedAt: new Date().toISOString()
    })
  );

  return NextResponse.json({
    success: true,
    message: 'Agent capabilities updated successfully',
    newCapabilities: AGENT_CAPABILITIES[capabilities] || AGENT_CAPABILITIES.basic
  });
}

// Token Verification Functions

async function verifyAgentToken(token: string) {
  if (!token) {
    return NextResponse.json(
      { error: 'No token provided' },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if agent session is still active
    const session = await prisma.$queryRawUnsafe(`
      SELECT * FROM agent_sessions 
      WHERE agent_id = $1 AND status = 'active'
      AND context->>'sessionId' = $2
    `, decoded.agentId, decoded.sessionId);

    if (!session || session.length === 0) {
      return NextResponse.json(
        { error: 'Agent session not found or inactive' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      agentId: decoded.agentId,
      capabilities: decoded.capabilities,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token', valid: false },
      { status: 401 }
    );
  }
}

async function getAgentSessionInfo(token: string) {
  if (!token) {
    return NextResponse.json(
      { error: 'No token provided' },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const session = await prisma.$queryRawUnsafe(`
      SELECT 
        agent_id,
        agent_type,
        capabilities,
        status,
        context,
        metadata,
        created_at,
        updated_at
      FROM agent_sessions 
      WHERE agent_id = $1 AND context->>'sessionId' = $2
    `, decoded.agentId, decoded.sessionId);

    if (!session || session.length === 0) {
      return NextResponse.json(
        { error: 'Agent session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: session[0]
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

async function listActiveAgents() {
  const agents = await prisma.$queryRawUnsafe(`
    SELECT 
      agent_id,
      agent_type,
      capabilities,
      status,
      context->>'lastActivity' as last_activity,
      metadata,
      created_at
    FROM agent_sessions 
    WHERE status = 'active'
    ORDER BY created_at DESC
  `);

  return NextResponse.json({
    success: true,
    agents,
    total: agents.length
  });
}