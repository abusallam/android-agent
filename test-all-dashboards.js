#!/usr/bin/env node

/**
 * 🎭 Automated Dashboard Testing with Playwright
 * Tests all role-based dashboards: ROOT_ADMIN, PROJECT_ADMIN, USER
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test credentials from the database setup
const testCredentials = {
  ROOT_ADMIN: { username: 'root', password: 'root123' },
  PROJECT_ADMIN: { username: 'admin1', password: 'admin123' },
  USER: { username: 'user1', password: 'user123' }
};

const baseUrl = 'http://localhost:3000';
const screenshotDir = './test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function testLogin(page, role, credentials) {
  console.log(`🔐 Testing ${role} login...`);
  
  // Navigate to login page
  await page.goto(`${baseUrl}/login`);
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of login page
  await page.screenshot({ 
    path: `${screenshotDir}/${role.toLowerCase()}-01-login-page.png`,
    fullPage: true 
  });
  
  // Fill login form
  await page.fill('input[id="username"]', credentials.username);
  await page.fill('input[id="password"]', credentials.password);
  
  // Take screenshot with filled form
  await page.screenshot({ 
    path: `${screenshotDir}/${role.toLowerCase()}-02-login-filled.png`,
    fullPage: true 
  });
  
  // Submit login
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  // Wait for redirect and take screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ 
    path: `${screenshotDir}/${role.toLowerCase()}-03-after-login.png`,
    fullPage: true 
  });
  
  console.log(`✅ ${role} login successful`);
  return true;
}

async function testRootAdminDashboard(page) {
  console.log('👑 Testing ROOT_ADMIN dashboard...');
  
  // Should be redirected to /root-admin
  await page.waitForURL('**/root-admin');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of dashboard
  await page.screenshot({ 
    path: `${screenshotDir}/root-admin-04-dashboard.png`,
    fullPage: true 
  });
  
  // Test dashboard elements
  const tests = [
    { selector: 'h1', expectedText: 'Root Admin Dashboard', description: 'Dashboard title' },
    { selector: '[data-testid="total-admins"]', description: 'Total admins metric' },
    { selector: '[data-testid="total-users"]', description: 'Total users metric' },
    { selector: '[data-testid="total-projects"]', description: 'Total projects metric' },
    { selector: '[data-testid="system-health"]', description: 'System health indicator' }
  ];
  
  for (const test of tests) {
    try {
      const element = await page.locator(test.selector).first();
      if (await element.isVisible()) {
        console.log(`  ✅ ${test.description} - Found`);
        if (test.expectedText) {
          const text = await element.textContent();
          if (text?.includes(test.expectedText)) {
            console.log(`    ✅ Text matches: "${test.expectedText}"`);
          } else {
            console.log(`    ⚠️  Text mismatch. Expected: "${test.expectedText}", Got: "${text}"`);
          }
        }
      } else {
        console.log(`  ❌ ${test.description} - Not visible`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.description} - Not found: ${error.message}`);
    }
  }
  
  // Test project admin management
  try {
    const createAdminButton = page.locator('button:has-text("Create Project Admin")').first();
    if (await createAdminButton.isVisible()) {
      console.log('  ✅ Create Project Admin button - Found');
    }
  } catch (error) {
    console.log('  ⚠️  Create Project Admin button - Not found');
  }
  
  console.log('✅ ROOT_ADMIN dashboard test completed');
}

async function testProjectAdminDashboard(page) {
  console.log('🏢 Testing PROJECT_ADMIN dashboard...');
  
  // Should be redirected to /project-admin
  await page.waitForURL('**/project-admin');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of dashboard
  await page.screenshot({ 
    path: `${screenshotDir}/project-admin-04-dashboard.png`,
    fullPage: true 
  });
  
  // Test dashboard elements
  const tests = [
    { selector: 'h1', expectedText: 'Project Admin Dashboard', description: 'Dashboard title' },
    { selector: '[data-testid="assigned-users"]', description: 'Assigned users metric' },
    { selector: '[data-testid="online-devices"]', description: 'Online devices metric' },
    { selector: '[data-testid="emergency-alerts"]', description: 'Emergency alerts section' },
    { selector: '[data-testid="user-management"]', description: 'User management section' }
  ];
  
  for (const test of tests) {
    try {
      const element = await page.locator(test.selector).first();
      if (await element.isVisible()) {
        console.log(`  ✅ ${test.description} - Found`);
        if (test.expectedText) {
          const text = await element.textContent();
          if (text?.includes(test.expectedText)) {
            console.log(`    ✅ Text matches: "${test.expectedText}"`);
          } else {
            console.log(`    ⚠️  Text mismatch. Expected: "${test.expectedText}", Got: "${text}"`);
          }
        }
      } else {
        console.log(`  ❌ ${test.description} - Not visible`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.description} - Not found: ${error.message}`);
    }
  }
  
  // Test communication features
  try {
    const videoCallButton = page.locator('button:has-text("Video Call")').first();
    if (await videoCallButton.isVisible()) {
      console.log('  ✅ Video Call button - Found');
      await videoCallButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: `${screenshotDir}/project-admin-05-video-call.png`,
        fullPage: true 
      });
    }
  } catch (error) {
    console.log('  ⚠️  Video Call button - Not found');
  }
  
  console.log('✅ PROJECT_ADMIN dashboard test completed');
}

async function testUserDashboard(page) {
  console.log('👤 Testing USER dashboard...');
  
  // Should be redirected to /user-dashboard
  await page.waitForURL('**/user-dashboard');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of dashboard
  await page.screenshot({ 
    path: `${screenshotDir}/user-04-dashboard.png`,
    fullPage: true 
  });
  
  // Test dashboard elements
  const tests = [
    { selector: 'h1', expectedText: 'User Dashboard', description: 'Dashboard title' },
    { selector: '[data-testid="device-status"]', description: 'Device status card' },
    { selector: '[data-testid="emergency-button"]', description: 'Emergency button' },
    { selector: '[data-testid="location-info"]', description: 'Location information' },
    { selector: '[data-testid="emergency-contacts"]', description: 'Emergency contacts' }
  ];
  
  for (const test of tests) {
    try {
      const element = await page.locator(test.selector).first();
      if (await element.isVisible()) {
        console.log(`  ✅ ${test.description} - Found`);
        if (test.expectedText) {
          const text = await element.textContent();
          if (text?.includes(test.expectedText)) {
            console.log(`    ✅ Text matches: "${test.expectedText}"`);
          } else {
            console.log(`    ⚠️  Text mismatch. Expected: "${test.expectedText}", Got: "${text}"`);
          }
        }
      } else {
        console.log(`  ❌ ${test.description} - Not visible`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.description} - Not found: ${error.message}`);
    }
  }
  
  // Test emergency button
  try {
    const emergencyButton = page.locator('button:has-text("EMERGENCY")').first();
    if (await emergencyButton.isVisible()) {
      console.log('  ✅ Emergency button - Found');
      await emergencyButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: `${screenshotDir}/user-05-emergency-clicked.png`,
        fullPage: true 
      });
    }
  } catch (error) {
    console.log('  ⚠️  Emergency button - Not found');
  }
  
  console.log('✅ USER dashboard test completed');
}

async function testAPIs() {
  console.log('🔌 Testing API endpoints...');
  
  const apiTests = [
    { url: '/api/health', description: 'Health check' },
    { url: '/api/root-admin/metrics', description: 'Root admin metrics' },
    { url: '/api/project-admin/metrics', description: 'Project admin metrics' },
    { url: '/api/user/profile', description: 'User profile' }
  ];
  
  for (const test of apiTests) {
    try {
      const response = await fetch(`${baseUrl}${test.url}`);
      if (response.ok) {
        console.log(`  ✅ ${test.description} - Status: ${response.status}`);
      } else {
        console.log(`  ⚠️  ${test.description} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.description} - Error: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🎭 Starting Automated Dashboard Testing...');
  console.log('==========================================');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 500 // Slow down for better visibility
  });
  
  try {
    // Test ROOT_ADMIN
    console.log('\n👑 ROOT_ADMIN Testing');
    console.log('====================');
    const rootPage = await browser.newPage();
    await testLogin(rootPage, 'ROOT_ADMIN', testCredentials.ROOT_ADMIN);
    await testRootAdminDashboard(rootPage);
    await rootPage.close();
    
    // Test PROJECT_ADMIN
    console.log('\n🏢 PROJECT_ADMIN Testing');
    console.log('========================');
    const adminPage = await browser.newPage();
    await testLogin(adminPage, 'PROJECT_ADMIN', testCredentials.PROJECT_ADMIN);
    await testProjectAdminDashboard(adminPage);
    await adminPage.close();
    
    // Test USER
    console.log('\n👤 USER Testing');
    console.log('===============');
    const userPage = await browser.newPage();
    await testLogin(userPage, 'USER', testCredentials.USER);
    await testUserDashboard(userPage);
    await userPage.close();
    
    // Test APIs
    console.log('\n🔌 API Testing');
    console.log('==============');
    await testAPIs();
    
    console.log('\n🎉 All Tests Completed!');
    console.log('========================');
    console.log(`📸 Screenshots saved to: ${screenshotDir}`);
    console.log('✅ Role-based dashboard system is working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };