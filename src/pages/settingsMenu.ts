// The gear menu in the shared header (partials/header.html): opens and closes the settings panel
// and holds the colorblind switch.
import {
  applySavedColorblindMode,
  isColorblindModeOn,
  setColorblindMode,
} from '../ui/colorblindMode';

/** Applies the saved settings and wires the header's settings menu (called by `enableHeader`). */
export function enableSettings(page: Document): void {
  applySavedColorblindMode();
  const menu = page.querySelector('[data-settings]');
  const gear = menu?.querySelector('.settings__gear');
  const panel = menu?.querySelector('.settings__panel');
  if (!menu || !(gear instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;
  enableOpening(page, menu, gear, panel);

  const toggle = panel.querySelector('[data-colorblind-toggle]');
  if (!(toggle instanceof HTMLInputElement)) return;
  toggle.checked = isColorblindModeOn();
  toggle.addEventListener('change', () => {
    setColorblindMode(toggle.checked);
  });
}

/** The gear opens and closes the panel; a click elsewhere or Escape closes it too. */
function enableOpening(
  page: Document,
  menu: Element,
  gear: HTMLButtonElement,
  panel: HTMLElement,
): void {
  const isOpen = () => gear.getAttribute('aria-expanded') === 'true';
  const setOpen = (open: boolean) => {
    panel.hidden = !open;
    gear.setAttribute('aria-expanded', String(open));
  };
  gear.addEventListener('click', () => {
    setOpen(!isOpen());
  });
  page.addEventListener('click', (event) => {
    if (isOpen() && event.target instanceof Node && !menu.contains(event.target)) {
      setOpen(false);
    }
  });
  page.addEventListener('keydown', (event) => {
    if (!isOpen() || event.key !== 'Escape') return;
    setOpen(false);
    gear.focus();
  });
}
