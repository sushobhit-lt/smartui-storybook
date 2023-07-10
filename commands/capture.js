const { cleanup } = require('./utils/cleanup')
const { screenshot } = require('./core/screenshot')

async function capture(screenshots, options, logger) {
    cleanup(logger);
    await screenshot(screenshots,options, logger);
    logger.info("screenshot capture completed")
}


module.exports = { capture };
