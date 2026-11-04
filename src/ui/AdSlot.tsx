import { useEffect, useRef, useState } from 'preact/hooks';
import {
  AD_SLOT_ID,
  AD_SLOT_MIN_HEIGHT_PX,
  ADS_CONFIGURED,
  ADSENSE_CLIENT_ID,
  ADSENSE_SCRIPT_URL,
} from '../ads/config';
import { shouldLoadAds, type ConsentState } from '../ads/consent';
import { loadGoogleConsentMessage } from '../ads/googleConsent';
import { loadScriptOnce } from '../ads/loadScript';
import { watchTcfConsent, type ConsentWatcher } from '../ads/tcf';

interface AdSlotProps {
  enabled?: boolean;
  isDevBuild?: boolean;
  watchConsent?: ConsentWatcher;
}

// One watcher for the page: a new function per render would restart the subscription each time.
const browserConsentWatcher = watchTcfConsent();

type AdsWindow = Window & { adsbygoogle?: unknown[] };

function useConsent(enabled: boolean, watchConsent: ConsentWatcher): ConsentState {
  const [consent, setConsent] = useState<ConsentState>('unknown');
  useEffect(() => {
    if (!enabled) return undefined;
    // The consent message has to run first: it is what lets the visitor choose.
    loadGoogleConsentMessage();
    return watchConsent(setConsent);
  }, [enabled, watchConsent]);
  return consent;
}

/**
 * One banner between the game and the footer, below the support link so it is never next to the
 * answer cards or the Next button. Only the game page shows ads (see `eslint.config.js`). Renders
 * nothing unless ads are switched on, this is not a development build and the visitor has
 * consented (or consent is not required). If the ad script is blocked or fails, the banner
 * disappears; the game never depends on it.
 */
export function AdSlot({
  enabled = ADS_CONFIGURED,
  isDevBuild = import.meta.env.DEV,
  watchConsent = browserConsentWatcher,
}: AdSlotProps) {
  const consent = useConsent(enabled && !isDevBuild, watchConsent);
  const allowed = shouldLoadAds({ enabled, consent, isDevBuild });
  const [scriptFailed, setScriptFailed] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    if (!allowed || requested.current) return;
    requested.current = true;
    void loadScriptOnce(ADSENSE_SCRIPT_URL).then((loaded) => {
      if (!loaded) {
        setScriptFailed(true);
        return;
      }
      const adsWindow: AdsWindow = window;
      (adsWindow.adsbygoogle ??= []).push({});
    });
  }, [allowed]);

  if (!allowed || scriptFailed) return null;

  return (
    <aside
      class="ad-slot"
      aria-label="Advertisement"
      style={{ minHeight: `${String(AD_SLOT_MIN_HEIGHT_PX)}px` }}
    >
      <p class="ad-slot__label">Advertisement</p>
      <ins
        class="adsbygoogle ad-slot__unit"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={AD_SLOT_ID}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
