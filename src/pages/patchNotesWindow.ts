// The patch notes window opened from the shared header (partials/header.html). A modal
// `<dialog>`, so focus, Escape and the backdrop are the browser's; this fills it and opens it.
import type { PatchNote } from '../data/patchNotes';
import { formatLongDate } from '../game/date';

/** Writes one section per day, its date as the heading and its changes as a list. */
export function renderPatchNotes(container: Element, notes: readonly PatchNote[]): void {
  container.replaceChildren(
    ...notes.map((note) => patchNoteSection(container.ownerDocument, note)),
  );
}

function patchNoteSection(page: Document, note: PatchNote): HTMLElement {
  const section = page.createElement('section');
  section.className = 'patch-note';
  const heading = page.createElement('h3');
  heading.className = 'patch-note__date';
  const time = page.createElement('time');
  time.dateTime = note.date;
  time.textContent = formatLongDate(note.date);
  heading.append(time);
  const list = page.createElement('ul');
  list.className = 'patch-note__changes';
  list.append(
    ...note.changes.map((change) => {
      const item = page.createElement('li');
      item.textContent = change;
      return item;
    }),
  );
  section.append(heading, list);
  return section;
}

/** Fills the window and wires its open and close buttons; a click on the backdrop closes it too. */
export function enablePatchNotes(page: Document, notes: readonly PatchNote[]): void {
  const dialog = page.querySelector('[data-patch-notes]');
  const openButton = page.querySelector('[data-patch-notes-open]');
  const list = dialog?.querySelector('[data-patch-notes-list]');
  if (!(dialog instanceof HTMLDialogElement) || !openButton || !list) return;
  renderPatchNotes(list, notes);

  openButton.addEventListener('click', () => {
    dialog.showModal();
  });
  dialog.querySelector('[data-patch-notes-close]')?.addEventListener('click', () => {
    dialog.close();
  });
  // The window's frame fills the dialog, so a click on the dialog itself is on the backdrop.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
