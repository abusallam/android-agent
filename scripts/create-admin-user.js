const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: { 
        password: hashedPassword,
        isActive: true 
      },
      create: {
        username: 'admin',
        email: 'admin@tac.consulting.sa',
        password: hashedPassword,
        role: 'ROOT_ADMIN',
        name: 'System Administrator',
        isActive: true
      }
    });
    
    console.log('✅ Admin user created/updated:', admin.username);
    
    // Create tactical dummy users
    const tacticalUsers = [
      { username: 'commander', name: 'Field Commander', role: 'ADMIN' },
      { username: 'operative1', name: 'Tactical Operative Alpha', role: 'USER' },
      { username: 'operative2', name: 'Tactical Operative Bravo', role: 'USER' },
      { username: 'sniper', name: 'Sniper Charlie', role: 'USER' },
      { username: 'medic', name: 'Field Medic Delta', role: 'USER' }
    ];
    
    for (const user of tacticalUsers) {
      await prisma.user.upsert({
        where: { username: user.username },
        update: { isActive: true },
        create: {
          username: user.username,
          email: `${user.username}@tac.consulting.sa`,
          password: hashedPassword, // Same password for demo
          role: user.role,
          name: user.name,
          isActive: true
        }
      });
    }
    
    console.log('✅ Tactical users created');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();