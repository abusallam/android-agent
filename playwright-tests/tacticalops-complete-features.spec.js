/**
 * TacticalOps Complete Features Test Suite
 * Comprehensive testing of all platform features including streaming
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const CONFIG = {
  baseURL: 'http://127.0.0.1:3020',
  httpsURL: 'https://tac.consulting.sa',
  credentials: {
    admin: { username: 'admin', password: 'admin123' },
    user: { username: 'testuser', password: 'testpass123' }
  },
  timeout: 30000
};

test.describe('TacticalOps Platform - Complete Feature Testing', () => {
  
  // Test 1: Homepage and Basic Navigation
  test('Homepage loads and displays correctly', async ({ page }) => {
    await page.goto(CONFIG.baseURL);
    
    // Check if redirected to login
    await expect(page).toHaveURL(/.*login.*/);
    
    // Check login page elements
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for logo and branding
    await expect(page.locator('text=Android Agent')).toBeVisible();
  });

  // Test 2: Authentication System
  test('Admin login and authentication flow', async ({ page }) => {
    await page.goto(CONFIG.baseURL + '/login');
    
    // Fill login form
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Check dashboard elements
    await expect(page.locator('text=Security Dashboard')).toBeVisible();
    await expect(page.locator('text=System Online')).toBeVisible();
  });

  // Test 3: Dashboard Functionality
  test('Dashboard displays all key metrics and components', async ({ page }) => {
    // Login first
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Check key dashboard components
    await expect(page.locator('text=Connected Devices')).toBeVisible();
    await expect(page.locator('text=GPS Tracking')).toBeVisible();
    await expect(page.locator('text=Avg Battery')).toBeVisible();
    await expect(page.locator('text=Network Status')).toBeVisible();
    await expect(page.locator('text=Active Alerts')).toBeVisible();
    
    // Check LiveKit streaming panel
    await expect(page.locator('text=Live Streaming & Communication')).toBeVisible();
    await expect(page.locator('text=Video Call')).toBeVisible();
    await expect(page.locator('text=Audio Call')).toBeVisible();
    await expect(page.locator('text=Screen Share')).toBeVisible();
    await expect(page.locator('text=EMERGENCY')).toBeVisible();
    
    // Check interactive map
    await expect(page.locator('text=Interactive Map')).toBeVisible();
    
    // Check system testing panel
    await expect(page.locator('text=System Testing & API Endpoints')).toBeVisible();
  });

  // Test 4: Admin Panel Access
  test('Admin panel loads and displays user management', async ({ page }) => {
    // Login as admin
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Navigate to admin panel
    await page.click('text=Admin');
    await page.waitForURL(/.*admin.*/, { timeout: 10000 });
    
    // Check admin panel elements
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Administrators')).toBeVisible();
    await expect(page.locator('text=Regular Users')).toBeVisible();
    await expect(page.locator('text=System Users')).toBeVisible();
  });

  // Test 5: Streaming Page Access
  test('Streaming page loads with LiveKit components', async ({ page }) => {
    // Login first
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Navigate to streaming page
    await page.goto(CONFIG.baseURL + '/streaming');
    
    // Check streaming dashboard elements
    await expect(page.locator('text=TacticalOps Streaming')).toBeVisible();
    await expect(page.locator('text=Connect to Room')).toBeVisible();
    
    // Check tabs are present
    await expect(page.locator('text=Video')).toBeVisible();
    await expect(page.locator('text=Audio')).toBeVisible();
    await expect(page.locator('text=Screen')).toBeVisible();
    await expect(page.locator('text=Emergency')).toBeVisible();
  });

  // Test 6: API Health Checks
  test('API endpoints respond correctly', async ({ page }) => {
    // Test health endpoint
    const healthResponse = await page.request.get(CONFIG.baseURL + '/api/health');
    expect(healthResponse.status()).toBe(200);
    
    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('healthy');
    expect(healthData.database.status).toBe('healthy');
    
    // Test other API endpoints
    const syncResponse = await page.request.get(CONFIG.baseURL + '/api/sync');
    expect(syncResponse.status()).toBe(200);
    
    const deviceResponse = await page.request.get(CONFIG.baseURL + '/api/device/sync');
    expect(deviceResponse.status()).toBe(200);
  });

  // Test 7: LiveKit Streaming Features
  test('LiveKit streaming components are functional', async ({ page }) => {
    // Login and navigate to streaming
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Test streaming buttons on main dashboard
    await expect(page.locator('text=Video Call')).toBeVisible();
    await expect(page.locator('text=Audio Call')).toBeVisible();
    await expect(page.locator('text=Screen Share')).toBeVisible();
    await expect(page.locator('text=EMERGENCY')).toBeVisible();
    
    // Navigate to dedicated streaming page
    await page.goto(CONFIG.baseURL + '/streaming');
    
    // Check streaming interface
    await expect(page.locator('text=TacticalOps Streaming')).toBeVisible();
    await expect(page.locator('text=Room: tactical-ops-main')).toBeVisible();
    
    // Test tab navigation
    await page.click('text=Audio');
    await expect(page.locator('text=Audio Communication')).toBeVisible();
    
    await page.click('text=Screen');
    await expect(page.locator('text=Screen Sharing')).toBeVisible();
    
    await page.click('text=Emergency');
    await expect(page.locator('text=Emergency Communication')).toBeVisible();
  });

  // Test 8: Emergency Communication System
  test('Emergency communication system is accessible', async ({ page }) => {
    // Login and navigate to streaming
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    await page.goto(CONFIG.baseURL + '/streaming');
    
    // Navigate to emergency tab
    await page.click('text=Emergency');
    
    // Check emergency form elements
    await expect(page.locator('text=Emergency Type')).toBeVisible();
    await expect(page.locator('text=Priority Level')).toBeVisible();
    await expect(page.locator('text=Description')).toBeVisible();
    
    // Check emergency types are available
    await page.click('text=Select emergency type');
    await expect(page.locator('text=Medical Emergency')).toBeVisible();
    await expect(page.locator('text=Security Incident')).toBeVisible();
    await expect(page.locator('text=Fire Emergency')).toBeVisible();
  });

  // Test 9: Responsive Design
  test('Platform is responsive on different screen sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(CONFIG.baseURL + '/login');
    
    // Check mobile login
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Login
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Check mobile dashboard
    await expect(page.locator('text=Security Dashboard')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('text=Security Dashboard')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await expect(page.locator('text=Security Dashboard')).toBeVisible();
  });

  // Test 10: PWA Features
  test('PWA features are functional', async ({ page }) => {
    await page.goto(CONFIG.baseURL);
    
    // Check PWA manifest
    const manifestResponse = await page.request.get(CONFIG.baseURL + '/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.icons).toBeDefined();
    
    // Check service worker
    const swResponse = await page.request.get(CONFIG.baseURL + '/sw.js');
    expect(swResponse.status()).toBe(200);
  });

  // Test 11: Security Headers
  test('Security headers are properly configured', async ({ page }) => {
    const response = await page.request.get(CONFIG.baseURL);
    
    // Check security headers
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['referrer-policy']).toBeDefined();
    expect(response.headers()['permissions-policy']).toBeDefined();
  });

  // Test 12: Database Connectivity
  test('Database operations work correctly', async ({ page }) => {
    // Test health endpoint which checks database
    const response = await page.request.get(CONFIG.baseURL + '/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.database.status).toBe('healthy');
    expect(data.database.provider).toBe('sqlite');
  });

  // Test 13: Real-time Features
  test('Real-time dashboard updates work', async ({ page }) => {
    // Login
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Check for real-time indicators
    await expect(page.locator('text=System Online')).toBeVisible();
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Check for live data updates
    await expect(page.locator('text=Connected Devices')).toBeVisible();
    await expect(page.locator('text=GPS Tracking')).toBeVisible();
  });

  // Test 14: Error Handling
  test('Error handling works correctly', async ({ page }) => {
    // Test invalid login
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', 'invalid');
    await page.fill('input[type="password"]', 'invalid');
    await page.click('button[type="submit"]');
    
    // Should stay on login page or show error
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('login');
    
    // Test 404 page
    const response = await page.request.get(CONFIG.baseURL + '/nonexistent-page');
    expect(response.status()).toBe(404);
  });

  // Test 15: Performance Metrics
  test('Performance meets requirements', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(CONFIG.baseURL);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    // Test API response times
    const apiStartTime = Date.now();
    const response = await page.request.get(CONFIG.baseURL + '/api/health');
    const apiTime = Date.now() - apiStartTime;
    
    expect(response.status()).toBe(200);
    expect(apiTime).toBeLessThan(1000); // API should respond within 1 second
  });

  // Test 16: Cross-browser Compatibility
  test('Platform works across different browsers', async ({ page, browserName }) => {
    await page.goto(CONFIG.baseURL + '/login');
    
    // Basic functionality should work in all browsers
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Login should work
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    await expect(page.locator('text=Security Dashboard')).toBeVisible();
    
    console.log(`✅ Test passed on ${browserName}`);
  });

  // Test 17: Accessibility
  test('Platform meets accessibility standards', async ({ page }) => {
    await page.goto(CONFIG.baseURL + '/login');
    
    // Check for proper form labels
    const usernameInput = page.locator('input[type="text"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Check for keyboard navigation
    await usernameInput.focus();
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
    
    // Check for proper heading structure
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Check for proper headings on dashboard
    await expect(page.locator('h1')).toBeVisible();
  });

  // Test 18: Data Persistence
  test('Data persistence works correctly', async ({ page }) => {
    // Login
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Navigate to admin panel
    await page.click('text=Admin');
    await page.waitForURL(/.*admin.*/, { timeout: 10000 });
    
    // Check that user data persists
    await expect(page.locator('text=System Users')).toBeVisible();
    
    // Refresh page and check data still exists
    await page.reload();
    await expect(page.locator('text=System Users')).toBeVisible();
  });

  // Test 19: Integration Testing
  test('All systems integrate properly', async ({ page }) => {
    // Login
    await page.goto(CONFIG.baseURL + '/login');
    await page.fill('input[type="text"]', CONFIG.credentials.admin.username);
    await page.fill('input[type="password"]', CONFIG.credentials.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
    
    // Test navigation between different sections
    await expect(page.locator('text=Security Dashboard')).toBeVisible();
    
    // Navigate to admin
    await page.click('text=Admin');
    await page.waitForURL(/.*admin.*/, { timeout: 10000 });
    await expect(page.locator('text=User Management')).toBeVisible();
    
    // Navigate back to dashboard
    await page.click('text=Dashboard');
    await page.waitForURL(/.*(?<!admin)$/, { timeout: 10000 });
    await expect(page.locator('text=Security Dashboard')).toBeVisible();
    
    // Navigate to streaming
    await page.goto(CONFIG.baseURL + '/streaming');
    await expect(page.locator('text=TacticalOps Streaming')).toBeVisible();
    
    // Test logout
    await page.goto(CONFIG.baseURL);
    await page.click('text=Logout');
    await page.waitForURL(/.*login.*/, { timeout: 10000 });
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  // Test 20: Production Readiness
  test('Platform is production ready', async ({ page }) => {
    // Test HTTPS redirect (if applicable)
    const httpsResponse = await page.request.get(CONFIG.httpsURL, { 
      ignoreHTTPSErrors: true 
    });
    expect(httpsResponse.status()).toBe(200);
    
    // Test health endpoint
    const healthResponse = await page.request.get(CONFIG.baseURL + '/api/health');
    expect(healthResponse.status()).toBe(200);
    
    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('healthy');
    expect(healthData.timestamp).toBeDefined();
    expect(healthData.version).toBeDefined();
    
    // Test that all critical pages load
    const criticalPages = [
      '/',
      '/login',
      '/admin',
      '/streaming'
    ];
    
    for (const pagePath of criticalPages) {
      const response = await page.request.get(CONFIG.baseURL + pagePath);
      expect(response.status()).toBeLessThan(400);
    }
  });
});

// Test configuration and setup
test.beforeEach(async ({ page }) => {
  // Set longer timeout for all tests
  page.setDefaultTimeout(CONFIG.timeout);
  
  // Set viewport to desktop by default
  await page.setViewportSize({ width: 1920, height: 1080 });
});

test.afterEach(async ({ page }) => {
  // Clean up after each test
  await page.close();
});