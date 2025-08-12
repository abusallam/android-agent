#!/usr/bin/env node

/**
 * 🎭 Android Agent AI - Role-Based Dummy Data Setup
 * Creates comprehensive dummy data for testing the role-based dashboard system
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Dummy data structure
const dummyData = {
  // ROOT_ADMIN - System administrator
  rootAdmin: {
    username: 'root',
    password: 'root123',
    email: 'root@androidagent.local',
    role: 'ROOT_ADMIN'
  },
  
  // PROJECT_ADMIN users - Manage specific projects and users
  projectAdmins: [
    {
      username: 'admin1',
      password: 'admin123',
      email: 'admin1@androidagent.local',
      role: 'PROJECT_ADMIN',
      project: {
        name: 'Security Team Alpha',
        description: 'Primary security monitoring project'
      }
    },
    {
      username: 'admin2', 
      password: 'admin123',
      email: 'admin2@androidagent.local',
      role: 'PROJECT_ADMIN',
      project: {
        name: 'Operations Team Beta',
        description: 'Field operations monitoring project'
      }
    },
    {
      username: 'admin3',
      password: 'admin123', 
      email: 'admin3@androidagent.local',
      role: 'PROJECT_ADMIN',
      project: {
        name: 'Emergency Response Team',
        description: 'Emergency response and crisis management'
      }
    }
  ],
  
  // USER accounts - End users assigned to project admins
  users: [
    // Users assigned to admin1 (Security Team Alpha)
    {
      username: 'user1',
      password: 'user123',
      email: 'user1@androidagent.local',
      role: 'USER',
      assignedAdmin: 'admin1',
      profile: {
        name: 'John Smith',
        department: 'Security',
        position: 'Security Officer'
      }
    },
    {
      username: 'user2',
      password: 'user123',
      email: 'user2@androidagent.local', 
      role: 'USER',
      assignedAdmin: 'admin1',
      profile: {
        name: 'Sarah Johnson',
        department: 'Security',
        position: 'Senior Security Analyst'
      }
    },
    {
      username: 'user3',
      password: 'user123',
      email: 'user3@androidagent.local',
      role: 'USER', 
      assignedAdmin: 'admin1',
      profile: {
        name: 'Mike Davis',
        department: 'Security',
        position: 'Security Guard'
      }
    },
    
    // Users assigned to admin2 (Operations Team Beta)
    {
      username: 'user4',
      password: 'user123',
      email: 'user4@androidagent.local',
      role: 'USER',
      assignedAdmin: 'admin2',
      profile: {
        name: 'Lisa Chen',
        department: 'Operations',
        position: 'Field Coordinator'
      }
    },
    {
      username: 'user5',
      password: 'user123',
      email: 'user5@androidagent.local',
      role: 'USER',
      assignedAdmin: 'admin2',
      profile: {
        name: 'David Wilson',
        department: 'Operations', 
        position: 'Operations Specialist'
      }
    },
    
    // Users assigned to admin3 (Emergency Response Team)
    {
      username: 'user6',
      password: 'user123',
      email: 'user6@androidagent.local',
      role: 'USER',
      assignedAdmin: 'admin3',
      profile: {
        name: 'Emma Rodriguez',
        department: 'Emergency Response',
        position: 'Emergency Coordinator'
      }
    },
    {
      username: 'user7',
      password: 'user123',
      email: 'user7@androidagent.local',
      role: 'USER',
      assignedAdmin: 'admin3',
      profile: {
        name: 'James Brown',
        department: 'Emergency Response',
        position: 'First Responder'
      }
    }
  ]
};

// Device data for users
const deviceData = [
  {
    deviceId: 'device-user1-001',
    name: 'John\'s Security Phone',
    model: 'Samsung Galaxy S23',
    manufacturer: 'Samsung',
    version: 'Android 14',
    isOnline: true,
    location: JSON.stringify({ lat: 40.7128, lng: -74.0060, accuracy: 5 })
  },
  {
    deviceId: 'device-user2-001', 
    name: 'Sarah\'s Security Tablet',
    model: 'iPad Pro',
    manufacturer: 'Apple',
    version: 'iOS 17',
    isOnline: true,
    location: JSON.stringify({ lat: 40.7589, lng: -73.9851, accuracy: 3 })
  },
  {
    deviceId: 'device-user3-001',
    name: 'Mike\'s Security Device',
    model: 'Google Pixel 8',
    manufacturer: 'Google',
    version: 'Android 14',
    isOnline: false,
    location: JSON.stringify({ lat: 40.7505, lng: -73.9934, accuracy: 8 })
  },
  {
    deviceId: 'device-user4-001',
    name: 'Lisa\'s Field Device',
    model: 'Samsung Galaxy Tab S9',
    manufacturer: 'Samsung', 
    version: 'Android 14',
    isOnline: true,
    location: JSON.stringify({ lat: 40.7282, lng: -74.0776, accuracy: 4 })
  },
  {
    deviceId: 'device-user5-001',
    name: 'David\'s Operations Phone',
    model: 'iPhone 15 Pro',
    manufacturer: 'Apple',
    version: 'iOS 17',
    isOnline: true,
    location: JSON.stringify({ lat: 40.7614, lng: -73.9776, accuracy: 6 })
  },
  {
    deviceId: 'device-user6-001',
    name: 'Emma\'s Emergency Device',
    model: 'Samsung Galaxy S24 Ultra',
    manufacturer: 'Samsung',
    version: 'Android 14',
    isOnline: true,
    location: JSON.stringify({ lat: 40.7831, lng: -73.9712, accuracy: 2 })
  },
  {
    deviceId: 'device-user7-001',
    name: 'James\'s Response Unit',
    model: 'Google Pixel 8 Pro',
    manufacturer: 'Google',
    version: 'Android 14',
    isOnline: true,
    location: JSON.stringify({ lat: 40.7549, lng: -73.9840, accuracy: 5 })
  }
];

async function clearExistingData() {
  console.log('🧹 Clearing existing role-based data...');
  
  // Clear in reverse dependency order
  await prisma.gpsLog.deleteMany({});
  await prisma.sensorData.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.userAssignment.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      role: {
        in: ['ROOT_ADMIN', 'PROJECT_ADMIN', 'USER']
      }
    }
  });
  
  console.log('✅ Existing data cleared');
}

async function createRootAdmin() {
  console.log('👑 Creating ROOT_ADMIN...');
  
  const hashedPassword = await bcrypt.hash(dummyData.rootAdmin.password, 12);
  
  const rootAdmin = await prisma.user.create({
    data: {
      username: dummyData.rootAdmin.username,
      password: hashedPassword,
      email: dummyData.rootAdmin.email,
      role: dummyData.rootAdmin.role,
      isActive: true
    }
  });
  
  console.log(`✅ ROOT_ADMIN created: ${rootAdmin.username}`);
  return rootAdmin;
}

async function createProjectAdminsAndProjects() {
  console.log('🏢 Creating PROJECT_ADMIN users and projects...');
  
  const projectAdmins = [];
  
  for (const adminData of dummyData.projectAdmins) {
    const hashedPassword = await bcrypt.hash(adminData.password, 12);
    
    // Create PROJECT_ADMIN user
    const admin = await prisma.user.create({
      data: {
        username: adminData.username,
        password: hashedPassword,
        email: adminData.email,
        role: adminData.role,
        isActive: true
      }
    });
    
    // Create associated project
    const project = await prisma.project.create({
      data: {
        name: adminData.project.name,
        description: adminData.project.description,
        adminId: admin.id,
        userCount: 0
      }
    });
    
    // Update admin with project reference
    await prisma.user.update({
      where: { id: admin.id },
      data: { projectId: project.id }
    });
    
    projectAdmins.push({ admin, project });
    console.log(`✅ PROJECT_ADMIN created: ${admin.username} -> ${project.name}`);
  }
  
  return projectAdmins;
}

async function createUsersAndAssignments(projectAdmins) {
  console.log('👥 Creating USER accounts and assignments...');
  
  const users = [];
  
  for (const userData of dummyData.users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Find the assigned admin
    const assignedAdmin = projectAdmins.find(pa => pa.admin.username === userData.assignedAdmin);
    if (!assignedAdmin) {
      console.error(`❌ Could not find admin: ${userData.assignedAdmin}`);
      continue;
    }
    
    // Create USER
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        role: userData.role,
        isActive: true,
        assignedAdminId: assignedAdmin.admin.id,
        projectId: assignedAdmin.project.id
      }
    });
    
    // Create user assignment
    await prisma.userAssignment.create({
      data: {
        projectAdminId: assignedAdmin.admin.id,
        userId: user.id,
        permissions: JSON.stringify({
          canReceiveCalls: true,
          canShareLocation: true,
          canTriggerEmergency: true,
          monitoringLevel: 'full'
        })
      }
    });
    
    // Update project user count
    await prisma.project.update({
      where: { id: assignedAdmin.project.id },
      data: {
        userCount: {
          increment: 1
        }
      }
    });
    
    users.push(user);
    console.log(`✅ USER created: ${user.username} -> assigned to ${assignedAdmin.admin.username}`);
  }
  
  return users;
}

async function createDeviceData(users) {
  console.log('📱 Creating device data...');
  
  for (let i = 0; i < Math.min(users.length, deviceData.length); i++) {
    const user = users[i];
    const deviceInfo = deviceData[i];
    
    // Create the device first
    const device = await prisma.device.create({
      data: {
        ...deviceInfo,
        lastSeen: new Date(),
        firstSeen: new Date()
      }
    });
    
    // Create some GPS logs for the device using the device.id
    const gpsLogs = [];
    for (let j = 0; j < 5; j++) {
      const location = JSON.parse(deviceInfo.location);
      gpsLogs.push({
        deviceId: device.id, // Use the created device's ID
        latitude: location.lat + (Math.random() - 0.5) * 0.01,
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        accuracy: location.accuracy + Math.random() * 5,
        timestamp: new Date(Date.now() - j * 3600000) // Every hour
      });
    }
    
    await prisma.gpsLog.createMany({
      data: gpsLogs
    });
    
    // Create some sensor data using the device.id
    await prisma.sensorData.createMany({
      data: [
        {
          deviceId: device.id, // Use the created device's ID
          sensorType: 'accelerometer',
          data: JSON.stringify({ x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }),
          timestamp: new Date()
        },
        {
          deviceId: device.id, // Use the created device's ID
          sensorType: 'gyroscope', 
          data: JSON.stringify({ x: Math.random() * 5, y: Math.random() * 5, z: Math.random() * 5 }),
          timestamp: new Date()
        }
      ]
    });
    
    console.log(`✅ Device data created: ${device.name}`);
  }
}

async function generateSystemMetrics() {
  console.log('📊 Generating system metrics...');
  
  const totalUsers = await prisma.user.count();
  const totalProjects = await prisma.project.count();
  const totalDevices = await prisma.device.count();
  const onlineDevices = await prisma.device.count({ where: { isOnline: true } });
  
  console.log(`📈 System Metrics Generated:`);
  console.log(`   Total Users: ${totalUsers}`);
  console.log(`   Total Projects: ${totalProjects}`);
  console.log(`   Total Devices: ${totalDevices}`);
  console.log(`   Online Devices: ${onlineDevices}`);
}

async function printCredentials() {
  console.log('\n🔐 DUMMY CREDENTIALS FOR TESTING:');
  console.log('=====================================');
  
  console.log('\n👑 ROOT_ADMIN:');
  console.log(`   Username: ${dummyData.rootAdmin.username}`);
  console.log(`   Password: ${dummyData.rootAdmin.password}`);
  console.log(`   Access: System-wide admin, manage project admins`);
  
  console.log('\n🏢 PROJECT_ADMIN accounts:');
  dummyData.projectAdmins.forEach((admin, index) => {
    console.log(`   ${index + 1}. Username: ${admin.username}`);
    console.log(`      Password: ${admin.password}`);
    console.log(`      Project: ${admin.project.name}`);
    console.log(`      Access: Manage assigned users, device monitoring`);
  });
  
  console.log('\n👥 USER accounts:');
  dummyData.users.forEach((user, index) => {
    console.log(`   ${index + 1}. Username: ${user.username}`);
    console.log(`      Password: ${user.password}`);
    console.log(`      Assigned to: ${user.assignedAdmin}`);
    console.log(`      Profile: ${user.profile.name} - ${user.profile.position}`);
  });
  
  console.log('\n🌐 ACCESS URLS:');
  console.log('   Dashboard: http://localhost:3003');
  console.log('   Login and test different role dashboards!');
}

async function main() {
  try {
    console.log('🚀 Starting Role-Based Dummy Data Setup...');
    console.log('==========================================');
    
    // Clear existing data
    await clearExistingData();
    
    // Create ROOT_ADMIN
    const rootAdmin = await createRootAdmin();
    
    // Create PROJECT_ADMIN users and projects
    const projectAdmins = await createProjectAdminsAndProjects();
    
    // Create USER accounts and assignments
    const users = await createUsersAndAssignments(projectAdmins);
    
    // Create device data
    await createDeviceData(users);
    
    // Generate metrics
    await generateSystemMetrics();
    
    // Print credentials
    await printCredentials();
    
    console.log('\n🎉 Role-Based Dummy Data Setup Complete!');
    console.log('✅ Database is ready for role-based testing');
    
  } catch (error) {
    console.error('❌ Error setting up dummy data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, dummyData };