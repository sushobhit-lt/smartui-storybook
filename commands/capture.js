// const { fetchDOM, upload } = require('./utils/dom')
const { cleanup } = require('./utils/cleanup')
const { screenshot } = require('./core/screenshot')


async function capture(screenshots, options, logger) {
    cleanup(logger);
    await screenshot(screenshots,options, logger);

    // await fetchDOM(screenshots,options, logger);
    // await upload(screenshots, options, logger);
}


module.exports = { capture };
