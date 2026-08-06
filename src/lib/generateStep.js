import { functions, httpsCallable, ready } from './firebase.js';

const callable = httpsCallable(functions, 'generateStep');

/* Thin wrapper around the generateStep callable. Contract fixed by
   DESIGN.md section 4 — do not add fields without updating functions/index.js
   and functions/core.js at the same time. */
export async function generateStep({ assignment, workSoFar, completedSteps, promptLevel, reason }) {
  // onCall authenticates by attaching the current Firebase Auth ID token.
  // Anonymous sign-in is fired at module load in firebase.js but not
  // awaited by the UI (Entry must render instantly) — it is awaited here,
  // at the one call site that actually needs a uid.
  await ready;

  const { data } = await callable({ assignment, workSoFar, completedSteps, promptLevel, reason });
  return data.step;
}
