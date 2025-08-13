#!/usr/bin/env node
/**
 * TacticalOps Platform - Deployment Readiness Validation
 * Validates that all components are ready for production deployment
 */

const fs = require('fs');
const path = require('path');

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

function log(message, color = 'blue') {
  console.log(`${colors[color]}[${new Date().toISOString()}] ${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function error(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// Validation functions
function validateFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    success(`${description}: ${filePath}`);
    return true;
  } else {
    error(`Missing ${description}: ${filePath}`);
    return false;
  }
}

function validateDirectoryExists(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    success(`${description}: ${dirPath}`);
    return true;
  } else {
    error(`Missing ${description}: ${dirPath}`);
    return false;
  }
}

function validateFileContent(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchString)) {
      success(`${description}: Found in ${filePath}`);
      return true;
    } else {
      error(`${description}: Not found in ${filePath}`);
      return false;
    }
  } catch (err) {
    error(`Cannot read ${filePath}: ${err.message}`);
    return false;
  }
}

function validateEnvironmentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    const requiredVars = [
      'DB_PASSWORD',
      'JWT_SECRET', 
      'ENCRYPTION_KEY',
      'SESSION_SECRET',
      'AGENT_API_KEY'
    ];
    
    let allFound = true;
    requiredVars.forEach(varName => {
      const found = lines.some(line => line.startsWith(`${varName}=`));
      if (found) {
        success(`Environment variable ${varName} configured`);
      } else {
        error(`Missing environment variable: ${varName}`);
        allFound = false;
      }
    });
    
    return allFound;
  } catch (err) {
    error(`Cannot validate environment file ${filePath}: ${err.message}`);
    return false;
  }
}

function validatePackageJson() {
  try {
    const packagePath = 'modern-dashboard/package.json';
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = [
      '@prisma/client',
      'next',
      'react',
      'socket.io',
      'jsonwebtoken',
      'bcryptjs'
    ];
    
    let allFound = true;
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        success(`Dependency ${dep} found`);
      } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        success(`Dev dependency ${dep} found`);
      } else {
        error(`Missing dependency: ${dep}`);
        allFound = false;
      }
    });
    
    return allFound;
  } catch (err) {
    error(`Cannot validate package.json: ${err.message}`);
    return false;
  }
}

// Main validation function
async function validateDeploymentReadiness() {
  log('🎖️ TacticalOps Platform - Deployment Readiness Validation', 'magenta');
  log('===========================================================', 'magenta');
  
  let allChecksPass = true;
  
  // 1. Core Infrastructure Files
  log('\n📁 Validating Core Infrastructure Files...', 'cyan');
  const coreFiles = [
    ['init-db-enhanced.sql', 'Enhanced Database Schema'],
    ['init-db-postgis.sql', 'PostGIS Database Schema'],
    ['scripts/create-task-management-schema.sql', 'Task Management Schema'],
    ['docker-compose.production.yml', 'Production Docker Compose'],
    ['docker-compose.vps.yml', 'VPS Docker Compose'],
    ['modern-dashboard/Dockerfile.production', 'Production Dockerfile'],
    ['.env.production.example', 'Environment Template'],
    ['deploy-vps.sh', 'VPS Deployment Script'],
    ['deploy-vps-simple.sh', 'Simple VPS Deployment Script']
  ];
  
  coreFiles.forEach(([file, desc]) => {
    if (!validateFileExists(file, desc)) allChecksPass = false;
  });
  
  // 2. API Endpoints
  log('\n🔌 Validating API Endpoints...', 'cyan');
  const apiEndpoints = [
    ['modern-dashboard/src/app/api/agentic/system-control/route.ts', 'Agentic System Control API'],
    ['modern-dashboard/src/app/api/agent/auth/route.ts', 'Agent Authentication API'],
    ['modern-dashboard/src/app/api/tactical/comprehensive/route.ts', 'Comprehensive Tactical API'],
    ['modern-dashboard/src/app/api/agents/task-management/route.ts', 'Task Management API'],
    ['modern-dashboard/src/app/api/auth/login/route.ts', 'Enhanced Login API']
  ];
  
  apiEndpoints.forEach(([file, desc]) => {
    if (!validateFileExists(file, desc)) allChecksPass = false;
    if (!validateFileContent(file, 'export async function', `${desc} Export Functions`)) allChecksPass = false;
  });
  
  // 3. Enhanced Authentication System
  log('\n🔐 Validating Enhanced Authentication System...', 'cyan');
  const authFiles = [
    ['modern-dashboard/src/lib/enhanced-auth.ts', 'Enhanced Authentication Library'],
    ['modern-dashboard/src/lib/websocket-server.ts', 'WebSocket Server']
  ];
  
  authFiles.forEach(([file, desc]) => {
    if (!validateFileExists(file, desc)) allChecksPass = false;
  });
  
  // Validate authentication features
  if (!validateFileContent('modern-dashboard/src/lib/enhanced-auth.ts', 'SECURITY_TIERS', 'Multi-tier Security')) allChecksPass = false;
  if (!validateFileContent('modern-dashboard/src/lib/enhanced-auth.ts', 'ROLE_PERMISSIONS', 'Role-based Permissions')) allChecksPass = false;
  
  // 4. Real-time Infrastructure
  log('\n⚡ Validating Real-time Infrastructure...', 'cyan');
  if (!validateFileContent('modern-dashboard/src/lib/websocket-server.ts', 'TacticalWebSocketServer', 'WebSocket Server Class')) allChecksPass = false;
  if (!validateFileContent('modern-dashboard/src/lib/websocket-server.ts', 'handleAuthentication', 'WebSocket Authentication')) allChecksPass = false;
  
  // 5. Database Schema Validation
  log('\n🗄️ Validating Database Schema...', 'cyan');
  const schemaChecks = [
    ['init-db-enhanced.sql', 'CREATE TABLE IF NOT EXISTS users', 'Users Table'],
    ['init-db-enhanced.sql', 'CREATE TABLE IF NOT EXISTS tasks', 'Tasks Table'],
    ['init-db-enhanced.sql', 'CREATE TABLE IF NOT EXISTS agent_sessions', 'Agent Sessions Table'],
    ['scripts/create-task-management-schema.sql', 'task_verification', 'Task Verification Table']
  ];
  
  schemaChecks.forEach(([file, search, desc]) => {
    if (!validateFileContent(file, search, desc)) allChecksPass = false;
  });
  
  // 6. Environment Configuration
  log('\n🌍 Validating Environment Configuration...', 'cyan');
  if (fs.existsSync('.env.production')) {
    if (!validateEnvironmentFile('.env.production')) allChecksPass = false;
  } else {
    warning('Production environment file not found - will be generated during deployment');
  }
  
  // 7. Package Dependencies
  log('\n📦 Validating Package Dependencies...', 'cyan');
  if (!validatePackageJson()) allChecksPass = false;
  
  // 8. Deployment Scripts
  log('\n🚀 Validating Deployment Scripts...', 'cyan');
  const deploymentScripts = [
    ['scripts/prepare-deployment.sh', 'Deployment Preparation Script'],
    ['scripts/minio-backup.sh', 'MinIO Backup Script']
  ];
  
  deploymentScripts.forEach(([file, desc]) => {
    if (!validateFileExists(file, desc)) allChecksPass = false;
  });
  
  // 9. Nginx Configuration
  log('\n🌐 Validating Nginx Configuration...', 'cyan');
  if (!validateFileExists('nginx/tacticalops.conf', 'Nginx Site Configuration')) allChecksPass = false;
  if (!validateFileContent('nginx/tacticalops.conf', 'location /api/', 'API Proxy Configuration')) allChecksPass = false;
  
  // 10. Monitoring Configuration
  log('\n📊 Validating Monitoring Configuration...', 'cyan');
  if (fs.existsSync('monitoring')) {
    validateDirectoryExists('monitoring', 'Monitoring Directory');
  } else {
    warning('Monitoring directory not found - basic monitoring will be used');
  }
  
  // Final Results
  log('\n📋 Validation Results:', 'magenta');
  log('==================', 'magenta');
  
  if (allChecksPass) {
    success('🎉 ALL CHECKS PASSED - System is ready for deployment!');
    log('\n🚀 Next Steps:', 'green');
    log('1. Run: ./scripts/prepare-deployment.sh', 'green');
    log('2. Deploy: ./deploy-vps-simple.sh', 'green');
    log('3. Access: https://your-domain.com', 'green');
    log('\n🤖 Agent API Ready:', 'green');
    log('- System Control: /api/agentic/system-control', 'green');
    log('- Authentication: /api/agent/auth', 'green');
    log('- Task Management: /api/agents/task-management', 'green');
    
    return true;
  } else {
    error('❌ VALIDATION FAILED - Some components are missing or incomplete');
    log('\n🔧 Please fix the issues above before deployment', 'yellow');
    return false;
  }
}

// Run validation
validateDeploymentReadiness()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    error(`Validation error: ${err.message}`);
    process.exit(1);
  });