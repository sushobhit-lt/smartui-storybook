
const playwright = require('playwright');
const { getLastCommit } = require('../utils/git')
const { default: axios } = require('axios')
var { constants } = require('../utils/constants');
const { shortPolling } = require('../utils/polling');
const { cleanFile ,cleanup} = require('../utils/cleanup')

const formData = require('form-data');
const fs = require('fs');
const { defaultSmartUIWebConfig } = require('../utils/config')
const EDGE_CHANNEL = 'msedge';

async function screenshot(screenshots, options, logger) {
    logger.debug("process screenshot started")

    // Create Build Call
    buildRes = await createBuild(options, logger);

    logger.debug(buildRes)
    for (const screenshot of screenshots) {

        if (screenshots.indexOf(screenshot) === screenshots.length - 1) {
            options.lastScreenshot = true
        }

        logger.debug(screenshot)
        let id = generateId(screenshot.name)
        logger.debug(id)
        screenshot.id = id
        await captureScreenshots(screenshot, buildRes.data, options, logger);
    }


}

async function createBuild(options, logger) {
    let commit = await getLastCommit();

    let payload = {
        projectToken: process.env.PROJECT_TOKEN,
        git: {
            branch: commit.branch,
            commitId: commit.shortHash,
            commitAuthor: commit.author.name,
            commitMessage: commit.subject,
            githubURL: process.env.GITHUB_URL || '',
        }
    }

    return (await axios.post(new URL(constants[options.env].CREATE_BUILD_PATH, constants[options.env].BASE_URL).href, payload)
        .then(async function (response) {
            logger.info('Build Created ' + response);
            return response
        })
        .catch(function (error) {
            if (error && error.response && error.response.data) {
                logger.debug(error.response.data);
                logger.info('Build Created');
                return error.response.data;
            }
            if (error.response) {
                logger.error('[smartui] Build creation failed: response: ', error.response.data.error?.message);
            } else {
                logger.error('[smartui] Build creation failed: Error: ', error);
            }
            process.exitCode = constants.ERROR_CATCHALL;
        }))
}

async function captureScreenshots(screenshot, build, options, logger) {
    logger.debug("captureScreenshots")
    try {
        const browsers = [];
        const viewports = [];

        let webConfig = options.config ? options.config : defaultSmartUIWebConfig.web;

        webConfig.browsers.forEach(element => {
            browsers.push(element.toLowerCase());
        });

        webConfig.resolutions.forEach(element => {
            viewports.push({ width: element[0], height: element[1] });
        });
        logger.info(browsers)
        logger.info(viewports)

        logger.info("Navigate URL : " + screenshot.url)
       
        for (const browserName of browsers) {
            logger.info("Processing for browser : " + browserName)
            let btype;
            let launchOptions = { headless: true };
            if (browserName == "chrome") {
                btype = "chromium";
            } else if (browserName == "safari") {
                btype = "webkit";
            } else if (browserName == "edge") {
                btype = "chromium";
                launchOptions.channel = EDGE_CHANNEL;
            } else {
                btype = browserName;
            }

            logger.debug(launchOptions)
            const browser = await playwright[btype].launch(launchOptions);
            const context = await browser.newContext();
            const page = await context.newPage();
            logger.debug("waitForTimeout : " + screenshot.waitForTimeout)

            await page.goto(screenshot.url);
            let lastBrowser = false
            if (browsers.indexOf(browserName) === browsers.length - 1) {
                lastBrowser = true
            }

            if (screenshot.waitForTimeout) {
                logger.debug("waitForTimeout : " + screenshot.waitForTimeout)
                // Add the wait timeout
                await page.waitForTimeout(screenshot.waitForTimeout);
            }

            for (const viewport of viewports) {

                let lastViewport = false
                if (viewports.indexOf(viewport) === viewports.length - 1) {
                    lastViewport = true
                }

                await page.setViewportSize(viewport);
                const { width, height } = viewport;
                const spath = `doms/${screenshot.id}/${browserName}-${width}x${height}-${screenshot.id}.png`
                await page.screenshot({ path: spath, fullPage: true });

                let payload = {
                    spath : spath,
                    browser: browserName,
                    resolution: `${width}x${height}`
                }
                if (lastViewport && lastBrowser && options.lastScreenshot) {
                    payload.completed = true;
                }

                upload(screenshot, build, options, logger, payload)
            }

            await browser.close();
        }
        logger.debug('Screenshots captured successfully.');
    } catch (error) {
        logger.error('Error capturing screenshots:');
        logger.error(error)
    }
}

function generateId(str) {
    const lowercaseStr = str.toLowerCase();
    const noSpacesStr = lowercaseStr.replace(/\s/g, '-');
    return noSpacesStr;
}


async function upload(screenshot, build, options, logger, payload) {
    // Create form
    const form = new formData();
    logger.debug("Upload screenshot started")
    logger.debug(screenshot)
    logger.debug(payload)


    const file = fs.readFileSync(payload.spath);
    form.append('screenshots', file, `${screenshot.name}.png`);

    form.append('projectToken', process.env.PROJECT_TOKEN);
    form.append('browser', payload.browser);
    form.append('resolution', payload.resolution);
    form.append('buildId', build.buildId);
    form.append('buildName', build.buildName);
    form.append('screenshotName', screenshot.name);
    if (build.baseline) {
        form.append('baseline', "true");
    }
    if (payload && payload.completed) {
        form.append('completed', "true");
    }

    await axios.post(new URL(constants[options.env].SCREENSHOT_PATH, constants[options.env].BASE_URL).href, form, {
        headers: {
            ...form.getHeaders()
        }
    }).then(async function (response) {
        logger.debug("uploaded success");
        logger.debug(response.data)
        if (response.data) {
            logger.debug("Screenshot uploaded")
            cleanFile(logger,payload.spath)
        }

        if (payload && payload.completed) {
            logger.info('[smartui] Build URL: ' + response.data.buildURL);
            logger.info('[smartui] Build in progress...');
            cleanup(logger);
            await shortPolling(response.data.buildId, 0, options);
        }
    }).catch(function (error) {
        if (error.response) {
            logger.error('[smartui] Screenshot failed error response : ' + error.response.data.message);
        } else {
            logger.error('[smartui] Screenshot failed: Error: ' + error.message);
        }
    });
}

module.exports = { screenshot }