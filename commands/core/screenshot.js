
const playwright = require('playwright');
const { getLastCommit } = require('../utils/git')
const { default: axios } = require('axios')
var { constants } = require('../utils/constants');
const { shortPolling } = require('../utils/polling');
const formData = require('form-data');
const fs = require('fs');



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
            logger.info('Build Created '+ response);
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
        const browserTypes = ['chromium', 'firefox'];
        const viewports = [
            { width: 360, height: 640 },
            { width: 1366, height: 768 },
            { width: 1920, height: 1080 }
        ];

        logger.info("Navigate URL : " + screenshot.url)

        for (const browserType of browserTypes) {
            const browser = await playwright[browserType].launch();
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto(screenshot.url);
            let lastBrowser = false
            if (browserTypes.indexOf(browserType) === browserTypes.length - 1) {
                lastBrowser = true
            }

            if (screenshot.waitForTimeout) {
                logger.info("waitForTimeout : " + screenshot.waitForTimeout)
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
                const spath = `doms/${screenshot.id}/${browserType}-${width}x${height}-${screenshot.id}.png`
                await page.screenshot({ path: spath, fullPage: true });

                options.spath = spath
                options.browser = browserType
                options.resolution = `${width}x${height}`
                let completed = false;
                if (lastViewport && lastBrowser && options.lastScreenshot) {
                    completed = true;
                }

                upload(screenshot, build, options, logger, completed)
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


async function upload(screenshot, build, options, logger, completed) {
    // Create form
    if (options.browser == "chromium") {
        options.browser = "chrome";
    }

    const form = new formData();
    logger.info("Upload screenshot started")
    logger.debug(screenshot)
    logger.debug(options)


    const file = fs.readFileSync(options.spath);
    form.append('screenshots', file, `${screenshot.name}.png`);

    form.append('projectToken', process.env.PROJECT_TOKEN);
    form.append('browser', options.browser);
    form.append('resolution', options.resolution);
    form.append('buildId', build.buildId);
    form.append('buildName', build.buildName);
    form.append('screenshotName', screenshot.name);
    if (completed) {
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
            logger.info("Screenshot uploaded")
        }

        if (completed) {
            logger.info('[smartui] Build URL: ' + response.data.buildURL);
            logger.info('[smartui] Build in progress...');
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