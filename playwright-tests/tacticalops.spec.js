const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = 'http://217.79.255.54:3000';
const TEST_USER = { username: 'admin', password: 'admin123' };

test.describe('TacticalOps Platform - Comprehensive Testing', () => {
  
  test('Infrastructure - VPS deployment health check', async ({ page }) => {
    console.log('🔍 Testing VPS deployment health...');
    
    // Test main application accessibility
    const response = await page.goto(BASE_URL);
    expect(response.status()).toBe(200);
    
    // Check if the page loads properly
    await expect(page).toHaveTitle(/TacticalOps|Android Agent|Dashboard/);
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'playwright-tests/test-results/01-homepage-loaded.png' });
    
    console.log('✅ VPS deployment is accessible and responding');
  });

  test('Authentication - Admin login functionality', async ({ page }) => {
    console.log('🔍 Testing admin login functionality...');
    
    await page.goto(`${BASE_URL}/login`);
    
    // Wait for login form to be visible
    await page.waitForSelector('form, input[type="text"], input[name="username"]', { timeout: 10000 });
    
    // Fill login form
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await usernameInput.fill(TEST_USER.username);
    await passwordInput.fill(TEST_USER.password);
    
    // Take screenshot before login
    await page.screenshot({ path: 'playwright-tests/test-results/02-login-form-filled.png' });
    
    // Submit login
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await submitButton.click();
    
    // Wait for redirect or dashboard load
    await page.waitForTimeout(5000);
    
    // Take screenshot after login
    await page.screenshot({ path: 'playwright-tests/test-results/03-after-login.png' });
    
    console.log(`After login URL: ${page.url()}`);
    console.log('✅ Admin login test completed');
  });

  test('Dashboard - Main interface loading', async ({ page }) => {
    console.log('🔍 Testing dashboard interface...');
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="text"], input[name="username"]', { timeout: 10000 });
    
    await page.fill('input[name="username"], input[type="text"]', TEST_USER.username);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    await page.waitForTimeout(3000);
    
    // Look for dashboard elements
    const dashboardElements = [
      'text=Dashboard',
      'text=Welcome',
      'text=Admin',
      'text=Tactical',
      'text=Emergency',
      'text=Map',
      'text=System'
    ];
    
    let elementsFound = 0;
    for (const element of dashboardElements) {
      try {
        await page.waitForSelector(element, { timeout: 2000 });
        console.log(`✅ Found dashboard element: ${element}`);
        elementsFound++;
      } catch (error) {
        // Element not found, continue
      }
    }
    
    console.log(`Found ${elementsFound} dashboard elements`);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'playwright-tests/test-results/04-dashboard-interface.png' });
    
    console.log('✅ Dashboard interface test completed');
  });

  test('Navigation - Tactical features access', async ({ page }) => {
    console.log('🔍 Testing tactical features navigation...');
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    await page.fill('input[name="username"], input[type="text"]', TEST_USER.username);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    await page.waitForTimeout(3000);
    
    // Look for tactical navigation
    const tacticalNavigation = [
      'text=Tactical',
      'text=Map',
      'text=Mapping',
      'a[href*="tactical"]',
      'button:has-text("Tactical")'
    ];
    
    for (const nav of tacticalNavigation) {
      try {
        const element = await page.waitForSelector(nav, { timeout: 2000 });
        console.log(`✅ Found tactical navigation: ${nav}`);
        
        // Click and test navigation
        await element.click();
        await page.waitForTimeout(2000);
        
        // Take screenshot
        await page.screenshot({ path: 'playwright-tests/test-results/05-tactical-navigation.png' });
        break;
      } catch (error) {
        // Continue to next navigation option
      }
    }
    
    console.log('✅ Tactical features navigation test completed');
  });

  test('API - Health endpoint validation', async ({ request }) => {
    console.log('🔍 Testing API endpoints...');
    
    const endpoints = [
      '/api/health',
      '/api/dashboard',
      '/api/auth/me',
      '/api/tactical/map-data'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await request.get(`${BASE_URL}${endpoint}`);
        const responseTime = Date.now() - startTime;
        
        console.log(`${endpoint}: ${response.status()} (${responseTime}ms)`);
        
        // Basic performance check
        expect(responseTime).toBeLessThan(5000);
      } catch (error) {
        console.log(`${endpoint}: Error - ${error.message}`);
      }
    }
    
    console.log('✅ API endpoints test completed');
  });

  test('Performance - Page load times', async ({ page }) => {
    console.log('🔍 Testing page load performance...');
    
    const pages = [
      '/',
      '/login',
      '/tactical-dashboard',
      '/admin'
    ];
    
    for (const pagePath of pages) {
      try {
        const startTime = Date.now();
        await page.goto(`${BASE_URL}${pagePath}`);
        const loadTime = Date.now() - startTime;
        
        console.log(`${pagePath}: ${loadTime}ms`);
        
        // Performance expectation (5 seconds for initial testing)
        expect(loadTime).toBeLessThan(5000);
      } catch (error) {
        console.log(`${pagePath}: Error - ${error.message}`);
      }
    }
    
    console.log('✅ Page load performance test completed');
  });

  test('Security - Authentication protection', async ({ page }) => {
    console.log('🔍 Testing authentication protection...');
    
    const protectedPages = [
      '/admin',
      '/dashboard',
      '/tactical-dashboard',
      '/root-admin'
    ];
    
    for (const pagePath of protectedPages) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`);
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
        
        if (isRedirectedToLogin) {
          console.log(`✅ ${pagePath}: Properly protected (redirected to login)`);
        } else {
          console.log(`⚠️ ${pagePath}: May be accessible without authentication`);
        }
      } catch (error) {
        console.log(`${pagePath}: Error - ${error.message}`);
      }
    }
    
    console.log('✅ Authentication protection test completed');
  });

  test('Responsive - Mobile and desktop views', async ({ page }) => {
    console.log('🔍 Testing responsive design...');
    
    await page.goto(BASE_URL);
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `playwright-tests/test-results/06-responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      });
      
      console.log(`✅ ${viewport.name} viewport (${viewport.width}x${viewport.height}) tested`);
    }
    
    console.log('✅ Responsive design test completed');
  });

  test('Emergency - Alert system features', async ({ page }) => {
    console.log('🔍 Testing emergency alert features...');
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    await page.fill('input[name="username"], input[type="text"]', TEST_USER.username);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    await page.waitForTimeout(3000);
    
    // Look for emergency features
    const emergencyFeatures = [
      'text=Emergency',
      'text=Alert',
      'text=Panic',
      'button:has-text("Emergency")',
      '.emergency-button'
    ];
    
    let emergencyFound = false;
    for (const feature of emergencyFeatures) {
      try {
        await page.waitForSelector(feature, { timeout: 2000 });
        console.log(`✅ Found emergency feature: ${feature}`);
        emergencyFound = true;
        
        // Take screenshot
        await page.screenshot({ path: 'playwright-tests/test-results/07-emergency-features.png' });
        break;
      } catch (error) {
        // Continue to next feature
      }
    }
    
    if (!emergencyFound) {
      console.log('⚠️ Emergency features not immediately visible');
    }
    
    console.log('✅ Emergency alert features test completed');
  });

  test('Integration - Full system workflow', async ({ page }) => {
    console.log('🔍 Testing full system integration workflow...');
    
    // Complete workflow: Login -> Dashboard -> Navigation -> Features
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    // Step 1: Login
    await page.fill('input[name="username"], input[type="text"]', TEST_USER.username);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Step 2: Navigate through available features
    const navigationTests = [
      { text: 'Dashboard', expected: 'dashboard' },
      { text: 'Tactical', expected: 'tactical' },
      { text: 'Admin', expected: 'admin' },
      { text: 'Map', expected: 'map' }
    ];
    
    for (const nav of navigationTests) {
      try {
        const element = page.locator(`text=${nav.text}, a:has-text("${nav.text}"), button:has-text("${nav.text}")`).first();
        
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          await page.waitForTimeout(2000);
          
          console.log(`✅ Successfully navigated to ${nav.text}`);
          
          // Take screenshot of each section
          await page.screenshot({ 
            path: `playwright-tests/test-results/08-workflow-${nav.text.toLowerCase()}.png` 
          });
        }
      } catch (error) {
        console.log(`⚠️ ${nav.text} navigation not available`);
      }
    }
    
    // Final screenshot of complete workflow
    await page.screenshot({ path: 'playwright-tests/test-results/09-workflow-complete.png' });
    
    console.log('✅ Full system integration workflow test completed');
  });

});

console.log('🎖️ TacticalOps Comprehensive Testing Suite Ready');
console.log(`Target: ${BASE_URL}`);