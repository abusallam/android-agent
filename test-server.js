const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Network Test</title></head>
      <body>
        <h1>🎉 Network Connection Working!</h1>
        <p>If you can see this, your network connection is working.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Your IP: ${req.connection.remoteAddress}</p>
        <p>User Agent: ${req.headers['user-agent']}</p>
      </body>
    </html>
  `);
});

server.listen(8080, '0.0.0.0', () => {
  console.log('🌐 Test server running on http://172.30.75.206:8080');
  console.log('📱 Try accessing this URL from your Android device');
});