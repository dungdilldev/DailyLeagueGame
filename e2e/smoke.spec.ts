import { expect, test, type Page } from '@playwright/test';

const ROUNDS_PER_DAY = 5;

/** Fails the test on any uncaught page error or console error (e.g. broken data or images). */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

/** Waits until every champion icon has actually loaded, not just been added to the page. */
async function expectIconsLoaded(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page
        .locator('.card__icon')
        .evaluateAll((icons) =>
          icons.every((icon) => icon instanceof HTMLImageElement && icon.naturalWidth > 0),
        ),
    )
    .toBe(true);
}

async function playFullDay(page: Page): Promise<void> {
  for (let round = 1; round <= ROUNDS_PER_DAY; round++) {
    await expect(
      page.getByText(`Round ${String(round)} of ${String(ROUNDS_PER_DAY)}`),
    ).toBeVisible();
    await page.locator('.card').first().click();
    await page
      .getByRole('button', { name: round === ROUNDS_PER_DAY ? 'See results' : 'Next round' })
      .click();
  }
}

test('a full day can be played and the result survives a reload', async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'DailyLeague' })).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(4);
  await expectIconsLoaded(page);
  await page.screenshot({ path: testInfo.outputPath('round.png'), fullPage: true });

  await page.locator('.card').first().click();
  await expect(page.locator('.card__value')).toHaveCount(4);
  await page.screenshot({ path: testInfo.outputPath('reveal.png'), fullPage: true });
  await page.getByRole('button', { name: 'Next round' }).click();

  for (let round = 2; round <= ROUNDS_PER_DAY; round++) {
    await page.locator('.card').first().click();
    await page
      .getByRole('button', { name: round === ROUNDS_PER_DAY ? 'See results' : 'Next round' })
      .click();
  }
  await expect(page.getByRole('heading', { name: /You got/ })).toBeVisible();
  await expect(page.getByText(/Next puzzle in/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('results.png'), fullPage: true });

  await page.reload();
  await expect(page.getByRole('heading', { name: /You got/ })).toBeVisible();

  expect(errors).toEqual([]);
});

test('progress resumes mid-day after a reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('.card').first().click();
  await page.getByRole('button', { name: 'Next round' }).click();
  await expect(page.getByText(`Round 2 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();

  await page.reload();
  await expect(page.getByText(`Round 2 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();
});

test('layout fits the viewport without horizontal scrolling', async ({ page }) => {
  await page.goto('/');
  await playFullDay(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('shows a friendly message when the puzzle is missing', async ({ page }) => {
  await page.route('**/data/puzzles/*.json', (route) => route.fulfill({ status: 404 }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('no puzzle');
});
