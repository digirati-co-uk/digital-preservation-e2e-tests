import { defineConfig, devices } from '@playwright/test';
import { frontendSessionFile } from './tests/auth';
import 'dotenv/config';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter:
    process.env.CI ?
      [
        [
          './support/SlackReporter.ts',
          {
            channel: process.env.SLACK_CHANNEL,
            token: process.env.SLACK_TOKEN,
          },
        ],
        ['html'],
        ['list']
      ]:
      [
        ['html'],
        ['list']
      ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-all-retries',
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'frontend-setup',
      testDir: './tests/setup',
      testMatch: /frontend\.setup\.ts/,
      use: {
        baseURL: process.env.FRONTEND_BASE_URL,
        ...devices['Desktop Chrome'] ,
      },
    },
    {
      dependencies: ['frontend-setup'],
      name: 'frontendtests',
      testDir: './tests/containerflows',
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.FRONTEND_BASE_URL,
        storageState: frontendSessionFile,
      },
    },
    {
      name: 'api_tests',
      testDir: './tests/apiTests',
      testMatch: /.*\.spec\.ts/,
      use: {
      },
    },
    {
      dependencies: ['frontend-setup'],
      name: 'loadtests_ui',
      testDir: './tests/loadtesting_ui',
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.FRONTEND_BASE_URL,
        storageState: frontendSessionFile,
      }
    },
      {
        name: 'loadtests_api',
        testDir: './tests/loadtesting_api',
        testMatch: /.*\.spec\.ts/,
        use: {
          baseURL: process.env.PRESERVATION_API_ENDPOINT,
          contextOptions: {
          ignoreHTTPSErrors: true,
        },
        },
        
    },
  ],
});
