import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
} from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

/* DELIBERATELY NOT IMPORTED — do not add these back.

   getAnalytics, getPerformance, and Crashlytics are every one of them
   third-party tracking on a minor. Their absence is a product feature
   (CLAUDE.md hard rule 8, DESIGN.md section 1, spec.md N13).

   The Firebase console's default snippet includes getAnalytics. It was
   removed on purpose. measurementId is omitted from the config below for
   the same reason. This holds regardless of the account model — sign-in
   provider is a separate question from third-party tracking. */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

/* Google sign-in replaces anonymous auth as of this build. Every user signs
   in; Firebase Auth's default web persistence (IndexedDB, survives reloads
   and browser restarts on the same device) is what gives "remember this
   device" for free — no custom device-fingerprinting needed. A returning
   session restores via onAuthStateChanged without the student doing
   anything; a new device sees LandingPage.jsx and its sign-in widget.

   PII minimization: we only ever read displayName off the Google profile
   (for the "Welcome back, {name}" greeting) — never email or photo. See
   CLAUDE.md for the COPPA/PII rationale; this is a deliberate scope limit,
   not an oversight. */
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider);
  return user;
}

export async function signOutUser() {
  await signOut(auth);
}

export { onAuthStateChanged, httpsCallable };
