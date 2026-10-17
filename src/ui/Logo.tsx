/** The site mark: a gold hextech-style hexagon around a diamond. Decorative only. */
export function Logo() {
  return (
    <svg class="logo" viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <defs>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f0e6d2" />
          <stop offset="0.5" stop-color="#c8aa6e" />
          <stop offset="1" stop-color="#785a28" />
        </linearGradient>
      </defs>
      <path
        d="M24 3 42 13.5v21L24 45 6 34.5v-21Z"
        fill="#0a1428"
        stroke="url(#logo-gold)"
        stroke-width="2.5"
      />
      <path d="M24 12 34 24 24 36 14 24Z" fill="none" stroke="#0ac8b9" stroke-width="2" />
      <path d="M24 18 29 24 24 30 19 24Z" fill="url(#logo-gold)" />
    </svg>
  );
}
