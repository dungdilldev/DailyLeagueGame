import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { baseURL: `http://localhost:${String(PORT)}` },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Chromium with a phone-sized viewport and touch: catches mobile layout problems.
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  // Tests run against the production build, which is what gets deployed.
  webServer: {
    command: `npm run build && npm run preview -- --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
