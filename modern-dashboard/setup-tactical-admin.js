const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTacticalAdmin() {
  try {
    console.log('🔧 Setting up TacticalOps admin users...');
    
    // Hash password with 12 rounds (secure)
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create/update admin user
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: { 
        password: hashedPassword,
        email: 'admin@tac.consulting.sa',
        role: 'ADMIN'
      },
      create: {
        username: 'admin',
        email: 'admin@tac.consulting.sa',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created/updated:', admin.username);
    
    // Create tactical dummy users for testing
    const tacticalUsers = [
      { 
        username: 'commander', 
        name: 'Field Commander', 
        role: 'ADMIN',
        email: 'commander@tac.consulting.sa'
      },
      { 
        username: 'operative1', 
        name: 'Tactical Operative Alpha', 
        role: 'USER',
        email: 'operative1@tac.consulting.sa'
      },
      { 
        username: 'operative2', 
        name: 'Tactical Operative Bravo', 
        role: 'USER',
        email: 'operative2@tac.consulting.sa'
      },
      { 
        username: 'sniper', 
        name: 'Sniper Charlie', 
        role: 'USER',
        email: 'sniper@tac.consulting.sa'
      },
      { 
        username: 'medic', 
        name: 'Field Medic Delta', 
        role: 'USER',
        email: 'medic@tac.consulting.sa'
      }
    ];
    
    console.log('🎯 Creating tactical team members...');
    
    for (const user of tacticalUsers) {
      await prisma.user.upsert({
        where: { username: user.username },
        update: { 
          password: hashedPassword // Same password for demo: admin123
        },
        create: {
          username: user.username,
          email: user.email,
          password: hashedPassword,
          role: user.role
        }
      });
      console.log(`  ✅ ${user.name} (${user.username})`);
    }
    
    // Create some dummy device data for testing
    console.log('📱 Creating tactical device data...');
    
    const devices = [
      {
        deviceId: 'TACT-001',
        name: 'Alpha Unit Device',
        model: 'Samsung Galaxy S23 Tactical',
        manufacturer: 'Samsung',
        isOnline: true,
        location: JSON.stringify({
          latitude: 24.7136,
          longitude: 46.6753,
          accuracy: 5
        })
      },
      {
        deviceId: 'TACT-002', 
        name: 'Bravo Unit Device',
        model: 'iPhone 14 Pro',
        manufacturer: 'Apple',
        isOnline: true,
        location: JSON.stringify({
          latitude: 24.7156,
          longitude: 46.6773,
          accuracy: 3
        })
      },
      {
        deviceId: 'TACT-003',
        name: 'Charlie Sniper Device',
        model: 'Google Pixel 8 Pro',
        manufacturer: 'Google',
        isOnline: false,
        location: JSON.stringify({
          latitude: 24.7176,
          longitude: 46.6793,
          accuracy: 8
        })
      }
    ];
    
    for (const device of devices) {
      await prisma.device.upsert({
        where: { deviceId: device.deviceId },
        update: device,
        create: device
      });
      console.log(`  ✅ ${device.name} (${device.deviceId})`);
    }
    
    console.log('\n🎉 TacticalOps setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: ADMIN');
    console.log('\n🔐 Additional Users (all use password: admin123):');
    tacticalUsers.forEach(user => {
      console.log(`   ${user.username} - ${user.name} (${user.role})`);
    });
    
    await prisma.$disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setupTacticalAdmin();