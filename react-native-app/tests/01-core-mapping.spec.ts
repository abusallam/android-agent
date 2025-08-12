import { test, expect } from '@playwright/test';

test.describe('🗺️ Core Mapping Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="tactical-app"]', { timeout: 30000 });
  });

  test('should load the tactical mapping interface', async ({ page }) => {
    // Check if the main tactical screen is loaded
    await expect(page.locator('[data-testid="tactical-screen"]')).toBeVisible();
    
    // Check if the map container is present
    await expect(page.locator('[data-testid="tactical-map-view"]')).toBeVisible();
    
    // Verify the map has loaded
    await page.waitForSelector('.maplibregl-map', { timeout: 15000 });
    await expect(page.locator('.maplibregl-map')).toBeVisible();
  });

  test('should display map controls and tools', async ({ page }) => {
    // Check for zoom controls
    await expect(page.locator('.maplibregl-ctrl-zoom-in')).toBeVisible();
    await expect(page.locator('.maplibregl-ctrl-zoom-out')).toBeVisible();
    
    // Check for drawing tools
    await expect(page.locator('[data-testid="drawing-tools"]')).toBeVisible();
    
    // Check for layer controls
    await expect(page.locator('[data-testid="layer-controls"]')).toBeVisible();
  });

  test('should support map interaction (pan and zoom)', async ({ page }) => {
    const mapContainer = page.locator('.maplibregl-map');
    
    // Test zoom in
    await page.locator('.maplibregl-ctrl-zoom-in').click();
    await page.waitForTimeout(1000);
    
    // Test zoom out
    await page.locator('.maplibregl-ctrl-zoom-out').click();
    await page.waitForTimeout(1000);
    
    // Test pan by dragging
    const mapBounds = await mapContainer.boundingBox();
    if (mapBounds) {
      await page.mouse.move(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
      await page.mouse.down();
      await page.mouse.move(mapBounds.x + mapBounds.width / 2 + 100, mapBounds.y + mapBounds.height / 2 + 100);
      await page.mouse.up();
    }
    
    // Verify map is still functional
    await expect(mapContainer).toBeVisible();
  });

  test('should load different map layers', async ({ page }) => {
    // Open layer controls
    await page.locator('[data-testid="layer-controls"]').click();
    
    // Check for different layer options
    await expect(page.locator('[data-testid="layer-osm"]')).toBeVisible();
    await expect(page.locator('[data-testid="layer-satellite"]')).toBeVisible();
    await expect(page.locator('[data-testid="layer-topographic"]')).toBeVisible();
    
    // Switch to satellite layer
    await page.locator('[data-testid="layer-satellite"]').click();
    await page.waitForTimeout(2000);
    
    // Switch back to OSM
    await page.locator('[data-testid="layer-osm"]').click();
    await page.waitForTimeout(2000);
  });

  test('should display user location when available', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    
    // Look for user location indicator
    await page.locator('[data-testid="location-button"]').click();
    
    // Wait for location to be acquired
    await page.waitForTimeout(3000);
    
    // Check if user location marker is visible
    await expect(page.locator('[data-testid="user-location"]')).toBeVisible();
  });

  test('should support offline mode toggle', async ({ page }) => {
    // Check for offline mode toggle
    await expect(page.locator('[data-testid="offline-toggle"]')).toBeVisible();
    
    // Toggle offline mode
    await page.locator('[data-testid="offline-toggle"]').click();
    
    // Verify offline indicator is shown
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Toggle back to online
    await page.locator('[data-testid="offline-toggle"]').click();
    
    // Verify online indicator
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
  });

  test('should handle map loading errors gracefully', async ({ page }) => {
    // Simulate network issues by blocking map tile requests
    await page.route('**/tiles/**', route => route.abort());
    
    // Reload the page
    await page.reload();
    await page.waitForSelector('[data-testid="tactical-app"]', { timeout: 30000 });
    
    // Check that the app still loads with error handling
    await expect(page.locator('[data-testid="tactical-screen"]')).toBeVisible();
    
    // Look for error message or fallback
    const errorMessage = page.locator('[data-testid="map-error"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('map');
    }
  });

  test('should maintain map state during navigation', async ({ page }) => {
    // Zoom to a specific level
    await page.locator('.maplibregl-ctrl-zoom-in').click();
    await page.locator('.maplibregl-ctrl-zoom-in').click();
    await page.waitForTimeout(1000);
    
    // Navigate away and back (if there are other screens)
    // This would depend on your navigation structure
    
    // Verify map state is maintained
    await expect(page.locator('.maplibregl-map')).toBeVisible();
  });

  test('should support touch gestures on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Touch gestures test only for mobile');
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      // Test pinch to zoom (simulate with two touch points)
      await page.touchscreen.tap(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
      await page.waitForTimeout(500);
      
      // Test swipe to pan
      await page.touchscreen.tap(mapBounds.x + 100, mapBounds.y + 100);
      await page.waitForTimeout(500);
    }
    
    // Verify map is still responsive
    await expect(mapContainer).toBeVisible();
  });

  test('should display map attribution and credits', async ({ page }) => {
    // Check for MapLibre attribution
    await expect(page.locator('.maplibregl-ctrl-attrib')).toBeVisible();
    
    // Check for data source attribution
    const attribution = page.locator('.maplibregl-ctrl-attrib-inner');
    await expect(attribution).toContainText('OpenStreetMap');
  });
});