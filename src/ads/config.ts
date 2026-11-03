const adsFlag: unknown = import.meta.env['VITE_ADS_ENABLED'];
const slotId: unknown = import.meta.env['VITE_AD_SLOT_ID'];

/**
 * Master switch, set per build with `VITE_ADS_ENABLED=true`. Stays off until AdSense has approved
 * the site and the consent message is published; with it off nothing about ads is rendered or
 * loaded. The end-to-end tests build a second copy with it on.
 */
export const ADS_ENABLED = adsFlag === 'true';

/** Publisher id; the same account as the line in `public/ads.txt`. */
export const ADSENSE_CLIENT_ID = 'ca-pub-4796032502172571';

/** Id of the banner ad unit, created in AdSense once the site is approved (`VITE_AD_SLOT_ID`). */
export const AD_SLOT_ID = typeof slotId === 'string' ? slotId : '';

/**
 * Script of the consent message (a certified consent platform, set up under "Privacy & messaging"
 * in AdSense). Empty until it exists: without one no consent can be read, so no ad is ever loaded.
 */
export const CONSENT_SCRIPT_URL: string = '';

export const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

/** Space reserved for the banner, so the page below it never jumps when the ad arrives. */
export const AD_SLOT_MIN_HEIGHT_PX = 100;
