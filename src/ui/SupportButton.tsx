/** Tip page of the creator (the slug from the Buy Me a Coffee button settings). */
export const SUPPORT_URL = 'https://buymeacoffee.com/dungdilldev';

/**
 * A labelled link to the tip page. A plain link rather than the official embed: their script
 * would load a web font from Google on every visit; this sends nothing to a third party until the
 * visitor clicks. Kept outside the game area so it never competes with the answers.
 */
export function SupportButton() {
  return (
    <p class="support">
      <span class="support__prompt">Enjoying the quiz?</span>
      <a class="support__link" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        <span class="support__badge" aria-hidden="true">
          <svg class="support__cup" viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M4 9h12v4.5A5.5 5.5 0 0 1 10.5 19h-1A5.5 5.5 0 0 1 4 13.5z"
              fill="currentColor"
            />
            <path
              d="M16 10.5h1.25a2.75 2.75 0 0 1 0 5.5H15.5M7.5 3.5v2.5M10 2.5v3.5M12.5 3.5v2.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </span>
        Buy me a coffee
      </a>
    </p>
  );
}
