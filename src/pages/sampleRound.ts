// The start page's sample round: its question, options and both result lines are plain HTML (so
// crawlers and visitors without JavaScript read them); this only makes the options answerable.

const OPTION_STATE_CLASSES = {
  correct: 'sample-option--correct',
  wrong: 'sample-option--wrong',
  other: 'sample-option--other',
} as const;

type OptionState = keyof typeof OPTION_STATE_CLASSES;

function stateAfterPick(option: HTMLElement, picked: HTMLElement): OptionState {
  if (option.hasAttribute('data-answer')) return 'correct';
  return option === picked ? 'wrong' : 'other';
}

function setHidden(root: HTMLElement, selector: string, hidden: boolean): void {
  for (const element of root.querySelectorAll<HTMLElement>(selector)) element.hidden = hidden;
}

/** Wires up the sample round in `root`: one pick reveals the answer, "Try again" resets it. */
export function enableSampleRound(root: HTMLElement): void {
  const options = [...root.querySelectorAll<HTMLButtonElement>('[data-option]')];

  const show = (picked: HTMLButtonElement | undefined) => {
    for (const option of options) {
      option.classList.remove(...Object.values(OPTION_STATE_CLASSES));
      option.disabled = picked !== undefined;
      option.setAttribute('aria-pressed', String(option === picked));
      if (picked) option.classList.add(OPTION_STATE_CLASSES[stateAfterPick(option, picked)]);
    }
    const answered = picked !== undefined;
    const right = picked?.hasAttribute('data-answer') === true;
    setHidden(root, '[data-sample-prompt]', answered);
    setHidden(root, '[data-sample-result="right"]', !(answered && right));
    setHidden(root, '[data-sample-result="wrong"]', !(answered && !right));
    setHidden(root, '[data-sample-reset]', !answered);
  };

  // The picked option becomes disabled, so keyboard focus moves on instead of being dropped.
  const reset = root.querySelector<HTMLButtonElement>('[data-sample-reset]');
  for (const option of options) {
    option.addEventListener('click', () => {
      show(option);
      reset?.focus();
    });
  }
  reset?.addEventListener('click', () => {
    show(undefined);
    options[0]?.focus();
  });
  show(undefined);
}
