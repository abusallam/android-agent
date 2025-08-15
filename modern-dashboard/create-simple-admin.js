#!/usr/bin/env node

/**
 * Simple Admin User Creation Script
 * Creates admin user compatible with the actual Prisma schema
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SUPABASE_DATABASE_URL
    }
  }
});

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user for TacticalOps...');
    
    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        email: 'admin@tacticalops.local'
      },
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        email: 'admin@tacticalops.local'
      }
    });
    
    console.log('✅ Admin user created successfully:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    
    // Test the password hash
    const passwordTest = await bcrypt.compare(password, adminUser.password);
    console.log(`   Password Test: ${passwordTest ? '✅ Valid' : '❌ Invalid'}`);
    
    console.log('\n🎯 Admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'P2002') {
      console.log('ℹ️  Admin user already exists, trying to update...');
      try {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const updatedUser = await prisma.user.update({
          where: { username: 'admin' },
          data: {
            password: hashedPassword,
            role: 'ADMIN'
          }
        });
        console.log('✅ Admin user updated successfully');
      } catch (updateError) {
        console.error('❌ Error updating admin user:', updateError);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();