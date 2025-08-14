#!/usr/bin/env node

/**
 * TacticalOps Platform - VPS Deployment Testing Suite
 * 
 * This script tests the deployed TacticalOps Platform on the VPS
 * without requiring local Docker access.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const CONFIG = {
    domain: 'ta.consulting.sa',
    protocol: 'https',
    testTimeout: 30000,
    maxRetries: 3,
    testResults: {
        deployment: {},
        security: {},
        api: {},
        ui: {},
        performance: {}
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

// VPS Deployment Validator
class VPSDeploymentValidator {
    constructor() {
        this.results = {
            connectivity: {},
            services: {},
            ssl: {},
            performance: {}
        };
    }

    async validateConnectivity() {
        log.section('Validating VPS Connectivity');
        
        const tests = [
            { name: 'Domain Resolution', url: `${CONFIG.protocol}://${CONFIG.domain}` },
            { name: 'Health Check', url: `${CONFIG.protocol}://${CONFIG.domain}/api/health` },
            { name: 'Login Page', url: `${CONFIG.protocol}://${CONFIG.domain}/login` },
            { name: 'Dashboard', url: `${CONFIG.protocol}://${CONFIG.domain}/tactical-dashboard` }
        ];
        
        for (const test of tests) {
            try {
                log.info(`Testing ${test.name}...`);
                const response = await makeHttpRequest(test.url);
                
                this.results.connectivity[test.name] = {
                    url: test.url,
                    statusCode: response.statusCode,
                    success: response.success,
                    responseTime: response.responseTime,
                    contentLength: response.body.length
                };
                
                if (response.success) {
                    log.success(`${test.name} is accessible (${response.statusCode}) - ${response.responseTime}ms`);
                } else {
                    log.warning(`${test.name} returned status ${response.statusCode}`);
                }
            } catch (error) {
                this.results.connectivity[test.name] = {
                    url: test.url,
                    success: false,
                    error: error.error || error.message
                };
                log.error(`${test.name} failed: ${error.error || error.message}`);
            }
        }
        
        return this.results.connectivity;
    }

    async validateServices() {
        log.section('Validating Application Services');
        
        const services = [
            { name: 'API Health', endpoint: '/api/health' },
            { name: 'Authentication API', endpoint: '/api/auth/login' },
            { name: 'Tactical API', endpoint: '/api/tactical/map-data' },
            { name: 'Agent API', endpoint: '/api/agent/auth' },
            { name: 'Emergency API', endpoint: '/api/emergency/alert' }
        ];
        
        for (const service of services) {
            try {
                log.info(`Testing ${service.name}...`);
                const url = `${CONFIG.protocol}://${CONFIG.domain}${service.endpoint}`;
                const response = await makeHttpRequest(url);
                
                this.results.services[service.name] = {
                    endpoint: service.endpoint,
                    statusCode: response.statusCode,
                    success: response.statusCode !== 404 && response.statusCode !== 500,
                    responseTime: response.responseTime,
                    hasContent: response.body.length > 0
                };
                
                if (response.statusCode === 200) {
                    log.success(`${service.name} is working (${response.statusCode})`);
                } else if (response.statusCode === 401 || response.statusCode === 403) {
                    log.success(`${service.name} is protected (${response.statusCode}) - Good!`);
                } else if (response.statusCode === 405) {
                    log.success(`${service.name} exists but requires different method (${response.statusCode})`);
                } else {
                    log.warning(`${service.name} returned status ${response.statusCode}`);
                }
            } catch (error) {
                this.results.services[service.name] = {
                    endpoint: service.endpoint,
                    success: false,
                    error: error.error || error.message
                };
                log.error(`${service.name} failed: ${error.error || error.message}`);
            }
        }
        
        return this.results.services;
    }

    async validateSSL() {
        log.section('Validating SSL/TLS Configuration');
        
        try {
            // Test HTTPS connection
            const httpsResponse = await makeHttpRequest(`https://${CONFIG.domain}`);
            
            this.results.ssl.https = {
                working: httpsResponse.success,
                statusCode: httpsResponse.statusCode,
                responseTime: httpsResponse.responseTime
            };
            
            if (httpsResponse.success) {
                log.success('HTTPS connection is working');
            } else {
                log.error(`HTTPS connection failed with status ${httpsResponse.statusCode}`);
            }
            
            // Test HTTP redirect
            try {
                const httpResponse = await makeHttpRequest(`http://${CONFIG.domain}`);
                
                if (httpResponse.statusCode === 301 || httpResponse.statusCode === 302) {
                    log.success('HTTP to HTTPS redirect is working');
                    this.results.ssl.redirect = { working: true, statusCode: httpResponse.statusCode };
                } else {
                    log.warning(`HTTP redirect returned status ${httpResponse.statusCode}`);
                    this.results.ssl.redirect = { working: false, statusCode: httpResponse.statusCode };
                }
            } catch (error) {
                log.warning('Could not test HTTP redirect');
                this.results.ssl.redirect = { working: false, error: error.message };
            }
            
        } catch (error) {
            log.error(`SSL validation failed: ${error.message}`);
            this.results.ssl = {
                success: false,
                error: error.message
            };
        }
        
        return this.results.ssl;
    }

    async validatePerformance() {
        log.section('Validating Performance');
        
        const performanceTests = [
            { name: 'Homepage Load', url: `${CONFIG.protocol}://${CONFIG.domain}` },
            { name: 'API Response', url: `${CONFIG.protocol}://${CONFIG.domain}/api/health` },
            { name: 'Dashboard Load', url: `${CONFIG.protocol}://${CONFIG.domain}/tactical-dashboard` }
        ];
        
        for (const test of performanceTests) {
            const times = [];
            
            log.info(`Performance testing ${test.name} (3 requests)...`);
            
            for (let i = 0; i < 3; i++) {
                try {
                    const response = await makeHttpRequest(test.url);
                    times.push(response.responseTime);
                } catch (error) {
                    log.warning(`Performance test ${i + 1} failed for ${test.name}`);
                }
            }
            
            if (times.length > 0) {
                const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
                const minTime = Math.min(...times);
                const maxTime = Math.max(...times);
                
                this.results.performance[test.name] = {
                    average: avgTime,
                    min: minTime,
                    max: maxTime,
                    samples: times.length,
                    success: avgTime < 5000 // Less than 5 seconds is acceptable
                };
                
                if (avgTime < 2000) {
                    log.success(`${test.name} performance: ${avgTime}ms avg (Excellent)`);
                } else if (avgTime < 5000) {
                    log.success(`${test.name} performance: ${avgTime}ms avg (Good)`);
                } else {
                    log.warning(`${test.name} performance: ${avgTime}ms avg (Slow)`);
                }
            } else {
                this.results.performance[test.name] = {
                    success: false,
                    error: 'All performance tests failed'
                };
                log.error(`${test.name} performance testing failed`);
            }
        }
        
        return this.results.performance;
    }

    async runAllValidations() {
        log.header('VPS DEPLOYMENT VALIDATION');
        
        const connectivity = await this.validateConnectivity();
        const services = await this.validateServices();
        const ssl = await this.validateSSL();
        const performance = await this.validatePerformance();
        
        return {
            connectivity,
            services,
            ssl,
            performance,
            overall: this.calculateOverallStatus()
        };
    }

    calculateOverallStatus() {
        const allResults = [
            ...Object.values(this.results.connectivity),
            ...Object.values(this.results.services),
            this.results.ssl.https || {},
            ...Object.values(this.results.performance)
        ];
        
        const successCount = allResults.filter(result => result && result.success).length;
        const totalCount = allResults.filter(result => result).length;
        
        return {
            passed: successCount,
            total: totalCount,
            percentage: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0,
            status: successCount === totalCount ? 'PASSED' : successCount > totalCount * 0.7 ? 'WARNING' : 'FAILED'
        };
    }
}

// Security Tester
class SecurityTester {
    constructor() {
        this.results = {
            authentication: {},
            authorization: {},
            headers: {},
            vulnerabilities: {}
        };
    }

    async testAuthentication() {
        log.section('Testing Authentication');
        
        try {
            // Test login endpoint
            log.info('Testing login endpoint...');
            const loginResponse = await makePostRequest(
                `${CONFIG.protocol}://${CONFIG.domain}/api/auth/login`,
                { username: 'admin', password: 'admin123' }
            );
            
            this.results.authentication.login = {
                statusCode: loginResponse.statusCode,
                success: loginResponse.success,
                hasToken: loginResponse.body.includes('token') || loginResponse.body.includes('jwt'),
                responseTime: loginResponse.responseTime
            };
            
            if (loginResponse.success) {
                log.success('Login endpoint is working');
            } else {
                log.warning(`Login endpoint returned status ${loginResponse.statusCode}`);
            }
            
            // Test protected endpoint without auth
            log.info('Testing protected endpoint without authentication...');
            const protectedResponse = await makeHttpRequest(
                `${CONFIG.protocol}://${CONFIG.domain}/api/tactical/map-data`
            );
            
            this.results.authentication.protection = {
                statusCode: protectedResponse.statusCode,
                isProtected: protectedResponse.statusCode === 401 || protectedResponse.statusCode === 403,
                success: protectedResponse.statusCode === 401 || protectedResponse.statusCode === 403
            };
            
            if (protectedResponse.statusCode === 401 || protectedResponse.statusCode === 403) {
                log.success('Protected endpoints are properly secured');
            } else {
                log.warning(`Protected endpoint returned status ${protectedResponse.statusCode} - may not be protected`);
            }
            
        } catch (error) {
            log.error(`Authentication testing failed: ${error.message}`);
            this.results.authentication = {
                success: false,
                error: error.message
            };
        }
        
        return this.results.authentication;
    }

    async testSecurityHeaders() {
        log.section('Testing Security Headers');
        
        try {
            const response = await makeHttpRequest(`${CONFIG.protocol}://${CONFIG.domain}`);
            
            const securityHeaders = {
                'x-frame-options': response.headers['x-frame-options'],
                'x-content-type-options': response.headers['x-content-type-options'],
                'x-xss-protection': response.headers['x-xss-protection'],
                'strict-transport-security': response.headers['strict-transport-security'],
                'content-security-policy': response.headers['content-security-policy']
            };
            
            this.results.headers = securityHeaders;
            
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
            
            log.info(`Security headers: ${secureHeaders}/${totalHeaders} present`);
            
        } catch (error) {
            log.error(`Security headers testing failed: ${error.message}`);
            this.results.headers = {
                success: false,
                error: error.message
            };
        }
        
        return this.results.headers;
    }

    async runSecurityTests() {
        log.header('SECURITY TESTING');
        
        const authentication = await this.testAuthentication();
        const headers = await this.testSecurityHeaders();
        
        return {
            authentication,
            headers,
            overall: this.calculateSecurityStatus()
        };
    }

    calculateSecurityStatus() {
        const authSuccess = this.results.authentication.login?.success && this.results.authentication.protection?.success;
        const headersCount = Object.values(this.results.headers).filter(h => h && typeof h === 'string').length;
        
        return {
            authentication: authSuccess ? 'PASSED' : 'FAILED',
            headers: headersCount >= 3 ? 'PASSED' : 'WARNING',
            overall: authSuccess && headersCount >= 2 ? 'PASSED' : 'WARNING'
        };
    }
}

// Main execution function
async function main() {
    try {
        log.header('TacticalOps Platform - VPS Deployment Testing');
        log.info(`Testing domain: ${CONFIG.domain}`);
        log.info(`Protocol: ${CONFIG.protocol}`);
        
        // Phase 1: VPS Deployment Validation
        const deploymentValidator = new VPSDeploymentValidator();
        const deploymentResults = await deploymentValidator.runAllValidations();
        
        CONFIG.testResults.deployment = deploymentResults;
        
        // Phase 2: Security Testing
        const securityTester = new SecurityTester();
        const securityResults = await securityTester.runSecurityTests();
        
        CONFIG.testResults.security = securityResults;
        
        // Generate summary report
        log.header('TESTING SUMMARY');
        log.info(`Deployment Status: ${deploymentResults.overall.status}`);
        log.info(`Security Status: ${securityResults.overall.overall}`);
        log.info(`Tests Passed: ${deploymentResults.overall.passed}/${deploymentResults.overall.total} (${deploymentResults.overall.percentage}%)`);
        
        if (deploymentResults.overall.status === 'PASSED' && securityResults.overall.overall === 'PASSED') {
            log.success('🎉 All tests passed! VPS deployment is working correctly.');
        } else if (deploymentResults.overall.status !== 'FAILED') {
            log.warning('⚠️  Some tests failed but core functionality is working');
        } else {
            log.error('❌ Critical issues detected in VPS deployment');
        }
        
        // Save results to file
        const resultsFile = `vps-test-results-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(CONFIG.testResults, null, 2));
        log.info(`Test results saved to: ${resultsFile}`);
        
        return deploymentResults.overall.status !== 'FAILED';
        
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
    VPSDeploymentValidator,
    SecurityTester,
    CONFIG,
    log,
    makeHttpRequest,
    makePostRequest
};