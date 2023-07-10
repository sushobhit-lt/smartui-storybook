const defaultSmartUIConfig = {
    storybook: {
        browsers: [
            'chrome',
            'firefox',
            'safari',
            'edge'
        ],
        resolutions: [
            [1920, 1080]
        ],
        waitForTimeout: 0,
        include: [],
        exclude: []
    }
};

const defaultScreenshotConfig = [
    {
        "name": "lambdatest-home-page",
        "url": "https://www.lambdatest.com"
    },
    {
        "name": "example-page",
        "url": "https://example.com/"
    }
]

const defaultSmartUIWebConfig = {
    web: {
        browsers: [
            'chrome',
            'firefox',
            'safari',
            'edge'
        ],
        resolutions: [
            [1920, 1080]
        ],
        include: [],
        exclude: []
    }
};
module.exports = { defaultSmartUIConfig, defaultScreenshotConfig, defaultSmartUIWebConfig }