import { GAME_MODES } from '../src/game/gameMode';
import { expect, test } from './test';

/**
 * The browser never validates with Zod: the pages carry data the build already checked, and Zod
 * would be most of their JavaScript. A value import of a Zod module (e.g. `data/schema.ts`) from
 * browser code pulls it back in, even through another module, so this checks what is served.
 */
const ZOD_MARKER = 'ZodError';
const PAGES = ['/', ...GAME_MODES.map((mode) => `/${mode}.html`)];

for (const path of PAGES) {
  test(`${path} loads no Zod`, async ({ page }) => {
    const scripts: Promise<string>[] = [];
    page.on('response', (response) => {
      if (response.request().resourceType() === 'script' && response.ok()) {
        scripts.push(response.text());
      }
    });
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const bodies = await Promise.all(scripts);
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.filter((body) => body.includes(ZOD_MARKER))).toEqual([]);
  });
}
