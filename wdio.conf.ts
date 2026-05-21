import path from 'path';
import fs from 'fs';
import type { Frameworks } from '@wdio/types';
import AllureReporter from '@wdio/allure-reporter';
import { resetAppState } from './src/helpers/adb';

// Standard Android Studio SDK location on Linux/Mac — override via ANDROID_HOME env var
process.env.ANDROID_HOME ??= path.join(process.env.HOME ?? '', 'Android', 'Sdk');
process.env.ANDROID_SDK_ROOT ??= process.env.ANDROID_HOME;

const deviceName = process.env.DEVICE_NAME ?? 'emulator-5554';
const appPath = process.env.APP_PATH
  ? path.resolve(process.env.APP_PATH)
  : path.resolve('./app/chefplanner.apk');

export const config: WebdriverIO.Config = {
  runner: 'local',

  hostname: 'localhost',
  port: 4723,
  path: '/',

  specs: ['./src/specs/**/*.spec.ts'],

  suites: {
    smoke: ['./src/specs/smoke/**/*.spec.ts'],
    regression: ['./src/specs/regression/**/*.spec.ts'],
    e2e: ['./src/specs/e2e/**/*.spec.ts'],
  },

  exclude: [],

  maxInstances: 1,

  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': deviceName,
      'appium:app': appPath,
      'appium:appPackage': 'com.app.chefplanner',
      'appium:appActivity': '.MainActivity',
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:newCommandTimeout': 120,
    },
  ],

  logLevel: 'info',
  bail: 0,

  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: [
    [
      'appium',
      {
        args: { relaxedSecurity: true },
        logFileName: 'appium.log',
      },
    ],
  ],

  framework: 'mocha',

  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'allure-results',
        disableWebdriverStepsReporting: false,
        disableWebdriverScreenshotsReporting: false,
        useCucumberStepReporter: false,
      },
    ],
  ],

  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  beforeTest: async function (test: Frameworks.Test) {
    console.log(`▶ Starting: ${test.title}`);

    if (!test.title.includes('@noReset')) {
      await resetAppState();
    }
  },

  afterTest: async function (
    test: Frameworks.Test,
    _context: unknown,
    { error }: Frameworks.TestResult,
  ) {
    if (!error) return;

    const screenshot = await browser.takeScreenshot();

    AllureReporter.addAttachment(
      `Failure — ${test.title}`,
      Buffer.from(screenshot, 'base64'),
      'image/png',
    );

    const screenshotDir = path.join(process.cwd(), 'screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = test.title.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
    fs.writeFileSync(
      path.join(screenshotDir, `${safeName}_${timestamp}.png`),
      Buffer.from(screenshot, 'base64'),
    );
  },
};