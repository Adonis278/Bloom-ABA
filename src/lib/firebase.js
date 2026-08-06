import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

/* DELIBERATELY NOT IMPORTED — do not add these back.

   getAnalytics, getPerformance, and Crashlytics are every one of them
   third-party tracking on a minor. Their absence is a product feature
   (CLAUDE.md hard rule 8, DESIGN.md section 1, spec.md N13).

   The Firebase console's default snippet includes getAnalytics. It was
   removed on purpose. measurementId is omitted from the config below for
   the same reason.

   Firestore is also not imported yet: nothing is persisted in this session,
   and an unused import would ship dead weight to a phone browser. */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const functions = getFunctions(app, 'us-central1');

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  // Auth too, not just Functions — otherwise local runs still sign in
  // against the real project (which may or may not have Anonymous enabled)
  // while generateStep hits the local emulator. Both or neither.
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

const AUTH_TIMEOUT_MS = 4000;

/* Anonymous auth only. No sign-up, no email, no password, no login screen.
   A student lands straight on the entry screen.

   This is fired at module load and deliberately NOT awaited by the UI: the
   entry screen must be on screen immediately. The uid is only needed later,
   at generate time, so `ready` is awaited there instead.

   Zero PII, but a stable uid — which is what makes per-student prompt levels
   and summaries possible without an account.

   `ready` ALWAYS resolves — it never rejects and never hangs forever.
   Found live: if sign-in fails for any reason (misconfigured project,
   Anonymous provider disabled, network blip), the original version of this
   code swallowed the error but then waited on onAuthStateChanged forever,
   since a failed sign-in never fires it. Every generateStep call sat on
   "Reading it." indefinitely — silently, with no way out. That is a worse
   failure than showing no uid at all. generateStep doesn't require
   req.auth, so proceeding unauthenticated after a timeout still works; it
   just means no stable uid for that session, which costs nothing this
   milestone since nothing is persisted per-uid yet. */
export const ready = new Promise((resolve) => {
  let settled = false;
  const finish = (user) => {
    if (settled) return;
    settled = true;
    resolve(user ?? null);
  };

  onAuthStateChanged(auth, (user) => {
    if (user) finish(user);
  });
  signInAnonymously(auth).catch(() => {
    /* Swallowed on purpose (hard rule 1) — the timeout below is what
       actually prevents this from becoming a silent hang. */
  });
  setTimeout(() => finish(null), AUTH_TIMEOUT_MS);
});

export { auth, httpsCallable };
