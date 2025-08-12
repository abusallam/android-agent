import { test, expect } from '@playwright/test';

test.describe('🤝 Real-time Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="tactical-app"]', { timeout: 30000 });
  });

  test('should display collaboration session controls', async ({ page }) => {
    // Check for session management controls
    await expect(page.locator('[data-testid="session-controls"]')).toBeVisible();
    
    // Check for create session button
    await expect(page.locator('[data-testid="create-session"]')).toBeVisible();
    
    // Check for join session button
    await expect(page.locator('[data-testid="join-session"]')).toBeVisible();
  });

  test('should create a new collaboration session', async ({ page }) => {
    // Click create session
    await page.locator('[data-testid="create-session"]').click();
    
    // Fill in session details
    await page.locator('[data-testid="session-name-input"]').fill('Test Tactical Session');
    await page.locator('[data-testid="session-description-input"]').fill('E2E Test Session');
    
    // Create the session
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Verify session is created
    await expect(page.locator('[data-testid="active-session"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-name"]')).toContainText('Test Tactical Session');
  });

  test('should display drawing tools for collaboration', async ({ page }) => {
    // Create a session first
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Drawing Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Check for drawing tools
    await expect(page.locator('[data-testid="drawing-tools"]')).toBeVisible();
    
    // Check for specific tools
    await expect(page.locator('[data-testid="tool-point"]')).toBeVisible();
    await expect(page.locator('[data-testid="tool-line"]')).toBeVisible();
    await expect(page.locator('[data-testid="tool-polygon"]')).toBeVisible();
    await expect(page.locator('[data-testid="tool-circle"]')).toBeVisible();
    await expect(page.locator('[data-testid="tool-rectangle"]')).toBeVisible();
  });

  test('should allow drawing points on the map', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Point Drawing Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Select point tool
    await page.locator('[data-testid="tool-point"]').click();
    
    // Click on the map to draw a point
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
    }
    
    // Verify point is drawn
    await expect(page.locator('[data-testid="map-feature"]')).toBeVisible();
  });

  test('should allow drawing lines on the map', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Line Drawing Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Select line tool
    await page.locator('[data-testid="tool-line"]').click();
    
    // Draw a line with multiple points
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      // First point
      await page.mouse.click(mapBounds.x + 100, mapBounds.y + 100);
      await page.waitForTimeout(500);
      
      // Second point
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 150);
      await page.waitForTimeout(500);
      
      // Third point
      await page.mouse.click(mapBounds.x + 300, mapBounds.y + 100);
      await page.waitForTimeout(500);
      
      // Finish line (double-click or press Enter)
      await page.keyboard.press('Enter');
    }
    
    // Verify line is drawn
    await expect(page.locator('[data-testid="map-feature"]')).toBeVisible();
  });

  test('should allow drawing polygons on the map', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Polygon Drawing Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Select polygon tool
    await page.locator('[data-testid="tool-polygon"]').click();
    
    // Draw a polygon
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      // Draw triangle
      await page.mouse.click(mapBounds.x + 150, mapBounds.y + 100);
      await page.waitForTimeout(500);
      
      await page.mouse.click(mapBounds.x + 250, mapBounds.y + 100);
      await page.waitForTimeout(500);
      
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
      await page.waitForTimeout(500);
      
      // Close polygon
      await page.mouse.click(mapBounds.x + 150, mapBounds.y + 100);
    }
    
    // Verify polygon is drawn
    await expect(page.locator('[data-testid="map-feature"]')).toBeVisible();
  });

  test('should display color picker for drawing tools', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Color Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Check for color picker
    await expect(page.locator('[data-testid="color-picker"]')).toBeVisible();
    
    // Check for predefined colors
    await expect(page.locator('[data-testid="color-red"]')).toBeVisible();
    await expect(page.locator('[data-testid="color-blue"]')).toBeVisible();
    await expect(page.locator('[data-testid="color-green"]')).toBeVisible();
    await expect(page.locator('[data-testid="color-yellow"]')).toBeVisible();
    await expect(page.locator('[data-testid="color-purple"]')).toBeVisible();
    await expect(page.locator('[data-testid="color-orange"]')).toBeVisible();
  });

  test('should allow changing drawing colors', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Color Change Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Select a color
    await page.locator('[data-testid="color-red"]').click();
    
    // Select point tool
    await page.locator('[data-testid="tool-point"]').click();
    
    // Draw a point
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
    }
    
    // Change color and draw another point
    await page.locator('[data-testid="color-blue"]').click();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2 + 50, mapBounds.y + mapBounds.height / 2 + 50);
    }
    
    // Verify both points are drawn
    const features = page.locator('[data-testid="map-feature"]');
    await expect(features).toHaveCount(2);
  });

  test('should display icon picker for annotations', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Icon Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Check for icon picker
    await expect(page.locator('[data-testid="icon-picker"]')).toBeVisible();
    
    // Check for predefined icons
    await expect(page.locator('[data-testid="icon-location"]')).toBeVisible();
    await expect(page.locator('[data-testid="icon-flag"]')).toBeVisible();
    await expect(page.locator('[data-testid="icon-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="icon-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="icon-star"]')).toBeVisible();
    await expect(page.locator('[data-testid="icon-heart"]')).toBeVisible();
  });

  test('should allow adding annotations to features', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Annotation Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Select point tool and draw a point
    await page.locator('[data-testid="tool-point"]').click();
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
    }
    
    // Click on the drawn point to open annotation dialog
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
    }
    
    // Check if annotation dialog opens
    await expect(page.locator('[data-testid="annotation-dialog"]')).toBeVisible();
    
    // Fill in annotation details
    await page.locator('[data-testid="annotation-title"]').fill('Test Point');
    await page.locator('[data-testid="annotation-description"]').fill('This is a test annotation');
    
    // Save annotation
    await page.locator('[data-testid="save-annotation"]').click();
    
    // Verify annotation is saved
    await expect(page.locator('[data-testid="annotation-dialog"]')).not.toBeVisible();
  });

  test('should display session participants', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Participants Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Check for participants panel
    await expect(page.locator('[data-testid="participants-panel"]')).toBeVisible();
    
    // Check for current user in participants
    await expect(page.locator('[data-testid="participant-self"]')).toBeVisible();
  });

  test('should handle session disconnection gracefully', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Disconnect Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Simulate network disconnection
    await page.setOfflineMode(true);
    await page.waitForTimeout(2000);
    
    // Check for offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Reconnect
    await page.setOfflineMode(false);
    await page.waitForTimeout(2000);
    
    // Check for reconnection
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
  });

  test('should allow leaving a session', async ({ page }) => {
    // Create a session
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Leave Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
    
    // Leave the session
    await page.locator('[data-testid="leave-session"]').click();
    
    // Confirm leaving
    await page.locator('[data-testid="confirm-leave"]').click();
    
    // Verify session is left
    await expect(page.locator('[data-testid="active-session"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="create-session"]')).toBeVisible();
  });
});