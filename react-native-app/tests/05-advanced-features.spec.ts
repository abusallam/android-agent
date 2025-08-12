import { test, expect } from '@playwright/test';

test.describe('🎯 Advanced Features - Tracking & Geofencing', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await page.goto('/');
    await page.waitForSelector('[data-testid="tactical-app"]', { timeout: 30000 });
    
    // Create a session for advanced features
    await page.locator('[data-testid="create-session"]').click();
    await page.locator('[data-testid="session-name-input"]').fill('Advanced Features Test');
    await page.locator('[data-testid="create-session-confirm"]').click();
  });

  test('should display target tracking interface', async ({ page }) => {
    // Open target tracking panel
    await page.locator('[data-testid="target-tracking"]').click();
    
    // Check for tracking controls
    await expect(page.locator('[data-testid="tracking-panel"]')).toBeVisible();
    
    // Check for add target button
    await expect(page.locator('[data-testid="add-target"]')).toBeVisible();
    
    // Check for target list
    await expect(page.locator('[data-testid="target-list"]')).toBeVisible();
  });

  test('should add a new target', async ({ page }) => {
    // Open target tracking
    await page.locator('[data-testid="target-tracking"]').click();
    
    // Click add target
    await page.locator('[data-testid="add-target"]').click();
    
    // Fill target details
    await page.locator('[data-testid="target-name"]').fill('Test Target');
    await page.locator('[data-testid="target-type"]').selectOption('person');
    await page.locator('[data-testid="target-classification"]').selectOption('friendly');
    await page.locator('[data-testid="target-priority"]').selectOption('medium');
    
    // Set target position by clicking on map
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
    }
    
    // Save target
    await page.locator('[data-testid="save-target"]').click();
    
    // Verify target is added
    await expect(page.locator('[data-testid="target-list"]')).toContainText('Test Target');
    
    // Verify target marker on map
    await expect(page.locator('[data-testid="target-marker"]')).toBeVisible();
  });

  test('should update target position', async ({ page }) => {
    // Add a target first
    await page.locator('[data-testid="target-tracking"]').click();
    await page.locator('[data-testid="add-target"]').click();
    await page.locator('[data-testid="target-name"]').fill('Moving Target');
    await page.locator('[data-testid="target-type"]').selectOption('vehicle');
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
    }
    
    await page.locator('[data-testid="save-target"]').click();
    
    // Select the target
    await page.locator('[data-testid="target-item"]').first().click();
    
    // Update position
    await page.locator('[data-testid="update-position"]').click();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 300, mapBounds.y + 250);
    }
    
    // Confirm update
    await page.locator('[data-testid="confirm-update"]').click();
    
    // Verify position is updated
    await expect(page.locator('[data-testid="target-marker"]')).toBeVisible();
  });

  test('should display target analytics', async ({ page }) => {
    // Add a target with some movement history
    await page.locator('[data-testid="target-tracking"]').click();
    await page.locator('[data-testid="add-target"]').click();
    await page.locator('[data-testid="target-name"]').fill('Analytics Target');
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
    }
    
    await page.locator('[data-testid="save-target"]').click();
    
    // Select target and view analytics
    await page.locator('[data-testid="target-item"]').first().click();
    await page.locator('[data-testid="view-analytics"]').click();
    
    // Check for analytics panel
    await expect(page.locator('[data-testid="target-analytics"]')).toBeVisible();
    
    // Check for analytics data
    await expect(page.locator('[data-testid="total-distance"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-speed"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-active"]')).toBeVisible();
  });

  test('should predict target movement', async ({ page }) => {
    // Add a target
    await page.locator('[data-testid="target-tracking"]').click();
    await page.locator('[data-testid="add-target"]').click();
    await page.locator('[data-testid="target-name"]').fill('Predictive Target');
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
    }
    
    await page.locator('[data-testid="save-target"]').click();
    
    // Select target and enable prediction
    await page.locator('[data-testid="target-item"]').first().click();
    await page.locator('[data-testid="predict-movement"]').click();
    
    // Set prediction parameters
    await page.locator('[data-testid="prediction-time"]').fill('3600'); // 1 hour
    await page.locator('[data-testid="calculate-prediction"]').click();
    
    // Wait for prediction calculation
    await page.waitForTimeout(2000);
    
    // Check for prediction visualization
    await expect(page.locator('[data-testid="prediction-path"]')).toBeVisible();
    await expect(page.locator('[data-testid="prediction-confidence"]')).toBeVisible();
  });

  test('should display geofencing interface', async ({ page }) => {
    // Open geofencing panel
    await page.locator('[data-testid="geofencing"]').click();
    
    // Check for geofencing controls
    await expect(page.locator('[data-testid="geofencing-panel"]')).toBeVisible();
    
    // Check for create geofence button
    await expect(page.locator('[data-testid="create-geofence"]')).toBeVisible();
    
    // Check for geofence list
    await expect(page.locator('[data-testid="geofence-list"]')).toBeVisible();
  });

  test('should create a circular geofence', async ({ page }) => {
    // Open geofencing
    await page.locator('[data-testid="geofencing"]').click();
    
    // Click create geofence
    await page.locator('[data-testid="create-geofence"]').click();
    
    // Select circular geofence
    await page.locator('[data-testid="geofence-type"]').selectOption('circle');
    
    // Fill geofence details
    await page.locator('[data-testid="geofence-name"]').fill('Test Circle');
    await page.locator('[data-testid="geofence-radius"]').fill('500');
    
    // Set center point by clicking on map
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
    }
    
    // Configure alerts
    await page.locator('[data-testid="alert-entry"]').check();
    await page.locator('[data-testid="alert-exit"]').check();
    
    // Save geofence
    await page.locator('[data-testid="save-geofence"]').click();
    
    // Verify geofence is created
    await expect(page.locator('[data-testid="geofence-list"]')).toContainText('Test Circle');
    
    // Verify geofence visualization on map
    await expect(page.locator('[data-testid="geofence-circle"]')).toBeVisible();
  });

  test('should create a polygon geofence', async ({ page }) => {
    // Open geofencing
    await page.locator('[data-testid="geofencing"]').click();
    
    // Click create geofence
    await page.locator('[data-testid="create-geofence"]').click();
    
    // Select polygon geofence
    await page.locator('[data-testid="geofence-type"]').selectOption('polygon');
    
    // Fill geofence details
    await page.locator('[data-testid="geofence-name"]').fill('Test Polygon');
    
    // Draw polygon by clicking multiple points
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      // Draw triangle
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
      await page.waitForTimeout(500);
      await page.mouse.click(mapBounds.x + 300, mapBounds.y + 200);
      await page.waitForTimeout(500);
      await page.mouse.click(mapBounds.x + 250, mapBounds.y + 300);
      await page.waitForTimeout(500);
      // Close polygon
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
    }
    
    // Save geofence
    await page.locator('[data-testid="save-geofence"]').click();
    
    // Verify geofence is created
    await expect(page.locator('[data-testid="geofence-list"]')).toContainText('Test Polygon');
    await expect(page.locator('[data-testid="geofence-polygon"]')).toBeVisible();
  });

  test('should trigger geofence alerts', async ({ page }) => {
    // Create a geofence first
    await page.locator('[data-testid="geofencing"]').click();
    await page.locator('[data-testid="create-geofence"]').click();
    await page.locator('[data-testid="geofence-type"]').selectOption('circle');
    await page.locator('[data-testid="geofence-name"]').fill('Alert Test');
    await page.locator('[data-testid="geofence-radius"]').fill('200');
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 300, mapBounds.y + 300);
    }
    
    await page.locator('[data-testid="alert-entry"]').check();
    await page.locator('[data-testid="save-geofence"]').click();
    
    // Add a target outside the geofence
    await page.locator('[data-testid="target-tracking"]').click();
    await page.locator('[data-testid="add-target"]').click();
    await page.locator('[data-testid="target-name"]').fill('Alert Target');
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 100, mapBounds.y + 100);
    }
    
    await page.locator('[data-testid="save-target"]').click();
    
    // Move target into geofence
    await page.locator('[data-testid="target-item"]').first().click();
    await page.locator('[data-testid="update-position"]').click();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 300, mapBounds.y + 300);
    }
    
    await page.locator('[data-testid="confirm-update"]').click();
    
    // Check for alert notification
    await expect(page.locator('[data-testid="geofence-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="alert-message"]')).toContainText('entry');
  });

  test('should display geofence analytics', async ({ page }) => {
    // Create a geofence
    await page.locator('[data-testid="geofencing"]').click();
    await page.locator('[data-testid="create-geofence"]').click();
    await page.locator('[data-testid="geofence-name"]').fill('Analytics Geofence');
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 250, mapBounds.y + 250);
    }
    
    await page.locator('[data-testid="save-geofence"]').click();
    
    // Select geofence and view analytics
    await page.locator('[data-testid="geofence-item"]').first().click();
    await page.locator('[data-testid="view-geofence-analytics"]').click();
    
    // Check for analytics panel
    await expect(page.locator('[data-testid="geofence-analytics"]')).toBeVisible();
    
    // Check for analytics data
    await expect(page.locator('[data-testid="total-events"]')).toBeVisible();
    await expect(page.locator('[data-testid="entry-events"]')).toBeVisible();
    await expect(page.locator('[data-testid="exit-events"]')).toBeVisible();
  });

  test('should support proximity alerts', async ({ page }) => {
    // Add two targets
    await page.locator('[data-testid="target-tracking"]').click();
    
    // First target
    await page.locator('[data-testid="add-target"]').click();
    await page.locator('[data-testid="target-name"]').fill('Target A');
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 200, mapBounds.y + 200);
    }
    
    await page.locator('[data-testid="save-target"]').click();
    
    // Second target
    await page.locator('[data-testid="add-target"]').click();
    await page.locator('[data-testid="target-name"]').fill('Target B');
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 400, mapBounds.y + 400);
    }
    
    await page.locator('[data-testid="save-target"]').click();
    
    // Set up proximity alert
    await page.locator('[data-testid="proximity-alerts"]').click();
    await page.locator('[data-testid="create-proximity-alert"]').click();
    
    // Select targets
    await page.locator('[data-testid="target-1"]').selectOption('Target A');
    await page.locator('[data-testid="target-2"]').selectOption('Target B');
    await page.locator('[data-testid="alert-distance"]').fill('100');
    
    await page.locator('[data-testid="save-proximity-alert"]').click();
    
    // Move targets closer
    await page.locator('[data-testid="target-item"]').last().click();
    await page.locator('[data-testid="update-position"]').click();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 220, mapBounds.y + 220);
    }
    
    await page.locator('[data-testid="confirm-update"]').click();
    
    // Check for proximity alert
    await expect(page.locator('[data-testid="proximity-alert"]')).toBeVisible();
  });

  test('should support offline mode for tracking', async ({ page }) => {
    // Add a target
    await page.locator('[data-testid="target-tracking"]').click();
    await page.locator('[data-testid="add-target"]').click();
    await page.locator('[data-testid="target-name"]').fill('Offline Target');
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 250, mapBounds.y + 250);
    }
    
    await page.locator('[data-testid="save-target"]').click();
    
    // Go offline
    await page.setOfflineMode(true);
    await page.waitForTimeout(1000);
    
    // Try to update target position offline
    await page.locator('[data-testid="target-item"]').first().click();
    await page.locator('[data-testid="update-position"]').click();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 300, mapBounds.y + 300);
    }
    
    await page.locator('[data-testid="confirm-update"]').click();
    
    // Check for offline queue indicator
    await expect(page.locator('[data-testid="offline-queue"]')).toBeVisible();
    
    // Go back online
    await page.setOfflineMode(false);
    await page.waitForTimeout(2000);
    
    // Check for sync completion
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();
  });

  test('should export tracking data', async ({ page }) => {
    // Add some targets and data
    await page.locator('[data-testid="target-tracking"]').click();
    await page.locator('[data-testid="add-target"]').click();
    await page.locator('[data-testid="target-name"]').fill('Export Target');
    
    const mapContainer = page.locator('.maplibregl-map');
    const mapBounds = await mapContainer.boundingBox();
    
    if (mapBounds) {
      await page.mouse.click(mapBounds.x + 250, mapBounds.y + 250);
    }
    
    await page.locator('[data-testid="save-target"]').click();
    
    // Open export options
    await page.locator('[data-testid="export-data"]').click();
    
    // Check for export formats
    await expect(page.locator('[data-testid="export-kml"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-gpx"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-geojson"]')).toBeVisible();
    
    // Export as KML
    await page.locator('[data-testid="export-kml"]').click();
    
    // Wait for download to start
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="confirm-export"]').click();
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.kml');
  });
});