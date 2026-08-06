import { useCallback, useState } from 'react';
import Entry from './screens/Entry.jsx';
import Step from './screens/Step.jsx';
import { generateStep } from './lib/generateStep.js';

const MAX_PROMPT_LEVEL = 4;
const FALLBACK_STEP = 'Open the document you are working on.';

/* Screen state + step engine. In-memory only (spec.md MVP: "Storage:
   in-memory") — nothing persists across a reload this milestone. No router:
   two screens driven by whether `assignment` is set. */
export default function App() {
  const [assignment, setAssignment] = useState(null);
  const [step, setStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [promptLevel, setPromptLevel] = useState(0);
  const [pending, setPending] = useState(false);

  const requestStep = useCallback(async ({ text, level, done, reason }) => {
    setPending(true);
    try {
      const next = await generateStep({
        assignment: text,
        workSoFar: '', // no draft surface yet — see HANDOFF.md
        completedSteps: done,
        promptLevel: level,
        reason,
      });
      setStep(next);
    } catch {
      // The callable itself failed end to end (network down, cold-start
      // timeout past 30s) — core.js already guarantees a usable step for
      // every failure *inside* the function, so reaching this branch means
      // the request never completed at all. Hard rule 1: no error state.
      setStep(FALLBACK_STEP);
    } finally {
      setPending(false);
    }
  }, []);

  function handleStart(text) {
    setAssignment(text);
    requestStep({ text, level: 0, done: [], reason: 'first' });
  }

  function handleDone() {
    const done = step ? [...completedSteps, step] : completedSteps;
    setCompletedSteps(done);
    requestStep({ text: assignment, level: promptLevel, done, reason: 'next' });
  }

  function handleTooBig() {
    const level = Math.min(promptLevel + 1, MAX_PROMPT_LEVEL);
    setPromptLevel(level);
    requestStep({ text: assignment, level, done: completedSteps, reason: 'too_big' });
  }

  if (assignment === null) {
    return <Entry onStart={handleStart} />;
  }

  return <Step step={step} pending={pending} onDone={handleDone} onTooBig={handleTooBig} />;
}
