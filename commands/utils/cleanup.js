const fs = require('fs');

function cleanup(logger) {
    logger.debug("cleanup initiated")
    fs.rm('doms', { recursive: true }, (err) => {
        if (err) {
            // return logger.error(err);
        }
    });
    return true
}

function cleanFile(logger, filePath) {
    logger.debug("cleanFile filePath :" + filePath)
    fs.rm(filePath, (err) => {
        if (err) {
            return logger.error(err);
        }
    });
    return true
}

module.exports = { cleanup, cleanFile }