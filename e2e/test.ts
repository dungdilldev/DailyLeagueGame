import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

// Every page loads Cloudflare Web Analytics (src/pages/partials/analytics.html). Tests must not
// count as visits, and from localhost its report fails with a CORS console error.
const ANALYTICS_URL = /cloudflareinsights\.com/;

/** Playwright's `test`, with the analytics beacon answered by an empty script on every page. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(ANALYTICS_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }),
    );
    await use(page);
  },
});
