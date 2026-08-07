import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { runGenerateStep } from './core.js';
import { runGenerateExample } from './example.js';

/* Keys never reach the client. They are Cloud Secret Manager secrets, bound to
   the function below, and read only inside the handler.
   CLAUDE.md hard rule 9. */
export const NVIDIA_API_KEY = defineSecret('NVIDIA_API_KEY');
export const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

/* generateStep — contract fixed by DESIGN.md section 4:

     in   { assignment, workSoFar, completedSteps, promptLevel, reason }
     out  { step }

   workSoFar is accepted and threaded through but will always be "" this
   milestone — there is no draft textarea until the stall detector lands.
   The field stays so the contract does not change later.

   Validation, retry, and the failsafe provider chain all live in core.js /
   validate.js / prompt.js / providers/index.js. This file only wires
   secrets to that logic and enforces the one thing that must happen at the
   transport boundary: never let a request without an assignment through. */
export const generateStep = onCall(
  {
    region: 'us-central1',
    secrets: [NVIDIA_API_KEY, ANTHROPIC_API_KEY],
    /* minInstances stays 0: it bills continuously. Cold start is the main
       risk to the 10-second budget — measure it, then decide whether to set
       this to 1 for the demo window. */
    minInstances: 0,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req) => {
    const assignment = req.data?.assignment;
    if (typeof assignment !== 'string' || !assignment.trim()) {
      // The client only calls this once the Entry textarea is non-empty, so
      // this indicates a bug upstream, not a generation failure a student
      // could hit. Fail loud here — this is the one place in the whole
      // pipeline where throwing is correct.
      throw new HttpsError('invalid-argument', 'assignment is required');
    }

    const keys = {
      nvidia: NVIDIA_API_KEY.value(),
      anthropic: ANTHROPIC_API_KEY.value(),
    };

    return runGenerateStep(req.data, keys);
  },
);

/* generateExample — in { assignment, workSoFar, step } / out { example }.

   Called only when the student is already stuck, and only after the step is
   already on screen. Never throws to the client and never blocks a step:
   example.js resolves to { example: null } on any failure, and the UI simply
   shows nothing extra. */
export const generateExample = onCall(
  {
    region: 'us-central1',
    secrets: [NVIDIA_API_KEY, ANTHROPIC_API_KEY],
    minInstances: 0,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req) => {
    const keys = {
      nvidia: NVIDIA_API_KEY.value(),
      anthropic: ANTHROPIC_API_KEY.value(),
    };
    return runGenerateExample(req.data, keys);
  },
);
