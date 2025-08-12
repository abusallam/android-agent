#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Android Agent Database...');
    console.log('');

    // Check if ROOT_ADMIN exists
    const rootAdmin = await prisma.user.findFirst({
      where: { role: 'ROOT_ADMIN' }
    });

    if (!rootAdmin) {
      console.log('👑 Creating ROOT_ADMIN user...');
      
      // Create default ROOT_ADMIN user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newRootAdmin = await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          email: 'admin@androidagent.local',
          role: 'ROOT_ADMIN',
          isActive: true
        }
      });

      console.log('✅ ROOT_ADMIN user created successfully');
      console.log('');
      console.log('📋 Default Admin Credentials:');
      console.log('   🔑 Username: admin');
      console.log('   🔒 Password: admin123');
      console.log('   📧 Email: admin@androidagent.local');
      console.log('');
      console.log('⚠️  SECURITY WARNING: Please change the default password after first login!');
      console.log('');
    } else {
      console.log('✅ ROOT_ADMIN user already exists');
      console.log(`   👤 Username: ${rootAdmin.username}`);
      console.log(`   📧 Email: ${rootAdmin.email || 'Not set'}`);
      console.log('');
    }

    // Create sample data
    await createSampleData();

    console.log('🎉 Database initialization complete!');
    console.log('');
    console.log('🌐 You can now:');
    console.log('   1. Start the PWA dashboard: npm run dev');
    console.log('   2. Login with admin credentials');
    console.log('   3. Access admin panel at /admin');
    console.log('   4. Test React Native app connection');
    console.log('');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSampleData() {
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

      console.log('✅ Sample devices created (3 devices)');
    } else {
      console.log(`✅ Found ${deviceCount} existing devices`);
    }

    // Create sample GPS logs
    const gpsLogCount = await prisma.gpsLog.count();
    if (gpsLogCount === 0) {
      console.log('📍 Creating sample GPS logs...');
      
      const devices = await prisma.device.findMany();
      let totalLogs = 0;
      
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
          totalLogs++;
        }
      }

      console.log(`✅ Sample GPS logs created (${totalLogs} logs)`);
    } else {
      console.log(`✅ Found ${gpsLogCount} existing GPS logs`);
    }

    // Create sample sensor data
    const sensorDataCount = await prisma.sensorData.count();
    if (sensorDataCount === 0) {
      console.log('🔬 Creating sample sensor data...');
      
      const devices = await prisma.device.findMany();
      let totalSensorData = 0;
      
      for (const device of devices) {
        // Create sample sensor data
        const sensorTypes = ['accelerometer', 'gyroscope', 'magnetometer'];
        
        for (const sensorType of sensorTypes) {
          for (let i = 0; i < 3; i++) {
            let sensorData;
            
            switch (sensorType) {
              case 'accelerometer':
                sensorData = {
                  x: (Math.random() - 0.5) * 20,
                  y: (Math.random() - 0.5) * 20,
                  z: 9.8 + (Math.random() - 0.5) * 2
                };
                break;
              case 'gyroscope':
                sensorData = {
                  x: (Math.random() - 0.5) * 10,
                  y: (Math.random() - 0.5) * 10,
                  z: (Math.random() - 0.5) * 10
                };
                break;
              case 'magnetometer':
                sensorData = {
                  x: (Math.random() - 0.5) * 100,
                  y: (Math.random() - 0.5) * 100,
                  z: (Math.random() - 0.5) * 100
                };
                break;
            }
            
            await prisma.sensorData.create({
              data: {
                deviceId: device.id,
                sensorType,
                data: JSON.stringify(sensorData),
                timestamp: new Date(Date.now() - i * 30 * 60 * 1000) // Last 90 minutes
              }
            });
            totalSensorData++;
          }
        }
      }

      console.log(`✅ Sample sensor data created (${totalSensorData} records)`);
    } else {
      console.log(`✅ Found ${sensorDataCount} existing sensor data records`);
    }

    console.log('✅ Sample data initialization complete');

  } catch (error) {
    console.error('❌ Sample data creation failed:', error);
    throw error;
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, createSampleData };