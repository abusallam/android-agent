const { test, expect } = require('@playwright/test');

test('TacticalOps - Basic functionality test', async ({ page }) => {
  console.log('🚀 Testing TacticalOps platform...');
  
  // Test 1: Homepage loads
  await page.goto('http://127.0.0.1:3020');
  console.log('✅ Homepage loaded');
  
  // Should redirect to login
  await expect(page).toHaveURL(/.*login.*/);
  console.log('✅ Redirected to login page');
  
  // Test 2: Login form exists
  await expect(page.locator('input[type="text"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  console.log('✅ Login form elements visible');
  
  // Test 3: Login functionality
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL(/.*(?<!login)$/, { timeout: 10000 });
  console.log('✅ Login successful');
  
  // Test 4: Dashboard loads
  await expect(page.locator('text=Security Dashboard')).toBeVisible();
  console.log('✅ Dashboard loaded');
  
  // Test 5: LiveKit streaming panel
  await expect(page.locator('text=Live Streaming & Communication')).toBeVisible();
  console.log('✅ LiveKit streaming panel visible');
  
  // Test 6: API health check
  const response = await page.request.get('http://127.0.0.1:3020/api/health');
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.status).toBe('healthy');
  console.log('✅ API health check passed');
  
  // Test 7: Admin panel access
  await page.click('text=Admin');
  await page.waitForURL(/.*admin.*/, { timeout: 10000 });
  await expect(page.locator('text=User Management')).toBeVisible();
  console.log('✅ Admin panel accessible');
  
  // Test 8: Streaming page access
  await page.goto('http://127.0.0.1:3020/streaming');
  await expect(page.locator('text=TacticalOps Streaming')).toBeVisible();
  console.log('✅ Streaming page accessible');
  
  console.log('🎉 All tests passed! Platform is fully functional.');
});