export type ConsentState = 'unknown' | 'granted' | 'denied';

/** The part of the IAB TCF "TCData" object that the decision needs. */
export interface TcData {
  gdprApplies?: boolean;
  eventStatus?: string;
  purpose?: { consents?: Readonly<Record<string, boolean>> };
}

/** TCF purpose 1: "store and/or access information on a device", which every ad needs. */
const STORE_AND_ACCESS_PURPOSE = '1';
/** The consent platform has a final answer: stored from an earlier visit, or just given. */
const DECIDED_EVENT_STATUSES: readonly string[] = ['tcloaded', 'useractioncomplete'];

/** Turns what the consent platform reports into one of three states. Anything unclear is `unknown`. */
export function consentFromTcData(data: TcData): ConsentState {
  if (data.gdprApplies === false) return 'granted';
  if (!data.eventStatus || !DECIDED_EVENT_STATUSES.includes(data.eventStatus)) return 'unknown';
  return data.purpose?.consents?.[STORE_AND_ACCESS_PURPOSE] === true ? 'granted' : 'denied';
}

interface AdLoadConditions {
  enabled: boolean;
  consent: ConsentState;
  isDevBuild: boolean;
}

/** Ads load only when switched on, outside development builds and with consent (or none needed). */
export function shouldLoadAds({ enabled, consent, isDevBuild }: AdLoadConditions): boolean {
  return enabled && !isDevBuild && consent === 'granted';
}
