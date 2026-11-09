import { useEffect, useRef, useState } from 'preact/hooks';
import {
  AD_RAIL_MIN_VIEWPORT_PX,
  AD_SLOT_ID,
  ADS_CONFIGURED,
  ADSENSE_CLIENT_ID,
  ADSENSE_SCRIPT_URL,
} from '../ads/config';
import { shouldLoadAds, type ConsentState } from '../ads/consent';
import { loadGoogleConsentMessage } from '../ads/googleConsent';
import { loadScriptOnce } from '../ads/loadScript';
import { watchTcfConsent, type ConsentWatcher } from '../ads/tcf';

/** `rail`: in the empty margin left of the game (wide windows). `below`: under the game. */
export type AdPlacement = 'rail' | 'below';

interface AdSlotProps {
  enabled?: boolean;
  isDevBuild?: boolean;
  watchConsent?: ConsentWatcher;
  /** Decided once per page: a loaded ad keeps the size it was requested with. */
  placement?: AdPlacement;
}

// One watcher for the page: a new function per render would restart the subscription each time.
const browserConsentWatcher = watchTcfConsent();

function placementForWindow(): AdPlacement {
  const railFits = window.matchMedia(`(min-width: ${String(AD_RAIL_MIN_VIEWPORT_PX)}px)`).matches;
  return railFits ? 'rail' : 'below';
}

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
 * One banner, never on top of, between or next to the answer cards or the Next button: on wide
 * windows in the empty margin left of the game, on narrower ones (phones, tablets) below the game
 * and the support link. Its size per placement is set in `game.css` (one responsive AdSense unit
 * fills whatever box it is given). Only the game pages show ads (see `eslint.config.js`). Renders
 * nothing unless ads are switched on, this is not a development build and the visitor has
 * consented (or consent is not required). If the ad script is blocked or fails, the banner
 * disappears; the game never depends on it.
 */
export function AdSlot({
  enabled = ADS_CONFIGURED,
  isDevBuild = import.meta.env.DEV,
  watchConsent = browserConsentWatcher,
  placement,
}: AdSlotProps) {
  const consent = useConsent(enabled && !isDevBuild, watchConsent);
  const allowed = shouldLoadAds({ enabled, consent, isDevBuild });
  const [scriptFailed, setScriptFailed] = useState(false);
  const requested = useRef(false);
  // Chosen when the banner first shows (consent can come long after the page loaded), then kept.
  const chosenPlacement = useRef<AdPlacement | undefined>(undefined);
  if (allowed) chosenPlacement.current ??= placement ?? placementForWindow();

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
      class={`ad-slot ad-slot--${chosenPlacement.current ?? 'below'}`}
      aria-label="Advertisement"
    >
      <p class="ad-slot__label">Advertisement</p>
      <ins
        class="adsbygoogle ad-slot__unit"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={AD_SLOT_ID}
      />
    </aside>
  );
}
