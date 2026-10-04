'use strict';
const {defineConfig, devices} = require('@playwright/test');
const port = Number(process.env.REPORT_STUDIO_TEST_PORT || 4173);
module.exports = defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 30_000,
  expect: {timeout: 8_000},
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'firefox', use: {...devices['Desktop Firefox']}}
  ],
  webServer: {
    command: 'node tests/browser/server.cjs',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 15_000
  }
});
