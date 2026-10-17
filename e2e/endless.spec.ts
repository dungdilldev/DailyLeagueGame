import { expect, test } from '@playwright/test';

test('the endless mode is reachable by address only, and links back to the daily page', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Endless mode/ })).toHaveCount(0);

  await page.goto('/?mode=endless');
  await expect(page.getByRole('heading', { name: 'Endless mode' })).toBeVisible();

  await page.getByRole('link', { name: /Back to the daily puzzle/ }).click();
  await expect(page.getByText(/Round 1 of 5/)).toBeVisible();
});

test('endless questions work, with real icons, and the seed is kept in the address', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/?mode=endless&seed=e2e');
  await expect(page.getByText('Question 1')).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(4);
  await expect
    .poll(() =>
      page
        .locator('.card__icon')
        .evaluateAll((icons) =>
          icons.every((icon) => icon instanceof HTMLImageElement && icon.naturalWidth > 0),
        ),
    )
    .toBe(true);

  await page.locator('.card').first().click();
  // Every kind of question marks the right option once answered; only stat questions show values.
  await expect(page.locator('.card--correct')).toHaveCount(1);
  await page.getByRole('button', { name: 'Next round' }).click();
  await expect(page.getByText('Question 2')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Question 1')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the same seed shows the same first question', async ({ page }) => {
  const firstQuestion = async () => {
    await page.goto('/?mode=endless&seed=repeatable');
    return page.locator('.question').textContent();
  };
  const first = await firstQuestion();
  expect(await firstQuestion()).toBe(first);
});

test('skipping through many questions covers every question and difficulty', async ({
  page,
}, testInfo) => {
  await page.goto('/?mode=endless&seed=coverage');
  await expect(page.getByText('Question 1')).toBeVisible();
  const skip = page.getByRole('button', { name: 'Skip question' });
  const missing = page.locator('.coverage__missing');

  // Random questions are chosen uniformly, so 300 is far more than needed. Stop once all are seen.
  for (let i = 0; i < 300 && (await missing.count()) > 0; i++) {
    await skip.click();
  }

  const total = await page.locator('.coverage tbody tr').count();
  await expect(page.getByText(/questions seen/)).toHaveText(
    new RegExp(`^${String(total)} of ${String(total)}`),
  );
  await expect(missing).toHaveCount(0);
  await page.locator('.coverage').screenshot({ path: testInfo.outputPath('coverage.png') });
});

test('a question that cannot be built at a difficulty says so', async ({ page }) => {
  await page.goto('/?mode=endless&seed=x');
  await page.getByLabel(/^Question/).selectOption('moveSpeed');
  await page.getByLabel(/^Difficulty/).selectOption('0');
  await expect(page.getByText(/cannot be built at this difficulty/)).toBeVisible();
});
