import { useEffect, useState } from 'preact/hooks';
import { ADS_CONFIGURED } from '../ads/config';
import { showPrivacySettings } from '../ads/googleConsent';
import { watchConsentRequired, type TcfWatcher } from '../ads/tcf';

interface PrivacySettingsLinkProps {
  enabled?: boolean;
  isDevBuild?: boolean;
  watchRequired?: TcfWatcher<boolean>;
  onOpen?: () => void;
}

// One watcher for the page: a new function per render would restart the subscription each time.
const browserRequiredWatcher = watchConsentRequired();

/**
 * Reopens Google's consent message, so a choice can be changed at any time. Shown at the bottom of
 * the game page, the only page with ads, and only where the consent rules apply: elsewhere there
 * is no choice to change and the link would do nothing. It stays after a "no", so that can be
 * changed too. The wording is Google's.
 */
export function PrivacySettingsLink({
  enabled = ADS_CONFIGURED,
  isDevBuild = import.meta.env.DEV,
  watchRequired = browserRequiredWatcher,
  onOpen = () => {
    showPrivacySettings();
  },
}: PrivacySettingsLinkProps) {
  const [required, setRequired] = useState(false);

  useEffect(() => {
    if (!enabled || isDevBuild) return undefined;
    return watchRequired(setRequired);
  }, [enabled, isDevBuild, watchRequired]);

  if (!enabled || isDevBuild || !required) return null;

  return (
    <p class="privacy-settings">
      <button type="button" class="privacy-settings__button" onClick={onOpen}>
        Privacy and cookie settings
      </button>
    </p>
  );
}
