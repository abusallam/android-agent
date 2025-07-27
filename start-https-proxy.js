#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get local IP address
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIP();
const HTTPS_PORT = 3001;
const HTTP_PORT = 3000;

// Check if certificates exist
const certPath = path.join(__dirname, 'ssl', 'localhost.crt');
const keyPath = path.join(__dirname, 'ssl', 'localhost.key');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  log('red', '❌ SSL certificates not found!');
  log('yellow', 'Please run: ./setup-https-dev.sh first');
  process.exit(1);
}

// Read SSL certificates
const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

// Create proxy middleware
const proxy = createProxyMiddleware({
  target: `http://localhost:${HTTP_PORT}`,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  onError: (err, req, res) => {
    log('red', `Proxy error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error');
  }
});

// Create HTTPS server
const server = https.createServer(options, (req, res) => {
  // Add CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  proxy(req, res);
});

// Handle WebSocket upgrades
server.on('upgrade', (request, socket, head) => {
  proxy.upgrade(request, socket, head);
});

// Start HTTPS proxy server
server.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log('\n🚀 Android Agent HTTPS Proxy Started!');
  console.log('=====================================');
  log('blue', `📱 Access URLs:`);
  log('green', `   Local:    https://localhost:${HTTPS_PORT}`);
  log('green', `   Network:  https://${LOCAL_IP}:${HTTPS_PORT}`);
  console.log('');
  log('yellow', '📋 For Android testing:');
  console.log(`   1. Connect your Android device to the same WiFi network`);
  console.log(`   2. Open Chrome on Android`);
  console.log(`   3. Visit: https://${LOCAL_IP}:${HTTPS_PORT}`);
  console.log(`   4. Accept the security warning (self-signed certificate)`);
  console.log(`   5. Install the PWA by tapping 'Setup Mobile App'`);
  console.log('');
  log('blue', `🔗 Proxying to: http://localhost:${HTTP_PORT}`);
  log('yellow', '⚠️  Make sure your Next.js dev server is running on port 3000');
  console.log('');
  log('green', '✅ HTTPS proxy ready for PWA testing!');
  console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('yellow', '\n🛑 Shutting down HTTPS proxy...');
  server.close(() => {
    log('green', '✅ HTTPS proxy stopped');
    process.exit(0);
  });
});

// Handle errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    log('red', `❌ Port ${HTTPS_PORT} is already in use`);
    log('yellow', 'Try stopping other servers or use a different port');
  } else {
    log('red', `❌ Server error: ${err.message}`);
  }
  process.exit(1);
});