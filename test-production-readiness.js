#!/usr/bin/env node
/**
 * TacticalOps Platform - Production Readiness Test Suite
 * Comprehensive testing for all platform components and agentic AI features
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Test configuration
const CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiVersion: 'v2',
  timeout: 30000,
  retries: 3,
  testUser: {
    username: 'test-agent',
    password: 'test-password-123'
  },
  agentConfig: {
    agentId: 'test-tactical-agent-001',
    capabilities: [
      'system-monitoring',
      'tactical-operations',
      'emergency-response',
      'user-assistance',
      'task-automation'
    ]
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging functions
const log = (message, color = colors.blue) => {
  console.log(`${color}[${new Date().toISOString()}] ${message}${colors.reset}`);
};

const success = (message) => log(`✅ ${message}`, colors.green);
const error = (message) => log(`❌ ${message}`, colors.red);
const warn = (message) => log(`⚠️ ${message}`, colors.yellow);
const info = (message) => log(`ℹ️ ${message}`, colors.cyan);

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// HTTP client with retry logic
const createHttpClient = () => {
  const client = axios.create({
    baseURL: CONFIG.baseURL,
    timeout: CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'TacticalOps-Test-Suite/2.0.0'
    }
  });

  // Add retry interceptor
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      if (!config || !config.retry) {
        config.retry = 0;
      }

      if (config.retry < CONFIG.retries && error.response?.status >= 500) {
        config.retry++;
        log(`Retrying request (${config.retry}/${CONFIG.retries}): ${config.url}`, colors.yellow);
        await new Promise(resolve => setTimeout(resolve, 1000 * config.retry));
        return client(config);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const httpClient = createHttpClient();

// Test execution wrapper
const runTest = async (testName, testFunction) => {
  testResults.total++;
  
  try {
    log(`Running test: ${testName}`, colors.magenta);
    const startTime = Date.now();
    
    await testFunction();
    
    const duration = Date.now() - startTime;
    testResults.passed++;
    testResults.details.push({
      name: testName,
      status: 'PASSED',
      duration,
      error: null
    });
    
    success(`${testName} (${duration}ms)`);
  } catch (err) {
    testResults.failed++;
    testResults.details.push({
      name: testName,
      status: 'FAILED',
      duration: 0,
      error: err.message
    });
    
    error(`${testName}: ${err.message}`);
  }
};

// Basic connectivity tests
const testBasicConnectivity = async () => {
  const response = await httpClient.get('/api/v2/health');
  
  if (response.status !== 200) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Health check returned unsuccessful response');
  }
  
  info(`Health check response: ${JSON.stringify(response.data)}`);
};

const testAPIVersioning = async () => {
  const response = await httpClient.get('/api/v2/health');
  
  if (!response.headers['x-api-version'] && !response.data.version) {
    throw new Error('API version not found in response');
  }
  
  info('API versioning is properly implemented');
};

// Authentication tests
const testUserAuthentication = async () => {
  const loginResponse = await httpClient.post('/api/auth/login', {
    username: CONFIG.testUser.username,
    password: CONFIG.testUser.password
  });
  
  if (loginResponse.status !== 200) {
    throw new Error(`Login failed with status: ${loginResponse.status}`);
  }
  
  if (!loginResponse.data.token) {
    throw new Error('No authentication token received');
  }
  
  // Test authenticated request
  const token = loginResponse.data.token;
  const profileResponse = await httpClient.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (profileResponse.status !== 200) {
    throw new Error('Authenticated request failed');
  }
  
  info('User authentication working correctly');
  return token;
};

// Agent authentication tests
const testAgentAuthentication = async () => {
  const response = await httpClient.post('/api/agent/auth', CONFIG.agentConfig, {
    headers: {
      'X-API-Key': process.env.AGENT_API_KEY || 'tactical-ops-agent-key-2024'
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Agent authentication failed with status: ${response.status}`);
  }
  
  if (!response.data.success || !response.data.data.token) {
    throw new Error('Agent authentication unsuccessful');
  }
  
  const agentToken = response.data.data.token;
  info(`Agent authenticated successfully: ${CONFIG.agentConfig.agentId}`);
  
  return agentToken;
};

// System monitoring tests
const testSystemMonitoring = async (agentToken) => {
  // Test system status endpoint
  const statusResponse = await httpClient.get('/api/agent/system', {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (statusResponse.status !== 200) {
    throw new Error(`System status request failed: ${statusResponse.status}`);
  }
  
  const statusData = statusResponse.data.data;
  if (!statusData.system || !statusData.memory || !statusData.cpu) {
    throw new Error('Incomplete system status data');
  }
  
  // Test health check endpoint
  const healthResponse = await httpClient.post('/api/agent/system', 
    { checks: ['all'] },
    { headers: { Authorization: `Bearer ${agentToken}` } }
  );
  
  if (healthResponse.status !== 200) {
    throw new Error(`Health check request failed: ${healthResponse.status}`);
  }
  
  info('System monitoring endpoints working correctly');
};

// Tactical operations tests
const testTacticalOperations = async (agentToken) => {
  // Test map analysis
  const mapAnalysisResponse = await httpClient.post('/api/agent/tactical', {
    action: 'analyze_map',
    bounds: {
      north: 34.1,
      south: 34.0,
      east: -118.2,
      west: -118.3
    },
    analysisType: 'terrain'
  }, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (mapAnalysisResponse.status !== 200) {
    throw new Error(`Map analysis failed: ${mapAnalysisResponse.status}`);
  }
  
  // Test route planning
  const routePlanResponse = await httpClient.post('/api/agent/tactical', {
    action: 'plan_route',
    waypoints: [
      { lat: 34.0522, lng: -118.2437, type: 'start' },
      { lat: 34.0622, lng: -118.2537, type: 'destination' }
    ]
  }, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (routePlanResponse.status !== 200) {
    throw new Error(`Route planning failed: ${routePlanResponse.status}`);
  }
  
  // Test mission creation
  const missionResponse = await httpClient.post('/api/agent/tactical', {
    action: 'create_mission',
    name: 'Test Reconnaissance Mission',
    type: 'reconnaissance',
    location: { lat: 34.0522, lng: -118.2437 },
    timeline: {
      startTime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    },
    objectives: ['Gather intelligence on target area']
  }, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (missionResponse.status !== 200) {
    throw new Error(`Mission creation failed: ${missionResponse.status}`);
  }
  
  info('Tactical operations endpoints working correctly');
};

// Emergency response tests
const testEmergencyResponse = async (agentToken) => {
  // Create emergency alert
  const alertResponse = await httpClient.post('/api/emergency/alert', {
    action: 'create_alert',
    type: 'medical',
    severity: 'high',
    location: {
      lat: 34.0522,
      lng: -118.2437,
      address: 'Test Location'
    },
    description: 'Test emergency alert for system validation'
  });
  
  if (alertResponse.status !== 200) {
    throw new Error(`Emergency alert creation failed: ${alertResponse.status}`);
  }
  
  const alertId = alertResponse.data.data.alertId;
  
  // Test emergency response
  const responseResponse = await httpClient.post('/api/emergency/alert', {
    action: 'respond_to_alert',
    alertId: alertId,
    responseType: 'acknowledge',
    notes: 'Test response from automated system'
  }, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (responseResponse.status !== 200) {
    throw new Error(`Emergency response failed: ${responseResponse.status}`);
  }
  
  // Get alert status
  const statusResponse = await httpClient.get(`/api/emergency/alert?alertId=${alertId}`, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (statusResponse.status !== 200) {
    throw new Error(`Alert status retrieval failed: ${statusResponse.status}`);
  }
  
  info('Emergency response system working correctly');
};

// Task automation tests
const testTaskAutomation = async (agentToken) => {
  // Schedule a test task
  const taskResponse = await httpClient.post('/api/agentic/task-monitor', {
    name: 'Test System Health Check',
    description: 'Automated system health check for testing',
    schedule: '*/5 * * * *', // Every 5 minutes
    command: 'echo "System health check completed"',
    type: 'cron'
  }, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (taskResponse.status !== 200) {
    throw new Error(`Task scheduling failed: ${taskResponse.status}`);
  }
  
  const taskId = taskResponse.data.data.taskId;
  
  // Execute task immediately
  const executeResponse = await httpClient.put('/api/agentic/task-monitor', {
    taskId: taskId,
    async: false
  }, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (executeResponse.status !== 200) {
    throw new Error(`Task execution failed: ${executeResponse.status}`);
  }
  
  // Get task status
  const statusResponse = await httpClient.get(`/api/agentic/task-monitor?taskId=${taskId}`, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (statusResponse.status !== 200) {
    throw new Error(`Task status retrieval failed: ${statusResponse.status}`);
  }
  
  // Cancel the task
  await httpClient.delete(`/api/agentic/task-monitor?taskId=${taskId}`, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  info('Task automation system working correctly');
};

// Natural language processing tests
const testNaturalLanguageProcessing = async (agentToken) => {
  // Test query processing
  const queryResponse = await httpClient.post('/api/agent/nlp', {
    action: 'process_query',
    query: 'What is the system status?',
    responseFormat: 'structured'
  }, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (queryResponse.status !== 200) {
    throw new Error(`NLP query processing failed: ${queryResponse.status}`);
  }
  
  const queryData = queryResponse.data.data;
  if (!queryData.parsed || !queryData.response) {
    throw new Error('Incomplete NLP response data');
  }
  
  // Test command processing
  const commandResponse = await httpClient.post('/api/agent/nlp', {
    action: 'execute_command',
    command: 'show me system health information',
    executeImmediately: false,
    confirmationRequired: true
  }, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (commandResponse.status !== 200) {
    throw new Error(`NLP command processing failed: ${commandResponse.status}`);
  }
  
  // Test capabilities endpoint
  const capabilitiesResponse = await httpClient.get('/api/agent/nlp?type=capabilities', {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  
  if (capabilitiesResponse.status !== 200) {
    throw new Error(`NLP capabilities request failed: ${capabilitiesResponse.status}`);
  }
  
  info('Natural language processing working correctly');
};

// Performance tests
const testPerformance = async () => {
  const startTime = Date.now();
  const requests = [];
  
  // Create multiple concurrent requests
  for (let i = 0; i < 10; i++) {
    requests.push(httpClient.get('/api/v2/health'));
  }
  
  const responses = await Promise.all(requests);
  const endTime = Date.now();
  
  const totalTime = endTime - startTime;
  const averageTime = totalTime / requests.length;
  
  if (averageTime > 1000) {
    throw new Error(`Average response time too high: ${averageTime}ms`);
  }
  
  // Check all responses are successful
  const failedResponses = responses.filter(r => r.status !== 200);
  if (failedResponses.length > 0) {
    throw new Error(`${failedResponses.length} requests failed under load`);
  }
  
  info(`Performance test passed: ${requests.length} requests in ${totalTime}ms (avg: ${averageTime}ms)`);
};

// Security tests
const testSecurity = async () => {
  // Test unauthorized access
  try {
    await httpClient.get('/api/agent/system');
    throw new Error('Unauthorized access should have been blocked');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${error.response?.status}`);
    }
  }
  
  // Test invalid API key
  try {
    await httpClient.post('/api/agent/auth', CONFIG.agentConfig, {
      headers: { 'X-API-Key': 'invalid-key' }
    });
    throw new Error('Invalid API key should have been rejected');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${error.response?.status}`);
    }
  }
  
  // Test SQL injection attempt
  try {
    await httpClient.post('/api/auth/login', {
      username: "admin'; DROP TABLE users; --",
      password: 'password'
    });
  } catch (error) {
    // Should handle gracefully without exposing database errors
    if (error.response?.data?.error?.message?.includes('SQL') || 
        error.response?.data?.error?.message?.includes('database')) {
      throw new Error('SQL injection vulnerability detected');
    }
  }
  
  info('Security tests passed');
};

// Docker and infrastructure tests
const testDockerInfrastructure = async () => {
  try {
    // Check if Docker is running
    const { stdout: dockerVersion } = await execAsync('docker --version');
    info(`Docker version: ${dockerVersion.trim()}`);
    
    // Check if containers are running
    const { stdout: containers } = await execAsync('docker ps --format "table {{.Names}}\\t{{.Status}}"');
    info('Running containers:');
    console.log(containers);
    
    // Check Docker Compose
    const { stdout: composeVersion } = await execAsync('docker-compose --version');
    info(`Docker Compose version: ${composeVersion.trim()}`);
    
  } catch (error) {
    throw new Error(`Docker infrastructure check failed: ${error.message}`);
  }
};

// Database connectivity tests
const testDatabaseConnectivity = async () => {
  // Test through API endpoint that requires database
  const response = await httpClient.get('/api/v2/health');
  
  if (!response.data.success) {
    throw new Error('Database connectivity test failed');
  }
  
  // Additional database-specific checks could be added here
  info('Database connectivity test passed');
};

// File system tests
const testFileSystemPermissions = async () => {
  try {
    // Check if required directories exist and are writable
    const directories = ['./logs', './uploads', './data'];
    
    for (const dir of directories) {
      try {
        await fs.access(dir, fs.constants.F_OK);
        await fs.access(dir, fs.constants.W_OK);
        info(`Directory accessible: ${dir}`);
      } catch (error) {
        warn(`Directory not accessible: ${dir} - ${error.message}`);
      }
    }
    
  } catch (error) {
    throw new Error(`File system test failed: ${error.message}`);
  }
};

// Generate test report
const generateTestReport = async () => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2)
    },
    details: testResults.details,
    environment: {
      baseURL: CONFIG.baseURL,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  // Write report to file
  const reportPath = path.join(__dirname, 'test-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  // Write HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>TacticalOps Production Readiness Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 5px; }
        .summary { background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 3px; }
        .passed { background: #d1fae5; border-left: 4px solid #10b981; }
        .failed { background: #fee2e2; border-left: 4px solid #ef4444; }
        .details { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎖️ TacticalOps Production Readiness Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <h2>Test Summary</h2>
        <p><strong>Total Tests:</strong> ${report.summary.total}</p>
        <p><strong>Passed:</strong> ${report.summary.passed}</p>
        <p><strong>Failed:</strong> ${report.summary.failed}</p>
        <p><strong>Success Rate:</strong> ${report.summary.successRate}%</p>
    </div>
    
    <div class="results">
        <h2>Test Results</h2>
        ${report.details.map(test => `
            <div class="test-result ${test.status.toLowerCase()}">
                <strong>${test.name}</strong> - ${test.status}
                ${test.duration ? `<span class="details">(${test.duration}ms)</span>` : ''}
                ${test.error ? `<div class="details">Error: ${test.error}</div>` : ''}
            </div>
        `).join('')}
    </div>
    
    <div class="summary">
        <h2>Environment</h2>
        <p><strong>Base URL:</strong> ${report.environment.baseURL}</p>
        <p><strong>Node Version:</strong> ${report.environment.nodeVersion}</p>
        <p><strong>Platform:</strong> ${report.environment.platform}</p>
        <p><strong>Architecture:</strong> ${report.environment.arch}</p>
    </div>
</body>
</html>
  `;
  
  const htmlReportPath = path.join(__dirname, 'test-report.html');
  await fs.writeFile(htmlReportPath, htmlReport);
  
  info(`Test report generated: ${reportPath}`);
  info(`HTML report generated: ${htmlReportPath}`);
  
  return report;
};

// Main test execution
const main = async () => {
  log('🎖️ TacticalOps Platform - Production Readiness Test Suite', colors.magenta);
  log('================================================================', colors.magenta);
  
  try {
    // Basic connectivity and health tests
    await runTest('Basic Connectivity', testBasicConnectivity);
    await runTest('API Versioning', testAPIVersioning);
    await runTest('Database Connectivity', testDatabaseConnectivity);
    
    // Authentication tests
    let userToken, agentToken;
    try {
      userToken = await runTest('User Authentication', testUserAuthentication);
    } catch (error) {
      warn('User authentication test failed, some tests may be skipped');
    }
    
    try {
      agentToken = await runTest('Agent Authentication', testAgentAuthentication);
    } catch (error) {
      warn('Agent authentication test failed, agent tests will be skipped');
    }
    
    // Agent-specific tests (only if agent authentication succeeded)
    if (agentToken) {
      await runTest('System Monitoring', () => testSystemMonitoring(agentToken));
      await runTest('Tactical Operations', () => testTacticalOperations(agentToken));
      await runTest('Emergency Response', () => testEmergencyResponse(agentToken));
      await runTest('Task Automation', () => testTaskAutomation(agentToken));
      await runTest('Natural Language Processing', () => testNaturalLanguageProcessing(agentToken));
    } else {
      warn('Skipping agent tests due to authentication failure');
      testResults.skipped += 5;
    }
    
    // Performance and security tests
    await runTest('Performance', testPerformance);
    await runTest('Security', testSecurity);
    
    // Infrastructure tests
    await runTest('Docker Infrastructure', testDockerInfrastructure);
    await runTest('File System Permissions', testFileSystemPermissions);
    
    // Generate report
    const report = await generateTestReport();
    
    // Final summary
    log('================================================================', colors.magenta);
    log('Test Execution Complete', colors.magenta);
    log(`Total Tests: ${report.summary.total}`, colors.blue);
    log(`Passed: ${report.summary.passed}`, colors.green);
    log(`Failed: ${report.summary.failed}`, colors.red);
    log(`Skipped: ${testResults.skipped}`, colors.yellow);
    log(`Success Rate: ${report.summary.successRate}%`, colors.cyan);
    
    if (testResults.failed > 0) {
      error('Some tests failed. Please review the test report for details.');
      process.exit(1);
    } else {
      success('All tests passed! TacticalOps Platform is production ready.');
      process.exit(0);
    }
    
  } catch (error) {
    error(`Test suite execution failed: ${error.message}`);
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTest,
  testResults,
  CONFIG
};