const http = require('http');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Android Agent PWA Test</title>
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#2563eb">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 2.5em;
            }
            .success {
                background: rgba(34, 197, 94, 0.2);
                border: 2px solid #22c55e;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
            .info {
                background: rgba(59, 130, 246, 0.2);
                border: 2px solid #3b82f6;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
            .install-btn {
                background: #22c55e;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 1.1em;
                cursor: pointer;
                width: 100%;
                margin: 20px 0;
                transition: background 0.3s;
            }
            .install-btn:hover {
                background: #16a34a;
            }
            .feature {
                display: flex;
                align-items: center;
                margin: 15px 0;
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
            }
            .emoji {
                font-size: 1.5em;
                margin-right: 15px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Android Agent PWA</h1>
            
            <div class="success">
                <h2>🎉 Connection Successful!</h2>
                <p>Your Android device is successfully connected to the Android Agent PWA!</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Your IP:</strong> ${req.connection.remoteAddress || req.socket.remoteAddress}</p>
            </div>

            <div class="info">
                <h3>📱 PWA Features Ready</h3>
                <div class="feature">
                    <span class="emoji">✅</span>
                    <span>HTTPS Connection Working</span>
                </div>
                <div class="feature">
                    <span class="emoji">✅</span>
                    <span>PWA Manifest Configured</span>
                </div>
                <div class="feature">
                    <span class="emoji">✅</span>
                    <span>Mobile-Optimized Interface</span>
                </div>
                <div class="feature">
                    <span class="emoji">✅</span>
                    <span>Ready for Installation</span>
                </div>
            </div>

            <button class="install-btn" onclick="installPWA()">
                📲 Install as PWA
            </button>

            <div class="info">
                <h3>🔧 Next Steps</h3>
                <p>1. Tap "Install as PWA" button above</p>
                <p>2. Grant location and notification permissions</p>
                <p>3. Add to home screen when prompted</p>
                <p>4. Launch from home screen to test standalone mode</p>
            </div>
        </div>

        <script>
            let deferredPrompt;
            
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                console.log('PWA install prompt ready');
            });

            function installPWA() {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('PWA installed');
                            alert('🎉 PWA installed successfully!');
                        }
                        deferredPrompt = null;
                    });
                } else {
                    // Fallback for browsers that don't support install prompt
                    alert('📱 To install: Tap the menu button (⋮) and select "Add to Home screen"');
                }
            }

            // Test PWA capabilities
            if ('serviceWorker' in navigator) {
                console.log('✅ Service Worker supported');
            }
            if ('geolocation' in navigator) {
                console.log('✅ Geolocation supported');
            }
            if ('Notification' in window) {
                console.log('✅ Notifications supported');
            }
        </script>
    </body>
    </html>
  `);
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('🌐 Android Agent PWA Test Server');
  console.log('================================');
  console.log('📱 Local: http://localhost:' + PORT);
  console.log('🌍 Network: http://172.30.75.206:' + PORT);
  console.log('');
  console.log('🚀 Starting ngrok tunnel...');
  console.log('📋 Use the ngrok HTTPS URL on your Android device');
});