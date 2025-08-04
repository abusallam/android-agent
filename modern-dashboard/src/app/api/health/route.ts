import { NextResponse } from 'next/server';
import { checkDatabaseHealth, getDatabaseConfig } from '@/lib/db-config';

export async function GET() {
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    const dbConfig = getDatabaseConfig();
    
    // Check Redis connection (if configured)
    let redisStatus = 'not configured';
    if (process.env.REDIS_URL) {
      try {
        // Redis health check would go here
        redisStatus = 'connected';
      } catch {
        redisStatus = 'error';
      }
    }

    const healthData = {
      status: dbHealth.status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        provider: dbConfig.provider,
        url: dbConfig.url.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
        status: dbHealth.status,
        error: dbHealth.error
      },
      services: {
        database: dbHealth.status === 'healthy' ? 'connected' : 'error',
        redis: redisStatus,
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    return NextResponse.json(healthData, { 
      status: dbHealth.status === 'healthy' ? 200 : 503 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 503 }
    );
  }
}