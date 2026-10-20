/** Tip page of the creator (the slug from the Buy Me a Coffee button settings). */
export const SUPPORT_URL = 'https://buymeacoffee.com/dungdilldev';

/**
 * A round coffee-cup link to the tip page. A plain link rather than the official embed: their
 * script would load a web font from Google on every visit; this sends nothing to a third party
 * until the visitor clicks. Kept outside the game area so it never competes with the answers.
 */
export function SupportButton() {
  return (
    <p class="support">
      <a
        class="support__link"
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buy me a coffee"
        title="Buy me a coffee"
      >
        <svg
          class="support__cup"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
          <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
          <path d="M8 3v2M11 3v2M14 3v2" />
        </svg>
      </a>
    </p>
  );
}
