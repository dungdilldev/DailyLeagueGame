import { patchNotes } from '../data/patchNotes';
import { enablePatchNotes } from './patchNotesWindow';
import { enableSettings } from './settingsMenu';
import './header.css';

/** Wires the shared header's buttons. Every page's script calls it first, before drawing anything. */
export function enableHeader(page: Document): void {
  enableSettings(page);
  enablePatchNotes(page, patchNotes);
}
