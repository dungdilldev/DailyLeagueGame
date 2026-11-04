import { consentFromTcData, type ConsentState, type TcData } from './consent';

type TcfCallback = (data: TcData, success: boolean) => void;
type TcfApi = (command: 'addEventListener', version: 2, callback: TcfCallback) => void;

/** Reports each change of a value read from the consent data; returns a function that stops. */
export type TcfWatcher<T> = (onChange: (value: T) => void) => () => void;

export type ConsentWatcher = TcfWatcher<ConsentState>;

const POLL_INTERVAL_MS = 250;
/** Long enough for a slow connection, short enough to give up when the platform is blocked. */
const MAX_POLLS = 80;

function findTcfApi(win: Window): TcfApi | undefined {
  const candidate: unknown = Reflect.get(win, '__tcfapi');
  return typeof candidate === 'function' ? (candidate as TcfApi) : undefined;
}

/**
 * Reads the consent data through the standard IAB TCF API that certified consent platforms
 * provide. The platform's script defines `__tcfapi` when it runs, which can be after the page
 * does, so this waits for it. If it never appears (blocked, not configured) nothing is reported.
 */
function watchTcfData<T>(read: (data: TcData) => T, win: Window): TcfWatcher<T> {
  return (onChange) => {
    let stopped = false;
    let polls = 0;

    const listen = (api: TcfApi) => {
      api('addEventListener', 2, (data, success) => {
        if (!stopped && success) onChange(read(data));
      });
    };

    const poll = win.setInterval(() => {
      polls += 1;
      const api = findTcfApi(win);
      if (api) listen(api);
      if (api || polls >= MAX_POLLS) win.clearInterval(poll);
    }, POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      win.clearInterval(poll);
    };
  };
}

/** The visitor's consent; stays unknown (so no ad loads) while nothing is reported. */
export function watchTcfConsent(win: Window = window): ConsentWatcher {
  return watchTcfData(consentFromTcData, win);
}

/** Whether the consent rules apply to this visitor, and so whether they have a choice to change. */
export function watchConsentRequired(win: Window = window): TcfWatcher<boolean> {
  return watchTcfData((data) => data.gdprApplies === true, win);
}
