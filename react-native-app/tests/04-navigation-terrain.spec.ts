import { test, expect } from '@playwright/test';

test.describe('🧭 Navigation & Terrain Analysis', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await page.goto('/');
    await page.waitForSelector('[data-testid="tactical-app"]', { timeout: 30000 });
  });

  test('should display navigation controls', async ({ page }) => {
    // Check for navigation panel
    await expect(page.locator('[data-testid="navigation-panel"]')).toBeVisible();
    
    // Check for route planning button
    await expect(page.locator('[data-testid="plan-route"]')).toBeVisible();
    
    // Check for navigation mode selector
    await expect(page.locator('[data-testid="navigation-mode"]')).toBeVisible();
  });

  test('should support route planning', async ({ page }) => {
    // Open route planning
    await page.locator('[data-testid="plan-route"]').click();
    
    // Check for route planning interface
    await expect(page.locator('[data-testid="route-planner"]')).toBeVisible();
    
    // Check for start/end point inputs
    await expect(page.locator('[data-testid="start-point"]')).toBeVisible();
    await expect(page.locator('[data-testid="end-point"]')).toBeVisible();
    
    // Check for calculate route button
    await expect(page.locator('[data-testid="calculate-route"]')).toBeVisible();
  });

  test('should calculate walking route', async ({ page }) => {
    // Open route planning
    await page.locator('[data-testid="plan-route"]').click();
    
    // Select walking mode
    await page.locator('[data-testid="navigation-mode"]').selectOption('walking');
    
    // Set start point (click on map)
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      // Click to set start point
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
      await page.waitForTimeout(500);
      
      // Click to set end point
      await page.mouse.click(mapBounds.x + 400, mapBounds.y + 300);
      await page.waitForTimeout(500);
    }
    
    // Calculate route
    await page.locator('[data-testid="calculate-route"]').click();
    
    // Wait for route calculation
    await page.waitForTimeout(3000);
    
    // Verify route is displayed
    await expect(page.locator('[data-testid="route-line"]')).toBeVisible();
    
    // Check for route information
    await expect(page.locator('[data-testid="route-distance"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-duration"]')).toBeVisible();
  });

  test('should calculate driving route', async ({ page }) => {
    // Open route planning
    await page.locator('[data-testid="plan-route"]').click();
    
    // Select driving mode
    await page.locator('[data-testid="navigation-mode"]').selectOption('driving');
    
    // Set waypoints and calculate route
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 150, mapBounds.y + 150);
      await page.waitForTimeout(500);
      await page.mouse.click(mapBounds.x + 450, mapBounds.y + 350);
      await page.waitForTimeout(500);
    }
    
    await page.locator('[data-testid="calculate-route"]').click();
    await page.waitForTimeout(3000);
    
    // Verify driving route is different from walking
    await expect(page.locator('[data-testid="route-line"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-mode-indicator"]')).toContainText('driving');
  });

  test('should support tactical navigation mode', async ({ page }) => {
    // Open route planning
    await page.locator('[data-testid="plan-route"]').click();
    
    // Select tactical mode
    await page.locator('[data-testid="navigation-mode"]').selectOption('tactical');
    
    // Set waypoints
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 180, mapBounds.y + 180);
      await page.waitForTimeout(500);
      await page.mouse.click(mapBounds.x + 380, mapBounds.y + 280);
      await page.waitForTimeout(500);
    }
    
    await page.locator('[data-testid="calculate-route"]').click();
    await page.waitForTimeout(3000);
    
    // Verify tactical route considerations
    await expect(page.locator('[data-testid="route-line"]')).toBeVisible();
    await expect(page.locator('[data-testid="tactical-warnings"]')).toBeVisible();
  });

  test('should display elevation profile', async ({ page }) => {
    // Plan a route first
    await page.locator('[data-testid="plan-route"]').click();
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
      await page.waitForTimeout(500);
      await page.mouse.click(mapBounds.x + 400, mapBounds.y + 300);
      await page.waitForTimeout(500);
    }
    
    await page.locator('[data-testid="calculate-route"]').click();
    await page.waitForTimeout(3000);
    
    // Open elevation profile
    await page.locator('[data-testid="show-elevation"]').click();
    
    // Check for elevation profile display
    await expect(page.locator('[data-testid="elevation-profile"]')).toBeVisible();
    
    // Check for elevation statistics
    await expect(page.locator('[data-testid="elevation-gain"]')).toBeVisible();
    await expect(page.locator('[data-testid="elevation-loss"]')).toBeVisible();
    await expect(page.locator('[data-testid="max-elevation"]')).toBeVisible();
    await expect(page.locator('[data-testid="min-elevation"]')).toBeVisible();
  });

  test('should support waypoint management', async ({ page }) => {
    // Open route planning
    await page.locator('[data-testid="plan-route"]').click();
    
    // Add multiple waypoints
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      // Start point
      await page.mouse.click(mapBounds.x + 100, mapBounds.y + 100);
      await page.waitForTimeout(500);
      
      // Waypoint 1
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 150);
      await page.waitForTimeout(500);
      
      // Waypoint 2
      await page.mouse.click(mapBounds.x + 300, mapBounds.y + 200);
      await page.waitForTimeout(500);
      
      // End point
      await page.mouse.click(mapBounds.x + 400, mapBounds.y + 250);
      await page.waitForTimeout(500);
    }
    
    // Check waypoint list
    await expect(page.locator('[data-testid="waypoint-list"]')).toBeVisible();
    
    // Verify waypoints are listed
    const waypoints = page.locator('[data-testid="waypoint-item"]');
    await expect(waypoints).toHaveCount(4); // start + 2 waypoints + end
  });

  test('should support terrain analysis', async ({ page }) => {
    // Open terrain analysis tools
    await page.locator('[data-testid="terrain-analysis"]').click();
    
    // Check for terrain analysis options
    await expect(page.locator('[data-testid="terrain-tools"]')).toBeVisible();
    
    // Check for slope analysis
    await expect(page.locator('[data-testid="slope-analysis"]')).toBeVisible();
    
    // Check for viewshed analysis
    await expect(page.locator('[data-testid="viewshed-analysis"]')).toBeVisible();
    
    // Check for contour lines
    await expect(page.locator('[data-testid="contour-lines"]')).toBeVisible();
  });

  test('should perform slope analysis', async ({ page }) => {
    // Open terrain analysis
    await page.locator('[data-testid="terrain-analysis"]').click();
    
    // Select slope analysis
    await page.locator('[data-testid="slope-analysis"]').click();
    
    // Click on map to analyze slope
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
    }
    
    // Wait for analysis
    await page.waitForTimeout(2000);
    
    // Check for slope analysis results
    await expect(page.locator('[data-testid="slope-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="slope-degree"]')).toBeVisible();
    await expect(page.locator('[data-testid="slope-classification"]')).toBeVisible();
  });

  test('should perform viewshed analysis', async ({ page }) => {
    // Open terrain analysis
    await page.locator('[data-testid="terrain-analysis"]').click();
    
    // Select viewshed analysis
    await page.locator('[data-testid="viewshed-analysis"]').click();
    
    // Set observer point
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
    }
    
    // Set viewshed parameters
    await page.locator('[data-testid="viewshed-radius"]').fill('1000');
    await page.locator('[data-testid="observer-height"]').fill('2');
    
    // Calculate viewshed
    await page.locator('[data-testid="calculate-viewshed"]').click();
    
    // Wait for calculation
    await page.waitForTimeout(5000);
    
    // Check for viewshed visualization
    await expect(page.locator('[data-testid="viewshed-overlay"]')).toBeVisible();
    
    // Check for viewshed statistics
    await expect(page.locator('[data-testid="visible-area"]')).toBeVisible();
  });

  test('should display contour lines', async ({ page }) => {
    // Open terrain analysis
    await page.locator('[data-testid="terrain-analysis"]').click();
    
    // Enable contour lines
    await page.locator('[data-testid="contour-lines"]').click();
    
    // Set contour interval
    await page.locator('[data-testid="contour-interval"]').fill('10');
    
    // Generate contours
    await page.locator('[data-testid="generate-contours"]').click();
    
    // Wait for generation
    await page.waitForTimeout(3000);
    
    // Check for contour lines on map
    await expect(page.locator('[data-testid="contour-layer"]')).toBeVisible();
  });

  test('should support 3D terrain visualization', async ({ page }) => {
    // Open 3D view
    await page.locator('[data-testid="3d-view"]').click();
    
    // Wait for 3D rendering
    await page.waitForTimeout(3000);
    
    // Check for 3D controls
    await expect(page.locator('[data-testid="3d-controls"]')).toBeVisible();
    
    // Check for pitch/tilt controls
    await expect(page.locator('[data-testid="pitch-control"]')).toBeVisible();
    await expect(page.locator('[data-testid="bearing-control"]')).toBeVisible();
    
    // Test 3D navigation
    await page.locator('[data-testid="pitch-control"]').click();
    await page.waitForTimeout(1000);
    
    // Return to 2D view
    await page.locator('[data-testid="2d-view"]').click();
  });

  test('should save and load routes', async ({ page }) => {
    // Plan a route
    await page.locator('[data-testid="plan-route"]').click();
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
      await page.waitForTimeout(500);
      await page.mouse.click(mapBounds.x + 400, mapBounds.y + 300);
      await page.waitForTimeout(500);
    }
    
    await page.locator('[data-testid="calculate-route"]').click();
    await page.waitForTimeout(3000);
    
    // Save the route
    await page.locator('[data-testid="save-route"]').click();
    
    // Enter route name
    await page.locator('[data-testid="route-name"]').fill('Test Route');
    await page.locator('[data-testid="confirm-save"]').click();
    
    // Verify route is saved
    await expect(page.locator('[data-testid="route-saved"]')).toBeVisible();
    
    // Load saved routes
    await page.locator('[data-testid="load-route"]').click();
    
    // Check for saved route in list
    await expect(page.locator('[data-testid="saved-routes"]')).toContainText('Test Route');
  });

  test('should provide turn-by-turn navigation', async ({ page }) => {
    // Plan a route
    await page.locator('[data-testid="plan-route"]').click();
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
      await page.waitForTimeout(500);
      await page.mouse.click(mapBounds.x + 400, mapBounds.y + 300);
      await page.waitForTimeout(500);
    }
    
    await page.locator('[data-testid="calculate-route"]').click();
    await page.waitForTimeout(3000);
    
    // Start navigation
    await page.locator('[data-testid="start-navigation"]').click();
    
    // Check for navigation interface
    await expect(page.locator('[data-testid="navigation-active"]')).toBeVisible();
    
    // Check for turn instructions
    await expect(page.locator('[data-testid="next-instruction"]')).toBeVisible();
    
    // Check for distance remaining
    await expect(page.locator('[data-testid="distance-remaining"]')).toBeVisible();
    
    // Check for ETA
    await expect(page.locator('[data-testid="estimated-arrival"]')).toBeVisible();
  });
});