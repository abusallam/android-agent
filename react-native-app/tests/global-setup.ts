import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Tactical Mapping System E2E Tests');
  console.log('📱 Testing Expo Web Application');
  console.log('🗺️ Features: Mapping, Communication, Navigation, Tracking, Geofencing');
  
  // Launch browser to warm up the application
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the app and wait for it to load
    console.log('⏳ Warming up application...');
    await page.goto('http://localhost:19006', { waitUntil: 'networkidle' });
    
    // Wait for the main app to be ready
    await page.waitForSelector('[data-testid="tactical-app"]', { timeout: 30000 });
    console.log('✅ Application is ready for testing');
    
  } catch (error) {
    console.error('❌ Failed to warm up application:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;