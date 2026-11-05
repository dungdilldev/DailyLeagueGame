import { describe, expect, it } from 'vitest';
import { modePageHref } from '../../src/ui/modePages';

describe('modePageHref', () => {
  it('names the page after the mode', () => {
    expect(modePageHref('mixed')).toBe('mixed.html');
  });
});
