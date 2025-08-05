import { prisma, getDatabaseConfig } from './db-config';
import { hashPassword } from './auth';

export async function initializeDatabase() {
  try {
    const dbConfig = getDatabaseConfig();
    console.log(`🗄️ Initializing ${dbConfig.provider} database...`);

    // Delete existing admin user if exists and recreate with correct password
    await prisma.user.deleteMany({
      where: { username: 'admin' }
    });

    // Create default admin user
    const hashedPassword = await hashPassword('admin123');
    
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@androidagent.local',
        role: 'ADMIN'
      }
    });

    console.log('✅ Default admin user created (username: admin, password: admin123)');

    // Create indexes for better performance (database-specific)
    try {
      if (dbConfig.isSQLite) {
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(deviceId);`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_gps_logs_device_timestamp ON gps_logs(deviceId, timestamp);`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_call_logs_device_date ON call_logs(deviceId, date);`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sms_logs_device_date ON sms_logs(deviceId, date);`;
      } else if (dbConfig.isPostgres) {
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices("deviceId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_gps_logs_device_timestamp ON gps_logs("deviceId", timestamp);`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_call_logs_device_date ON call_logs("deviceId", date);`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sms_logs_device_date ON sms_logs("deviceId", date);`;
      }
      console.log('✅ Database indexes created');
    } catch (error) {
      console.log('⚠️ Index creation skipped:', (error as Error).message);
    }

    // Create sample device for testing (only in development)
    if (process.env.NODE_ENV === 'development') {
      const existingDevice = await prisma.device.findFirst();
      if (!existingDevice) {
        await prisma.device.create({
          data: {
            deviceId: 'test-device-001',
            name: "Test Device",
            model: 'Android Test Device',
            manufacturer: 'Test Manufacturer',
            version: 'Android 14',
            isOnline: true,
            location: JSON.stringify({ latitude: 31.2001, longitude: 29.9187, address: 'Alexandria, Egypt' })
          }
        });
        console.log('✅ Sample test device created');
      }
    }

    console.log(`✅ ${dbConfig.provider} database initialized successfully`);
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