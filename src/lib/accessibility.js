/* Student-controlled display preferences — spec.md F26 ("Adjustable text:
   size, spacing, weight, colour, contrast") and DESIGN.md section 10
   ("Text scaling: student-controlled, up to 200% without layout break").

   Stored in localStorage, not Firestore: this is a device preference, not
   content, so it doesn't need to sync across devices or survive a
   signed-out session on a different machine. Read-aloud (Step.jsx)
   intentionally makes the same call — no Firestore round-trip for a UI
   preference. If this becomes a per-child, cross-device need later, this
   is the one function (loadDisplayPrefs) that would change to read from
   the child's profile doc instead. */

const STORAGE_KEY = 'bloom.display';

export const SCALE_OPTIONS = [100, 125, 150, 175, 200];

export const TINT_OPTIONS = [
  { value: null, label: 'Default' },
  { value: 'sand', label: 'Sand' },
  { value: 'mist', label: 'Mist' },
  { value: 'rose', label: 'Rose' },
];

const DEFAULTS = { scale: 100, spacing: 'default', weight: 'default', tint: null };

export function loadDisplayPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveDisplayPrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Preference just doesn't persist across reloads — nothing else in the
    // app depends on this succeeding (hard rule 1: no error states).
  }
}

/* Applies to <html> so every screen picks it up — Entry, Step, MyWork,
   AdultView — without any of them needing to know these preferences exist.
   Tints reuse the existing [data-tint] CSS already defined in index.css;
   spacing/weight add two new attribute hooks next to it, same pattern. */
export function applyDisplayPrefs(prefs) {
  const root = document.documentElement;
  root.style.fontSize = `${prefs.scale}%`;

  if (prefs.tint) root.setAttribute('data-tint', prefs.tint);
  else root.removeAttribute('data-tint');

  if (prefs.spacing === 'wide') root.setAttribute('data-spacing', 'wide');
  else root.removeAttribute('data-spacing');

  if (prefs.weight === 'bold') root.setAttribute('data-weight', 'bold');
  else root.removeAttribute('data-weight');
}
