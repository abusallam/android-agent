/**
 * OpenRouter AI Client for TacticalOps Platform
 * Provides AI capabilities for agentic control and natural language processing
 */

import OpenAI from 'openai';

// OpenRouter configuration
const OPENROUTER_CONFIG = {
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  defaultModel: process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-coder-32b-instruct',
  maxTokens: parseInt(process.env.AGENTIC_MAX_TOKENS || '4096'),
  temperature: parseFloat(process.env.AGENTIC_TEMPERATURE || '0.7'),
  timeout: parseInt(process.env.AGENTIC_TIMEOUT || '30000')
};

// Initialize OpenRouter client
const openrouter = new OpenAI({
  apiKey: OPENROUTER_CONFIG.apiKey,
  baseURL: OPENROUTER_CONFIG.baseURL,
  timeout: OPENROUTER_CONFIG.timeout
});

// System prompts for different agent types
export const AGENT_SYSTEM_PROMPTS = {
  tactical_operations: `You are a TacticalOps AI Agent specialized in tactical operations and military planning. 

Your capabilities include:
- Analyzing tactical situations and providing strategic recommendations
- Planning missions and operations with detailed risk assessments
- Coordinating resources and personnel for optimal effectiveness
- Providing real-time tactical guidance and decision support
- Analyzing maps, terrain, and environmental factors
- Creating CASEVAC plans and emergency response procedures

You have access to the TacticalOps platform APIs and can:
- Create and manage missions
- Analyze map data and plan routes
- Assess threats and provide security recommendations
- Coordinate emergency responses
- Manage resources and personnel allocation

Always prioritize:
1. Safety of personnel (highest priority)
2. Mission success and objectives
3. Resource optimization and efficiency
4. Operational security (OPSEC)
5. Clear, actionable recommendations

Respond in a professional, military-appropriate tone with specific, actionable guidance.`,

  system_monitoring: `You are a TacticalOps System Monitoring AI Agent responsible for maintaining system health and performance.

Your responsibilities include:
- Monitoring system health, performance metrics, and resource usage
- Detecting anomalies and potential issues before they become critical
- Performing automated maintenance and optimization tasks
- Generating performance reports and recommendations
- Managing system alerts and notifications
- Coordinating with other agents for system-wide operations

You have access to:
- System metrics (CPU, memory, disk, network)
- Application performance data
- Database and cache status
- Container and service health
- Log analysis and error tracking
- Automated remediation tools

Key monitoring thresholds:
- CPU usage: Alert if >80% for >5 minutes
- Memory usage: Alert if >85%
- Disk space: Alert if >90%
- Response time: Alert if >1000ms average
- Error rate: Alert if >5% of requests

Provide clear, technical recommendations with specific metrics and actionable steps.`,

  emergency_response: `You are a TacticalOps Emergency Response AI Agent specialized in crisis management and emergency coordination.

Your role includes:
- Processing and prioritizing emergency alerts
- Coordinating response resources and personnel
- Managing incident escalation and communication
- Providing real-time emergency guidance
- Creating and executing emergency response plans
- Coordinating with external emergency services

Emergency response priorities:
1. Life safety (absolute priority)
2. Property protection
3. Environmental protection
4. Operational continuity

Response procedures:
- Panic button: Immediate response within 30 seconds
- Medical emergency: Coordinate medical resources and CASEVAC
- Security threat: Assess threat level and implement countermeasures
- Natural disaster: Activate emergency protocols and evacuation procedures

You can:
- Create and manage emergency alerts
- Dispatch resources and coordinate responses
- Communicate with emergency contacts
- Track incident status and resolution
- Generate incident reports and analysis

Always respond with urgency appropriate to the situation while maintaining clear, professional communication.`,

  user_assistance: `You are a TacticalOps User Assistance AI Agent designed to help users navigate and utilize the platform effectively.

Your purpose is to:
- Help users understand and use platform features
- Provide tactical guidance and best practices
- Troubleshoot technical issues and problems
- Generate reports and analyze data
- Train users on proper procedures
- Answer questions about platform capabilities

You have knowledge of:
- All platform features and capabilities
- Tactical procedures and best practices
- Security protocols and requirements
- Emergency response procedures
- System administration tasks
- Integration with external systems

Communication style:
- Clear, concise, and helpful
- Professional but approachable
- Use appropriate tactical terminology
- Provide step-by-step guidance when needed
- Offer multiple solutions when possible
- Always prioritize user safety and security

You can help with:
- Feature explanations and tutorials
- Troubleshooting and problem resolution
- Best practice recommendations
- Report generation and data analysis
- Training and skill development
- System configuration and setup

Always ensure users understand the implications of their actions, especially regarding security and safety.`
};

// Agent context interface
export interface AgentContext {
  agentId: string;
  agentType: 'tactical_operations' | 'system_monitoring' | 'emergency_response' | 'user_assistance';
  userId?: string;
  sessionId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  currentMission?: string;
  userRole?: string;
  systemStatus?: any;
  recentActions?: string[];
}

// AI response interface
export interface AIResponse {
  content: string;
  reasoning?: string;
  actions?: Array<{
    type: string;
    description: string;
    parameters?: any;
  }>;
  confidence: number;
  followUpQuestions?: string[];
}

/**
 * Generate AI response using OpenRouter
 */
export async function generateAIResponse(
  prompt: string,
  context: AgentContext,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    includeActions?: boolean;
  } = {}
): Promise<AIResponse> {
  try {
    const systemPrompt = AGENT_SYSTEM_PROMPTS[context.agentType];
    const model = options.model || OPENROUTER_CONFIG.defaultModel;
    
    // Build context-aware prompt
    const contextualPrompt = buildContextualPrompt(prompt, context);
    
    const completion = await openrouter.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: contextualPrompt
        }
      ],
      max_tokens: options.maxTokens || OPENROUTER_CONFIG.maxTokens,
      temperature: options.temperature || OPENROUTER_CONFIG.temperature,
      stream: false
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Parse response for actions if requested
    const actions = options.includeActions ? parseActionsFromResponse(content) : [];
    
    return {
      content,
      actions,
      confidence: calculateConfidence(completion),
      followUpQuestions: generateFollowUpQuestions(content, context)
    };
    
  } catch (error) {
    console.error('OpenRouter AI error:', error);
    throw new Error(`AI response generation failed: ${error.message}`);
  }
}

/**
 * Build contextual prompt with system information
 */
function buildContextualPrompt(prompt: string, context: AgentContext): string {
  let contextualPrompt = `Agent Context:
- Agent ID: ${context.agentId}
- Agent Type: ${context.agentType}
- Timestamp: ${new Date().toISOString()}`;

  if (context.userId) {
    contextualPrompt += `\n- User ID: ${context.userId}`;
  }

  if (context.location) {
    contextualPrompt += `\n- Location: ${context.location.lat}, ${context.location.lng}`;
  }

  if (context.currentMission) {
    contextualPrompt += `\n- Current Mission: ${context.currentMission}`;
  }

  if (context.userRole) {
    contextualPrompt += `\n- User Role: ${context.userRole}`;
  }

  if (context.systemStatus) {
    contextualPrompt += `\n- System Status: ${JSON.stringify(context.systemStatus)}`;
  }

  if (context.recentActions && context.recentActions.length > 0) {
    contextualPrompt += `\n- Recent Actions: ${context.recentActions.join(', ')}`;
  }

  contextualPrompt += `\n\nUser Request: ${prompt}`;

  return contextualPrompt;
}

/**
 * Parse actions from AI response
 */
function parseActionsFromResponse(content: string): Array<{
  type: string;
  description: string;
  parameters?: any;
}> {
  const actions: Array<{
    type: string;
    description: string;
    parameters?: any;
  }> = [];

  // Look for action patterns in the response
  const actionPatterns = [
    /ACTION:\s*(\w+)\s*-\s*(.+?)(?:\n|$)/gi,
    /\[ACTION:\s*(\w+)\]\s*(.+?)(?:\n|$)/gi,
    /EXECUTE:\s*(\w+)\s*-\s*(.+?)(?:\n|$)/gi
  ];

  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      actions.push({
        type: match[1].toLowerCase(),
        description: match[2].trim(),
        parameters: {}
      });
    }
  }

  return actions;
}

/**
 * Calculate confidence score based on completion
 */
function calculateConfidence(completion: any): number {
  // Simple confidence calculation based on response length and finish reason
  const content = completion.choices[0]?.message?.content || '';
  const finishReason = completion.choices[0]?.finish_reason;
  
  let confidence = 0.7; // Base confidence
  
  if (finishReason === 'stop') {
    confidence += 0.2; // Complete response
  }
  
  if (content.length > 100) {
    confidence += 0.1; // Detailed response
  }
  
  return Math.min(confidence, 1.0);
}

/**
 * Generate follow-up questions based on response and context
 */
function generateFollowUpQuestions(content: string, context: AgentContext): string[] {
  const questions: string[] = [];
  
  switch (context.agentType) {
    case 'tactical_operations':
      questions.push(
        'Would you like me to create a detailed mission plan?',
        'Do you need a threat assessment for this area?',
        'Should I coordinate additional resources?'
      );
      break;
      
    case 'system_monitoring':
      questions.push(
        'Would you like me to run a comprehensive system health check?',
        'Should I generate a performance report?',
        'Do you want me to set up monitoring alerts?'
      );
      break;
      
    case 'emergency_response':
      questions.push(
        'Do you need me to dispatch emergency resources?',
        'Should I notify additional emergency contacts?',
        'Would you like me to create an incident report?'
      );
      break;
      
    case 'user_assistance':
      questions.push(
        'Would you like more detailed instructions?',
        'Do you need help with any other features?',
        'Should I create a tutorial for this process?'
      );
      break;
  }
  
  return questions.slice(0, 3); // Limit to 3 questions
}

/**
 * Test OpenRouter connection
 */
export async function testOpenRouterConnection(): Promise<{
  success: boolean;
  model: string;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const completion = await openrouter.chat.completions.create({
      model: OPENROUTER_CONFIG.defaultModel,
      messages: [
        {
          role: 'user',
          content: 'Test connection. Respond with "Connection successful".'
        }
      ],
      max_tokens: 50,
      temperature: 0
    });

    const latency = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content || '';
    
    return {
      success: content.toLowerCase().includes('connection successful'),
      model: OPENROUTER_CONFIG.defaultModel,
      latency,
    };
    
  } catch (error) {
    return {
      success: false,
      model: OPENROUTER_CONFIG.defaultModel,
      latency: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Get available models from OpenRouter
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data?.map((model: any) => model.id) || [];
    
  } catch (error) {
    console.error('Failed to fetch available models:', error);
    return [OPENROUTER_CONFIG.defaultModel];
  }
}

export default openrouter;