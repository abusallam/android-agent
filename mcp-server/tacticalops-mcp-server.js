#!/usr/bin/env node
/**
 * TacticalOps MCP Server
 * Provides MCP tools for testing and interacting with the TacticalOps Platform
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

// Configuration
const CONFIG = {
  apiUrl: process.env.TACTICALOPS_API_URL || 'http://localhost:3000/api/v2',
  agentApiKey: process.env.TACTICALOPS_AGENT_API_KEY || 'tactical-ops-agent-key-2024',
  timeout: 30000
};

// HTTP client setup
const httpClient = axios.create({
  baseURL: CONFIG.apiUrl,
  timeout: CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'TacticalOps-MCP-Server/1.0.0'
  }
});

// Agent authentication token (will be set after authentication)
let agentToken = null;

/**
 * Authenticate agent and get token
 */
async function authenticateAgent() {
  try {
    const response = await httpClient.post('/agent/auth', {
      agentId: 'mcp-test-agent',
      capabilities: [
        'system-monitoring',
        'tactical-operations',
        'emergency-response',
        'user-assistance',
        'task-automation'
      ],
      version: '2.0.0',
      metadata: {
        name: 'MCP Test Agent',
        description: 'Agent for MCP testing and validation',
        type: 'assistance'
      }
    }, {
      headers: {
        'X-API-Key': CONFIG.agentApiKey
      }
    });

    if (response.data.success) {
      agentToken = response.data.data.token;
      console.error('✅ Agent authenticated successfully');
      return true;
    } else {
      console.error('❌ Agent authentication failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Agent authentication error:', error.message);
    return false;
  }
}

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest(method, endpoint, data = null) {
  if (!agentToken) {
    const authenticated = await authenticateAgent();
    if (!authenticated) {
      throw new Error('Agent authentication failed');
    }
  }

  const config = {
    method,
    url: endpoint,
    headers: {
      'Authorization': `Bearer ${agentToken}`
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await httpClient(config);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired, re-authenticate
      agentToken = null;
      const authenticated = await authenticateAgent();
      if (authenticated) {
        config.headers['Authorization'] = `Bearer ${agentToken}`;
        const retryResponse = await httpClient(config);
        return retryResponse.data;
      }
    }
    throw error;
  }
}

// MCP Tools Definition
const TOOLS = [
  {
    name: 'test_system_health',
    description: 'Test system health and get comprehensive status information',
    inputSchema: {
      type: 'object',
      properties: {
        includeMetrics: {
          type: 'boolean',
          description: 'Include detailed performance metrics',
          default: true
        },
        checkServices: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific services to check',
          default: ['all']
        }
      }
    }
  },
  {
    name: 'test_agent_authentication',
    description: 'Test agent authentication and capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        testCapabilities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Capabilities to test',
          default: ['system-monitoring', 'tactical-operations']
        }
      }
    }
  },
  {
    name: 'test_nlp_processing',
    description: 'Test natural language processing capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query to test'
        },
        responseFormat: {
          type: 'string',
          enum: ['text', 'structured', 'actions'],
          description: 'Expected response format',
          default: 'structured'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'test_emergency_response',
    description: 'Test emergency response system',
    inputSchema: {
      type: 'object',
      properties: {
        emergencyType: {
          type: 'string',
          enum: ['medical', 'fire', 'security', 'natural_disaster'],
          description: 'Type of emergency to simulate',
          default: 'medical'
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Emergency severity level',
          default: 'medium'
        },
        location: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          },
          description: 'Emergency location coordinates'
        }
      }
    }
  },
  {
    name: 'test_tactical_operations',
    description: 'Test tactical operations capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['map_analysis', 'route_planning', 'mission_creation', 'threat_assessment'],
          description: 'Tactical operation to test',
          default: 'map_analysis'
        },
        parameters: {
          type: 'object',
          description: 'Operation-specific parameters'
        }
      }
    }
  },
  {
    name: 'test_task_automation',
    description: 'Test task scheduling and automation',
    inputSchema: {
      type: 'object',
      properties: {
        taskType: {
          type: 'string',
          enum: ['health_check', 'backup', 'report_generation'],
          description: 'Type of task to test',
          default: 'health_check'
        },
        schedule: {
          type: 'string',
          description: 'Cron schedule expression',
          default: '*/5 * * * *'
        }
      }
    }
  },
  {
    name: 'run_comprehensive_test',
    description: 'Run comprehensive test suite for all platform features',
    inputSchema: {
      type: 'object',
      properties: {
        testSuite: {
          type: 'string',
          enum: ['basic', 'full', 'performance', 'security'],
          description: 'Test suite to run',
          default: 'basic'
        },
        generateReport: {
          type: 'boolean',
          description: 'Generate detailed test report',
          default: true
        }
      }
    }
  },
  {
    name: 'monitor_real_time',
    description: 'Monitor platform in real-time and report status',
    inputSchema: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          description: 'Monitoring duration in seconds',
          default: 60
        },
        interval: {
          type: 'number',
          description: 'Monitoring interval in seconds',
          default: 5
        }
      }
    }
  }
];

// Tool implementations
const toolImplementations = {
  async test_system_health(args) {
    try {
      // Get system status
      const systemStatus = await makeAuthenticatedRequest('GET', '/agent/system');
      
      // Perform health check
      const healthCheck = await makeAuthenticatedRequest('POST', '/agent/system', {
        checks: args.checkServices || ['all']
      });
      
      // Get metrics if requested
      let metrics = null;
      if (args.includeMetrics) {
        metrics = await makeAuthenticatedRequest('PUT', '/agent/system', {
          timeRange: '1h',
          metrics: ['cpu', 'memory', 'disk', 'network']
        });
      }
      
      return {
        success: true,
        systemStatus: systemStatus.data,
        healthCheck: healthCheck.data,
        metrics: metrics?.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  async test_agent_authentication(args) {
    try {
      // Test authentication
      const authResult = await authenticateAgent();
      
      if (!authResult) {
        return {
          success: false,
          error: 'Agent authentication failed',
          timestamp: new Date().toISOString()
        };
      }
      
      // Test capabilities
      const capabilityTests = {};
      for (const capability of args.testCapabilities || []) {
        try {
          switch (capability) {
            case 'system-monitoring':
              await makeAuthenticatedRequest('GET', '/agent/system');
              capabilityTests[capability] = 'PASS';
              break;
            case 'tactical-operations':
              await makeAuthenticatedRequest('GET', '/agent/tactical?type=missions');
              capabilityTests[capability] = 'PASS';
              break;
            case 'emergency-response':
              await makeAuthenticatedRequest('GET', '/emergency/alert');
              capabilityTests[capability] = 'PASS';
              break;
            default:
              capabilityTests[capability] = 'SKIP';
          }
        } catch (error) {
          capabilityTests[capability] = `FAIL: ${error.message}`;
        }
      }
      
      return {
        success: true,
        authenticated: true,
        token: agentToken ? 'Present' : 'Missing',
        capabilityTests,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  async test_nlp_processing(args) {
    try {
      const response = await makeAuthenticatedRequest('POST', '/agent/nlp', {
        action: 'process_query',
        query: args.query,
        responseFormat: args.responseFormat || 'structured'
      });
      
      return {
        success: true,
        query: args.query,
        response: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        query: args.query,
        timestamp: new Date().toISOString()
      };
    }
  },

  async test_emergency_response(args) {
    try {
      // Create test emergency alert
      const alertResponse = await makeAuthenticatedRequest('POST', '/emergency/alert', {
        action: 'create_alert',
        type: args.emergencyType || 'medical',
        severity: args.severity || 'medium',
        location: args.location || { lat: 34.0522, lng: -118.2437 },
        description: 'MCP Test Emergency Alert'
      });
      
      if (!alertResponse.success) {
        return {
          success: false,
          error: 'Failed to create emergency alert',
          details: alertResponse.error,
          timestamp: new Date().toISOString()
        };
      }
      
      const alertId = alertResponse.data.alertId;
      
      // Test emergency response
      const responseResult = await makeAuthenticatedRequest('POST', '/emergency/alert', {
        action: 'respond_to_alert',
        alertId: alertId,
        responseType: 'acknowledge',
        notes: 'MCP Test Response'
      });
      
      return {
        success: true,
        alertCreated: alertResponse.data,
        responseResult: responseResult.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  async test_tactical_operations(args) {
    try {
      const operation = args.operation || 'map_analysis';
      let result;
      
      switch (operation) {
        case 'map_analysis':
          result = await makeAuthenticatedRequest('POST', '/agent/tactical', {
            action: 'analyze_map',
            bounds: {
              north: 34.1,
              south: 34.0,
              east: -118.2,
              west: -118.3
            },
            analysisType: 'terrain'
          });
          break;
          
        case 'route_planning':
          result = await makeAuthenticatedRequest('POST', '/agent/tactical', {
            action: 'plan_route',
            waypoints: [
              { lat: 34.0522, lng: -118.2437, type: 'start' },
              { lat: 34.0622, lng: -118.2537, type: 'destination' }
            ]
          });
          break;
          
        case 'mission_creation':
          result = await makeAuthenticatedRequest('POST', '/agent/tactical', {
            action: 'create_mission',
            name: 'MCP Test Mission',
            type: 'reconnaissance',
            location: { lat: 34.0522, lng: -118.2437 },
            timeline: {
              startTime: new Date(Date.now() + 3600000).toISOString()
            },
            objectives: ['Test tactical operations via MCP']
          });
          break;
          
        case 'threat_assessment':
          result = await makeAuthenticatedRequest('POST', '/agent/tactical', {
            action: 'assess_threats',
            area: {
              center: { lat: 34.0522, lng: -118.2437 },
              radius: 5000
            }
          });
          break;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      return {
        success: true,
        operation,
        result: result.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        operation: args.operation,
        timestamp: new Date().toISOString()
      };
    }
  },

  async test_task_automation(args) {
    try {
      // Create test task
      const taskResponse = await makeAuthenticatedRequest('POST', '/agentic/task-monitor', {
        name: `MCP Test Task - ${args.taskType}`,
        description: 'Test task created via MCP',
        schedule: args.schedule || '*/5 * * * *',
        command: 'echo "MCP test task executed successfully"',
        type: 'cron'
      });
      
      if (!taskResponse.success) {
        return {
          success: false,
          error: 'Failed to create task',
          details: taskResponse.error,
          timestamp: new Date().toISOString()
        };
      }
      
      const taskId = taskResponse.data.taskId;
      
      // Execute task immediately
      const executeResponse = await makeAuthenticatedRequest('PUT', '/agentic/task-monitor', {
        taskId: taskId,
        async: false
      });
      
      // Clean up - cancel the task
      await makeAuthenticatedRequest('DELETE', `/agentic/task-monitor?taskId=${taskId}`);
      
      return {
        success: true,
        taskCreated: taskResponse.data,
        executionResult: executeResponse.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  async run_comprehensive_test(args) {
    const testSuite = args.testSuite || 'basic';
    const results = {
      testSuite,
      startTime: new Date().toISOString(),
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };
    
    const tests = {
      basic: ['test_system_health', 'test_agent_authentication', 'test_nlp_processing'],
      full: ['test_system_health', 'test_agent_authentication', 'test_nlp_processing', 
             'test_emergency_response', 'test_tactical_operations', 'test_task_automation'],
      performance: ['test_system_health', 'monitor_real_time'],
      security: ['test_agent_authentication', 'test_system_health']
    };
    
    const testsToRun = tests[testSuite] || tests.basic;
    
    for (const testName of testsToRun) {
      results.summary.total++;
      try {
        const testResult = await toolImplementations[testName]({});
        results.tests[testName] = testResult;
        if (testResult.success) {
          results.summary.passed++;
        } else {
          results.summary.failed++;
        }
      } catch (error) {
        results.tests[testName] = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        results.summary.failed++;
      }
    }
    
    results.endTime = new Date().toISOString();
    results.summary.successRate = ((results.summary.passed / results.summary.total) * 100).toFixed(2);
    
    return results;
  },

  async monitor_real_time(args) {
    const duration = args.duration || 60;
    const interval = args.interval || 5;
    const samples = [];
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration * 1000) {
      try {
        const status = await makeAuthenticatedRequest('GET', '/agent/system');
        samples.push({
          timestamp: new Date().toISOString(),
          status: status.data,
          responseTime: Date.now() - startTime
        });
      } catch (error) {
        samples.push({
          timestamp: new Date().toISOString(),
          error: error.message,
          responseTime: Date.now() - startTime
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }
    
    return {
      success: true,
      duration,
      interval,
      samples: samples.length,
      data: samples,
      summary: {
        averageResponseTime: samples.reduce((acc, s) => acc + (s.responseTime || 0), 0) / samples.length,
        errors: samples.filter(s => s.error).length,
        successRate: ((samples.filter(s => !s.error).length / samples.length) * 100).toFixed(2)
      },
      timestamp: new Date().toISOString()
    };
  }
};

// Create MCP server
const server = new Server(
  {
    name: 'tacticalops-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (!toolImplementations[name]) {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  try {
    const result = await toolImplementations[name](args || {});
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(`Tool ${name} error:`, error);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            tool: name,
            timestamp: new Date().toISOString()
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🎖️ TacticalOps MCP Server started');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('MCP Server error:', error);
    process.exit(1);
  });
}

module.exports = { server, toolImplementations };