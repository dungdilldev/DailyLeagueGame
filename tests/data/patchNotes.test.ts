import { describe, expect, it } from 'vitest';
import patchNoteFile from '../../data/patchNotes.json';
import { PatchNoteFileSchema } from '../../src/data/patchNoteSchema';

const note = { date: '2026-11-28', changes: ['Colorblind mode.'] };

describe('PatchNoteFileSchema', () => {
  it('accepts days newest first', () => {
    expect(PatchNoteFileSchema.safeParse([note, { ...note, date: '2026-11-20' }]).success).toBe(
      true,
    );
  });

  it('rejects days out of order or twice, which the window would show as they are', () => {
    expect(PatchNoteFileSchema.safeParse([{ ...note, date: '2026-11-20' }, note]).success).toBe(
      false,
    );
    expect(PatchNoteFileSchema.safeParse([note, note]).success).toBe(false);
  });

  it('rejects a bad date, a day without changes, an empty change and unknown keys', () => {
    expect(PatchNoteFileSchema.safeParse([{ ...note, date: '2026-02-30' }]).success).toBe(false);
    expect(PatchNoteFileSchema.safeParse([{ ...note, changes: [] }]).success).toBe(false);
    expect(PatchNoteFileSchema.safeParse([{ ...note, changes: [' '] }]).success).toBe(false);
    expect(PatchNoteFileSchema.safeParse([{ ...note, version: '1.0' }]).success).toBe(false);
  });
});

describe('data/patchNotes.json', () => {
  it('is valid', () => {
    expect(PatchNoteFileSchema.parse(patchNoteFile)).toEqual(patchNoteFile);
  });
});
