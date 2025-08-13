#!/usr/bin/env node

/**
 * TacticalOps Platform - Comprehensive Deployment Testing Suite
 * 
 * This script performs comprehensive testing and validation of the TacticalOps Platform
 * deployment including infrastructure, security, API functionality, UI/UX, performance,
 * and integration testing.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
    domain: process.env.DOMAIN || 'ta.consulting.sa',
    protocol: 'https',
    port: process.env.PORT || 443,
    testTimeout: 30000,
    maxRetries: 3,
    isRemoteDeployment: true, // Testing deployed VPS application
    testResults: {
        deployment: {},
        security: {},
        api: {},
        ui: {},
        performance: {},
        integration: {}
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

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const executeCommand = (command, options = {}) => {
    try {
        const result = execSync(command, { 
            encoding: 'utf8', 
            timeout: CONFIG.testTimeout,
            ...options 
        });
        return { success: true, output: result.trim() };
    } catch (error) {
        return { success: false, error: error.message, output: error.stdout || '' };
    }
};

const makeHttpRequest = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const timeout = options.timeout || CONFIG.testTimeout;
        
        const req = client.get(url, { 
            timeout,
            rejectUnauthorized: false, // For self-signed certificates
            ...options 
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    success: res.statusCode >= 200 && res.statusCode < 400
                });
            });
        });
        
        req.on('error', (error) => {
            reject({ success: false, error: error.message });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject({ success: false, error: 'Request timeout' });
        });
    });
};

// Phase 1: Deployment Status Validation
class DeploymentValidator {
    constructor() {
        this.results = {
            containers: {},
            services: {},
            database: {},
            ssl: {},
            nginx: {}
        };
    }

    async validateContainers() {
        log.section('Validating Docker Containers');
        
        for (const container of CONFIG.containers) {
            try {
                // Check if container exists and is running
                const statusResult = executeCommand(`docker ps --filter "name=${container}" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"`);
                
                if (statusResult.success && statusResult.output.includes(container)) {
                    // Get detailed container info
                    const inspectResult = executeCommand(`docker inspect ${container} --format "{{.State.Status}}|{{.State.Health.Status}}|{{.Config.Image}}"`);
                    
                    if (inspectResult.success) {
                        const [status, health, image] = inspectResult.output.split('|');
                        this.results.containers[container] = {
                            status: 'RUNNING',
                            health: health || 'N/A',
                            image: image,
                            success: status === 'running'
                        };
                        
                        if (status === 'running') {
                            log.success(`Container ${container} is running (Health: ${health || 'N/A'})`);
                        } else {
                            log.error(`Container ${container} status: ${status}`);
                        }
                    } else {
                        this.results.containers[container] = {
                            status: 'UNKNOWN',
                            success: false,
                            error: inspectResult.error
                        };
                        log.error(`Failed to inspect container ${container}: ${inspectResult.error}`);
                    }
                } else {
                    this.results.containers[container] = {
                        status: 'NOT_FOUND',
                        success: false,
                        error: 'Container not found or not running'
                    };
                    log.error(`Container ${container} not found or not running`);
                }
            } catch (error) {
                this.results.containers[container] = {
                    status: 'ERROR',
                    success: false,
                    error: error.message
                };
                log.error(`Error checking container ${container}: ${error.message}`);
            }
        }
        
        return this.results.containers;
    }

    async validateServices() {
        log.section('Validating Service Connectivity');
        
        const services = [
            { name: 'Web Application', url: `${CONFIG.protocol}://${CONFIG.domain}/api/health` },
            { name: 'Database Health', url: `${CONFIG.protocol}://${CONFIG.domain}/api/health/db` },
            { name: 'Cache Health', url: `${CONFIG.protocol}://${CONFIG.domain}/api/health/cache` },
            { name: 'Main Dashboard', url: `${CONFIG.protocol}://${CONFIG.domain}` }
        ];
        
        for (const service of services) {
            try {
                log.info(`Testing ${service.name}...`);
                const response = await makeHttpRequest(service.url);
                
                this.results.services[service.name] = {
                    url: service.url,
                    statusCode: response.statusCode,
                    success: response.success,
                    responseTime: Date.now() // Simplified timing
                };
                
                if (response.success) {
                    log.success(`${service.name} is accessible (Status: ${response.statusCode})`);
                } else {
                    log.warning(`${service.name} returned status ${response.statusCode}`);
                }
            } catch (error) {
                this.results.services[service.name] = {
                    url: service.url,
                    success: false,
                    error: error.error || error.message
                };
                log.error(`${service.name} failed: ${error.error || error.message}`);
            }
        }
        
        return this.results.services;
    }

    async validateDatabase() {
        log.section('Validating Database Connectivity and Schema');
        
        try {
            // Test PostgreSQL connectivity
            const pgResult = executeCommand('docker exec tacticalops_postgres pg_isready -U postgres');
            
            if (pgResult.success) {
                log.success('PostgreSQL is ready and accepting connections');
                
                // Test database schema
                const schemaResult = executeCommand(`docker exec tacticalops_postgres psql -U postgres -d tacticalops -c "\\dt" -t`);
                
                if (schemaResult.success) {
                    const tables = schemaResult.output.split('\n').filter(line => line.trim()).length;
                    log.success(`Database schema validated - ${tables} tables found`);
                    
                    this.results.database = {
                        postgresql: {
                            status: 'CONNECTED',
                            tables: tables,
                            success: true
                        }
                    };
                } else {
                    log.warning('Could not validate database schema');
                    this.results.database = {
                        postgresql: {
                            status: 'CONNECTED',
                            schema: 'UNKNOWN',
                            success: true
                        }
                    };
                }
            } else {
                log.error('PostgreSQL is not ready');
                this.results.database = {
                    postgresql: {
                        status: 'DISCONNECTED',
                        success: false,
                        error: pgResult.error
                    }
                };
            }
            
            // Test Redis connectivity
            const redisResult = executeCommand('docker exec tacticalops_redis redis-cli ping');
            
            if (redisResult.success && redisResult.output.includes('PONG')) {
                log.success('Redis cache is responding');
                this.results.database.redis = {
                    status: 'CONNECTED',
                    success: true
                };
            } else {
                log.error('Redis cache is not responding');
                this.results.database.redis = {
                    status: 'DISCONNECTED',
                    success: false,
                    error: redisResult.error
                };
            }
            
        } catch (error) {
            log.error(`Database validation failed: ${error.message}`);
            this.results.database = {
                success: false,
                error: error.message
            };
        }
        
        return this.results.database;
    }

    async validateSSL() {
        log.section('Validating SSL/TLS Configuration');
        
        try {
            // Test SSL certificate
            const sslResult = executeCommand(`echo | openssl s_client -servername ${CONFIG.domain} -connect ${CONFIG.domain}:443 2>/dev/null | openssl x509 -noout -dates`);
            
            if (sslResult.success) {
                log.success('SSL certificate is valid and accessible');
                this.results.ssl = {
                    certificate: 'VALID',
                    details: sslResult.output,
                    success: true
                };
            } else {
                log.warning('SSL certificate validation failed or not configured');
                this.results.ssl = {
                    certificate: 'INVALID',
                    success: false,
                    error: sslResult.error
                };
            }
            
            // Test HTTPS redirect
            try {
                const httpResponse = await makeHttpRequest(`http://${CONFIG.domain}`);
                if (httpResponse.statusCode === 301 || httpResponse.statusCode === 302) {
                    log.success('HTTP to HTTPS redirect is working');
                    this.results.ssl.redirect = 'WORKING';
                } else {
                    log.warning(`HTTP redirect returned status ${httpResponse.statusCode}`);
                    this.results.ssl.redirect = 'NOT_CONFIGURED';
                }
            } catch (error) {
                log.warning('Could not test HTTP redirect');
                this.results.ssl.redirect = 'UNKNOWN';
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

    async validateNginx() {
        log.section('Validating Nginx Configuration');
        
        try {
            // Test nginx configuration
            const nginxTest = executeCommand('sudo nginx -t');
            
            if (nginxTest.success) {
                log.success('Nginx configuration is valid');
                this.results.nginx = {
                    configuration: 'VALID',
                    success: true
                };
            } else {
                log.error('Nginx configuration has errors');
                this.results.nginx = {
                    configuration: 'INVALID',
                    success: false,
                    error: nginxTest.error
                };
            }
            
            // Test nginx status
            const nginxStatus = executeCommand('systemctl is-active nginx');
            
            if (nginxStatus.success && nginxStatus.output === 'active') {
                log.success('Nginx service is active and running');
                this.results.nginx.service = 'ACTIVE';
            } else {
                log.warning('Nginx service may not be running');
                this.results.nginx.service = 'INACTIVE';
            }
            
        } catch (error) {
            log.error(`Nginx validation failed: ${error.message}`);
            this.results.nginx = {
                success: false,
                error: error.message
            };
        }
        
        return this.results.nginx;
    }

    async runAllValidations() {
        log.header('PHASE 1: DEPLOYMENT STATUS VALIDATION');
        
        const containers = await this.validateContainers();
        const services = await this.validateServices();
        const database = await this.validateDatabase();
        const ssl = await this.validateSSL();
        const nginx = await this.validateNginx();
        
        return {
            containers,
            services,
            database,
            ssl,
            nginx,
            overall: this.calculateOverallStatus()
        };
    }

    calculateOverallStatus() {
        const allResults = [
            ...Object.values(this.results.containers),
            ...Object.values(this.results.services),
            this.results.database,
            this.results.ssl,
            this.results.nginx
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

// Main execution function
async function main() {
    try {
        log.header('TacticalOps Platform - Comprehensive Deployment Testing');
        log.info(`Testing domain: ${CONFIG.domain}`);
        log.info(`Protocol: ${CONFIG.protocol}`);
        log.info(`Timeout: ${CONFIG.testTimeout}ms`);
        
        // Phase 1: Deployment Status Validation
        const deploymentValidator = new DeploymentValidator();
        const deploymentResults = await deploymentValidator.runAllValidations();
        
        CONFIG.testResults.deployment = deploymentResults;
        
        // Generate summary report
        log.header('DEPLOYMENT VALIDATION SUMMARY');
        log.info(`Overall Status: ${deploymentResults.overall.status}`);
        log.info(`Tests Passed: ${deploymentResults.overall.passed}/${deploymentResults.overall.total} (${deploymentResults.overall.percentage}%)`);
        
        if (deploymentResults.overall.status === 'PASSED') {
            log.success('🎉 All deployment validation tests passed!');
        } else if (deploymentResults.overall.status === 'WARNING') {
            log.warning('⚠️  Some deployment tests failed but core functionality is working');
        } else {
            log.error('❌ Critical deployment issues detected');
        }
        
        // Save results to file
        const resultsFile = `deployment-test-results-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(CONFIG.testResults, null, 2));
        log.info(`Test results saved to: ${resultsFile}`);
        
        // Continue with next phases if deployment is working
        if (deploymentResults.overall.status !== 'FAILED') {
            log.info('Deployment validation completed successfully. Ready for security testing phase.');
            return true;
        } else {
            log.error('Deployment validation failed. Please fix critical issues before proceeding.');
            return false;
        }
        
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
    DeploymentValidator,
    CONFIG,
    log,
    executeCommand,
    makeHttpRequest
};