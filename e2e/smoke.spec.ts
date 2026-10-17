import { expect, test, type Page } from '@playwright/test';
import { ARCHIVE_DAYS } from '../src/game/archive';

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

test('shows a friendly message when the game data cannot be loaded', async ({ page }) => {
  await page.route('**/data/champions.json', (route) => route.fulfill({ status: 500 }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Something went wrong');
});

test.describe('day navigation', () => {
  test('goes back to the previous day and returns to today', async ({ page }, testInfo) => {
    await page.goto('/');
    const next = page.getByRole('button', { name: /Next day/ });
    await expect(next).toBeDisabled();
    await expect(page.getByText('Today', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Previous day/ }).click();
    await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-\d{2}$/);
    await expect(page.getByText('Earlier puzzle')).toBeVisible();
    await expect(page.getByText(`Round 1 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('previous-day.png'), fullPage: true });

    // The chosen day survives a reload.
    await page.reload();
    await expect(page.getByText('Earlier puzzle')).toBeVisible();

    await next.click();
    await expect(page.getByText('Today', { exact: true })).toBeVisible();
    await expect(page).not.toHaveURL(/date=/);
  });

  test('can go back only as far as the archive window allows', async ({ page }) => {
    await page.goto('/');
    const previous = page.getByRole('button', { name: /Previous day/ });
    for (let day = 0; day < ARCHIVE_DAYS; day++) await previous.click();
    await expect(previous).toBeDisabled();
  });

  test('ignores a date in the address that is invalid or outside the window', async ({ page }) => {
    for (const value of ['2000-01-01', '2099-01-01', 'garbage']) {
      await page.goto(`/?date=${value}`);
      await expect(page.getByText('Today', { exact: true })).toBeVisible();
    }
  });

  test('keeps progress for today and an earlier day separate', async ({ page }) => {
    await page.goto('/');
    await page.locator('.card').first().click();
    await page.getByRole('button', { name: 'Next round' }).click();
    await expect(page.getByText(`Round 2 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();

    await page.getByRole('button', { name: /Previous day/ }).click();
    await expect(page.getByText(`Round 1 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();

    await page.getByRole('button', { name: /Next day/ }).click();
    await expect(page.getByText(`Round 2 of ${String(ROUNDS_PER_DAY)}`)).toBeVisible();
  });
});
