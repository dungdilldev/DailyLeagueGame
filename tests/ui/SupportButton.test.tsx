import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { SUPPORT_URL, SupportButton } from '../../src/ui/SupportButton';

afterEach(cleanup);

describe('SupportButton', () => {
  it('links to the Buy Me a Coffee page and opens it in a new tab without leaking the opener', () => {
    render(<SupportButton />);
    const link = screen.getByRole('link', { name: /Buy me a coffee/ });
    expect(SUPPORT_URL).toBe('https://buymeacoffee.com/dungdilldev');
    expect(link.getAttribute('href')).toBe(SUPPORT_URL);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('loads no third-party script, so nothing is sent before the visitor clicks', () => {
    render(<SupportButton />);
    expect(document.querySelectorAll('script[src]')).toHaveLength(0);
  });
});
