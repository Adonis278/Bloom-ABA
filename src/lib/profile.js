import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

/* profiles/{uid} — new-vs-returning detection and the "Welcome back" name.

   PII minimization (see CLAUDE.md): we store only a first name derived from
   the Google profile at sign-in, plus timestamps. Never email, never photo,
   never the full name. The student's first name is the only thing shown
   back to them ("Welcome back, Alex") — nothing here is shared with any
   adult; this is a separate document from summaries/{uid} (DESIGN.md
   section 2), which is the only thing an adult can ever read. */

function firstNameFrom(user) {
  const full = user.displayName?.trim();
  if (!full) return null;
  return full.split(/\s+/)[0];
}

/* Returns { isNew, firstName }. Creates the profile doc on first sign-in;
   touches lastSeenAt on every subsequent one. One read + at most one write
   per session, not per screen. */
export async function ensureProfile(user) {
  const ref = doc(db, 'profiles', user.uid);
  const snap = await getDoc(ref);
  const firstName = firstNameFrom(user);

  if (snap.exists()) {
    await setDoc(ref, { lastSeenAt: serverTimestamp() }, { merge: true });
    return { isNew: false, firstName: firstName ?? snap.data().firstName ?? null };
  }

  await setDoc(ref, {
    firstName,
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  });
  return { isNew: true, firstName };
}
