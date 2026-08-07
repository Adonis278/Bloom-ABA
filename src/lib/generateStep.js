import { functions, httpsCallable } from './firebase.js';

const callable = httpsCallable(functions, 'generateStep');

/* Thin wrapper around the generateStep callable. Contract fixed by
   DESIGN.md section 4 — do not add fields without updating functions/index.js
   and functions/core.js at the same time.

   No auth wait here anymore: App.jsx only renders the Entry/Step flow once
   onAuthStateChanged has already fired with a real user (see App.jsx), so a
   signed-in uid is guaranteed by the time this is called. */
/* Returns { step, complete }. `complete` is the loop's finish line: the
   assignment has reached the length it asked for and the last sentence is
   closed, so there is no next step to give. Without it the tool would keep
   asking for "the next sentence" forever. */
export async function generateStep({ assignment, workSoFar, completedSteps, promptLevel, reason }) {
  const { data } = await callable({ assignment, workSoFar, completedSteps, promptLevel, reason });
  return { step: data.step ?? null, complete: Boolean(data.complete) };
}

const exampleCallable = httpsCallable(functions, 'generateExample');

/* Fetched only when the student is already stuck, and only after the step is
   showing. Resolves to null on any failure — the step stands on its own and
   nothing about the loop depends on an example arriving. */
export async function generateExample({ assignment, workSoFar, step }) {
  try {
    const { data } = await exampleCallable({ assignment, workSoFar, step });
    return data.example ?? null;
  } catch {
    return null;
  }
}
