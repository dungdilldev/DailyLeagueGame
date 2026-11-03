import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ADS_ENABLED, ADSENSE_CLIENT_ID } from '../../src/ads/config';

describe('ad config', () => {
  it('ships switched off until approval', () => {
    expect(ADS_ENABLED).toBe(false);
  });

  it('uses the same publisher as ads.txt', () => {
    const adsTxt = readFileSync('public/ads.txt', 'utf8');
    expect(adsTxt).toContain(ADSENSE_CLIENT_ID.replace('ca-', ''));
  });
});
