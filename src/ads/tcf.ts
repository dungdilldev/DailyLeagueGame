import { consentFromTcData, type ConsentState, type TcData } from './consent';

type TcfCallback = (data: TcData, success: boolean) => void;
type TcfApi = (command: 'addEventListener', version: 2, callback: TcfCallback) => void;

/** Reports each consent change; returns a function that stops reporting. */
export type ConsentWatcher = (onChange: (consent: ConsentState) => void) => () => void;

const POLL_INTERVAL_MS = 250;
/** Long enough for a slow connection, short enough to give up when the platform is blocked. */
const MAX_POLLS = 80;

function findTcfApi(win: Window): TcfApi | undefined {
  const candidate: unknown = Reflect.get(win, '__tcfapi');
  return typeof candidate === 'function' ? (candidate as TcfApi) : undefined;
}

/**
 * Reads consent through the standard IAB TCF API that certified consent platforms provide. The
 * platform's script defines `__tcfapi` when it runs, which can be after the page does, so this
 * waits for it. If it never appears (blocked, not configured) consent stays unknown and no ad loads.
 */
export function watchTcfConsent(win: Window = window): ConsentWatcher {
  return (onChange) => {
    let stopped = false;
    let polls = 0;

    const listen = (api: TcfApi) => {
      api('addEventListener', 2, (data, success) => {
        if (!stopped && success) onChange(consentFromTcData(data));
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
