import { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth';

const prisma = new PrismaClient();

export async function initializeDatabase() {
  try {
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!existingAdmin) {
      // Create default admin user
      const hashedPassword = await hashPassword('admin');
      
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          email: 'admin@androidagent.local',
          role: 'ADMIN'
        }
      });

      console.log('✅ Default admin user created (username: admin, password: admin)');
    }

    // Create indexes for better performance
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devices_device_id ON devices(device_id);`;
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gps_logs_device_timestamp ON gps_logs(device_id, timestamp);`;
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_call_logs_device_date ON call_logs(device_id, date);`;
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sms_logs_device_date ON sms_logs(device_id, date);`;

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}