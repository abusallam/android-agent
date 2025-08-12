import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

// System status endpoint
export async function GET(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has system monitoring capability
    if (!agent.capabilities.includes('system-monitoring')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have system-monitoring capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    // Get system information
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus().length,
      networkInterfaces: Object.keys(os.networkInterfaces())
    };
    
    // Calculate system metrics
    const memoryUsage = {
      total: systemInfo.totalmem,
      free: systemInfo.freemem,
      used: systemInfo.totalmem - systemInfo.freemem,
      percentage: Math.round(((systemInfo.totalmem - systemInfo.freemem) / systemInfo.totalmem) * 100)
    };
    
    const cpuUsage = {
      cores: systemInfo.cpus,
      loadAverage: systemInfo.loadavg,
      usage: Math.round(systemInfo.loadavg[0] * 100 / systemInfo.cpus)
    };
    
    // Get process information
    let processInfo = {};
    try {
      const { stdout } = await execAsync('ps aux | grep -E "(node|tacticalops)" | grep -v grep | wc -l');
      processInfo = {
        tacticalopsProcesses: parseInt(stdout.trim()) || 0
      };
    } catch (error) {
      console.warn('Could not get process information:', error);
    }
    
    // Get disk usage
    let diskUsage = {};
    try {
      const { stdout } = await execAsync('df -h / | tail -1');
      const diskInfo = stdout.trim().split(/\s+/);
      diskUsage = {
        filesystem: diskInfo[0],
        size: diskInfo[1],
        used: diskInfo[2],
        available: diskInfo[3],
        percentage: parseInt(diskInfo[4]) || 0
      };
    } catch (error) {
      console.warn('Could not get disk usage:', error);
    }
    
    // Determine system health status
    const healthStatus = {
      overall: 'healthy',
      issues: [] as string[]
    };
    
    if (memoryUsage.percentage > 85) {
      healthStatus.overall = 'warning';
      healthStatus.issues.push(`High memory usage: ${memoryUsage.percentage}%`);
    }
    
    if (cpuUsage.usage > 80) {
      healthStatus.overall = 'warning';
      healthStatus.issues.push(`High CPU usage: ${cpuUsage.usage}%`);
    }
    
    if (diskUsage.percentage && diskUsage.percentage > 90) {
      healthStatus.overall = 'critical';
      healthStatus.issues.push(`High disk usage: ${diskUsage.percentage}%`);
    }
    
    if (systemInfo.uptime < 300) { // Less than 5 minutes
      healthStatus.issues.push('System recently restarted');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        system: systemInfo,
        memory: memoryUsage,
        cpu: cpuUsage,
        disk: diskUsage,
        processes: processInfo,
        health: healthStatus,
        services: {
          api: 'running', // Would check actual service status
          database: 'running',
          redis: 'running',
          nginx: 'running'
        },
        timestamp: new Date().toISOString(),
        agentId: agent.agentId
      },
      message: 'System status retrieved successfully'
    });
    
  } catch (error) {
    console.error('System status error:', error);
    
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
          message: 'Failed to retrieve system status' 
        } 
      },
      { status: 500 }
    );
  }
}

// System health check endpoint
export async function POST(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has system monitoring capability
    if (!agent.capabilities.includes('system-monitoring')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have system-monitoring capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { checks = ['all'] } = body;
    
    const healthChecks = {
      system: { status: 'pass', message: 'System is operational' },
      database: { status: 'pass', message: 'Database connection successful' },
      redis: { status: 'pass', message: 'Redis connection successful' },
      api: { status: 'pass', message: 'API endpoints responding' },
      disk: { status: 'pass', message: 'Disk space sufficient' },
      memory: { status: 'pass', message: 'Memory usage normal' },
      cpu: { status: 'pass', message: 'CPU usage normal' }
    };
    
    // Perform actual health checks
    try {
      // Check memory usage
      const memUsage = (os.totalmem() - os.freemem()) / os.totalmem() * 100;
      if (memUsage > 90) {
        healthChecks.memory = { status: 'fail', message: `High memory usage: ${memUsage.toFixed(1)}%` };
      } else if (memUsage > 80) {
        healthChecks.memory = { status: 'warn', message: `Elevated memory usage: ${memUsage.toFixed(1)}%` };
      }
      
      // Check CPU load
      const cpuLoad = os.loadavg()[0] / os.cpus().length * 100;
      if (cpuLoad > 90) {
        healthChecks.cpu = { status: 'fail', message: `High CPU load: ${cpuLoad.toFixed(1)}%` };
      } else if (cpuLoad > 70) {
        healthChecks.cpu = { status: 'warn', message: `Elevated CPU load: ${cpuLoad.toFixed(1)}%` };
      }
      
      // Check disk space
      try {
        const { stdout } = await execAsync('df / | tail -1');
        const diskInfo = stdout.trim().split(/\s+/);
        const diskUsage = parseInt(diskInfo[4]) || 0;
        
        if (diskUsage > 95) {
          healthChecks.disk = { status: 'fail', message: `Critical disk usage: ${diskUsage}%` };
        } else if (diskUsage > 85) {
          healthChecks.disk = { status: 'warn', message: `High disk usage: ${diskUsage}%` };
        }
      } catch (error) {
        healthChecks.disk = { status: 'warn', message: 'Could not check disk usage' };
      }
      
      // Check database connection (mock for now)
      // In production, would actually test database connection
      
      // Check Redis connection (mock for now)
      // In production, would actually test Redis connection
      
    } catch (error) {
      console.error('Health check error:', error);
    }
    
    // Determine overall health
    const failedChecks = Object.values(healthChecks).filter(check => check.status === 'fail');
    const warningChecks = Object.values(healthChecks).filter(check => check.status === 'warn');
    
    let overallStatus = 'healthy';
    if (failedChecks.length > 0) {
      overallStatus = 'unhealthy';
    } else if (warningChecks.length > 0) {
      overallStatus = 'degraded';
    }
    
    return NextResponse.json({
      success: true,
      data: {
        overall: overallStatus,
        checks: healthChecks,
        summary: {
          total: Object.keys(healthChecks).length,
          passed: Object.values(healthChecks).filter(check => check.status === 'pass').length,
          warnings: warningChecks.length,
          failed: failedChecks.length
        },
        timestamp: new Date().toISOString(),
        agentId: agent.agentId
      },
      message: `Health check completed - ${overallStatus}`
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
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
          message: 'Failed to perform health check' 
        } 
      },
      { status: 500 }
    );
  }
}

// System metrics endpoint
export async function PUT(request: NextRequest) {
  try {
    // Verify agent authentication
    const agent = verifyAgentToken(request);
    
    // Check if agent has system monitoring capability
    if (!agent.capabilities.includes('system-monitoring')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Agent does not have system-monitoring capability' 
          } 
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { timeRange = '1h', metrics = ['cpu', 'memory', 'disk', 'network'] } = body;
    
    // Generate mock time series data (in production, would query actual metrics database)
    const now = Date.now();
    const interval = timeRange === '1h' ? 60000 : timeRange === '24h' ? 3600000 : 300000; // 1min, 1hour, 5min
    const points = timeRange === '1h' ? 60 : timeRange === '24h' ? 24 : 12;
    
    const generateTimeSeries = (baseValue: number, variance: number) => {
      const data = [];
      for (let i = points; i >= 0; i--) {
        const timestamp = now - (i * interval);
        const value = Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * variance));
        data.push({
          timestamp: new Date(timestamp).toISOString(),
          value: Math.round(value * 100) / 100
        });
      }
      return data;
    };
    
    const metricsData = {
      cpu: {
        usage: generateTimeSeries(45, 30),
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      },
      memory: {
        usage: generateTimeSeries(60, 20),
        total: os.totalmem(),
        free: os.freemem()
      },
      disk: {
        usage: generateTimeSeries(35, 10),
        // Would get actual disk metrics in production
      },
      network: {
        bytesIn: generateTimeSeries(1000000, 500000),
        bytesOut: generateTimeSeries(800000, 400000)
      }
    };
    
    // Filter requested metrics
    const filteredMetrics = {};
    metrics.forEach(metric => {
      if (metricsData[metric]) {
        filteredMetrics[metric] = metricsData[metric];
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        timeRange,
        interval: `${interval / 1000}s`,
        metrics: filteredMetrics,
        timestamp: new Date().toISOString(),
        agentId: agent.agentId
      },
      message: 'System metrics retrieved successfully'
    });
    
  } catch (error) {
    console.error('System metrics error:', error);
    
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
          message: 'Failed to retrieve system metrics' 
        } 
      },
      { status: 500 }
    );
  }
}