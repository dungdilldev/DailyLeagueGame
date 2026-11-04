import { CONSENT_SCRIPT_URL } from './config';
import { loadScriptOnce } from './loadScript';

/** The frame name Google's ad tags look for to know that the consent message is already loaded. */
const PRESENCE_FRAME_NAME = 'googlefcPresent';

interface GoogleFc {
  callbackQueue?: unknown[];
  showRevocationMessage?: () => void;
}

type GoogleFcWindow = Window & { googlefc?: GoogleFc };

/**
 * Loads Google's consent message the way Google's own tag does: the script without a
 * `crossorigin` attribute, plus a hidden, empty frame named `googlefcPresent`.
 */
export function loadGoogleConsentMessage(doc: Document = document): void {
  void loadScriptOnce(CONSENT_SCRIPT_URL, doc, null);
  if (doc.querySelector(`iframe[name="${PRESENCE_FRAME_NAME}"]`)) return;

  const frame = doc.createElement('iframe');
  frame.name = PRESENCE_FRAME_NAME;
  frame.style.display = 'none';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');
  doc.body.append(frame);
}

/**
 * Shows Google's consent message again so the visitor can change their choice. Google's script
 * only takes calls through its queue, which it works through once it has loaded.
 */
export function showPrivacySettings(win: GoogleFcWindow = window): void {
  const googlefc = (win.googlefc ??= {});
  (googlefc.callbackQueue ??= []).push(() => {
    win.googlefc?.showRevocationMessage?.();
  });
}
