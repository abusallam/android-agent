import { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth';

const prisma = new PrismaClient();

// Export prisma instance for use in other modules
export { prisma };

export async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');

    // Check if ADMIN exists
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('👑 Creating ADMIN user...');
      
      // Create default ADMIN user
      const hashedPassword = await hashPassword('admin123');
      
      const newAdmin = await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          email: 'admin@androidagent.local',
          role: 'ADMIN'
        }
      });

      console.log('✅ ADMIN user created successfully');
      console.log('📋 Default credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change the default password after first login!');
      
      return newAdmin;
    } else {
      console.log('✅ ADMIN user already exists');
      return adminUser;
    }

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function createSampleData() {
  try {
    console.log('📊 Creating sample data...');

    // Check if we already have sample devices
    const deviceCount = await prisma.device.count();
    
    if (deviceCount === 0) {
      console.log('📱 Creating sample devices...');
      
      // Create sample devices
      const sampleDevices = [
        {
          deviceId: 'android-device-001',
          name: 'Child\'s Phone',
          model: 'Samsung Galaxy A54',
          manufacturer: 'Samsung',
          version: 'Android 13',
          isOnline: true,
          ipAddress: '192.168.1.100',
          location: JSON.stringify({
            latitude: 31.2001,
            longitude: 29.9187,
            address: 'Alexandria, Egypt'
          })
        },
        {
          deviceId: 'android-device-002',
          name: 'Work Tablet',
          model: 'iPad Pro 11"',
          manufacturer: 'Apple',
          version: 'iOS 17',
          isOnline: true,
          ipAddress: '192.168.1.101',
          location: JSON.stringify({
            latitude: 30.0444,
            longitude: 31.2357,
            address: 'Cairo, Egypt'
          })
        },
        {
          deviceId: 'android-device-003',
          name: 'Backup Device',
          model: 'Samsung Galaxy S21',
          manufacturer: 'Samsung',
          version: 'Android 12',
          isOnline: false,
          ipAddress: '192.168.1.102',
          location: JSON.stringify({
            latitude: 30.0444,
            longitude: 31.2357,
            address: 'Cairo, Egypt'
          })
        }
      ];

      for (const device of sampleDevices) {
        await prisma.device.create({ data: device });
      }

      console.log('✅ Sample devices created');
    }

    // Create sample GPS logs
    const gpsLogCount = await prisma.gpsLog.count();
    if (gpsLogCount === 0) {
      console.log('📍 Creating sample GPS logs...');
      
      const devices = await prisma.device.findMany();
      
      for (const device of devices) {
        // Create some GPS logs for each device
        for (let i = 0; i < 5; i++) {
          await prisma.gpsLog.create({
            data: {
              deviceId: device.id,
              latitude: 31.2001 + (Math.random() - 0.5) * 0.01,
              longitude: 29.9187 + (Math.random() - 0.5) * 0.01,
              accuracy: 5 + Math.random() * 10,
              timestamp: new Date(Date.now() - i * 60 * 60 * 1000) // Last 5 hours
            }
          });
        }
      }

      console.log('✅ Sample GPS logs created');
    }

    console.log('✅ Sample data initialization complete');

  } catch (error) {
    console.error('❌ Sample data creation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function getDashboardStats() {
  try {
    const [
      totalDevices,
      onlineDevices,
      totalUsers,
      activeUsers,
      recentGpsLogs,
      recentSessions
    ] = await Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { isOnline: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.gpsLog.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.session.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    return {
      devices: {
        total: totalDevices,
        online: onlineDevices,
        offline: totalDevices - onlineDevices
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      activity: {
        recentGpsLogs,
        recentSessions
      },
      stats: {
        avgBattery: 75, // Mock data - would calculate from device data
        gpsAccuracy: '±5m',
        networkStatus: 'WiFi',
        alerts: 0
      }
    };

  } catch (error) {
    console.error('❌ Failed to get dashboard stats:', error);
    return {
      devices: { total: 0, online: 0, offline: 0 },
      users: { total: 0, active: 0, inactive: 0 },
      activity: { recentGpsLogs: 0, recentSessions: 0 },
      stats: { avgBattery: 0, gpsAccuracy: 'N/A', networkStatus: 'Unknown', alerts: 0 }
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Initialize database on module load in development
if (process.env.NODE_ENV === 'development') {
  initializeDatabase().catch(console.error);
}