// Entry for the static information pages (how to play, about, privacy, the play.html redirect): they need the shared look and the header's settings menu only.
import { enableSettings } from './settingsMenu';
import '../ui/styles.css';
import './site.css';

enableSettings(document);
