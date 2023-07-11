const path = require('path');
const fs = require('fs');
const { defaultSmartUIConfig, defaultScreenshotConfig, defaultSmartUIWebConfig } = require('./utils/config');
var { constants } = require('./utils/constants');

function createConfig(filepath, logger) {
    // default filepath
    filepath = filepath || '.smartui.json';
    let filetype = path.extname(filepath);
    if (filetype != '.json') {
        logger.error(`[smartui] Error: Config file must have .json extension`);
        process.exitCode = constants.ERROR_CATCHALL;
        return
    }

    // verify the file does not already exist
    if (fs.existsSync(filepath)) {
        logger.error(`[smartui] Error: LambdaTest SmartUI config already exists: ${filepath}`);
        process.exitCode = constants.ERROR_CATCHALL;
        return
    }

    // write stringified default config options to the filepath
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(defaultSmartUIConfig, null, 2) + '\n');
    logger.info(`[smartui] Created LambdaTest SmartUI config: ${filepath}`);
};

function createWebStaticConfig(filepath, logger) {
    // default filepath
    filepath = filepath || 'url.json';
    let filetype = path.extname(filepath);
    if (filetype != '.json') {
        logger.error(`[smartui] Error: Config file must have .json extension`);
        process.exitCode = constants.ERROR_CATCHALL;
        return
    }

    // verify the file does not already exist
    if (fs.existsSync(filepath)) {
        logger.error(`[smartui] Error: web-static config already exists: ${filepath}`);
        process.exitCode = constants.ERROR_CATCHALL;
        return
    }

    // write stringified default config options to the filepath
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(defaultScreenshotConfig, null, 2) + '\n');
    logger.info(`[smartui] created web-static config: ${filepath}`);
};

function createWebConfig(filepath, logger) {
    // default filepath
    filepath = filepath || 'smartui-web.json';
    let filetype = path.extname(filepath);
    if (filetype != '.json') {
        logger.error(`[smartui] Error: Web Config file must have .json extension`);
        process.exitCode = constants.ERROR_CATCHALL;
        return
    }

    // verify the file does not already exist
    if (fs.existsSync(filepath)) {
        logger.error(`[smartui] Error: SmartUI Web Config already exists: ${filepath}`);
        process.exitCode = constants.ERROR_CATCHALL;
        return
    }

    // write stringified default config options to the filepath
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(defaultSmartUIWebConfig, null, 2) + '\n');
    logger.info(`[smartui] Created SmartUI Web Config: ${filepath}`);
};

module.exports = { createConfig, createWebStaticConfig, createWebConfig };