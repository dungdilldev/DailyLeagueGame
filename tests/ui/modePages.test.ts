import { describe, expect, it } from 'vitest';
import { modePageHref } from '../../src/ui/modePages';

describe('modePageHref', () => {
  it('names the page after the mode', () => {
    expect(modePageHref('mixed')).toBe('mixed.html');
  });

  it('opens an earlier day on that page', () => {
    expect(modePageHref('lore', '2026-03-04')).toBe('lore.html?date=2026-03-04');
  });
});
