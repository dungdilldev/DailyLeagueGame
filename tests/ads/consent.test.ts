import { describe, expect, it } from 'vitest';
import { consentFromTcData, shouldLoadAds } from '../../src/ads/consent';

describe('consentFromTcData', () => {
  it('needs no consent where the law does not apply', () => {
    expect(consentFromTcData({ gdprApplies: false })).toBe('granted');
  });

  it('stays unknown while the message is shown or nothing is reported yet', () => {
    expect(consentFromTcData({ gdprApplies: true, eventStatus: 'cmpuishown' })).toBe('unknown');
    expect(consentFromTcData({ gdprApplies: true })).toBe('unknown');
    expect(consentFromTcData({})).toBe('unknown');
  });

  it.each(['tcloaded', 'useractioncomplete'])('grants on purpose 1 consent (%s)', (eventStatus) => {
    const purpose = { consents: { '1': true } };
    expect(consentFromTcData({ gdprApplies: true, eventStatus, purpose })).toBe('granted');
  });

  it('denies when purpose 1 is declined or missing', () => {
    const declined = { consents: { '1': false } };
    expect(
      consentFromTcData({
        gdprApplies: true,
        eventStatus: 'useractioncomplete',
        purpose: declined,
      }),
    ).toBe('denied');
    expect(consentFromTcData({ gdprApplies: true, eventStatus: 'tcloaded' })).toBe('denied');
  });

  it('does not assume consent when it is unclear whether the law applies', () => {
    expect(consentFromTcData({ eventStatus: 'tcloaded' })).toBe('denied');
  });
});

describe('shouldLoadAds', () => {
  const allowed = { enabled: true, consent: 'granted', isDevBuild: false } as const;

  it('loads only when enabled, consented and not a development build', () => {
    expect(shouldLoadAds(allowed)).toBe(true);
    expect(shouldLoadAds({ ...allowed, enabled: false })).toBe(false);
    expect(shouldLoadAds({ ...allowed, isDevBuild: true })).toBe(false);
    expect(shouldLoadAds({ ...allowed, consent: 'unknown' })).toBe(false);
    expect(shouldLoadAds({ ...allowed, consent: 'denied' })).toBe(false);
  });
});
