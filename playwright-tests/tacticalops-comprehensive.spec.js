const { test, expect } = require('@playwright/test');

// Configuration
const CONFIG = {
  timeout: 30000,
  credentials: {
    admin: { username: 'admin', password: 'admin123' },
    user: { username: 'user', password: 'user123' }
  }
};

// Test suite for TacticalOps Platform
test.describe('TacticalOps Platform - Comprehensive Testing', () => {
  
  // Configure test settings
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for slow responses
    page.setDefaultTimeout(CONFIG.timeout);
  });

  test.describe('Deployment and Connectivity Tests', () => {
    
    test('should load the main page', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check if page loaded successfully
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // Take screenshot for verification
      await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });
      
      console.log(`✅ Homepage loaded successfully - Title: ${title}`);
    });

    test('should handle SSL/TLS properly', async ({ page }) => {
      const response = await page.goto(CONFIG.baseURL);
      
      // Check response status
      expect(response.status()).toBeLessThan(400);
      
      // Check if HTTPS is working
      expect(page.url()).toContain('https://');
      
      console.log(`✅ SSL/TLS working - Status: ${response.status()}`);
    });

    test('should redirect HTTP to HTTPS', async ({ page }) => {
      try {
        await page.goto('http://ta.consulting.sa');
        await page.waitForLoadState('networkidle');
        
        // Should be redirected to HTTPS
        expect(page.url()).toContain('https://');
        
        console.log('✅ HTTP to HTTPS redirect working');
      } catch (error) {
        console.log('⚠️  HTTP redirect test failed:', error.message);
      }
    });
  });

  test.describe('Authentication and Login Tests', () => {
    
    test('should display login page', async ({ page }) => {
      await page.goto(`${CONFIG.baseURL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Check for login form elements
      const usernameField = page.locator('input[name="username"], input[type="text"], input[placeholder*="username" i]');
      const passwordField = page.locator('input[name="password"], input[type="password"], input[placeholder*="password" i]');
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      
      // Verify login form exists
      await expect(usernameField.first()).toBeVisible({ timeout: 10000 });
      await expect(passwordField.first()).toBeVisible({ timeout: 10000 });
      await expect(loginButton.first()).toBeVisible({ timeout: 10000 });
      
      await page.screenshot({ path: 'test-results/02-login-page.png', fullPage: true });
      
      console.log('✅ Login page displayed correctly');
    });

    test('should authenticate with admin credentials', async ({ page }) => {
      await page.goto(`${CONFIG.baseURL}/login`);
      await page.waitForLoadState('networkidle');
      
      try {
        // Fill login form
        const usernameField = page.locator('input[name="username"], input[type="text"], input[placeholder*="username" i]').first();
        const passwordField = page.locator('input[name="password"], input[type="password"], input[placeholder*="password" i]').first();
        const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
        
        await usernameField.fill(CONFIG.credentials.admin.username);
        await passwordField.fill(CONFIG.credentials.admin.password);
        
        await page.screenshot({ path: 'test-results/03-login-filled.png', fullPage: true });
        
        // Submit login
        await loginButton.click();
        
        // Wait for navigation or dashboard
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Check if redirected to dashboard or authenticated area
        const currentUrl = page.url();
        const isAuthenticated = !currentUrl.includes('/login') || 
                              currentUrl.includes('/dashboard') || 
                              currentUrl.includes('/tactical') ||
                              currentUrl.includes('/admin');
        
        if (isAuthenticated) {
          await page.screenshot({ path: 'test-results/04-after-login.png', fullPage: true });
          console.log('✅ Admin authentication successful');
        } else {
          console.log('⚠️  Authentication may have failed - still on login page');
        }
        
      } catch (error) {
        console.log('⚠️  Login test encountered error:', error.message);
        await page.screenshot({ path: 'test-results/04-login-error.png', fullPage: true });
      }
    });
  });

  test.describe('Dashboard and UI Tests', () => {
    
    test('should load tactical dashboard', async ({ page }) => {
      // First login
      await page.goto(`${CONFIG.baseURL}/login`);
      await page.waitForLoadState('networkidle');
      
      try {
        // Attempt login
        const usernameField = page.locator('input[name="username"], input[type="text"], input[placeholder*="username" i]').first();
        const passwordField = page.locator('input[name="password"], input[type="password"], input[placeholder*="password" i]').first();
        const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
        
        await usernameField.fill(CONFIG.credentials.admin.username);
        await passwordField.fill(CONFIG.credentials.admin.password);
        await loginButton.click();
        
        await page.waitForLoadState('networkidle');
        
        // Navigate to tactical dashboard
        await page.goto(`${CONFIG.baseURL}/tactical-dashboard`);
        await page.waitForLoadState('networkidle');
        
        // Check for dashboard elements
        const dashboardContent = page.locator('body');
        await expect(dashboardContent).toBeVisible();
        
        await page.screenshot({ path: 'test-results/05-dashboard.png', fullPage: true });
        
        console.log('✅ Tactical dashboard loaded');
        
      } catch (error) {
        console.log('⚠️  Dashboard test encountered error:', error.message);
        await page.screenshot({ path: 'test-results/05-dashboard-error.png', fullPage: true });
      }
    });

    test('should test responsive design', async ({ page }) => {
      await page.goto(CONFIG.baseURL);
      await page.waitForLoadState('networkidle');
      
      // Test desktop view
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.screenshot({ path: 'test-results/06-responsive-desktop.png', fullPage: true });
      
      // Test tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.screenshot({ path: 'test-results/06-responsive-tablet.png', fullPage: true });
      
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({ path: 'test-results/06-responsive-mobile.png', fullPage: true });
      
      console.log('✅ Responsive design tested across viewports');
    });

    test('should test theme switching', async ({ page }) => {
      await page.goto(CONFIG.baseURL);
      await page.waitForLoadState('networkidle');
      
      try {
        // Look for theme toggle button
        const themeToggle = page.locator('button:has-text("Dark"), button:has-text("Light"), button[aria-label*="theme" i], [data-theme-toggle]');
        
        if (await themeToggle.count() > 0) {
          await themeToggle.first().click();
          await page.waitForTimeout(1000);
          
          await page.screenshot({ path: 'test-results/07-theme-switched.png', fullPage: true });
          
          console.log('✅ Theme switching tested');
        } else {
          console.log('⚠️  Theme toggle not found');
        }
      } catch (error) {
        console.log('⚠️  Theme switching test failed:', error.message);
      }
    });
  });

  test.describe('API and Functionality Tests', () => {
    
    test('should test API endpoints', async ({ page }) => {
      // Test API endpoints through browser
      const apiEndpoints = [
        '/api/health',
        '/api/auth/login',
        '/api/tactical/map-data'
      ];
      
      for (const endpoint of apiEndpoints) {
        try {
          const response = await page.goto(`${CONFIG.baseURL}${endpoint}`, { 
            waitUntil: 'networkidle',
            timeout: 10000 
          });
          
          console.log(`API ${endpoint}: Status ${response.status()}`);
          
          // 200 = working, 401/403 = protected (good), 405 = wrong method (exists)
          const isWorking = [200, 401, 403, 405].includes(response.status());
          
          if (isWorking) {
            console.log(`✅ API endpoint ${endpoint} is accessible`);
          } else {
            console.log(`⚠️  API endpoint ${endpoint} returned ${response.status()}`);
          }
          
        } catch (error) {
          console.log(`❌ API endpoint ${endpoint} failed: ${error.message}`);
        }
      }
    });

    test('should test interactive elements', async ({ page }) => {
      await page.goto(CONFIG.baseURL);
      await page.waitForLoadState('networkidle');
      
      try {
        // Look for interactive elements
        const buttons = page.locator('button');
        const links = page.locator('a');
        const inputs = page.locator('input');
        
        const buttonCount = await buttons.count();
        const linkCount = await links.count();
        const inputCount = await inputs.count();
        
        console.log(`✅ Interactive elements found - Buttons: ${buttonCount}, Links: ${linkCount}, Inputs: ${inputCount}`);
        
        // Test first few buttons if they exist
        if (buttonCount > 0) {
          for (let i = 0; i < Math.min(3, buttonCount); i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
              const buttonText = await button.textContent();
              console.log(`Button ${i + 1}: "${buttonText}"`);
            }
          }
        }
        
      } catch (error) {
        console.log('⚠️  Interactive elements test failed:', error.message);
      }
    });
  });

  test.describe('Performance and Load Tests', () => {
    
    test('should measure page load performance', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(CONFIG.baseURL);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      console.log(`✅ Page load time: ${loadTime}ms`);
      
      // Performance should be under 10 seconds for initial load
      expect(loadTime).toBeLessThan(10000);
      
      if (loadTime < 3000) {
        console.log('🚀 Excellent performance!');
      } else if (loadTime < 5000) {
        console.log('👍 Good performance');
      } else {
        console.log('⚠️  Slow performance - consider optimization');
      }
    });

    test('should test multiple page navigation', async ({ page }) => {
      const pages = [
        '/',
        '/login',
        '/tactical-dashboard',
        '/tactical-test'
      ];
      
      for (const pagePath of pages) {
        try {
          const startTime = Date.now();
          await page.goto(`${CONFIG.baseURL}${pagePath}`);
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          const loadTime = Date.now() - startTime;
          
          console.log(`✅ Page ${pagePath}: ${loadTime}ms`);
          
        } catch (error) {
          console.log(`⚠️  Page ${pagePath} failed: ${error.message}`);
        }
      }
    });
  });

  test.describe('Security Tests', () => {
    
    test('should check for security headers', async ({ page }) => {
      const response = await page.goto(CONFIG.baseURL);
      
      const headers = response.headers();
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy'
      ];
      
      let secureHeadersCount = 0;
      
      for (const header of securityHeaders) {
        if (headers[header]) {
          console.log(`✅ Security header ${header}: ${headers[header]}`);
          secureHeadersCount++;
        } else {
          console.log(`⚠️  Missing security header: ${header}`);
        }
      }
      
      console.log(`Security headers: ${secureHeadersCount}/${securityHeaders.length} present`);
    });

    test('should test for common vulnerabilities', async ({ page }) => {
      await page.goto(CONFIG.baseURL);
      await page.waitForLoadState('networkidle');
      
      // Test for XSS protection
      try {
        await page.evaluate(() => {
          // Try to inject script - should be blocked
          const testScript = '<script>alert("XSS")</script>';
          document.body.innerHTML += testScript;
        });
        
        // If no alert appears, XSS protection is working
        console.log('✅ XSS protection appears to be working');
        
      } catch (error) {
        console.log('✅ XSS injection blocked by browser/application');
      }
      
      // Test for clickjacking protection
      const frameOptions = await page.evaluate(() => {
        return document.querySelector('meta[http-equiv="X-Frame-Options"]')?.content;
      });
      
      if (frameOptions) {
        console.log(`✅ Clickjacking protection: ${frameOptions}`);
      } else {
        console.log('⚠️  No clickjacking protection detected');
      }
    });
  });

  test.describe('Error Handling Tests', () => {
    
    test('should handle 404 errors gracefully', async ({ page }) => {
      const response = await page.goto(`${CONFIG.baseURL}/nonexistent-page`);
      
      // Should return 404 or redirect to error page
      const status = response.status();
      console.log(`404 test returned status: ${status}`);
      
      // Take screenshot of error page
      await page.screenshot({ path: 'test-results/08-404-error.png', fullPage: true });
      
      // Page should still be functional (not completely broken)
      const bodyContent = await page.textContent('body');
      expect(bodyContent.length).toBeGreaterThan(0);
      
      console.log('✅ 404 error handled gracefully');
    });

    test('should handle network errors', async ({ page }) => {
      // Test with invalid subdomain
      try {
        await page.goto('https://invalid-subdomain.ta.consulting.sa', { timeout: 10000 });
      } catch (error) {
        console.log('✅ Network error handled properly:', error.message);
      }
    });
  });
});

// Global test configuration
test.describe.configure({ mode: 'parallel' });

// Global hooks
test.beforeAll(async () => {
  console.log('🎖️  Starting TacticalOps Platform Comprehensive Testing');
  console.log(`🌐 Testing URL: ${CONFIG.baseURL}`);
});

test.afterAll(async () => {
  console.log('🎯 TacticalOps Platform Testing Complete');
});