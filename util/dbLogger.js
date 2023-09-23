const path = require('path');
const fs = require('fs');
const moment = require('moment');
const databaseLogger = (message) => {
    let time = moment().format('LLL');
    const filePath = path.join(__dirname, '..', 'server', 'apiLogger.log');
    fs.appendFileSync(
        filePath,
        message + '  ( Time -> ' + time + ')' + '\n' + '\n'
    );
};

module.exports = databaseLogger;
