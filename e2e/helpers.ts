import { expect, type Page } from '@playwright/test';

export const ROUNDS_PER_DAY = 5;

/** Fails the test on any uncaught page error or console error (e.g. broken data or images). */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

export async function playFullDay(page: Page): Promise<void> {
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
