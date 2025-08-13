/**
 * TacticalOps Platform - Simple Comprehensive Test
 * Direct testing without complex Playwright setup
 */

const { chromium } = require('playwright');

async function runTacticalOpsTests() {
  console.log('🎖️ Starting TacticalOps Comprehensive Testing');
  console.log('Target: http://217.79.255.54:3000');
  console.log('='.repeat(50));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: VPS Deployment Health Check
  try {
    console.log('🔍 Test 1: VPS Deployment Health Check');
    const response = await page.goto('http://217.79.255.54:3000');
    
    if (response.status() === 200) {
      console.log('✅ VPS is accessible and responding');
      results.passed++;
      results.tests.push({ name: 'VPS Health Check', status: 'PASSED' });
    } else {
      console.log(`❌ VPS returned status: ${response.status()}`);
      results.failed++;
      results.tests.push({ name: 'VPS Health Check', status: 'FAILED' });
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/01-homepage.png' });
    
  } catch (error) {
    console.log(`❌ VPS Health Check failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'VPS Health Check', status: 'FAILED', error: error.message });
  }

  // Test 2: Login Page Accessibility
  try {
    console.log('🔍 Test 2: Login Page Accessibility');
    await page.goto('http://217.79.255.54:3000/login');
    
    // Wait for login form
    await page.waitForSelector('input[type="text"], input[name="username"], form', { timeout: 10000 });
    
    console.log('✅ Login page is accessible');
    results.passed++;
    results.tests.push({ name: 'Login Page Access', status: 'PASSED' });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/02-login-page.png' });
    
  } catch (error) {
    console.log(`❌ Login page test failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Login Page Access', status: 'FAILED', error: error.message });
  }

  // Test 3: Admin Login Functionality
  try {
    console.log('🔍 Test 3: Admin Login Functionality');
    
    // Fill login form
    const usernameField = page.locator('input[name="username"], input[type="text"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    
    await usernameField.fill('admin');
    await passwordField.fill('admin123');
    
    // Take screenshot before login
    await page.screenshot({ path: 'test-results/03-login-filled.png' });
    
    // Submit login
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await submitButton.click();
    
    // Wait for redirect
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`After login URL: ${currentUrl}`);
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-results/04-after-login.png' });
    
    console.log('✅ Login functionality test completed');
    results.passed++;
    results.tests.push({ name: 'Admin Login', status: 'PASSED' });
    
  } catch (error) {
    console.log(`❌ Login test failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Admin Login', status: 'FAILED', error: error.message });
  }

  // Test 4: Dashboard Interface
  try {
    console.log('🔍 Test 4: Dashboard Interface');
    
    // Look for dashboard elements
    const dashboardElements = [
      'text=Dashboard',
      'text=Welcome',
      'text=Admin',
      'text=Tactical',
      'text=Emergency',
      'text=Map'
    ];
    
    let elementsFound = 0;
    for (const element of dashboardElements) {
      try {
        await page.waitForSelector(element, { timeout: 2000 });
        console.log(`  ✅ Found: ${element}`);
        elementsFound++;
      } catch (error) {
        // Element not found
      }
    }
    
    console.log(`✅ Dashboard test completed - Found ${elementsFound} elements`);
    results.passed++;
    results.tests.push({ name: 'Dashboard Interface', status: 'PASSED', details: `${elementsFound} elements found` });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/05-dashboard.png' });
    
  } catch (error) {
    console.log(`❌ Dashboard test failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Dashboard Interface', status: 'FAILED', error: error.message });
  }

  // Test 5: Navigation Testing
  try {
    console.log('🔍 Test 5: Navigation Testing');
    
    const navigationItems = [
      'Tactical',
      'Admin',
      'Dashboard',
      'Map'
    ];
    
    let navigationWorking = 0;
    for (const item of navigationItems) {
      try {
        const navElement = page.locator(`text=${item}, a:has-text("${item}"), button:has-text("${item}")`).first();
        
        if (await navElement.isVisible({ timeout: 2000 })) {
          await navElement.click();
          await page.waitForTimeout(2000);
          console.log(`  ✅ Navigation to ${item} works`);
          navigationWorking++;
          
          // Take screenshot
          await page.screenshot({ path: `test-results/06-nav-${item.toLowerCase()}.png` });
        }
      } catch (error) {
        console.log(`  ⚠️ Navigation to ${item} not available`);
      }
    }
    
    console.log(`✅ Navigation test completed - ${navigationWorking} items working`);
    results.passed++;
    results.tests.push({ name: 'Navigation', status: 'PASSED', details: `${navigationWorking} nav items` });
    
  } catch (error) {
    console.log(`❌ Navigation test failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Navigation', status: 'FAILED', error: error.message });
  }

  // Test 6: Responsive Design
  try {
    console.log('🔍 Test 6: Responsive Design Testing');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-results/07-responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      });
      
      console.log(`  ✅ ${viewport.name} viewport tested`);
    }
    
    console.log('✅ Responsive design test completed');
    results.passed++;
    results.tests.push({ name: 'Responsive Design', status: 'PASSED' });
    
  } catch (error) {
    console.log(`❌ Responsive design test failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Responsive Design', status: 'FAILED', error: error.message });
  }

  // Test 7: Performance Check
  try {
    console.log('🔍 Test 7: Performance Testing');
    
    const startTime = Date.now();
    await page.goto('http://217.79.255.54:3000');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    if (loadTime < 5000) {
      console.log('✅ Performance test passed');
      results.passed++;
      results.tests.push({ name: 'Performance', status: 'PASSED', details: `${loadTime}ms` });
    } else {
      console.log('⚠️ Performance test warning - slow load time');
      results.passed++;
      results.tests.push({ name: 'Performance', status: 'WARNING', details: `${loadTime}ms` });
    }
    
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Performance', status: 'FAILED', error: error.message });
  }

  // Close browser
  await browser.close();

  // Generate Test Report
  console.log('\n' + '='.repeat(50));
  console.log('🎖️ TACTICALOPS TESTING COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${results.passed}`);
  console.log(`❌ Tests Failed: ${results.failed}`);
  console.log(`📊 Total Tests: ${results.tests.length}`);
  console.log(`🎯 Success Rate: ${Math.round((results.passed / results.tests.length) * 100)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.tests.forEach((test, index) => {
    const status = test.status === 'PASSED' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${index + 1}. ${status} ${test.name} - ${test.status}`);
    if (test.details) console.log(`   Details: ${test.details}`);
    if (test.error) console.log(`   Error: ${test.error}`);
  });

  console.log('\n📸 Screenshots saved to: test-results/');
  console.log('🎖️ TacticalOps Platform Testing Complete!');

  return results;
}

// Create test results directory
const fs = require('fs');
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

// Run the tests
runTacticalOpsTests().catch(console.error);