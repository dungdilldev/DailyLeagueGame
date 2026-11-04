const adsFlag: unknown = import.meta.env['VITE_ADS_ENABLED'];
const slotId: unknown = import.meta.env['VITE_AD_SLOT_ID'];

/**
 * Master switch, set per build with `VITE_ADS_ENABLED=true`. Stays off until AdSense has approved
 * the site and the consent message is published; with it off nothing about ads is rendered or
 * loaded. The end-to-end tests build a second copy with it on.
 */
export const ADS_ENABLED = adsFlag === 'true';

/** Publisher id; the same account as the line in `public/ads.txt`. */
const PUBLISHER_ID = 'pub-4796032502172571';
export const ADSENSE_CLIENT_ID = `ca-${PUBLISHER_ID}`;

/** Id of the banner ad unit, created in AdSense once the site is approved (`VITE_AD_SLOT_ID`). */
export const AD_SLOT_ID = typeof slotId === 'string' ? slotId : '';

/** Ads are on for this build: switched on and an ad unit to show. */
export const ADS_CONFIGURED = ADS_ENABLED && AD_SLOT_ID !== '';

/**
 * Script of Google's consent message (a certified consent platform, set up under "Privacy &
 * messaging" in AdSense). The ad script would bring the message along, but it may only load after
 * consent, so the message is loaded on its own first, with the address Google's own tag uses.
 */
export const CONSENT_SCRIPT_URL = `https://fundingchoicesmessages.google.com/i/${PUBLISHER_ID}?ers=1`;

export const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

/** Space reserved for the banner, so the page below it never jumps when the ad arrives. */
export const AD_SLOT_MIN_HEIGHT_PX = 100;
