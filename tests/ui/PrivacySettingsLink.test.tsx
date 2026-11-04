import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TcfWatcher } from '../../src/ads/tcf';
import { PrivacySettingsLink } from '../../src/ui/PrivacySettingsLink';

afterEach(cleanup);

const LINK = 'Privacy and cookie settings';

/** A consent platform the test controls by hand. */
function fakeRequired() {
  let report: (required: boolean) => void = () => undefined;
  const watch: TcfWatcher<boolean> = (onChange) => {
    report = onChange;
    return () => undefined;
  };
  return {
    watch,
    report: (required: boolean) =>
      act(() => {
        report(required);
      }),
  };
}

describe('PrivacySettingsLink', () => {
  it('shows the link where the consent rules apply and reopens the message on click', async () => {
    const { watch, report } = fakeRequired();
    const onOpen = vi.fn();
    render(
      <PrivacySettingsLink enabled isDevBuild={false} watchRequired={watch} onOpen={onOpen} />,
    );
    await report(true);
    fireEvent.click(screen.getByRole('button', { name: LINK }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('shows nothing where the consent rules do not apply', async () => {
    const { watch, report } = fakeRequired();
    const { container } = render(
      <PrivacySettingsLink enabled isDevBuild={false} watchRequired={watch} />,
    );
    await report(false);
    expect(container.innerHTML).toBe('');
  });

  it('shows nothing before the consent platform has answered', () => {
    const { watch } = fakeRequired();
    const { container } = render(
      <PrivacySettingsLink enabled isDevBuild={false} watchRequired={watch} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it.each([
    { enabled: false, isDevBuild: false },
    { enabled: true, isDevBuild: true },
  ])('shows nothing when ads are off or in development (%o)', async (props) => {
    const { watch, report } = fakeRequired();
    const { container } = render(<PrivacySettingsLink {...props} watchRequired={watch} />);
    await report(true);
    expect(container.innerHTML).toBe('');
  });
});
