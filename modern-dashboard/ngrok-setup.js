#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const NGROK_CONFIG = {
  port: 3000,
  region: 'us', // Change to your preferred region: us, eu, ap, au, sa, jp, in
  subdomain: null, // Set to your preferred subdomain if you have a paid plan
  authtoken: process.env.NGROK_AUTHTOKEN || null
};

console.log('🌐 Setting up ngrok for Android Agent external testing...');
console.log('');

// Check if ngrok is installed
function checkNgrokInstalled() {
  return new Promise((resolve) => {
    const ngrok = spawn('ngrok', ['version'], { stdio: 'pipe' });
    
    ngrok.on('close', (code) => {
      resolve(code === 0);
    });
    
    ngrok.on('error', () => {
      resolve(false);
    });
  });
}

// Install ngrok if not present
async function installNgrok() {
  console.log('📦 Installing ngrok...');
  
  return new Promise((resolve, reject) => {
    const npm = spawn('npm', ['install', '-g', 'ngrok'], { 
      stdio: 'inherit',
      shell: true 
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        console.log('✅ ngrok installed successfully');
        resolve();
      } else {
        reject(new Error('Failed to install ngrok'));
      }
    });
  });
}

// Set up ngrok auth token
async function setupAuthToken() {
  if (!NGROK_CONFIG.authtoken) {
    console.log('⚠️  No ngrok auth token provided');
    console.log('   You can get a free token at: https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('   Set it with: export NGROK_AUTHTOKEN=your_token_here');
    console.log('   Or add it to your .env file');
    console.log('');
    return false;
  }

  return new Promise((resolve, reject) => {
    const ngrok = spawn('ngrok', ['config', 'add-authtoken', NGROK_CONFIG.authtoken], {
      stdio: 'inherit',
      shell: true
    });
    
    ngrok.on('close', (code) => {
      if (code === 0) {
        console.log('✅ ngrok auth token configured');
        resolve(true);
      } else {
        console.log('❌ Failed to configure auth token');
        resolve(false);
      }
    });
  });
}

// Create ngrok configuration file
function createNgrokConfig() {
  const configDir = path.join(require('os').homedir(), '.ngrok2');
  const configFile = path.join(configDir, 'ngrok.yml');
  
  // Ensure config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const config = `
version: "2"
authtoken: ${NGROK_CONFIG.authtoken || 'YOUR_AUTH_TOKEN_HERE'}
region: ${NGROK_CONFIG.region}
tunnels:
  android-agent:
    proto: http
    addr: ${NGROK_CONFIG.port}
    bind_tls: true
    inspect: true
    ${NGROK_CONFIG.subdomain ? `subdomain: ${NGROK_CONFIG.subdomain}` : ''}
    host_header: localhost:${NGROK_CONFIG.port}
`;

  fs.writeFileSync(configFile, config.trim());
  console.log('✅ ngrok configuration created');
  console.log(`   Config file: ${configFile}`);
}

// Update React Native app configuration
function updateReactNativeConfig(ngrokUrl) {
  const constantsFile = path.join(__dirname, '..', 'react-native-app', 'src', 'constants', 'index.ts');
  
  if (!fs.existsSync(constantsFile)) {
    console.log('⚠️  React Native constants file not found');
    return;
  }

  let content = fs.readFileSync(constantsFile, 'utf8');
  
  // Update the API base URL
  const newBaseUrl = `${ngrokUrl}/api`;
  content = content.replace(
    /BASE_URL:\s*['"`][^'"`]*['"`]/,
    `BASE_URL: '${newBaseUrl}'`
  );

  fs.writeFileSync(constantsFile, content);
  console.log('✅ React Native API configuration updated');
  console.log(`   New API URL: ${newBaseUrl}`);
}

// Start ngrok tunnel
async function startNgrokTunnel() {
  console.log('🚀 Starting ngrok tunnel...');
  console.log(`   Local server: http://localhost:${NGROK_CONFIG.port}`);
  console.log('');

  return new Promise((resolve, reject) => {
    const args = ['http', NGROK_CONFIG.port.toString()];
    
    if (NGROK_CONFIG.region) {
      args.push('--region', NGROK_CONFIG.region);
    }
    
    if (NGROK_CONFIG.subdomain) {
      args.push('--subdomain', NGROK_CONFIG.subdomain);
    }

    const ngrok = spawn('ngrok', args, {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true
    });

    let output = '';
    ngrok.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    // Give ngrok time to start and then extract the URL
    setTimeout(() => {
      // Try to extract the public URL from ngrok's API
      const http = require('http');
      
      const req = http.get('http://localhost:4040/api/tunnels', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const tunnels = JSON.parse(data);
            const tunnel = tunnels.tunnels.find(t => t.proto === 'https');
            if (tunnel) {
              const publicUrl = tunnel.public_url;
              console.log('');
              console.log('🎉 ngrok tunnel is ready!');
              console.log('');
              console.log('📱 External URLs:');
              console.log(`   HTTPS: ${publicUrl}`);
              console.log(`   HTTP:  ${publicUrl.replace('https://', 'http://')}`);
              console.log('');
              console.log('🔧 Testing URLs:');
              console.log(`   Dashboard: ${publicUrl}`);
              console.log(`   Admin Panel: ${publicUrl}/admin`);
              console.log(`   Health Check: ${publicUrl}/api/health`);
              console.log(`   Device Sync: ${publicUrl}/api/device/sync`);
              console.log('');
              console.log('📋 Admin Credentials:');
              console.log('   Username: admin');
              console.log('   Password: admin123');
              console.log('');
              console.log('🔍 ngrok Web Interface: http://localhost:4040');
              console.log('');
              console.log('⚠️  Remember to update your React Native app API URL to:');
              console.log(`   ${publicUrl}`);
              console.log('');
              
              // Update React Native config
              updateReactNativeConfig(publicUrl);
              
              resolve(publicUrl);
            }
          } catch (error) {
            console.log('⚠️  Could not extract ngrok URL automatically');
            console.log('   Check http://localhost:4040 for the public URL');
            resolve(null);
          }
        });
      });
      
      req.on('error', () => {
        console.log('⚠️  Could not connect to ngrok API');
        console.log('   Check http://localhost:4040 for the public URL');
        resolve(null);
      });
    }, 3000);

    ngrok.on('error', (error) => {
      reject(error);
    });
  });
}

// Main setup function
async function setupNgrok() {
  try {
    // Check if ngrok is installed
    const isInstalled = await checkNgrokInstalled();
    if (!isInstalled) {
      await installNgrok();
    } else {
      console.log('✅ ngrok is already installed');
    }

    // Set up auth token
    const tokenConfigured = await setupAuthToken();
    
    // Create configuration
    createNgrokConfig();
    
    console.log('');
    console.log('🎯 Setup complete! Now you can:');
    console.log('');
    console.log('1. Start your Next.js server:');
    console.log('   cd modern-dashboard && npm run dev');
    console.log('');
    console.log('2. In another terminal, start ngrok:');
    console.log('   node ngrok-setup.js start');
    console.log('');
    console.log('3. Test the React Native app with the ngrok URL');
    console.log('');
    
    if (!tokenConfigured) {
      console.log('⚠️  Don\'t forget to set your ngrok auth token for better features!');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Start ngrok if requested
async function startNgrok() {
  try {
    await startNgrokTunnel();
    
    // Keep the process running
    console.log('Press Ctrl+C to stop ngrok');
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping ngrok...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start ngrok:', error.message);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'start') {
  startNgrok();
} else {
  setupNgrok();
}

module.exports = { setupNgrok, startNgrok, updateReactNativeConfig };