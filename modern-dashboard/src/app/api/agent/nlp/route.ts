import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { generateAIResponse, testOpenRouterConnection, AgentContext } from '@/lib/openrouter-client';

// NLP processing schemas
const nlpQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  context: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional(),
    timestamp: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }).optional().default({}),
  language: z.enum(['en', 'ar']).default('en'),
  responseFormat: z.enum(['text', 'structured', 'actions']).default('text')
});

const nlpCommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  parameters: z.record(z.any()).optional().default({}),
  context: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional(),
    currentMission: z.string().optional(),
    userRole: z.enum(['user', 'operator', 'commander', 'admin']).optional()
  }).optional().default({}),
  executeImmediately: z.boolean().default(false),
  confirmationRequired: z.boolean().default(true)
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

// Natural Language Processing patterns and intents
const NLP_PATTERNS = {
  // System status queries
  system_status: [
    /what is the system status/i,
    /show me system health/i,
    /are all services running/i,
    /check system performance/i,
    /system overview/i,
    /how is the system doing/i
  ],
  
  // Emergency commands
  emergency_alert: [
    /trigger emergency alert/i,
    /send panic signal/i,
    /alert emergency contacts/i,
    /activate emergency response/i,
    /emergency situation/i,
    /need immediate help/i
  ],
  
  // Tactical queries
  tactical_analysis: [
    /analyze tactical situation/i,
    /plan mission route/i,
    /optimize resource allocation/i,
    /assess threat level/i,
    /tactical overview/i,
    /mission status/i
  ],
  
  // Location and mapping
  location_query: [
    /where is (.+)/i,
    /show me location of (.+)/i,
    /find (.+) on map/i,
    /navigate to (.+)/i,
    /route to (.+)/i,
    /distance to (.+)/i
  ],
  
  // Resource management
  resource_management: [
    /allocate resources/i,
    /check resource availability/i,
    /deploy (.+) to (.+)/i,
    /resource status/i,
    /available personnel/i,
    /equipment status/i
  ],
  
  // Communication
  communication: [
    /send message to (.+)/i,
    /broadcast to (.+)/i,
    /establish communication with (.+)/i,
    /contact (.+)/i,
    /radio check/i
  ],
  
  // Task management
  task_management: [
    /schedule (.+)/i,
    /create task (.+)/i,
    /execute (.+)/i,
    /cancel task (.+)/i,
    /task status/i,
    /pending tasks/i
  ]
};

// Intent classification and entity extraction
function parseNaturalLanguage(query: string, context: any = {}) {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Find matching intent
  let intent = 'unknown';
  let confidence = 0;
  let entities = {};
  
  for (const [intentName, patterns] of Object.entries(NLP_PATTERNS)) {
    for (const pattern of patterns) {
      const match = normalizedQuery.match(pattern);
      if (match) {
        intent = intentName;
        confidence = 0.9; // High confidence for pattern match
        
        // Extract entities from regex groups
        if (match.length > 1) {
          entities = extractEntities(intentName, match, normalizedQuery);
        }
        break;
      }
    }
    if (intent !== 'unknown') break;
  }
  
  // Fallback: keyword-based classification
  if (intent === 'unknown') {
    const result = classifyByKeywords(normalizedQuery);
    intent = result.intent;
    confidence = result.confidence;
    entities = result.entities;
  }
  
  return {
    intent,
    confidence,
    entities,
    originalQuery: query,
    normalizedQuery,
    context
  };
}

function extractEntities(intent: string, match: RegExpMatchArray, query: string) {
  const entities: any = {};
  
  switch (intent) {
    case 'location_query':
      if (match[1]) {
        entities.target = match[1].trim();
        entities.locationType = 'search';
      }
      break;
      
    case 'resource_management':
      if (match[1] && match[2]) {
        entities.resource = match[1].trim();
        entities.destination = match[2].trim();
      }
      break;
      
    case 'communication':
      if (match[1]) {
        entities.recipient = match[1].trim();
      }
      break;
      
    case 'task_management':
      if (match[1]) {
        entities.taskName = match[1].trim();
      }
      break;
  }
  
  // Extract common entities
  entities.coordinates = extractCoordinates(query);
  entities.timeframe = extractTimeframe(query);
  entities.priority = extractPriority(query);
  
  return entities;
}

function classifyByKeywords(query: string) {
  const keywords = {
    system_status: ['status', 'health', 'performance', 'running', 'operational'],
    emergency_alert: ['emergency', 'panic', 'help', 'urgent', 'critical', 'alert'],
    tactical_analysis: ['tactical', 'mission', 'operation', 'threat', 'analyze'],
    location_query: ['location', 'where', 'map', 'navigate', 'route', 'coordinates'],
    resource_management: ['resource', 'personnel', 'equipment', 'allocate', 'deploy'],
    communication: ['message', 'contact', 'radio', 'communicate', 'broadcast'],
    task_management: ['task', 'schedule', 'execute', 'create', 'manage']
  };
  
  let bestIntent = 'unknown';
  let bestScore = 0;
  
  for (const [intent, words] of Object.entries(keywords)) {
    const score = words.reduce((acc, word) => {
      return acc + (query.includes(word) ? 1 : 0);
    }, 0) / words.length;
    
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }
  
  return {
    intent: bestScore > 0.2 ? bestIntent : 'unknown',
    confidence: bestScore,
    entities: {}
  };
}

function extractCoordinates(query: string) {
  // Extract coordinates in various formats
  const patterns = [
    /(\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/,  // lat, lng
    /(\d+\.?\d*)\s+(-?\d+\.?\d*)/,      // lat lng
    /coordinates?\s+(\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
  }
  
  return null;
}

function extractTimeframe(query: string) {
  const timePatterns = [
    { pattern: /in (\d+) minutes?/i, unit: 'minutes' },
    { pattern: /in (\d+) hours?/i, unit: 'hours' },
    { pattern: /in (\d+) days?/i, unit: 'days' },
    { pattern: /(\d+)h/i, unit: 'hours' },
    { pattern: /(\d+)m/i, unit: 'minutes' },
    { pattern: /now|immediately|asap/i, value: 'immediate' },
    { pattern: /today/i, value: 'today' },
    { pattern: /tomorrow/i, value: 'tomorrow' }
  ];
  
  for (const { pattern, unit, value } of timePatterns) {
    const match = query.match(pattern);
    if (match) {
      if (value) {
        return { type: value };
      } else {
        return {
          value: parseInt(match[1]),
          unit: unit
        };
      }
    }
  }
  
  return null;
}

function extractPriority(query: string) {
  const priorityPatterns = [
    { pattern: /critical|urgent|emergency/i, level: 'critical' },
    { pattern: /high priority|important/i, level: 'high' },
    { pattern: /medium priority|normal/i, level: 'medium' },
    { pattern: /low priority|routine/i, level: 'low' }
  ];
  
  for (const { pattern, level } of priorityPatterns) {
    if (query.match(pattern)) {
      return level;
    }
  }
  
  return null;
}

// Process natural language query
export async function POST(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has user assistance capability
    if (!agent.capabilities.includes('user-assistance')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have user-assistance capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'process_query':
        return await handleNLPQuery(body, agent);
      case 'execute_command':
        return await handleNLPCommand(body, agent);
      case 'get_context':
        return await handleGetContext(body, agent);
      default:
        // Default to processing query
        return await handleNLPQuery(body, agent);
    }
    
  } catch (error) {
    console.error('NLP processing error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid NLP request data',
            details: error.errors 
          } 
        },
        { status: 400 }
      );
    }
    
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
          message: 'Failed to process natural language request' 
        } 
      },
      { status: 500 }
    );
  }
}

// Get NLP capabilities and context
export async function GET(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has user assistance capability
    if (!agent.capabilities.includes('user-assistance')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have user-assistance capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    switch (type) {
      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            supportedIntents: Object.keys(NLP_PATTERNS),
            supportedLanguages: ['en', 'ar'],
            responseFormats: ['text', 'structured', 'actions'],
            features: [
              'Intent classification',
              'Entity extraction',
              'Context awareness',
              'Multi-language support',
              'Command execution',
              'Query processing'
            ]
          },
          message: 'NLP capabilities retrieved successfully'
        });
        
      case 'examples':
        return NextResponse.json({
          success: true,
          data: {
            queries: [
              'What is the system status?',
              'Show me all units within 5km of coordinates 34.0522, -118.2437',
              'Alert all emergency contacts about the current situation',
              'Generate a CASEVAC plan for priority 1 casualty',
              'Schedule backup for tonight at 2 AM',
              'Send secure message to Team Bravo about mission update'
            ],
            commands: [
              'trigger emergency alert at current location',
              'deploy medical team to sector 7',
              'establish communication with base',
              'execute tactical analysis for area',
              'schedule reconnaissance mission for tomorrow'
            ]
          },
          message: 'NLP examples retrieved successfully'
        });
        
      default:
        return NextResponse.json({
          success: true,
          data: {
            status: 'operational',
            version: '2.0.0',
            agentId: agent.agentId,
            capabilities: agent.capabilities,
            supportedIntents: Object.keys(NLP_PATTERNS).length,
            processingLatency: '< 100ms'
          },
          message: 'NLP service status retrieved successfully'
        });
    }
    
  } catch (error) {
    console.error('NLP service error:', error);
    
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
          message: 'Failed to retrieve NLP service information' 
        } 
      },
      { status: 500 }
    );
  }
}

// Handler functions

async function handleNLPQuery(body: any, agent: any) {
  const validatedData = nlpQuerySchema.parse(body);
  
  // Parse the natural language query
  const parsed = parseNaturalLanguage(validatedData.query, validatedData.context);
  
  // Create agent context for AI
  const agentContext: AgentContext = {
    agentId: agent.agentId,
    agentType: determineAgentType(agent.capabilities),
    userId: validatedData.context.userId,
    sessionId: validatedData.context.sessionId,
    location: validatedData.context.location,
    recentActions: []
  };
  
  let response;
  
  // Use OpenRouter AI for intelligent responses if available
  if (process.env.OPENROUTER_API_KEY && parsed.confidence < 0.8) {
    try {
      const aiResponse = await generateAIResponse(
        validatedData.query,
        agentContext,
        {
          includeActions: validatedData.responseFormat === 'actions',
          maxTokens: 1000
        }
      );
      
      response = {
        type: 'ai_generated',
        text: aiResponse.content,
        actions: aiResponse.actions,
        confidence: aiResponse.confidence,
        followUpQuestions: aiResponse.followUpQuestions,
        source: 'openrouter_ai'
      };
    } catch (error) {
      console.error('OpenRouter AI error, falling back to pattern matching:', error);
      response = await generateResponse(parsed, agent, validatedData.responseFormat);
    }
  } else {
    // Use pattern-based response generation
    response = await generateResponse(parsed, agent, validatedData.responseFormat);
  }
  
  return NextResponse.json({
    success: true,
    data: {
      query: validatedData.query,
      parsed: {
        intent: parsed.intent,
        confidence: parsed.confidence,
        entities: parsed.entities
      },
      response,
      language: validatedData.language,
      responseFormat: validatedData.responseFormat,
      processingTime: Date.now() - (parsed.context.timestamp ? new Date(parsed.context.timestamp).getTime() : Date.now())
    },
    message: 'Natural language query processed successfully'
  });
}

async function handleNLPCommand(body: any, agent: any) {
  const validatedData = nlpCommandSchema.parse(body);
  
  // Parse the command
  const parsed = parseNaturalLanguage(validatedData.command, validatedData.context);
  
  // Validate command execution permissions
  const canExecute = validateCommandPermissions(parsed.intent, agent.capabilities, validatedData.context.userRole);
  
  if (!canExecute.allowed) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'COMMAND_NOT_AUTHORIZED',
        message: canExecute.reason
      }
    }, { status: 403 });
  }
  
  // Execute command if immediate execution is requested
  let executionResult = null;
  if (validatedData.executeImmediately && !validatedData.confirmationRequired) {
    executionResult = await executeCommand(parsed, validatedData.parameters, agent);
  }
  
  return NextResponse.json({
    success: true,
    data: {
      command: validatedData.command,
      parsed: {
        intent: parsed.intent,
        confidence: parsed.confidence,
        entities: parsed.entities
      },
      authorization: canExecute,
      executionResult,
      requiresConfirmation: validatedData.confirmationRequired,
      suggestedActions: generateSuggestedActions(parsed)
    },
    message: executionResult ? 'Command executed successfully' : 'Command parsed and authorized'
  });
}

async function handleGetContext(body: any, agent: any) {
  const { sessionId, userId } = body;
  
  // Mock context retrieval (in production, would fetch from database)
  const context = {
    sessionId,
    userId,
    agentId: agent.agentId,
    currentLocation: null,
    activeMissions: [],
    recentQueries: [],
    userPreferences: {
      language: 'en',
      responseFormat: 'text',
      verbosity: 'medium'
    },
    systemStatus: 'operational',
    availableCapabilities: agent.capabilities
  };
  
  return NextResponse.json({
    success: true,
    data: { context },
    message: 'Context retrieved successfully'
  });
}

// Helper functions

async function generateResponse(parsed: any, agent: any, format: string) {
  const { intent, entities, confidence } = parsed;
  
  if (confidence < 0.3) {
    return {
      type: 'clarification',
      text: "I'm not sure I understand. Could you please rephrase your request?",
      suggestions: [
        'Try asking about system status',
        'Ask for tactical information',
        'Request emergency assistance'
      ]
    };
  }
  
  switch (intent) {
    case 'system_status':
      return await generateSystemStatusResponse(entities, format);
      
    case 'emergency_alert':
      return await generateEmergencyResponse(entities, format);
      
    case 'tactical_analysis':
      return await generateTacticalResponse(entities, format);
      
    case 'location_query':
      return await generateLocationResponse(entities, format);
      
    case 'resource_management':
      return await generateResourceResponse(entities, format);
      
    case 'communication':
      return await generateCommunicationResponse(entities, format);
      
    case 'task_management':
      return await generateTaskResponse(entities, format);
      
    default:
      return {
        type: 'general',
        text: `I understand you're asking about ${intent}, but I need more specific information to help you effectively.`,
        suggestedActions: [
          'Provide more details about what you need',
          'Ask about specific system capabilities',
          'Request help with available commands'
        ]
      };
  }
}

async function generateSystemStatusResponse(entities: any, format: string) {
  // Mock system status (in production, would fetch real data)
  const status = {
    overall: 'operational',
    services: { active: 8, total: 10 },
    performance: { cpu: 45, memory: 62, disk: 35 },
    alerts: 2,
    uptime: '15 days, 4 hours'
  };
  
  if (format === 'structured') {
    return {
      type: 'system_status',
      data: status,
      summary: 'System is operational with minor alerts'
    };
  }
  
  return {
    type: 'system_status',
    text: `✅ System Status: ${status.overall.toUpperCase()}\n\n` +
          `Services: ${status.services.active}/${status.services.total} running\n` +
          `Performance: CPU ${status.performance.cpu}%, Memory ${status.performance.memory}%, Disk ${status.performance.disk}%\n` +
          `Active Alerts: ${status.alerts}\n` +
          `Uptime: ${status.uptime}`,
    data: status
  };
}

async function generateEmergencyResponse(entities: any, format: string) {
  const response = {
    type: 'emergency_alert',
    text: '🚨 Emergency alert has been triggered. Emergency contacts are being notified immediately.',
    actions: [
      'Emergency contacts notified',
      'Nearest responders alerted',
      'Incident logged in system'
    ],
    estimatedResponseTime: '5-8 minutes'
  };
  
  if (entities.coordinates) {
    response.text += `\n📍 Location: ${entities.coordinates.lat}, ${entities.coordinates.lng}`;
  }
  
  return response;
}

async function generateTacticalResponse(entities: any, format: string) {
  return {
    type: 'tactical_analysis',
    text: '🎯 Tactical analysis initiated. Analyzing current operational status and threat assessment.',
    data: {
      activeMissions: 3,
      threatLevel: 'medium',
      resourceReadiness: '85%',
      recommendedActions: [
        'Continue current patrol patterns',
        'Monitor sector 7 for increased activity',
        'Maintain communication protocols'
      ]
    }
  };
}

async function generateLocationResponse(entities: any, format: string) {
  const target = entities.target || 'specified location';
  
  return {
    type: 'location_query',
    text: `📍 Searching for location: ${target}`,
    data: {
      searchTerm: target,
      results: [
        {
          name: target,
          coordinates: entities.coordinates || { lat: 34.0522, lng: -118.2437 },
          distance: '2.3 km',
          bearing: '045°'
        }
      ]
    }
  };
}

async function generateResourceResponse(entities: any, format: string) {
  return {
    type: 'resource_management',
    text: '📋 Resource allocation analysis in progress.',
    data: {
      availablePersonnel: 45,
      deployedPersonnel: 23,
      availableVehicles: 8,
      deployedVehicles: 6,
      recommendations: [
        'Reserve capacity available for deployment',
        'Consider rotating deployed units',
        'Equipment maintenance scheduled'
      ]
    }
  };
}

async function generateCommunicationResponse(entities: any, format: string) {
  const recipient = entities.recipient || 'specified recipient';
  
  return {
    type: 'communication',
    text: `📡 Establishing communication with ${recipient}.`,
    data: {
      recipient,
      channels: ['radio', 'secure_message', 'satellite'],
      status: 'attempting_connection'
    }
  };
}

async function generateTaskResponse(entities: any, format: string) {
  const taskName = entities.taskName || 'specified task';
  
  return {
    type: 'task_management',
    text: `📅 Task management: ${taskName}`,
    data: {
      taskName,
      status: 'processing',
      estimatedCompletion: entities.timeframe || 'pending schedule'
    }
  };
}

function validateCommandPermissions(intent: string, capabilities: string[], userRole?: string) {
  const requiredCapabilities = {
    system_status: ['system-monitoring'],
    emergency_alert: ['emergency-response'],
    tactical_analysis: ['tactical-operations'],
    resource_management: ['tactical-operations'],
    communication: ['communication-management'],
    task_management: ['task-automation']
  };
  
  const required = requiredCapabilities[intent] || [];
  const hasCapability = required.every(cap => capabilities.includes(cap));
  
  if (!hasCapability) {
    return {
      allowed: false,
      reason: `Missing required capabilities: ${required.join(', ')}`
    };
  }
  
  // Role-based restrictions
  const restrictedCommands = ['emergency_alert', 'tactical_analysis'];
  if (restrictedCommands.includes(intent) && userRole === 'user') {
    return {
      allowed: false,
      reason: 'Command requires elevated privileges'
    };
  }
  
  return {
    allowed: true,
    reason: 'Command authorized'
  };
}

async function executeCommand(parsed: any, parameters: any, agent: any) {
  // Mock command execution (in production, would execute real commands)
  return {
    status: 'executed',
    result: `Command ${parsed.intent} executed successfully`,
    timestamp: new Date().toISOString(),
    executedBy: agent.agentId
  };
}

function determineAgentType(capabilities: string[]): 'tactical_operations' | 'system_monitoring' | 'emergency_response' | 'user_assistance' {
  if (capabilities.includes('tactical-operations')) {
    return 'tactical_operations';
  } else if (capabilities.includes('system-monitoring')) {
    return 'system_monitoring';
  } else if (capabilities.includes('emergency-response')) {
    return 'emergency_response';
  } else {
    return 'user_assistance';
  }
}

function generateSuggestedActions(parsed: any) {
  const suggestions = {
    system_status: [
      'Check specific service status',
      'View performance metrics',
      'Review system logs'
    ],
    emergency_alert: [
      'Specify emergency type',
      'Provide location details',
      'Add contact information'
    ],
    tactical_analysis: [
      'Define analysis area',
      'Specify threat types',
      'Set time parameters'
    ]
  };
  
  return suggestions[parsed.intent] || [
    'Provide more specific details',
    'Clarify the request',
    'Ask for help with available options'
  ];
}