import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE_PATH } from './tests/e2e/global-setup';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: require.resolve('./tests/e2e/global-setup'),

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: 'https://local.banditbool.com:3000',
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
    navigationTimeout: 30000,
    storageState: STORAGE_STATE_PATH,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
