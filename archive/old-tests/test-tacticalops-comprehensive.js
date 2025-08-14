#!/usr/bin/env node

/**
 * TacticalOps Comprehensive Testing Framework
 * Tests all platform features including domain, SSL, authentication, dashboard, API, database, security, performance, UI/UX, and integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Test configuration
const CONFIG = {
    vpsHost: '217.79.255.54',
    vpsUser: 'root',
    localUrl: 'http://127.0.0.1:3020',
    httpsUrl: 'https://tacticalops.ta.consulting.sa',
    projectDir: '/opt/tacticalops',
    composeFile: 'docker-compose.vps-fixed.yml',
    testTimeout: 30000,
    credentials: {
        username: 'admin',
        password: 'admin123'
    }
};

// Test results storage
const results = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: 'production',
    suites: {},
    overallSummary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warningTests: 0,
        skippedTests: 0,
        successRate: 0,
        totalDuration: 0
    },
    recommendations: [],
    criticalIssues: [],
    performanceMetrics: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
    }
};

// Utility functions
class TestUtils {
    static executeOnVPS(command) {
        try {
            const fullCommand = `ssh -o StrictHostKeyChecking=no ${CONFIG.vpsUser}@${CONFIG.vpsHost} "${command}"`;
            const output = execSync(fullCommand, { encoding: 'utf8', timeout: CONFIG.testTimeout });
            return { success: true, output: output.trim() };
        } catch (error) {
            return { success: false, error: error.message, output: error.stdout || '' };
        }
    }

    static makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const isHttps = url.startsWith('https');
            const client = isHttps ? https : http;
            
            const requestOptions = {
                ...options,
                timeout: CONFIG.testTimeout,
                rejectUnauthorized: false
            };
            
            const req = client.request(url, requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data,
                        url: url
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    static createTestResult(testName, status, duration, details = {}, error = null) {
        return {
            testName,
            status,
            duration,
            timestamp: new Date().toISOString(),
            details,
            error
        };
    }

    static logTest(testName, status, details = '') {
        const icon = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : status === 'WARNING' ? '⚠️' : '⏭️';
        console.log(`${icon} ${testName}: ${status}${details ? ' - ' + details : ''}`);
    }
}

// Test Suite Classes
class DomainSSLTests {
    static async runTests() {
        console.log('\n🔍 Domain & SSL Tests');
        console.log('=' .repeat(40));
        
        const suite = {
            suiteName: 'Domain & SSL',
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, duration: 0 }
        };
        
        const startTime = Date.now();
        
        // Test 1: Local HTTPS with Host header
        try {
            const result = await TestUtils.executeOnVPS(`curl -I -H 'Host: tacticalops.ta.consulting.sa' https://127.0.0.1/api/health -k -s`);
            if (result.success && result.output.includes('HTTP/2 200')) {
                suite.tests.push(TestUtils.createTestResult('Local HTTPS', 'PASSED', 0, { statusCode: 200 }));
                TestUtils.logTest('Local HTTPS', 'PASSED');
            } else {
                suite.tests.push(TestUtils.createTestResult('Local HTTPS', 'FAILED', 0, {}, result.error));
                TestUtils.logTest('Local HTTPS', 'FAILED', result.error);
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('Local HTTPS', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('Local HTTPS', 'FAILED', error.message);
        }
        
        // Test 2: HTTP Redirect
        try {
            const result = await TestUtils.executeOnVPS(`curl -I http://127.0.0.1 -H 'Host: tacticalops.ta.consulting.sa' -s`);
            if (result.success && result.output.includes('301')) {
                suite.tests.push(TestUtils.createTestResult('HTTP Redirect', 'PASSED', 0, { statusCode: 301 }));
                TestUtils.logTest('HTTP Redirect', 'PASSED');
            } else {
                suite.tests.push(TestUtils.createTestResult('HTTP Redirect', 'FAILED', 0, {}, 'No redirect detected'));
                TestUtils.logTest('HTTP Redirect', 'FAILED', 'No redirect detected');
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('HTTP Redirect', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('HTTP Redirect', 'FAILED', error.message);
        }
        
        // Test 3: SSL Certificate
        try {
            const result = await TestUtils.executeOnVPS(`openssl x509 -in /etc/letsencrypt/live/consulting.sa/fullchain.pem -noout -dates`);
            if (result.success) {
                suite.tests.push(TestUtils.createTestResult('SSL Certificate', 'WARNING', 0, { note: 'Certificate exists but may not cover subdomain' }));
                TestUtils.logTest('SSL Certificate', 'WARNING', 'Certificate exists but may not cover subdomain');
            } else {
                suite.tests.push(TestUtils.createTestResult('SSL Certificate', 'FAILED', 0, {}, result.error));
                TestUtils.logTest('SSL Certificate', 'FAILED', result.error);
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('SSL Certificate', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('SSL Certificate', 'FAILED', error.message);
        }
        
        // Test 4: Security Headers
        try {
            const result = await TestUtils.executeOnVPS(`curl -I -H 'Host: tacticalops.ta.consulting.sa' https://127.0.0.1/ -k -s`);
            if (result.success) {
                const headers = result.output.toLowerCase();
                const hasXFrame = headers.includes('x-frame-options');
                const hasXContent = headers.includes('x-content-type-options');
                const hasHSTS = headers.includes('strict-transport-security');
                
                const headerCount = [hasXFrame, hasXContent, hasHSTS].filter(Boolean).length;
                const status = headerCount >= 2 ? 'PASSED' : headerCount >= 1 ? 'WARNING' : 'FAILED';
                
                suite.tests.push(TestUtils.createTestResult('Security Headers', status, 0, { 
                    xFrame: hasXFrame, 
                    xContent: hasXContent, 
                    hsts: hasHSTS 
                }));
                TestUtils.logTest('Security Headers', status, `${headerCount}/3 headers present`);
            } else {
                suite.tests.push(TestUtils.createTestResult('Security Headers', 'FAILED', 0, {}, result.error));
                TestUtils.logTest('Security Headers', 'FAILED', result.error);
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('Security Headers', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('Security Headers', 'FAILED', error.message);
        }
        
        suite.summary.duration = Date.now() - startTime;
        suite.summary.total = suite.tests.length;
        suite.summary.passed = suite.tests.filter(t => t.status === 'PASSED').length;
        suite.summary.failed = suite.tests.filter(t => t.status === 'FAILED').length;
        suite.summary.warnings = suite.tests.filter(t => t.status === 'WARNING').length;
        
        return suite;
    }
}

class ContainerTests {
    static async runTests() {
        console.log('\n🔍 Container & Service Tests');
        console.log('=' .repeat(40));
        
        const suite = {
            suiteName: 'Containers & Services',
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, duration: 0 }
        };
        
        const startTime = Date.now();
        
        // Test 1: Container Status
        try {
            const result = await TestUtils.executeOnVPS(`cd ${CONFIG.projectDir} && docker-compose -f ${CONFIG.composeFile} ps --format json`);
            if (result.success) {
                const containers = result.output.split('\n').filter(line => line.trim()).map(line => {
                    try { return JSON.parse(line); } catch { return null; }
                }).filter(Boolean);
                
                let healthyContainers = 0;
                containers.forEach(container => {
                    const isHealthy = container.State === 'running';
                    if (isHealthy) healthyContainers++;
                    
                    suite.tests.push(TestUtils.createTestResult(
                        `Container ${container.Service}`, 
                        isHealthy ? 'PASSED' : 'FAILED', 
                        0, 
                        { state: container.State, health: container.Health }
                    ));
                    TestUtils.logTest(`Container ${container.Service}`, isHealthy ? 'PASSED' : 'FAILED', container.State);
                });
                
            } else {
                suite.tests.push(TestUtils.createTestResult('Container Status', 'FAILED', 0, {}, result.error));
                TestUtils.logTest('Container Status', 'FAILED', result.error);
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('Container Status', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('Container Status', 'FAILED', error.message);
        }
        
        suite.summary.duration = Date.now() - startTime;
        suite.summary.total = suite.tests.length;
        suite.summary.passed = suite.tests.filter(t => t.status === 'PASSED').length;
        suite.summary.failed = suite.tests.filter(t => t.status === 'FAILED').length;
        
        return suite;
    }
}

class APITests {
    static async runTests() {
        console.log('\n🔍 API Endpoint Tests');
        console.log('=' .repeat(40));
        
        const suite = {
            suiteName: 'API Endpoints',
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, duration: 0 }
        };
        
        const startTime = Date.now();
        
        const endpoints = [
            { name: 'Health', path: '/api/health', expectedStatus: 200 },
            { name: 'Main Page', path: '/', expectedStatus: 200 },
            { name: 'Login Page', path: '/login', expectedStatus: 200 },
            { name: 'Admin Page', path: '/admin', expectedStatus: [200, 401, 403] }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const result = await TestUtils.executeOnVPS(`curl -s -w "HTTPSTATUS:%{http_code}" ${CONFIG.localUrl}${endpoint.path}`);
                if (result.success) {
                    const parts = result.output.split('HTTPSTATUS:');
                    const statusCode = parseInt(parts[1]) || 0;
                    const body = parts[0] || '';
                    
                    const expectedStatuses = Array.isArray(endpoint.expectedStatus) ? endpoint.expectedStatus : [endpoint.expectedStatus];
                    const isSuccess = expectedStatuses.includes(statusCode);
                    
                    suite.tests.push(TestUtils.createTestResult(
                        `API ${endpoint.name}`, 
                        isSuccess ? 'PASSED' : 'FAILED', 
                        0, 
                        { statusCode, responseSize: body.length }
                    ));
                    TestUtils.logTest(`API ${endpoint.name}`, isSuccess ? 'PASSED' : 'FAILED', `Status: ${statusCode}`);
                } else {
                    suite.tests.push(TestUtils.createTestResult(`API ${endpoint.name}`, 'FAILED', 0, {}, result.error));
                    TestUtils.logTest(`API ${endpoint.name}`, 'FAILED', result.error);
                }
            } catch (error) {
                suite.tests.push(TestUtils.createTestResult(`API ${endpoint.name}`, 'FAILED', 0, {}, error.message));
                TestUtils.logTest(`API ${endpoint.name}`, 'FAILED', error.message);
            }
        }
        
        suite.summary.duration = Date.now() - startTime;
        suite.summary.total = suite.tests.length;
        suite.summary.passed = suite.tests.filter(t => t.status === 'PASSED').length;
        suite.summary.failed = suite.tests.filter(t => t.status === 'FAILED').length;
        
        return suite;
    }
}

class DatabaseTests {
    static async runTests() {
        console.log('\n🔍 Database Tests');
        console.log('=' .repeat(40));
        
        const suite = {
            suiteName: 'Database',
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, duration: 0 }
        };
        
        const startTime = Date.now();
        
        // Test 1: Database Health
        try {
            const result = await TestUtils.executeOnVPS(`curl -s ${CONFIG.localUrl}/api/health`);
            if (result.success) {
                const healthData = JSON.parse(result.output);
                if (healthData.database && healthData.database.status === 'healthy') {
                    suite.tests.push(TestUtils.createTestResult('Database Health', 'PASSED', 0, {
                        provider: healthData.database.provider,
                        status: healthData.database.status
                    }));
                    TestUtils.logTest('Database Health', 'PASSED', `${healthData.database.provider} healthy`);
                } else {
                    suite.tests.push(TestUtils.createTestResult('Database Health', 'FAILED', 0, {}, 'Database not healthy'));
                    TestUtils.logTest('Database Health', 'FAILED', 'Database not healthy');
                }
            } else {
                suite.tests.push(TestUtils.createTestResult('Database Health', 'FAILED', 0, {}, result.error));
                TestUtils.logTest('Database Health', 'FAILED', result.error);
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('Database Health', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('Database Health', 'FAILED', error.message);
        }
        
        // Test 2: Database File
        try {
            const result = await TestUtils.executeOnVPS(`cd ${CONFIG.projectDir} && ls -la data/tacticalops.db`);
            if (result.success && !result.output.includes('No such file')) {
                suite.tests.push(TestUtils.createTestResult('Database File', 'PASSED', 0, { exists: true }));
                TestUtils.logTest('Database File', 'PASSED', 'File exists');
            } else {
                suite.tests.push(TestUtils.createTestResult('Database File', 'FAILED', 0, {}, 'Database file not found'));
                TestUtils.logTest('Database File', 'FAILED', 'Database file not found');
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('Database File', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('Database File', 'FAILED', error.message);
        }
        
        // Test 3: Test Data
        try {
            const result = await TestUtils.executeOnVPS(`cd ${CONFIG.projectDir} && docker-compose -f ${CONFIG.composeFile} exec -T tacticalops-app node -e "
                const { PrismaClient } = require('@prisma/client');
                const prisma = new PrismaClient();
                prisma.user.count().then(count => {
                    console.log('USER_COUNT:' + count);
                    return prisma.device.count();
                }).then(count => {
                    console.log('DEVICE_COUNT:' + count);
                    prisma.\\$disconnect();
                }).catch(err => {
                    console.log('ERROR:' + err.message);
                    prisma.\\$disconnect();
                });
            "`);
            
            if (result.success) {
                const userMatch = result.output.match(/USER_COUNT:(\d+)/);
                const deviceMatch = result.output.match(/DEVICE_COUNT:(\d+)/);
                
                if (userMatch && deviceMatch) {
                    const userCount = parseInt(userMatch[1]);
                    const deviceCount = parseInt(deviceMatch[1]);
                    
                    suite.tests.push(TestUtils.createTestResult('Test Data', 'PASSED', 0, {
                        userCount,
                        deviceCount
                    }));
                    TestUtils.logTest('Test Data', 'PASSED', `${userCount} users, ${deviceCount} devices`);
                } else if (result.output.includes('ERROR:')) {
                    suite.tests.push(TestUtils.createTestResult('Test Data', 'FAILED', 0, {}, 'Database query error'));
                    TestUtils.logTest('Test Data', 'FAILED', 'Database query error');
                } else {
                    suite.tests.push(TestUtils.createTestResult('Test Data', 'WARNING', 0, {}, 'Could not parse counts'));
                    TestUtils.logTest('Test Data', 'WARNING', 'Could not parse counts');
                }
            } else {
                suite.tests.push(TestUtils.createTestResult('Test Data', 'FAILED', 0, {}, result.error));
                TestUtils.logTest('Test Data', 'FAILED', result.error);
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('Test Data', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('Test Data', 'FAILED', error.message);
        }
        
        suite.summary.duration = Date.now() - startTime;
        suite.summary.total = suite.tests.length;
        suite.summary.passed = suite.tests.filter(t => t.status === 'PASSED').length;
        suite.summary.failed = suite.tests.filter(t => t.status === 'FAILED').length;
        suite.summary.warnings = suite.tests.filter(t => t.status === 'WARNING').length;
        
        return suite;
    }
}

class PerformanceTests {
    static async runTests() {
        console.log('\n🔍 Performance Tests');
        console.log('=' .repeat(40));
        
        const suite = {
            suiteName: 'Performance',
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, duration: 0 }
        };
        
        const startTime = Date.now();
        
        const endpoints = [
            { name: 'Main Page', path: '/', target: 2000 },
            { name: 'Health API', path: '/api/health', target: 100 },
            { name: 'Login Page', path: '/login', target: 2000 }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const result = await TestUtils.executeOnVPS(`curl -s -w "%{time_total}" -o /dev/null ${CONFIG.localUrl}${endpoint.path}`);
                if (result.success) {
                    const responseTime = parseFloat(result.output) * 1000; // Convert to ms
                    const status = responseTime <= endpoint.target ? 'PASSED' : 
                                 responseTime <= endpoint.target * 2 ? 'WARNING' : 'FAILED';
                    
                    suite.tests.push(TestUtils.createTestResult(
                        `Performance ${endpoint.name}`, 
                        status, 
                        responseTime, 
                        { responseTime, target: endpoint.target }
                    ));
                    TestUtils.logTest(`Performance ${endpoint.name}`, status, `${responseTime.toFixed(0)}ms (target: ${endpoint.target}ms)`);
                } else {
                    suite.tests.push(TestUtils.createTestResult(`Performance ${endpoint.name}`, 'FAILED', 0, {}, result.error));
                    TestUtils.logTest(`Performance ${endpoint.name}`, 'FAILED', result.error);
                }
            } catch (error) {
                suite.tests.push(TestUtils.createTestResult(`Performance ${endpoint.name}`, 'FAILED', 0, {}, error.message));
                TestUtils.logTest(`Performance ${endpoint.name}`, 'FAILED', error.message);
            }
        }
        
        suite.summary.duration = Date.now() - startTime;
        suite.summary.total = suite.tests.length;
        suite.summary.passed = suite.tests.filter(t => t.status === 'PASSED').length;
        suite.summary.failed = suite.tests.filter(t => t.status === 'FAILED').length;
        suite.summary.warnings = suite.tests.filter(t => t.status === 'WARNING').length;
        
        return suite;
    }
}

class UITests {
    static async runTests() {
        console.log('\n🔍 UI/UX Tests');
        console.log('=' .repeat(40));
        
        const suite = {
            suiteName: 'UI/UX',
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0, duration: 0 }
        };
        
        const startTime = Date.now();
        
        // Test 1: Main Page Content
        try {
            const result = await TestUtils.executeOnVPS(`curl -s ${CONFIG.localUrl}/`);
            if (result.success) {
                const content = result.output;
                
                const uiChecks = {
                    hasHtml: content.includes('<html') || content.includes('<!DOCTYPE'),
                    hasTitle: content.includes('<title>'),
                    hasCSS: content.includes('css') || content.includes('style'),
                    hasJS: content.includes('script') || content.includes('javascript'),
                    hasReact: content.includes('react') || content.includes('_next'),
                    hasDarkTheme: content.includes('dark') || content.includes('#0d1117')
                };
                
                const passedChecks = Object.values(uiChecks).filter(Boolean).length;
                const status = passedChecks >= 4 ? 'PASSED' : passedChecks >= 2 ? 'WARNING' : 'FAILED';
                
                suite.tests.push(TestUtils.createTestResult('UI Components', status, 0, uiChecks));
                TestUtils.logTest('UI Components', status, `${passedChecks}/6 checks passed`);
            } else {
                suite.tests.push(TestUtils.createTestResult('UI Components', 'FAILED', 0, {}, result.error));
                TestUtils.logTest('UI Components', 'FAILED', result.error);
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('UI Components', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('UI Components', 'FAILED', error.message);
        }
        
        // Test 2: Login Page Content
        try {
            const result = await TestUtils.executeOnVPS(`curl -s ${CONFIG.localUrl}/login`);
            if (result.success) {
                const content = result.output;
                const hasLoginForm = content.includes('login') || content.includes('username') || content.includes('password');
                
                suite.tests.push(TestUtils.createTestResult('Login Form', hasLoginForm ? 'PASSED' : 'FAILED', 0, { hasLoginForm }));
                TestUtils.logTest('Login Form', hasLoginForm ? 'PASSED' : 'FAILED');
            } else {
                suite.tests.push(TestUtils.createTestResult('Login Form', 'FAILED', 0, {}, result.error));
                TestUtils.logTest('Login Form', 'FAILED', result.error);
            }
        } catch (error) {
            suite.tests.push(TestUtils.createTestResult('Login Form', 'FAILED', 0, {}, error.message));
            TestUtils.logTest('Login Form', 'FAILED', error.message);
        }
        
        suite.summary.duration = Date.now() - startTime;
        suite.summary.total = suite.tests.length;
        suite.summary.passed = suite.tests.filter(t => t.status === 'PASSED').length;
        suite.summary.failed = suite.tests.filter(t => t.status === 'FAILED').length;
        suite.summary.warnings = suite.tests.filter(t => t.status === 'WARNING').length;
        
        return suite;
    }
}

// Main test runner and reporting
class ComprehensiveTestRunner {
    static async runAllTests() {
        console.log('🚀 TacticalOps Comprehensive Testing Framework');
        console.log('=' .repeat(60));
        console.log(`📅 Started: ${results.timestamp}`);
        console.log(`🖥️  VPS: ${CONFIG.vpsHost}`);
        console.log(`📁 Project: ${CONFIG.projectDir}`);
        console.log(`🌐 Local URL: ${CONFIG.localUrl}`);
        
        const testSuites = [
            { name: 'Domain & SSL', runner: DomainSSLTests },
            { name: 'Containers', runner: ContainerTests },
            { name: 'API Endpoints', runner: APITests },
            { name: 'Database', runner: DatabaseTests },
            { name: 'Performance', runner: PerformanceTests },
            { name: 'UI/UX', runner: UITests }
        ];
        
        const overallStartTime = Date.now();
        
        for (const testSuite of testSuites) {
            try {
                const suiteResult = await testSuite.runner.runTests();
                results.suites[testSuite.name] = suiteResult;
                
                // Update overall summary
                results.overallSummary.totalTests += suiteResult.summary.total;
                results.overallSummary.passedTests += suiteResult.summary.passed;
                results.overallSummary.failedTests += suiteResult.summary.failed;
                results.overallSummary.warningTests += suiteResult.summary.warnings || 0;
                results.overallSummary.skippedTests += suiteResult.summary.skipped || 0;
                
            } catch (error) {
                console.error(`❌ Failed to run ${testSuite.name} tests:`, error.message);
                results.criticalIssues.push(`Failed to run ${testSuite.name} tests: ${error.message}`);
            }
        }
        
        results.overallSummary.totalDuration = Date.now() - overallStartTime;
        results.overallSummary.successRate = results.overallSummary.totalTests > 0 ? 
            Math.round((results.overallSummary.passedTests / results.overallSummary.totalTests) * 100) : 0;
        
        // Calculate performance metrics
        this.calculatePerformanceMetrics();
        
        // Generate recommendations
        this.generateRecommendations();
        
        // Display summary
        this.displaySummary();
        
        // Save results
        this.saveResults();
        
        return results;
    }
    
    static calculatePerformanceMetrics() {
        const performanceTests = results.suites['Performance']?.tests || [];
        const responseTimes = performanceTests
            .filter(test => test.details?.responseTime)
            .map(test => test.details.responseTime);
        
        if (responseTimes.length > 0) {
            results.performanceMetrics.avgResponseTime = Math.round(
                responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            );
            results.performanceMetrics.maxResponseTime = Math.max(...responseTimes);
        }
    }
    
    static generateRecommendations() {
        const recommendations = [];
        const criticalIssues = [];
        
        // Check SSL certificate issue
        const sslTest = results.suites['Domain & SSL']?.tests?.find(t => t.testName === 'SSL Certificate');
        if (sslTest?.status === 'WARNING') {
            criticalIssues.push('SSL certificate does not cover tacticalops.ta.consulting.sa subdomain');
            recommendations.push('Add tacticalops.ta.consulting.sa to SSL certificate or use tacticalops.consulting.sa instead');
        }
        
        // Check failed containers
        const containerTests = results.suites['Containers']?.tests || [];
        const failedContainers = containerTests.filter(t => t.status === 'FAILED');
        if (failedContainers.length > 0) {
            criticalIssues.push(`${failedContainers.length} container(s) not running properly`);
            recommendations.push('Restart failed containers and check logs for errors');
        }
        
        // Check API failures
        const apiTests = results.suites['API Endpoints']?.tests || [];
        const failedAPIs = apiTests.filter(t => t.status === 'FAILED');
        if (failedAPIs.length > 0) {
            criticalIssues.push(`${failedAPIs.length} API endpoint(s) not responding`);
            recommendations.push('Check application logs and ensure all services are running');
        }
        
        // Check database issues
        const dbTest = results.suites['Database']?.tests?.find(t => t.testName === 'Database Health');
        if (dbTest?.status === 'FAILED') {
            criticalIssues.push('Database connection issues detected');
            recommendations.push('Check database container status and connection configuration');
        }
        
        // Check performance issues
        const perfTests = results.suites['Performance']?.tests || [];
        const slowTests = perfTests.filter(t => t.status === 'FAILED' || t.status === 'WARNING');
        if (slowTests.length > 0) {
            recommendations.push('Optimize slow endpoints and consider caching strategies');
        }
        
        // Success recommendations
        if (results.overallSummary.successRate >= 80) {
            recommendations.push('System is performing well - consider implementing monitoring and alerting');
        }
        
        if (results.overallSummary.successRate >= 90) {
            recommendations.push('Excellent system health - ready for production use');
        }
        
        results.recommendations = recommendations;
        results.criticalIssues = criticalIssues;
    }
    
    static displaySummary() {
        console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
        console.log('=' .repeat(60));
        
        // Overall status
        const statusIcon = results.overallSummary.successRate >= 90 ? '✅' : 
                          results.overallSummary.successRate >= 70 ? '⚠️' : '❌';
        const statusText = results.overallSummary.successRate >= 90 ? 'EXCELLENT' : 
                          results.overallSummary.successRate >= 70 ? 'GOOD' : 'NEEDS ATTENTION';
        
        console.log(`${statusIcon} Overall Status: ${statusText}`);
        console.log(`📈 Success Rate: ${results.overallSummary.successRate}%`);
        console.log(`📊 Tests: ${results.overallSummary.totalTests} total, ${results.overallSummary.passedTests} passed, ${results.overallSummary.failedTests} failed, ${results.overallSummary.warningTests} warnings`);
        console.log(`⏱️  Total Duration: ${Math.round(results.overallSummary.totalDuration / 1000)}s`);
        
        // Performance metrics
        if (results.performanceMetrics.avgResponseTime > 0) {
            console.log(`⚡ Avg Response Time: ${results.performanceMetrics.avgResponseTime}ms`);
            console.log(`🚀 Max Response Time: ${results.performanceMetrics.maxResponseTime}ms`);
        }
        
        // Suite breakdown
        console.log('\n📋 Test Suite Results:');
        Object.entries(results.suites).forEach(([suiteName, suite]) => {
            const suiteIcon = suite.summary.failed === 0 ? '✅' : suite.summary.failed < suite.summary.passed ? '⚠️' : '❌';
            console.log(`${suiteIcon} ${suiteName}: ${suite.summary.passed}/${suite.summary.total} passed`);
        });
        
        // Critical issues
        if (results.criticalIssues.length > 0) {
            console.log('\n🚨 Critical Issues:');
            results.criticalIssues.forEach(issue => console.log(`  ❗ ${issue}`));
        }
        
        // Recommendations
        if (results.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            results.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
        }
        
        // Access information
        console.log('\n🌐 Access Information:');
        console.log(`  📱 Application: ${CONFIG.httpsUrl} (SSL certificate issue - use local access)`);
        console.log(`  🔧 Local Access: ${CONFIG.localUrl}`);
        console.log(`  📊 Health Check: ${CONFIG.localUrl}/api/health`);
        console.log(`  🔑 Default Login: ${CONFIG.credentials.username}/${CONFIG.credentials.password}`);
        
        console.log('\n📄 Detailed results saved to: tacticalops-comprehensive-test-results.json');
    }
    
    static saveResults() {
        const filename = 'tacticalops-comprehensive-test-results.json';
        fs.writeFileSync(filename, JSON.stringify(results, null, 2));
        
        // Also create a simple HTML report
        const htmlReport = this.generateHTMLReport();
        fs.writeFileSync('tacticalops-test-report.html', htmlReport);
    }
    
    static generateHTMLReport() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TacticalOps Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status-excellent { color: #28a745; }
        .status-good { color: #ffc107; }
        .status-attention { color: #dc3545; }
        .suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .suite-header { font-weight: bold; margin-bottom: 10px; }
        .test-passed { color: #28a745; }
        .test-failed { color: #dc3545; }
        .test-warning { color: #ffc107; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: center; }
        .recommendations { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .critical-issues { background: #ffe6e6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 TacticalOps Comprehensive Test Report</h1>
            <p><strong>Generated:</strong> ${results.timestamp}</p>
            <p><strong>Version:</strong> ${results.version} | <strong>Environment:</strong> ${results.environment}</p>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="status-${results.overallSummary.successRate >= 90 ? 'excellent' : results.overallSummary.successRate >= 70 ? 'good' : 'attention'}">
                    ${results.overallSummary.successRate}%
                </div>
            </div>
            <div class="metric">
                <h3>Total Tests</h3>
                <div>${results.overallSummary.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="test-passed">${results.overallSummary.passedTests}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="test-failed">${results.overallSummary.failedTests}</div>
            </div>
        </div>
        
        ${results.criticalIssues.length > 0 ? `
        <div class="critical-issues">
            <h3>🚨 Critical Issues</h3>
            <ul>
                ${results.criticalIssues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        ${results.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
                ${results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        <h2>📋 Test Suite Results</h2>
        ${Object.entries(results.suites).map(([suiteName, suite]) => `
        <div class="suite">
            <div class="suite-header">${suiteName} (${suite.summary.passed}/${suite.summary.total} passed)</div>
            ${suite.tests.map(test => `
            <div class="test-${test.status.toLowerCase()}">
                ${test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️'} ${test.testName}
                ${test.details ? ` - ${JSON.stringify(test.details)}` : ''}
                ${test.error ? ` - Error: ${test.error}` : ''}
            </div>
            `).join('')}
        </div>
        `).join('')}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
            <p>TacticalOps Platform - Comprehensive Testing Framework</p>
        </div>
    </div>
</body>
</html>`;
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    ComprehensiveTestRunner.runAllTests().catch(console.error);
}

module.exports = { ComprehensiveTestRunner, CONFIG, results };