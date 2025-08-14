#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test configuration
const CONFIG = {
    baseUrl: 'https://tacticalops.ta.consulting.sa',
    httpsUrl: 'https://tacticalops.ta.consulting.sa',
    httpUrl: 'http://tacticalops.ta.consulting.sa',
    localUrl: 'http://127.0.0.1:3020',
    testTimeout: 30000,
    credentials: {
        username: 'admin',
        password: 'admin123'
    }
};

// Test results
const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
        total: 0,
        passed: 0,
        failed: 0
    }
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const requestOptions = {
            ...options,
            timeout: CONFIG.testTimeout,
            rejectUnauthorized: false // Allow self-signed certificates
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

// Test functions
async function testHealthEndpoint() {
    console.log('🔍 Testing health endpoint...');
    
    try {
        // Test local health endpoint
        const localResponse = await makeRequest(`${CONFIG.localUrl}/api/health`);
        
        if (localResponse.statusCode === 200) {
            const healthData = JSON.parse(localResponse.data);
            results.tests.localHealth = {
                status: 'PASSED',
                statusCode: localResponse.statusCode,
                data: healthData
            };
            console.log('✅ Local health endpoint: PASSED');
        } else {
            results.tests.localHealth = {
                status: 'FAILED',
                statusCode: localResponse.statusCode,
                error: 'Non-200 status code'
            };
            console.log('❌ Local health endpoint: FAILED');
        }
    } catch (error) {
        results.tests.localHealth = {
            status: 'FAILED',
            error: error.message
        };
        console.log('❌ Local health endpoint: FAILED -', error.message);
    }
    
    // Test HTTPS health endpoint
    try {
        const httpsResponse = await makeRequest(`${CONFIG.httpsUrl}/api/health`);
        
        if (httpsResponse.statusCode === 200) {
            results.tests.httpsHealth = {
                status: 'PASSED',
                statusCode: httpsResponse.statusCode
            };
            console.log('✅ HTTPS health endpoint: PASSED');
        } else {
            results.tests.httpsHealth = {
                status: 'FAILED',
                statusCode: httpsResponse.statusCode
            };
            console.log('❌ HTTPS health endpoint: FAILED');
        }
    } catch (error) {
        results.tests.httpsHealth = {
            status: 'FAILED',
            error: error.message
        };
        console.log('❌ HTTPS health endpoint: FAILED -', error.message);
    }
}

async function testHttpRedirect() {
    console.log('🔍 Testing HTTP to HTTPS redirect...');
    
    try {
        const response = await makeRequest(`${CONFIG.httpUrl}/api/health`);
        
        if (response.statusCode === 301 || response.statusCode === 302) {
            const location = response.headers.location;
            if (location && location.startsWith('https://')) {
                results.tests.httpRedirect = {
                    status: 'PASSED',
                    statusCode: response.statusCode,
                    redirectLocation: location
                };
                console.log('✅ HTTP redirect: PASSED');
            } else {
                results.tests.httpRedirect = {
                    status: 'FAILED',
                    statusCode: response.statusCode,
                    error: 'Invalid redirect location'
                };
                console.log('❌ HTTP redirect: FAILED - Invalid redirect location');
            }
        } else {
            results.tests.httpRedirect = {
                status: 'FAILED',
                statusCode: response.statusCode,
                error: 'No redirect detected'
            };
            console.log('❌ HTTP redirect: FAILED - No redirect detected');
        }
    } catch (error) {
        results.tests.httpRedirect = {
            status: 'FAILED',
            error: error.message
        };
        console.log('❌ HTTP redirect: FAILED -', error.message);
    }
}

async function testMainPage() {
    console.log('🔍 Testing main page...');
    
    try {
        const response = await makeRequest(`${CONFIG.localUrl}/`);
        
        if (response.statusCode === 200) {
            const isHtml = response.data.includes('<html') || response.data.includes('<!DOCTYPE');
            if (isHtml) {
                results.tests.mainPage = {
                    status: 'PASSED',
                    statusCode: response.statusCode,
                    contentType: response.headers['content-type']
                };
                console.log('✅ Main page: PASSED');
            } else {
                results.tests.mainPage = {
                    status: 'FAILED',
                    statusCode: response.statusCode,
                    error: 'Response is not HTML'
                };
                console.log('❌ Main page: FAILED - Response is not HTML');
            }
        } else {
            results.tests.mainPage = {
                status: 'FAILED',
                statusCode: response.statusCode
            };
            console.log('❌ Main page: FAILED');
        }
    } catch (error) {
        results.tests.mainPage = {
            status: 'FAILED',
            error: error.message
        };
        console.log('❌ Main page: FAILED -', error.message);
    }
}

async function testLoginPage() {
    console.log('🔍 Testing login page...');
    
    try {
        const response = await makeRequest(`${CONFIG.localUrl}/login`);
        
        if (response.statusCode === 200) {
            const hasLoginForm = response.data.includes('login') || response.data.includes('username') || response.data.includes('password');
            if (hasLoginForm) {
                results.tests.loginPage = {
                    status: 'PASSED',
                    statusCode: response.statusCode
                };
                console.log('✅ Login page: PASSED');
            } else {
                results.tests.loginPage = {
                    status: 'FAILED',
                    statusCode: response.statusCode,
                    error: 'Login form not found'
                };
                console.log('❌ Login page: FAILED - Login form not found');
            }
        } else {
            results.tests.loginPage = {
                status: 'FAILED',
                statusCode: response.statusCode
            };
            console.log('❌ Login page: FAILED');
        }
    } catch (error) {
        results.tests.loginPage = {
            status: 'FAILED',
            error: error.message
        };
        console.log('❌ Login page: FAILED -', error.message);
    }
}

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    
    try {
        const response = await makeRequest(`${CONFIG.localUrl}/api/health`);
        
        if (response.statusCode === 200) {
            const healthData = JSON.parse(response.data);
            if (healthData.database && healthData.database.status === 'healthy') {
                results.tests.database = {
                    status: 'PASSED',
                    provider: healthData.database.provider,
                    url: healthData.database.url
                };
                console.log('✅ Database connection: PASSED');
            } else {
                results.tests.database = {
                    status: 'FAILED',
                    error: 'Database not healthy'
                };
                console.log('❌ Database connection: FAILED');
            }
        } else {
            results.tests.database = {
                status: 'FAILED',
                error: 'Health endpoint not accessible'
            };
            console.log('❌ Database connection: FAILED');
        }
    } catch (error) {
        results.tests.database = {
            status: 'FAILED',
            error: error.message
        };
        console.log('❌ Database connection: FAILED -', error.message);
    }
}

async function testContainerStatus() {
    console.log('🔍 Testing container status...');
    
    try {
        // This would need to be run on the VPS
        results.tests.containers = {
            status: 'SKIPPED',
            note: 'Container status check requires VPS access'
        };
        console.log('⏭️  Container status: SKIPPED (requires VPS access)');
    } catch (error) {
        results.tests.containers = {
            status: 'FAILED',
            error: error.message
        };
        console.log('❌ Container status: FAILED -', error.message);
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting TacticalOps Deployment Tests');
    console.log('=' .repeat(50));
    
    const tests = [
        testHealthEndpoint,
        testHttpRedirect,
        testMainPage,
        testLoginPage,
        testDatabaseConnection,
        testContainerStatus
    ];
    
    for (const test of tests) {
        try {
            await test();
            console.log('');
        } catch (error) {
            console.error('Test execution error:', error.message);
            console.log('');
        }
    }
    
    // Calculate summary
    results.summary.total = Object.keys(results.tests).length;
    results.summary.passed = Object.values(results.tests).filter(t => t.status === 'PASSED').length;
    results.summary.failed = Object.values(results.tests).filter(t => t.status === 'FAILED').length;
    results.summary.skipped = Object.values(results.tests).filter(t => t.status === 'SKIPPED').length;
    
    // Print summary
    console.log('📊 Test Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${results.summary.total}`);
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`❌ Failed: ${results.summary.failed}`);
    console.log(`⏭️  Skipped: ${results.summary.skipped}`);
    console.log('');
    
    // Print detailed results
    console.log('📋 Detailed Results');
    console.log('=' .repeat(50));
    Object.entries(results.tests).forEach(([testName, result]) => {
        const status = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⏭️';
        console.log(`${status} ${testName}: ${result.status}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        if (result.statusCode) {
            console.log(`   Status Code: ${result.statusCode}`);
        }
    });
    
    // Save results to file
    const fs = require('fs');
    const resultsFile = `deployment-test-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsFile}`);
    
    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, CONFIG, results };