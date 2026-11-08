/** Line icons on a 24-unit grid, drawn in the current text colour (styled by `.icon`). */
const ICON_PATHS = {
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cross: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2',
  flame: 'M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8Z',
  share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
} as const;

export type IconName = keyof typeof ICON_PATHS;

const DEFAULT_SIZE = 18;

/** Decorative only: the text next to it says the same, so screen readers skip it. */
export function Icon({ name, size = DEFAULT_SIZE }: { name: IconName; size?: number }) {
  return (
    <svg class="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
