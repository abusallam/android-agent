const { chromium } = require('playwright');

async function testTacticalFixes() {
  console.log('🧪 Testing TacticalOps Fixes...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test 1: Check tactical theme on login page
    console.log('🎯 Test 1: Tactical Theme on Login Page');
    await page.goto('https://tacticalops.ta.consulting.sa/login');
    await page.waitForTimeout(3000);
    
    // Check for tactical camo background
    const hasDesertCamo = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return computedStyle.backgroundImage.includes('radial-gradient');
    });
    
    console.log(hasDesertCamo ? '✅ Tactical camo background detected' : '❌ No tactical camo background');
    
    // Test 2: Check Arabic/English toggle
    console.log('\n🌐 Test 2: Language Toggle');
    const languageButton = await page.locator('button:has-text("العربية")').first();
    if (await languageButton.isVisible()) {
      console.log('✅ Arabic language toggle found');
      await languageButton.click();
      await page.waitForTimeout(1000);
      
      // Check if page switched to Arabic (RTL)
      const isRTL = await page.evaluate(() => {
        return document.documentElement.getAttribute('dir') === 'rtl' || 
               document.body.getAttribute('dir') === 'rtl';
      });
      console.log(isRTL ? '✅ RTL layout activated' : '❌ RTL layout not detected');
      
      // Switch back to English
      await page.locator('button:has-text("English")').first().click();
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ Language toggle not found');
    }
    
    // Test 3: Check for sign up and forgot password links
    console.log('\n🔐 Test 3: Authentication Links');
    const signUpLink = await page.locator('text=Create Account').first();
    const forgotPasswordLink = await page.locator('text=Forgot Password').first();
    
    console.log(await signUpLink.isVisible() ? '✅ Sign up link found' : '❌ Sign up link missing');
    console.log(await forgotPasswordLink.isVisible() ? '✅ Forgot password link found' : '❌ Forgot password link missing');
    
    // Test 4: Check that demo credentials are NOT visible on main login
    console.log('\n🚫 Test 4: No Demo Credentials on Front Screen');
    const demoCredentials = await page.locator('text=Demo Credentials').first();
    const isVisible = await demoCredentials.isVisible().catch(() => false);
    console.log(!isVisible ? '✅ Demo credentials properly hidden' : '❌ Demo credentials still visible');
    
    // Test 5: Test login functionality
    console.log('\n🔑 Test 5: Login Functionality');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for either dashboard or error
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Check for error message
      const errorMessage = await page.locator('.text-red-300, .text-red-400').first().textContent().catch(() => null);
      console.log(`❌ Login failed: ${errorMessage || 'Unknown error'}`);
    } else {
      console.log('✅ Login successful - redirected to dashboard');
      
      // Test 6: Check tactical dashboard theme
      console.log('\n🎯 Test 6: Tactical Dashboard Theme');
      await page.waitForTimeout(3000);
      
      // Check for tactical elements
      const tacticalTitle = await page.locator('text=TacticalOps Command').first().isVisible().catch(() => false);
      const tacticalColors = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="amber"], [class*="text-amber"]');
        return elements.length > 0;
      });
      
      console.log(tacticalTitle ? '✅ TacticalOps Command title found' : '❌ Tactical title missing');
      console.log(tacticalColors ? '✅ Tactical amber colors detected' : '❌ Tactical colors missing');
      
      // Test 7: Check for tactical map and streaming features
      console.log('\n🗺️ Test 7: Tactical Features');
      const tacticalMap = await page.locator('text=Tactical Map').first().isVisible().catch(() => false);
      const streamingPanel = await page.locator('text=Live Streaming').first().isVisible().catch(() => false);
      const emergencyButton = await page.locator('text=EMERGENCY').first().isVisible().catch(() => false);
      
      console.log(tacticalMap ? '✅ Tactical map found' : '❌ Tactical map missing');
      console.log(streamingPanel ? '✅ Streaming panel found' : '❌ Streaming panel missing');
      console.log(emergencyButton ? '✅ Emergency button found' : '❌ Emergency button missing');
      
      // Test 8: Check admin panel access
      console.log('\n👤 Test 8: Admin Panel Access');
      const adminButton = await page.locator('text=Admin Panel').first();
      if (await adminButton.isVisible()) {
        console.log('✅ Admin panel button found');
        await adminButton.click();
        await page.waitForTimeout(3000);
        
        const adminUrl = page.url();
        console.log(adminUrl.includes('/admin') ? '✅ Admin panel accessible' : '❌ Admin panel not accessible');
      } else {
        console.log('❌ Admin panel button not found');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 Testing Complete!');
}

// Run the tests
testTacticalFixes().catch(console.error);