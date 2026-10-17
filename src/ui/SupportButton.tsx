/** Tip page of the creator (the slug from the Buy Me a Coffee button settings). */
export const SUPPORT_URL = 'https://buymeacoffee.com/dungdilldev';

/**
 * Looks like the official Buy Me a Coffee button but is a plain link. Their embed script would
 * load a web font from Google on every visit; this sends nothing to a third party until the
 * visitor clicks. Kept outside the game area so it never competes with the answers.
 */
export function SupportButton() {
  return (
    <p class="support">
      <a class="support__link" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        <span class="support__cup" aria-hidden="true">
          ☕
        </span>
        Buy me a coffee
      </a>
    </p>
  );
}
