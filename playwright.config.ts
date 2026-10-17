import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
// The endless mode only exists in development builds, so its tests run against the dev server.
const DEV_PORT = 5174;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { baseURL: `http://localhost:${String(PORT)}` },
  projects: [
    { name: 'desktop', testIgnore: /endless/, use: { ...devices['Desktop Chrome'] } },
    // Chromium with a phone-sized viewport and touch: catches mobile layout problems.
    {
      name: 'mobile',
      testIgnore: /endless/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'endless-desktop',
      testMatch: /endless/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${String(DEV_PORT)}` },
    },
    {
      name: 'endless-mobile',
      testMatch: /endless/,
      use: { ...devices['Pixel 7'], baseURL: `http://localhost:${String(DEV_PORT)}` },
    },
  ],
  // Tests run against the production build, which is what gets deployed.
  webServer: [
    {
      command: `npm run build && npm run preview -- --port ${String(PORT)} --strictPort`,
      url: `http://localhost:${String(PORT)}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${String(DEV_PORT)} --strictPort`,
      url: `http://localhost:${String(DEV_PORT)}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
