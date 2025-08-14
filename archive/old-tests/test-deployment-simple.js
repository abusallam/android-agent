#!/usr/bin/env node

/**
 * TacticalOps Platform - Simple Deployment Testing
 * 
 * This script tests the deployed TacticalOps Platform without Playwright dependencies
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const CONFIG = {
    domain: 'ta.consulting.sa',
    protocol: 'https',
    testTimeout: 30000,
    credentials: {
        admin: { username: 'admin', password: 'admin123' }
    }
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Logging utilities
const log = {
    info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.cyan}${colors.bright}🎖️  ${msg}${colors.reset}\n`),
    section: (msg) => console.log(`\n${colors.magenta}${colors.bright}📋 ${msg}${colors.reset}`)
};

// HTTP request utility
const makeHttpRequest = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const timeout = options.timeout || CONFIG.testTimeout;
        
        const requestOptions = {
            timeout,
            rejectUnauthorized: false, // For self-signed certificates
            headers: {
                'User-Agent': 'TacticalOps-Testing-Suite/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                ...options.headers
            },
            ...options
        };
        
        const req = client.get(url, requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    responseTime: Date.now() - startTime
                });
            });
        });
        
        const startTime = Date.now();
        
        req.on('error', (error) => {
            reject({ success: false, error: error.message });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject({ success: false, error: 'Request timeout' });
        });
    });
};

// POST request utility
const makePostRequest = (url, data, options = {}) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const postData = JSON.stringify(data);
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'TacticalOps-Testing-Suite/1.0',
                ...options.headers
            },
            timeout: options.timeout || CONFIG.testTimeout,
            rejectUnauthorized: false
        };
        
        const req = client.request(url, requestOptions, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: responseData,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    responseTime: Date.now() - startTime
                });
            });
        });
        
        const startTime = Date.now();
        
        req.on('error', (error) => {
            reject({ success: false, error: error.message });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject({ success: false, error: 'Request timeout' });
        });
        
        req.write(postData);
        req.end();
    });
};

// Test Results Storage
const testResults = {
    connectivity: {},
    authentication: {},
    api: {},
    security: {},
    performance: {},
    overall: {}
};

// Connectivity Tests
async function testConnectivity() {
    log.section('Testing VPS Connectivity');
    
    const tests = [
        { name: 'Homepage', path: '/' },
        { name: 'Login Page', path: '/login' },
        { name: 'Health Check', path: '/api/health' },
        { name: 'Tactical Dashboard', path: '/tactical-dashboard' },
        { name: 'Admin Dashboard', path: '/admin' }
    ];
    
    for (const test of tests) {
        try {
            log.info(`Testing ${test.name}...`);
            const url = `${CONFIG.protocol}://${CONFIG.domain}${test.path}`;
            const response = await makeHttpRequest(url);
            
            testResults.connectivity[test.name] = {
                url: url,
                statusCode: response.statusCode,
                success: response.success,
                responseTime: response.responseTime,
                contentLength: response.body.length,
                hasContent: response.body.length > 0
            };
            
            if (response.success) {
                log.success(`${test.name}: ${response.statusCode} (${response.responseTime}ms) - ${response.body.length} bytes`);
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                log.success(`${test.name}: ${response.statusCode} (Redirect) - ${response.responseTime}ms`);
            } else {
                log.warning(`${test.name}: ${response.statusCode} - ${response.responseTime}ms`);
            }
            
            // Check for specific content indicators
            if (response.body.includes('TacticalOps') || response.body.includes('Android Agent') || response.body.includes('Dashboard')) {
                log.success(`${test.name}: Contains expected content`);
                testResults.connectivity[test.name].hasExpectedContent = true;
            } else if (response.body.includes('<!DOCTYPE html>') || response.body.includes('<html')) {
                log.info(`${test.name}: Valid HTML response`);
                testResults.connectivity[test.name].isHTML = true;
            }
            
        } catch (error) {
            testResults.connectivity[test.name] = {
                success: false,
                error: error.error || error.message
            };
            log.error(`${test.name}: ${error.error || error.message}`);
        }
    }
    
    return testResults.connectivity;
}

// Authentication Tests
async function testAuthentication() {
    log.section('Testing Authentication');
    
    try {
        // Test login endpoint
        log.info('Testing login endpoint...');
        const loginUrl = `${CONFIG.protocol}://${CONFIG.domain}/api/auth/login`;
        const loginResponse = await makePostRequest(loginUrl, {
            username: CONFIG.credentials.admin.username,
            password: CONFIG.credentials.admin.password
        });
        
        testResults.authentication.login = {
            statusCode: loginResponse.statusCode,
            success: loginResponse.success,
            responseTime: loginResponse.responseTime,
            hasToken: loginResponse.body.includes('token') || loginResponse.body.includes('jwt'),
            response: loginResponse.body.substring(0, 200) // First 200 chars for debugging
        };
        
        if (loginResponse.success) {
            log.success(`Login endpoint working: ${loginResponse.statusCode} (${loginResponse.responseTime}ms)`);
        } else {
            log.warning(`Login endpoint: ${loginResponse.statusCode} - ${loginResponse.body.substring(0, 100)}`);
        }
        
        // Test protected endpoint without auth
        log.info('Testing protected endpoint access...');
        const protectedUrl = `${CONFIG.protocol}://${CONFIG.domain}/api/tactical/map-data`;
        const protectedResponse = await makeHttpRequest(protectedUrl);
        
        testResults.authentication.protection = {
            statusCode: protectedResponse.statusCode,
            isProtected: protectedResponse.statusCode === 401 || protectedResponse.statusCode === 403,
            success: protectedResponse.statusCode === 401 || protectedResponse.statusCode === 403,
            responseTime: protectedResponse.responseTime
        };
        
        if (protectedResponse.statusCode === 401 || protectedResponse.statusCode === 403) {
            log.success('Protected endpoints are properly secured');
        } else {
            log.warning(`Protected endpoint returned ${protectedResponse.statusCode} - may not be protected`);
        }
        
    } catch (error) {
        log.error(`Authentication testing failed: ${error.message}`);
        testResults.authentication = {
            success: false,
            error: error.message
        };
    }
    
    return testResults.authentication;
}

// API Tests
async function testAPI() {
    log.section('Testing API Endpoints');
    
    const endpoints = [
        { name: 'Health Check', path: '/api/health', expectedStatus: [200] },
        { name: 'Auth Login', path: '/api/auth/login', expectedStatus: [200, 400, 405] },
        { name: 'Tactical Map Data', path: '/api/tactical/map-data', expectedStatus: [200, 401, 403] },
        { name: 'Agent Auth', path: '/api/agent/auth', expectedStatus: [200, 400, 405] },
        { name: 'Emergency Alert', path: '/api/emergency/alert', expectedStatus: [200, 401, 403, 405] },
        { name: 'System Control', path: '/api/agentic/system-control', expectedStatus: [200, 401, 403] }
    ];
    
    for (const endpoint of endpoints) {
        try {
            log.info(`Testing ${endpoint.name}...`);
            const url = `${CONFIG.protocol}://${CONFIG.domain}${endpoint.path}`;
            const response = await makeHttpRequest(url);
            
            const isExpectedStatus = endpoint.expectedStatus.includes(response.statusCode);
            
            testResults.api[endpoint.name] = {
                path: endpoint.path,
                statusCode: response.statusCode,
                success: isExpectedStatus,
                responseTime: response.responseTime,
                hasContent: response.body.length > 0,
                isJSON: response.body.startsWith('{') || response.body.startsWith('[')
            };
            
            if (isExpectedStatus) {
                log.success(`${endpoint.name}: ${response.statusCode} (${response.responseTime}ms) - Expected status`);
            } else {
                log.warning(`${endpoint.name}: ${response.statusCode} (${response.responseTime}ms) - Unexpected status`);
            }
            
            // Check for JSON response
            if (response.body.startsWith('{') || response.body.startsWith('[')) {
                log.info(`${endpoint.name}: JSON response detected`);
            }
            
        } catch (error) {
            testResults.api[endpoint.name] = {
                path: endpoint.path,
                success: false,
                error: error.error || error.message
            };
            log.error(`${endpoint.name}: ${error.error || error.message}`);
        }
    }
    
    return testResults.api;
}

// Security Tests
async function testSecurity() {
    log.section('Testing Security Headers');
    
    try {
        const response = await makeHttpRequest(`${CONFIG.protocol}://${CONFIG.domain}/`);
        
        const securityHeaders = {
            'x-frame-options': response.headers['x-frame-options'],
            'x-content-type-options': response.headers['x-content-type-options'],
            'x-xss-protection': response.headers['x-xss-protection'],
            'strict-transport-security': response.headers['strict-transport-security'],
            'content-security-policy': response.headers['content-security-policy'],
            'referrer-policy': response.headers['referrer-policy']
        };
        
        testResults.security.headers = securityHeaders;
        
        let secureHeaders = 0;
        const totalHeaders = Object.keys(securityHeaders).length;
        
        for (const [header, value] of Object.entries(securityHeaders)) {
            if (value) {
                log.success(`${header}: ${value}`);
                secureHeaders++;
            } else {
                log.warning(`Missing security header: ${header}`);
            }
        }
        
        testResults.security.score = {
            present: secureHeaders,
            total: totalHeaders,
            percentage: Math.round((secureHeaders / totalHeaders) * 100)
        };
        
        log.info(`Security headers: ${secureHeaders}/${totalHeaders} (${testResults.security.score.percentage}%)`);
        
    } catch (error) {
        log.error(`Security testing failed: ${error.message}`);
        testResults.security = {
            success: false,
            error: error.message
        };
    }
    
    return testResults.security;
}

// Performance Tests
async function testPerformance() {
    log.section('Testing Performance');
    
    const performanceTests = [
        { name: 'Homepage Load', path: '/' },
        { name: 'API Health', path: '/api/health' },
        { name: 'Login Page', path: '/login' }
    ];
    
    for (const test of performanceTests) {
        const times = [];
        
        log.info(`Performance testing ${test.name} (3 samples)...`);
        
        for (let i = 0; i < 3; i++) {
            try {
                const url = `${CONFIG.protocol}://${CONFIG.domain}${test.path}`;
                const response = await makeHttpRequest(url);
                times.push(response.responseTime);
            } catch (error) {
                log.warning(`Performance sample ${i + 1} failed for ${test.name}`);
            }
        }
        
        if (times.length > 0) {
            const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            
            testResults.performance[test.name] = {
                average: avgTime,
                min: minTime,
                max: maxTime,
                samples: times.length,
                success: avgTime < 5000 // Less than 5 seconds is acceptable
            };
            
            if (avgTime < 1000) {
                log.success(`${test.name}: ${avgTime}ms avg (Excellent)`);
            } else if (avgTime < 3000) {
                log.success(`${test.name}: ${avgTime}ms avg (Good)`);
            } else if (avgTime < 5000) {
                log.warning(`${test.name}: ${avgTime}ms avg (Acceptable)`);
            } else {
                log.error(`${test.name}: ${avgTime}ms avg (Slow)`);
            }
        } else {
            testResults.performance[test.name] = {
                success: false,
                error: 'All performance tests failed'
            };
            log.error(`${test.name}: Performance testing failed`);
        }
    }
    
    return testResults.performance;
}

// Calculate Overall Status
function calculateOverallStatus() {
    const allTests = [
        ...Object.values(testResults.connectivity),
        ...Object.values(testResults.authentication),
        ...Object.values(testResults.api),
        ...Object.values(testResults.performance)
    ];
    
    const successCount = allTests.filter(test => test && test.success).length;
    const totalCount = allTests.filter(test => test).length;
    
    testResults.overall = {
        passed: successCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0,
        status: successCount === totalCount ? 'PASSED' : successCount > totalCount * 0.7 ? 'WARNING' : 'FAILED'
    };
    
    return testResults.overall;
}

// Generate Report
function generateReport() {
    log.header('COMPREHENSIVE TESTING SUMMARY');
    
    const overall = calculateOverallStatus();
    
    log.info(`Overall Status: ${overall.status}`);
    log.info(`Tests Passed: ${overall.passed}/${overall.total} (${overall.percentage}%)`);
    
    // Connectivity Summary
    const connectivityPassed = Object.values(testResults.connectivity).filter(t => t.success).length;
    const connectivityTotal = Object.values(testResults.connectivity).length;
    log.info(`Connectivity: ${connectivityPassed}/${connectivityTotal} passed`);
    
    // Authentication Summary
    const authPassed = Object.values(testResults.authentication).filter(t => t.success).length;
    const authTotal = Object.values(testResults.authentication).length;
    log.info(`Authentication: ${authPassed}/${authTotal} passed`);
    
    // API Summary
    const apiPassed = Object.values(testResults.api).filter(t => t.success).length;
    const apiTotal = Object.values(testResults.api).length;
    log.info(`API Endpoints: ${apiPassed}/${apiTotal} passed`);
    
    // Performance Summary
    const perfPassed = Object.values(testResults.performance).filter(t => t.success).length;
    const perfTotal = Object.values(testResults.performance).length;
    log.info(`Performance: ${perfPassed}/${perfTotal} passed`);
    
    // Security Summary
    if (testResults.security.score) {
        log.info(`Security Headers: ${testResults.security.score.present}/${testResults.security.score.total} (${testResults.security.score.percentage}%)`);
    }
    
    if (overall.status === 'PASSED') {
        log.success('🎉 All critical tests passed! VPS deployment is working correctly.');
    } else if (overall.status === 'WARNING') {
        log.warning('⚠️  Some tests failed but core functionality is working');
    } else {
        log.error('❌ Critical issues detected in VPS deployment');
    }
    
    // Save results to file
    const resultsFile = `deployment-test-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    log.info(`Detailed test results saved to: ${resultsFile}`);
    
    return overall.status !== 'FAILED';
}

// Main execution function
async function main() {
    try {
        log.header('TacticalOps Platform - Comprehensive VPS Testing');
        log.info(`Testing domain: ${CONFIG.domain}`);
        log.info(`Protocol: ${CONFIG.protocol}`);
        log.info(`Timeout: ${CONFIG.testTimeout}ms`);
        
        // Run all test suites
        await testConnectivity();
        await testAuthentication();
        await testAPI();
        await testSecurity();
        await testPerformance();
        
        // Generate final report
        const success = generateReport();
        
        return success;
        
    } catch (error) {
        log.error(`Test execution failed: ${error.message}`);
        console.error(error);
        return false;
    }
}

// Execute if run directly
if (require.main === module) {
    main().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    testConnectivity,
    testAuthentication,
    testAPI,
    testSecurity,
    testPerformance,
    generateReport,
    CONFIG,
    log
};