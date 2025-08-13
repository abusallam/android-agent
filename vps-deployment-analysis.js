/**
 * VPS Deployment Analysis Script
 * Comprehensive analysis of what's running on our VPS
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const VPS_IP = '217.79.255.54';
const EXPECTED_PORTS = [3000, 5432, 6379, 9000]; // App, PostgreSQL, Redis, MinIO

async function analyzeVPSDeployment() {
  console.log('🎖️ TacticalOps VPS Deployment Analysis');
  console.log('=====================================');
  console.log(`Target VPS: ${VPS_IP}`);
  console.log('');

  const results = {
    ports: {},
    services: {},
    applications: {},
    issues: [],
    recommendations: []
  };

  // Test 1: Port Scanning
  console.log('🔍 1. Port Analysis');
  console.log('-------------------');
  
  for (const port of EXPECTED_PORTS) {
    try {
      const { stdout, stderr } = await execAsync(`nc -z -v -w5 ${VPS_IP} ${port}`, { timeout: 10000 });
      console.log(`✅ Port ${port}: OPEN`);
      results.ports[port] = 'OPEN';
    } catch (error) {
      console.log(`❌ Port ${port}: CLOSED/FILTERED`);
      results.ports[port] = 'CLOSED';
    }
  }

  // Test 2: HTTP Service Analysis
  console.log('\\n🔍 2. HTTP Service Analysis');
  console.log('----------------------------');
  
  const httpTests = [
    { port: 3000, path: '/', name: 'Main Application' },
    { port: 3000, path: '/login', name: 'Login Page' },
    { port: 3000, path: '/api/health', name: 'Health API' },
    { port: 3000, path: '/tactical-dashboard', name: 'Tactical Dashboard' },
    { port: 3000, path: '/admin', name: 'Admin Panel' }
  ];

  for (const test of httpTests) {
    try {
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}|%{content_type}|%{time_total}" http://${VPS_IP}:${test.port}${test.path}`, { timeout: 10000 });
      const [statusCode, contentType, responseTime] = stdout.trim().split('|');
      
      console.log(`${test.name}:`);
      console.log(`  Status: ${statusCode}`);
      console.log(`  Content-Type: ${contentType}`);
      console.log(`  Response Time: ${responseTime}s`);
      
      results.services[test.name] = {
        status: statusCode,
        contentType,
        responseTime: parseFloat(responseTime),
        accessible: statusCode === '200'
      };
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      results.services[test.name] = { error: error.message };
    }
  }

  // Test 3: Application Detection
  console.log('\\n🔍 3. Application Detection');
  console.log('----------------------------');
  
  try {
    // Check what's actually running on port 3000
    const { stdout } = await execAsync(`curl -s http://${VPS_IP}:3000 | head -20`);
    
    if (stdout.includes('consulting.sa')) {
      console.log('🔍 Detected: consulting.sa website');
      results.applications.detected = 'consulting.sa';
      results.issues.push('TacticalOps application not found - consulting.sa is running instead');
    } else if (stdout.includes('TacticalOps') || stdout.includes('Android Agent')) {
      console.log('✅ Detected: TacticalOps Platform');
      results.applications.detected = 'TacticalOps';
    } else if (stdout.includes('404') || stdout.includes('Not Found')) {
      console.log('⚠️ Detected: 404/Not Found responses');
      results.applications.detected = '404_responses';
      results.issues.push('Application returning 404 responses');
    } else {
      console.log('❓ Detected: Unknown application');
      results.applications.detected = 'unknown';
      results.issues.push('Unknown application running on port 3000');
    }
  } catch (error) {
    console.log(`❌ Application detection failed: ${error.message}`);
    results.applications.error = error.message;
  }

  // Test 4: Docker Container Analysis (if accessible)
  console.log('\\n🔍 4. Container Analysis');
  console.log('-------------------------');
  
  // We can't directly access Docker on the VPS, but we can infer from services
  const expectedContainers = [
    { name: 'tacticalops-app', port: 3000, service: 'Main Application' },
    { name: 'tacticalops-postgres', port: 5432, service: 'PostgreSQL Database' },
    { name: 'tacticalops-redis', port: 6379, service: 'Redis Cache' },
    { name: 'tacticalops-minio', port: 9000, service: 'MinIO Storage' }
  ];

  for (const container of expectedContainers) {
    const portStatus = results.ports[container.port];
    if (portStatus === 'OPEN') {
      console.log(`✅ ${container.name}: Likely running (port ${container.port} open)`);
      results.applications[container.name] = 'likely_running';
    } else {
      console.log(`❌ ${container.name}: Not running (port ${container.port} closed)`);
      results.applications[container.name] = 'not_running';
      results.issues.push(`${container.service} not accessible on port ${container.port}`);
    }
  }

  // Test 5: API Endpoint Analysis
  console.log('\\n🔍 5. API Endpoint Analysis');
  console.log('-----------------------------');
  
  const apiEndpoints = [
    '/api/health',
    '/api/auth/login',
    '/api/dashboard',
    '/api/tactical/map-data',
    '/api/agentic/system-control',
    '/api/agents/task-management'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://${VPS_IP}:3000${endpoint}`, { timeout: 5000 });
      const statusCode = stdout.trim();
      
      if (statusCode === '200') {
        console.log(`✅ ${endpoint}: Available (${statusCode})`);
      } else if (statusCode === '404') {
        console.log(`❌ ${endpoint}: Not Found (${statusCode})`);
      } else if (statusCode === '401' || statusCode === '403') {
        console.log(`🔐 ${endpoint}: Protected (${statusCode})`);
      } else {
        console.log(`⚠️ ${endpoint}: Status ${statusCode}`);
      }
      
      results.services[endpoint] = { status: statusCode };
    } catch (error) {
      console.log(`❌ ${endpoint}: ERROR`);
      results.services[endpoint] = { error: error.message };
    }
  }

  // Generate Analysis Report
  console.log('\\n📊 ANALYSIS SUMMARY');
  console.log('===================');
  
  console.log('\\n🔌 Port Status:');
  Object.entries(results.ports).forEach(([port, status]) => {
    console.log(`  Port ${port}: ${status}`);
  });

  console.log('\\n🎯 Detected Application:');
  console.log(`  ${results.applications.detected || 'Unknown'}`);

  if (results.issues.length > 0) {
    console.log('\\n⚠️ Issues Found:');
    results.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }

  // Generate Recommendations
  console.log('\\n💡 Recommendations:');
  
  if (results.applications.detected === 'consulting.sa') {
    console.log('  1. TacticalOps application is not deployed or not running');
    console.log('  2. Need to deploy TacticalOps to replace or run alongside consulting.sa');
    console.log('  3. Check Docker containers and deployment scripts');
    results.recommendations.push('Deploy TacticalOps application');
  }

  if (results.ports[5432] === 'CLOSED') {
    console.log('  4. PostgreSQL database is not accessible');
    console.log('  5. Check database container and configuration');
    results.recommendations.push('Start PostgreSQL container');
  }

  if (results.ports[6379] === 'CLOSED') {
    console.log('  6. Redis cache is not accessible');
    console.log('  7. Check Redis container and configuration');
    results.recommendations.push('Start Redis container');
  }

  if (results.ports[9000] === 'CLOSED') {
    console.log('  8. MinIO storage is not accessible');
    console.log('  9. Check MinIO container and configuration');
    results.recommendations.push('Start MinIO container');
  }

  console.log('\\n🎖️ Next Steps:');
  console.log('1. Verify TacticalOps deployment status');
  console.log('2. Check Docker container status on VPS');
  console.log('3. Review deployment logs');
  console.log('4. Re-deploy TacticalOps if necessary');
  console.log('5. Update testing to match actual deployment');

  return results;
}

// Run the analysis
analyzeVPSDeployment()
  .then(results => {
    console.log('\\n✅ Analysis Complete!');
    
    // Save results to file
    const fs = require('fs');
    fs.writeFileSync('vps-analysis-results.json', JSON.stringify(results, null, 2));
    console.log('📄 Results saved to: vps-analysis-results.json');
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error.message);
  });