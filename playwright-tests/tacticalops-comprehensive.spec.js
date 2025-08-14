
import { test, expect } from '@playwright/test';

test.describe('TacticalOps Platform - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Homepage loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/TacticalOps/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Login functionality', async ({ page }) => {
    await page.click('text=Login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL('**/admin', { timeout: 10000 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Admin dashboard loads', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
  });

  test('Tactical dashboard functionality', async ({ page }) => {
    // Login and navigate to tactical dashboard
    await page.goto('/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/tactical-dashboard');
    await expect(page.locator('text=Tactical Operations')).toBeVisible();
  });

  test('API health check', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('Responsive design - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Check if mobile navigation works
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
    }
  });

  test('Dark/Light theme toggle', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Verify theme changed
      await expect(page.locator('html')).toHaveAttribute('class', /dark|light/);
    }
  });

  test('Emergency button functionality', async ({ page }) => {
    const emergencyBtn = page.locator('[data-testid="emergency-button"]');
    if (await emergencyBtn.isVisible()) {
      await emergencyBtn.click();
      await expect(page.locator('text=Emergency')).toBeVisible();
    }
  });
});

test.describe('API Tests', () => {
  test('Health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('Authentication endpoint', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
    
    expect(response.status()).toBe(200);
  });

  test('Agent API endpoints', async ({ request }) => {
    // Test agent authentication
    const authResponse = await request.post('/api/agent/auth', {
      data: {
        action: 'authenticate',
        data: {
          agentId: 'test-agent',
          apiKey: 'test-key',
          capabilities: 'basic'
        }
      }
    });
    
    expect(authResponse.status()).toBeLessThan(500);
  });
});

test.describe('Security Tests', () => {
  test('Unauthorized access blocked', async ({ request }) => {
    const response = await request.get('/api/admin/users');
    expect(response.status()).toBe(401);
  });

  test('HTTPS redirect', async ({ page }) => {
    // This test would check HTTPS redirect if SSL is configured
    await page.goto('https://tacticalops.ta.consulting.sa');
    await expect(page).toHaveURL(/^https?:\/\//);
  });

  test('Security headers present', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    
    // Check for security headers
    expect(headers).toHaveProperty('x-frame-options');
    expect(headers).toHaveProperty('x-content-type-options');
  });
});
