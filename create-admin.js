const { PrismaClient } = require('@prisma/client');

async function createAdminUser() {
  const prisma = new PrismaClient();
  try {
    // Check if admin user exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user with a simple password hash for testing
    // In production, this should use proper bcrypt hashing
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/8VfuFvO', // admin123
        email: 'admin@tacticalops.sa',
        role: 'ADMIN'
      }
    });
    
    console.log('Admin user created:', user.username);
    
    // Create some sample devices for testing
    const device1 = await prisma.device.create({
      data: {
        deviceId: 'test-device-001',
        deviceName: 'Test Android Device 1',
        deviceModel: 'Samsung Galaxy S21',
        androidVersion: '13',
        lastSeen: new Date(),
        isOnline: true,
        batteryLevel: 85,
        location: JSON.stringify({ lat: 24.7136, lng: 46.6753 }) // Riyadh
      }
    });
    
    const device2 = await prisma.device.create({
      data: {
        deviceId: 'test-device-002',
        deviceName: 'Test Android Device 2',
        deviceModel: 'Google Pixel 7',
        androidVersion: '14',
        lastSeen: new Date(),
        isOnline: false,
        batteryLevel: 42,
        location: JSON.stringify({ lat: 21.3891, lng: 39.8579 }) // Mecca
      }
    });
    
    console.log('Sample devices created');
    
    // Create some GPS logs
    await prisma.gpsLog.createMany({
      data: [
        {
          deviceId: device1.id,
          latitude: 24.7136,
          longitude: 46.6753,
          accuracy: 10.5,
          timestamp: new Date()
        },
        {
          deviceId: device2.id,
          latitude: 21.3891,
          longitude: 39.8579,
          accuracy: 8.2,
          timestamp: new Date()
        }
      ]
    });
    
    console.log('Sample GPS logs created');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();