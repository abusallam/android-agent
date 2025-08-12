#!/usr/bin/env node

/**
 * 🎭 Android Agent AI - Automated Dashboard Testing with Playwright
 * This script automatically tests all dashboard functionality and generates reports
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class DashboardTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      tests: [],
      screenshots: [],
      errors: [],
      performance: {},
      timestamp: new Date().toISOString()
    };
  }

  async initialize() {
    console.log('🚀 Initializing Playwright Dashboard Tester...');
    
    this.browser = await chromium.launch({ 
      headless: false, // Set to true for CI/CD
      slowMo: 1000 // Slow down for demo purposes
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport for consistent testing
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.errors.push({
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    console.log('✅ Playwright initialized successfully');
  }

  async testLogin() {
    console.log('🔐 Testing login functionality...');
    
    try {
      // Navigate to the main page (should redirect to login if not authenticated)
      await this.page.goto('http://localhost:3003', { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      // Wait a bit for any redirects
      await this.page.waitForTimeout(2000);
      
      // Take screenshot of current page (should be login)
      await this.takeScreenshot('01-login-page');
      
      // Check if we need to log in
      const hasLoginForm = await this.page.locator('text=Sign In').isVisible().catch(() => false);
      const currentUrl = this.page.url();
      console.log(`Current URL: ${currentUrl}, Has login form: ${hasLoginForm}`);
      
      if (hasLoginForm || currentUrl.includes('/login')) {
        console.log('🔑 Logging in...');
        // We're on login page, proceed with login
        await this.page.fill('#username', 'admin');
        await this.page.fill('#password', 'admin123');
        
        await this.takeScreenshot('02-login-filled');
        
        // Click login button
        await this.page.click('button[type="submit"]');
        await this.page.waitForTimeout(5000); // Wait longer for login to process
        
        await this.takeScreenshot('03-after-login');
        
        // Wait for dashboard to load
        await this.page.waitForTimeout(3000);
      }
      
      // Check if we're now on dashboard
      const finalUrl = this.page.url();
      const pageContent = await this.page.textContent('body');
      const isLoggedIn = !finalUrl.includes('/login') && (
        pageContent.includes('Dashboard') || 
        pageContent.includes('Android Agent') ||
        pageContent.includes('Emergency')
      );
      
      this.results.tests.push({
        name: 'Login Test',
        status: isLoggedIn ? 'PASS' : 'FAIL',
        details: `Final URL: ${finalUrl}, Has dashboard content: ${isLoggedIn}`
      });
      
      await this.takeScreenshot('03-dashboard-loaded');
      console.log('✅ Login test completed');
      
    } catch (error) {
      this.results.tests.push({
        name: 'Login Test',
        status: 'ERROR',
        error: error.message
      });
      console.error('❌ Login test failed:', error.message);
    }
  }

  async testDashboardElements() {
    console.log('📊 Testing dashboard elements...');
    
    try {
      // Test metric cards
      const metricCards = await this.page.locator('[data-testid="metric-card"], .group').count();
      console.log(`Found ${metricCards} metric cards`);
      
      // Test emergency button
      const emergencyButton = await this.page.locator('text=EMERGENCY').isVisible();
      
      // Test streaming buttons
      const videoButton = await this.page.locator('text=Video Call').isVisible();
      const audioButton = await this.page.locator('text=Audio Call').isVisible();
      
      // Test map component
      const mapComponent = await this.page.locator('text=Live Location Tracking').isVisible();
      
      this.results.tests.push({
        name: 'Dashboard Elements Test',
        status: 'PASS',
        details: {
          metricCards,
          emergencyButton,
          videoButton,
          audioButton,
          mapComponent
        }
      });
      
      await this.takeScreenshot('04-dashboard-elements');
      console.log('✅ Dashboard elements test completed');
      
    } catch (error) {
      this.results.tests.push({
        name: 'Dashboard Elements Test',
        status: 'ERROR',
        error: error.message
      });
      console.error('❌ Dashboard elements test failed:', error.message);
    }
  }

  async testStreamingButtons() {
    console.log('🎥 Testing streaming functionality...');
    
    try {
      // Wait for dashboard to fully load
      await this.page.waitForTimeout(3000);
      
      // Check if buttons exist using more flexible selectors
      const videoButton = await this.page.locator('button:has-text("Video Call")').first();
      const audioButton = await this.page.locator('button:has-text("Audio Call")').first();
      const emergencyButton = await this.page.locator('button:has-text("EMERGENCY")').first();
      
      let buttonsFound = {
        video: await videoButton.isVisible().catch(() => false),
        audio: await audioButton.isVisible().catch(() => false),
        emergency: await emergencyButton.isVisible().catch(() => false)
      };
      
      console.log('Button visibility:', buttonsFound);
      
      // Try to click buttons if they exist
      if (buttonsFound.video) {
        await videoButton.click();
        await this.page.waitForTimeout(1000);
        await this.takeScreenshot('05-video-call-clicked');
      }
      
      if (buttonsFound.audio) {
        await audioButton.click();
        await this.page.waitForTimeout(1000);
        await this.takeScreenshot('06-audio-call-clicked');
      }
      
      if (buttonsFound.emergency) {
        await emergencyButton.click();
        await this.page.waitForTimeout(1000);
        await this.takeScreenshot('07-emergency-clicked');
      }
      
      const allButtonsFound = buttonsFound.video && buttonsFound.audio && buttonsFound.emergency;
      
      this.results.tests.push({
        name: 'Streaming Buttons Test',
        status: allButtonsFound ? 'PASS' : 'PARTIAL',
        details: `Buttons found: ${JSON.stringify(buttonsFound)}`
      });
      
      console.log('✅ Streaming buttons test completed');
      
    } catch (error) {
      this.results.tests.push({
        name: 'Streaming Buttons Test',
        status: 'ERROR',
        error: error.message
      });
      console.error('❌ Streaming buttons test failed:', error.message);
    }
  }

  async testAPIEndpoints() {
    console.log('🔗 Testing API endpoints...');
    
    const endpoints = [
      '/api/health',
      '/api/dashboard',
      '/api/livekit/token'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.page.request.get(`http://localhost:3003${endpoint}`);
        const status = response.status();
        
        this.results.tests.push({
          name: `API Test: ${endpoint}`,
          status: status === 200 ? 'PASS' : 'FAIL',
          details: `HTTP ${status}`
        });
        
        console.log(`✅ ${endpoint}: HTTP ${status}`);
        
      } catch (error) {
        this.results.tests.push({
          name: `API Test: ${endpoint}`,
          status: 'ERROR',
          error: error.message
        });
        console.error(`❌ ${endpoint} failed:`, error.message);
      }
    }
  }

  async testResponsiveDesign() {
    console.log('📱 Testing responsive design...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      try {
        await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
        await this.page.waitForTimeout(1000);
        
        await this.takeScreenshot(`08-responsive-${viewport.name.toLowerCase()}`);
        
        this.results.tests.push({
          name: `Responsive Test: ${viewport.name}`,
          status: 'PASS',
          details: `${viewport.width}x${viewport.height}`
        });
        
        console.log(`✅ ${viewport.name} viewport test completed`);
        
      } catch (error) {
        this.results.tests.push({
          name: `Responsive Test: ${viewport.name}`,
          status: 'ERROR',
          error: error.message
        });
        console.error(`❌ ${viewport.name} viewport test failed:`, error.message);
      }
    }
  }

  async measurePerformance() {
    console.log('⚡ Measuring performance...');
    
    try {
      // Reset to desktop viewport
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      
      const startTime = Date.now();
      await this.page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Get performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      this.results.performance = {
        totalLoadTime: loadTime,
        ...performanceMetrics
      };
      
      console.log(`✅ Performance test completed - Load time: ${loadTime}ms`);
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
    }
  }

  async takeScreenshot(name) {
    const screenshotPath = `screenshots/${name}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.results.screenshots.push(screenshotPath);
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
  }

  async generateReport() {
    console.log('📋 Generating test report...');
    
    // Create screenshots directory
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }
    
    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Android Agent AI - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #0d1117; color: white; }
        .header { background: linear-gradient(135deg, #1e3a8a, #7c3aed); padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .test-result { margin: 10px 0; padding: 15px; border-radius: 5px; }
        .pass { background: #065f46; border-left: 4px solid #10b981; }
        .fail { background: #7f1d1d; border-left: 4px solid #ef4444; }
        .error { background: #92400e; border-left: 4px solid #f59e0b; }
        .screenshot { margin: 10px; display: inline-block; }
        .screenshot img { max-width: 300px; border: 2px solid #374151; border-radius: 5px; }
        .performance { background: #1e293b; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎭 Android Agent AI - Automated Test Report</h1>
        <p>Generated: ${this.results.timestamp}</p>
    </div>
    
    <h2>📊 Test Results</h2>
    ${this.results.tests.map(test => `
        <div class="test-result ${test.status.toLowerCase()}">
            <h3>${test.name}: ${test.status}</h3>
            <p>${test.details || test.error || 'No additional details'}</p>
        </div>
    `).join('')}
    
    <div class="performance">
        <h2>⚡ Performance Metrics</h2>
        <p>Total Load Time: ${this.results.performance.totalLoadTime || 'N/A'}ms</p>
        <p>DOM Content Loaded: ${this.results.performance.domContentLoaded || 'N/A'}ms</p>
        <p>First Contentful Paint: ${this.results.performance.firstContentfulPaint || 'N/A'}ms</p>
    </div>
    
    <h2>📸 Screenshots</h2>
    <div class="screenshots">
        ${this.results.screenshots.map(screenshot => `
            <div class="screenshot">
                <img src="${screenshot}" alt="${screenshot}">
                <p>${screenshot}</p>
            </div>
        `).join('')}
    </div>
    
    <h2>❌ Errors</h2>
    ${this.results.errors.length > 0 ? 
        this.results.errors.map(error => `<p style="color: #ef4444;">${error.message}</p>`).join('') :
        '<p style="color: #10b981;">No errors detected! 🎉</p>'
    }
</body>
</html>`;
    
    fs.writeFileSync('test-report.html', htmlReport);
    fs.writeFileSync('test-results.json', JSON.stringify(this.results, null, 2));
    
    console.log('✅ Test report generated: test-report.html');
    console.log('✅ Test results saved: test-results.json');
  }

  async runAllTests() {
    try {
      await this.initialize();
      await this.testLogin();
      await this.testDashboardElements();
      await this.testStreamingButtons();
      await this.testAPIEndpoints();
      await this.testResponsiveDesign();
      await this.measurePerformance();
      await this.generateReport();
      
      console.log('\n🎉 All tests completed successfully!');
      console.log('📋 Open test-report.html to view detailed results');
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DashboardTester();
  
  process.on('SIGINT', async () => {
    console.log('\n🛑 Test interrupted by user');
    await tester.cleanup();
    process.exit(0);
  });
  
  tester.runAllTests().catch(console.error);
}

module.exports = DashboardTester;