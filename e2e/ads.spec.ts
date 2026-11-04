import { expect, test, type Page } from '@playwright/test';
import { collectErrors, playFullDay } from './helpers';

// These run against a build with ads switched on (see playwright.config.ts). No real Google
// request is ever made: the ad script is answered by a stub or blocked, Google's consent script by
// an empty stub, and the consent platform is a fake `__tcfapi` that the test controls.

const AD_SCRIPT_URL = '**/pagead2.googlesyndication.com/**';
const CONSENT_SCRIPT_URL = '**/fundingchoicesmessages.google.com/**';
const BANNER = 'Advertisement';
/** One of the mode pages; they all render the same game, ad slot included. */
const GAME_PAGE = '/stats.html';
/** Every page except the game: none of them may ever load ad code (decided by the owner). */
const PAGES_WITHOUT_ADS = ['/', '/how-to-play.html', '/about.html', '/privacy.html'];

const GRANTED = {
  gdprApplies: true,
  eventStatus: 'useractioncomplete',
  purpose: { consents: { '1': true } },
};
const DECLINED = {
  gdprApplies: true,
  eventStatus: 'useractioncomplete',
  purpose: { consents: { '1': false } },
};

const PENDING = { gdprApplies: true, eventStatus: 'cmpuishown' };
const NOT_REQUIRED = { gdprApplies: false };

type ConsentReport = typeof GRANTED | typeof DECLINED | typeof PENDING | typeof NOT_REQUIRED;

/** Stands in for the consent platform; `initial` is what it reports once a listener is added. */
async function installConsentPlatform(page: Page, initial?: ConsentReport): Promise<void> {
  await page.addInitScript((initialReport) => {
    type Listener = (data: unknown, success: boolean) => void;
    const listeners: Listener[] = [];
    let report: unknown = initialReport;
    Object.assign(window, {
      __tcfapi: (command: string, _version: number, listener: Listener) => {
        if (command !== 'addEventListener') return;
        listeners.push(listener);
        if (report) listener(report, true);
      },
      __reportConsent: (next: unknown) => {
        report = next;
        listeners.forEach((listener) => {
          listener(next, true);
        });
      },
    });
  }, initial);
}

async function reportConsent(page: Page, report: ConsentReport): Promise<void> {
  await page.evaluate((next) => {
    (window as unknown as { __reportConsent: (value: unknown) => void }).__reportConsent(next);
  }, report);
}

/** Answers the ad script with an empty stub and counts how often it was asked for. */
async function stubAdScript(page: Page): Promise<{ requests: () => number }> {
  let count = 0;
  await page.route(AD_SCRIPT_URL, (route) => {
    count += 1;
    return route.fulfill({
      contentType: 'application/javascript',
      body: 'window.adsbygoogle = window.adsbygoogle || [];',
    });
  });
  return { requests: () => count };
}

/** Stands in for Google's consent script: works through its queue and counts reopenings. */
const FAKE_GOOGLE_CONSENT = `
  const googlefc = (window.googlefc = window.googlefc || {});
  const waiting = googlefc.callbackQueue || [];
  googlefc.showRevocationMessage = () => {
    window.__reopened = (window.__reopened || 0) + 1;
  };
  googlefc.callbackQueue = { push: (item) => (typeof item === 'function' ? item() : undefined) };
  waiting.forEach((item) => googlefc.callbackQueue.push(item));
`;
const PRIVACY_SETTINGS = 'Privacy and cookie settings';

let consentScriptRequests = 0;

test.beforeEach(async ({ page }) => {
  consentScriptRequests = 0;
  await page.route(CONSENT_SCRIPT_URL, (route) => {
    consentScriptRequests += 1;
    return route.fulfill({ contentType: 'application/javascript', body: FAKE_GOOGLE_CONSENT });
  });
});

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test('after consent the labelled banner appears below the game and the page still fits', async ({
  page,
}) => {
  const errors = collectErrors(page);
  const script = await stubAdScript(page);
  await installConsentPlatform(page, GRANTED);
  await page.goto(GAME_PAGE);

  const banner = page.getByLabel(BANNER);
  await expect(banner).toBeVisible();
  await expect(banner.getByText(BANNER)).toBeVisible();
  await expect(banner.locator('ins.adsbygoogle')).toHaveAttribute('data-ad-slot', '1234567890');
  expect(script.requests()).toBe(1);

  const bannerTop = (await banner.boundingBox())?.y ?? 0;
  const lastCard = (await page.locator('.card').last().boundingBox()) ?? { y: 0, height: 0 };
  expect(bannerTop).toBeGreaterThan(lastCard.y + lastCard.height);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('the ad arriving does not move the answer cards', async ({ page }) => {
  await stubAdScript(page);
  await installConsentPlatform(page);
  await page.goto(GAME_PAGE);
  await expect(page.locator('.card')).toHaveCount(4);
  const before = await page.locator('.card').first().boundingBox();

  await reportConsent(page, GRANTED);
  await expect(page.getByLabel(BANNER)).toBeVisible();
  expect(await page.locator('.card').first().boundingBox()).toEqual(before);
});

test('declining consent loads no ad script, shows no banner and the day is playable', async ({
  page,
}) => {
  const errors = collectErrors(page);
  const script = await stubAdScript(page);
  await installConsentPlatform(page, DECLINED);
  await page.goto(GAME_PAGE);

  await playFullDay(page);
  await expect(page.getByRole('heading', { name: /You got/ })).toBeVisible();
  await expect(page.getByLabel(BANNER)).toHaveCount(0);
  expect(script.requests()).toBe(0);
  expect(errors).toEqual([]);
});

test('while the consent choice is still open no ad is loaded', async ({ page }) => {
  const script = await stubAdScript(page);
  await installConsentPlatform(page, PENDING);
  await page.goto(GAME_PAGE);
  await expect(page.locator('.card')).toHaveCount(4);
  await page.waitForTimeout(1000);

  await expect(page.getByLabel(BANNER)).toHaveCount(0);
  expect(script.requests()).toBe(0);
});

test('without any consent platform no ad is loaded and the game works', async ({ page }) => {
  const errors = collectErrors(page);
  const script = await stubAdScript(page);
  await page.goto(GAME_PAGE);

  await playFullDay(page);
  await expect(page.getByRole('heading', { name: /You got/ })).toBeVisible();
  await expect(page.getByLabel(BANNER)).toHaveCount(0);
  expect(script.requests()).toBe(0);
  expect(errors).toEqual([]);
});

test('a blocked ad script removes the banner and does not break the game', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route(AD_SCRIPT_URL, (route) => route.abort());
  await installConsentPlatform(page, GRANTED);
  await page.goto(GAME_PAGE);

  await expect(page.getByLabel(BANNER)).toHaveCount(0);
  await playFullDay(page);
  await expect(page.getByRole('heading', { name: /You got/ })).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  expect(pageErrors).toEqual([]);
});

for (const path of PAGES_WITHOUT_ADS) {
  test(`${path} never loads an ad, even with consent`, async ({ page }) => {
    const script = await stubAdScript(page);
    await installConsentPlatform(page, GRANTED);
    await page.goto(path);
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await page.waitForTimeout(1000);

    await expect(page.getByLabel(BANNER)).toHaveCount(0);
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
    expect(script.requests()).toBe(0);
    expect(consentScriptRequests).toBe(0);
    await expect(page.getByRole('button', { name: PRIVACY_SETTINGS })).toHaveCount(0);
  });
}

test('after a "no" the privacy settings link reopens the consent message', async ({ page }) => {
  await stubAdScript(page);
  await installConsentPlatform(page, DECLINED);
  await page.goto(GAME_PAGE);

  await page.getByRole('button', { name: PRIVACY_SETTINGS }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __reopened?: number }).__reopened))
    .toBe(1);
});

test('where no consent is needed ads load and there is no privacy settings link', async ({
  page,
}) => {
  const script = await stubAdScript(page);
  await installConsentPlatform(page, NOT_REQUIRED);
  await page.goto(GAME_PAGE);

  await expect(page.getByLabel(BANNER)).toBeVisible();
  expect(script.requests()).toBe(1);
  await expect(page.getByRole('button', { name: PRIVACY_SETTINGS })).toHaveCount(0);
});

test("the game page loads Google's consent message once, before any ad", async ({ page }) => {
  const script = await stubAdScript(page);
  await page.goto(GAME_PAGE);
  await expect(page.locator('.card')).toHaveCount(4);

  await expect.poll(() => consentScriptRequests).toBe(1);
  await expect(page.locator('iframe[name="googlefcPresent"]')).toHaveCount(1);
  expect(script.requests()).toBe(0);
});
