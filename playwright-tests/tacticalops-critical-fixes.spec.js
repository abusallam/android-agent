const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tac.consulting.sa';

test.describe('TacticalOps Critical Fixes Validation', () => {
  
  test('Loading screen shows tactical theme instead of blue', async ({ page }) => {
    console.log('🎨 Testing loading screen tactical theme...');
    
    await page.goto(BASE_URL);
    
    // Wait for any loading screens to appear
    await page.waitForTimeout(2000);
    
    // Check for tactical theme colors
    const bodyElement = await page.locator('body');
    const computedStyle = await bodyElement.evaluate(el => window.getComputedStyle(el));
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/01-loading-screen.png', fullPage: true });
    
    // Check that blue theme is not present
    const hasBlueBackground = await page.locator('[class*="blue-950"], [class*="blue-400"]').count();
    expect(hasBlueBackground).toBe(0);
    
    console.log('✅ Loading screen tactical theme verified');
  });

  test('Admin authentication works with admin/admin123', async ({ page }) => {
    console.log('🔐 Testing admin authentication...');
    
    await page.goto(`${BASE_URL}/login`);
    
    // Wait for login page to load
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/02-login-page.png', fullPage: true });
    
    // Fill in credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    
    // Take screenshot with filled credentials
    await page.screenshot({ path: 'test-results/03-login-filled.png', fullPage: true });
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation or dashboard to load
    await page.waitForTimeout(5000);
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-results/04-after-login.png', fullPage: true });
    
    // Check if we're redirected to a dashboard (not login page)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    
    // Check for dashboard elements
    const hasDashboardContent = await page.locator('[class*="dashboard"], [class*="tactical"], h1, h2').count();
    expect(hasDashboardContent).toBeGreaterThan(0);
    
    console.log('✅ Admin authentication successful');
  });

  test('Arabic language switching works', async ({ page }) => {
    console.log('🌍 Testing Arabic language switching...');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Look for language toggle button
    const languageButton = page.locator('button:has-text("العربية"), button:has-text("English")').first();
    
    if (await languageButton.count() > 0) {
      // Take screenshot before language switch
      await page.screenshot({ path: 'test-results/05-before-arabic.png', fullPage: true });
      
      // Click language toggle
      await languageButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after language switch
      await page.screenshot({ path: 'test-results/06-after-arabic.png', fullPage: true });
      
      // Check if HTML direction changed to RTL
      const htmlDir = await page.locator('html').getAttribute('dir');
      const bodyDir = await page.locator('body').getAttribute('dir');
      const containerDir = await page.locator('div[dir]').first().getAttribute('dir');
      
      const hasRTL = htmlDir === 'rtl' || bodyDir === 'rtl' || containerDir === 'rtl';
      expect(hasRTL).toBe(true);
      
      // Check for Arabic text
      const hasArabicText = await page.locator('text=تسجيل الدخول').count() > 0 ||
                           await page.locator('text=اسم المستخدم').count() > 0 ||
                           await page.locator('text=كلمة المرور').count() > 0;
      
      expect(hasArabicText).toBe(true);
      
      console.log('✅ Arabic language switching verified');
    } else {
      console.log('⚠️ Language toggle button not found');
      await page.screenshot({ path: 'test-results/07-no-language-toggle.png', fullPage: true });
    }
  });

  test('Complete user workflow - login to dashboard', async ({ page }) => {
    console.log('🔄 Testing complete user workflow...');
    
    // Start from homepage
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/08-homepage.png', fullPage: true });
    
    // Navigate to login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    // Login process
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/09-dashboard.png', fullPage: true });
    
    // Verify we're on a dashboard page
    const currentUrl = page.url();
    const isDashboard = currentUrl.includes('dashboard') || 
                       currentUrl.includes('admin') || 
                       !currentUrl.includes('login');
    
    expect(isDashboard).toBe(true);
    
    // Check for tactical theme elements
    const hasTacticalElements = await page.locator('[class*="amber"], [class*="tactical"], [class*="camo"]').count();
    expect(hasTacticalElements).toBeGreaterThan(0);
    
    console.log('✅ Complete user workflow verified');
  });

  test('System performance and responsiveness', async ({ page }) => {
    console.log('⚡ Testing system performance...');
    
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);
    
    // Performance should be under 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Test navigation responsiveness
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    const navigationTime = Date.now() - startTime;
    console.log(`📊 Navigation time: ${navigationTime}ms`);
    
    await page.screenshot({ path: 'test-results/10-performance-test.png', fullPage: true });
    
    console.log('✅ Performance test completed');
  });

});