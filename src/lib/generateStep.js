import { functions, httpsCallable } from './firebase.js';

const callable = httpsCallable(functions, 'generateStep');

/* Thin wrapper around the generateStep callable. Contract fixed by
   DESIGN.md section 4 — do not add fields without updating functions/index.js
   and functions/core.js at the same time.

   No auth wait here anymore: App.jsx only renders the Entry/Step flow once
   onAuthStateChanged has already fired with a real user (see App.jsx), so a
   signed-in uid is guaranteed by the time this is called. */
export async function generateStep({ assignment, workSoFar, completedSteps, promptLevel, reason }) {
  const { data } = await callable({ assignment, workSoFar, completedSteps, promptLevel, reason });
  return data.step;
}
