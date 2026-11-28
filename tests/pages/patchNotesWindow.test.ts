import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { enablePatchNotes, renderPatchNotes } from '../../src/pages/patchNotesWindow';

// The real shared header, so the test fails if its markup and the script stop matching.
const HEADER = readFileSync('src/pages/partials/header.html', 'utf8');

const NOTES = [
  { date: '2026-11-28', changes: ['Colorblind mode.', 'Patch notes.'] },
  { date: '2026-11-19', changes: ['Pages load faster.'] },
];

function sections(container: Element) {
  return [...container.querySelectorAll('.patch-note')].map((section) => ({
    date: section.querySelector('time')?.dateTime,
    heading: section.querySelector('h3')?.textContent,
    changes: [...section.querySelectorAll('li')].map((item) => item.textContent),
  }));
}

describe('renderPatchNotes', () => {
  it('writes one section per day, in file order, with the date as heading and the changes below', () => {
    const container = document.createElement('div');
    renderPatchNotes(container, NOTES);
    expect(sections(container)).toEqual([
      {
        date: '2026-11-28',
        heading: 'November 28, 2026',
        changes: ['Colorblind mode.', 'Patch notes.'],
      },
      { date: '2026-11-19', heading: 'November 19, 2026', changes: ['Pages load faster.'] },
    ]);
  });

  it('shows the text as text, never as markup', () => {
    const container = document.createElement('div');
    renderPatchNotes(container, [{ date: '2026-11-28', changes: ['<b>bold</b>'] }]);
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('li')?.textContent).toBe('<b>bold</b>');
  });
});

describe('enablePatchNotes', () => {
  beforeEach(() => {
    document.body.innerHTML = HEADER;
  });

  it('fills the window in the header', () => {
    enablePatchNotes(document, NOTES);
    const list = document.querySelector('[data-patch-notes] [data-patch-notes-list]');
    if (!list) throw new Error('The header has no patch notes list');
    expect(sections(list).map((section) => section.date)).toEqual(['2026-11-28', '2026-11-19']);
  });
});
