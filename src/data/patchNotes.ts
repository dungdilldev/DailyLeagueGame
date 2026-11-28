import patchNoteFile from '../../data/patchNotes.json';

/** One day's changes to the site, as the patch notes window shows them. */
export interface PatchNote {
  /** The day the changes went live, YYYY-MM-DD (UTC). */
  date: string;
  changes: string[];
}

/**
 * Hand-written in `data/patchNotes.json`, newest first, and bundled into every page. Not parsed
 * here, so the browser loads no Zod: `PatchNoteFileSchema` checks it in the tests.
 */
export const patchNotes: readonly PatchNote[] = patchNoteFile;
