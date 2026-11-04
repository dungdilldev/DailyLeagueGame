import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_SCRIPT_URL } from '../../src/ads/config';
import { loadGoogleConsentMessage, showPrivacySettings } from '../../src/ads/googleConsent';

afterEach(() => {
  document.querySelectorAll('script, iframe').forEach((element) => {
    element.remove();
  });
});

const consentScripts = () => document.querySelectorAll(`script[src="${CONSENT_SCRIPT_URL}"]`);
const presenceFrames = () =>
  document.querySelectorAll<HTMLIFrameElement>('iframe[name="googlefcPresent"]');

describe('loadGoogleConsentMessage', () => {
  it("adds the consent script once, without a crossorigin attribute like Google's tag", () => {
    loadGoogleConsentMessage();
    loadGoogleConsentMessage();
    expect(consentScripts()).toHaveLength(1);
    expect(consentScripts()[0]?.hasAttribute('crossorigin')).toBe(false);
  });

  it("adds one hidden frame that tells Google's ad tags the message is present", () => {
    loadGoogleConsentMessage();
    loadGoogleConsentMessage();
    expect(presenceFrames()).toHaveLength(1);
    expect(presenceFrames()[0]?.style.display).toBe('none');
  });
});

describe('showPrivacySettings', () => {
  it("queues the call until Google's script runs it", () => {
    const showRevocationMessage = vi.fn();
    const win = {} as Window & {
      googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void };
    };
    showPrivacySettings(win);
    expect(showRevocationMessage).not.toHaveBeenCalled();

    win.googlefc = { ...win.googlefc, showRevocationMessage };
    const [queued] = win.googlefc.callbackQueue ?? [];
    expect(typeof queued).toBe('function');
    (queued as () => void)();
    expect(showRevocationMessage).toHaveBeenCalledOnce();
  });
});
