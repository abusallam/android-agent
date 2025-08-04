import { PrismaClient } from '@prisma/client';

// Database configuration utility
export function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
  const isSQLite = databaseUrl.startsWith('file:') || databaseUrl.includes('.db');
  
  return {
    url: databaseUrl,
    provider: isPostgres ? 'postgresql' : 'sqlite',
    isPostgres,
    isSQLite
  };
}

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Helper functions for JSON handling (SQLite vs PostgreSQL compatibility)
export function parseJsonField(field: string | object | null): object | null {
  if (!field) return null;
  if (typeof field === 'object') return field;
  try {
    return JSON.parse(field);
  } catch {
    return null;
  }
}

export function stringifyJsonField(data: object | null): string | null {
  if (!data) return null;
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<{ status: 'healthy' | 'unhealthy', provider: string, error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const config = getDatabaseConfig();
    return { status: 'healthy', provider: config.provider };
  } catch (error) {
    const config = getDatabaseConfig();
    return { 
      status: 'unhealthy', 
      provider: config.provider,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}