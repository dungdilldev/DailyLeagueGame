import { act, cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import type { ConsentState } from '../../src/ads/consent';
import type { ConsentWatcher } from '../../src/ads/tcf';
import { AdSlot } from '../../src/ui/AdSlot';

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('script').forEach((script) => {
    script.remove();
  });
});

/** A consent platform the test controls by hand. */
function fakeConsent() {
  let report: (consent: ConsentState) => void = () => undefined;
  const watch: ConsentWatcher = (onChange) => {
    report = onChange;
    return () => undefined;
  };
  return {
    watch,
    report: (consent: ConsentState) =>
      act(() => {
        report(consent);
      }),
  };
}

const adScripts = () => document.querySelectorAll('script[src*="googlesyndication"]');

describe('AdSlot', () => {
  it('renders nothing and loads nothing when ads are switched off', async () => {
    const { watch, report } = fakeConsent();
    const { container } = render(
      <AdSlot enabled={false} isDevBuild={false} watchConsent={watch} />,
    );
    await report('granted');
    expect(container.innerHTML).toBe('');
    expect(adScripts()).toHaveLength(0);
  });

  it('renders nothing in a development build, even with consent', async () => {
    const { watch, report } = fakeConsent();
    const { container } = render(<AdSlot enabled isDevBuild watchConsent={watch} />);
    await report('granted');
    expect(container.innerHTML).toBe('');
    expect(adScripts()).toHaveLength(0);
  });

  it.each<ConsentState>(['unknown', 'denied'])(
    'renders nothing and loads nothing when consent is %s',
    async (state) => {
      const { watch, report } = fakeConsent();
      const { container } = render(<AdSlot enabled isDevBuild={false} watchConsent={watch} />);
      await report(state);
      expect(container.innerHTML).toBe('');
      expect(adScripts()).toHaveLength(0);
    },
  );

  it('shows the labelled banner and loads the ad script once consent is granted', async () => {
    const { watch, report } = fakeConsent();
    render(<AdSlot enabled isDevBuild={false} watchConsent={watch} />);
    await report('granted');
    expect(screen.getByLabelText('Advertisement')).toBeTruthy();
    expect(adScripts()).toHaveLength(1);
  });

  it('removes the banner when the ad script is blocked', async () => {
    const { watch, report } = fakeConsent();
    const { container } = render(<AdSlot enabled isDevBuild={false} watchConsent={watch} />);
    await report('granted');
    await act(async () => {
      adScripts()[0]?.dispatchEvent(new Event('error'));
      await Promise.resolve();
    });
    expect(container.innerHTML).toBe('');
  });
});
