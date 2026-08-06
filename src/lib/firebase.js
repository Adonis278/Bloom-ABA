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

/* Anonymous auth only. No sign-up, no email, no password, no login screen.
   A student lands straight on the entry screen.

   This is fired at module load and deliberately NOT awaited by the UI: the
   entry screen must be on screen immediately. The uid is only needed later,
   at generate time, so `ready` is awaited there instead.

   Zero PII, but a stable uid — which is what makes per-student prompt levels
   and summaries possible without an account. */
export const ready = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) resolve(user);
  });
  signInAnonymously(auth).catch(() => {
    /* Swallowed on purpose. There is no error state in this product
       (hard rule 1). A student never sees a failed sign-in; the caller
       that actually needs a uid handles the absence quietly. */
  });
});

export { auth, httpsCallable };
