import { useCallback, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signInWithGoogle } from './lib/firebase.js';
import { ensureProfile } from './lib/profile.js';
import { addHistoryEntry } from './lib/history.js';
import LandingPage from './screens/LandingPage.jsx';
import Entry from './screens/Entry.jsx';
import Step from './screens/Step.jsx';
import MyWork from './screens/MyWork.jsx';
import { generateStep } from './lib/generateStep.js';

const MAX_PROMPT_LEVEL = 4;
const FALLBACK_STEP = 'Open the document you are working on.';

// New users get a slightly longer welcome beat than returning ones — there's
// more being said ("Welcome" vs "Welcome back") and less reason to rush it.
const WELCOME_DELAY_NEW_MS = 1600;
const WELCOME_DELAY_RETURNING_MS = 1100;

/* Screen state + step engine. `authUser` drives everything above the task
   loop: undefined while Firebase checks the persisted session, null once
   confirmed signed out, a User once signed in — by either an explicit
   click on LandingPage or a silent auto-restore of a remembered device.
   Either way the same effect below runs ensureProfile + the welcome timer,
   so "Welcome back, {name}" fires identically regardless of which path got
   the student there. */
export default function App() {
  const [authUser, setAuthUser] = useState(undefined);
  const [welcome, setWelcome] = useState(null);
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState('task'); // 'task' | 'myWork'

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user ?? null);
      if (!user) {
        setWelcome(null);
        setEntered(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!authUser) return undefined;
    let cancelled = false;

    ensureProfile(authUser).then(({ isNew, firstName }) => {
      if (cancelled) return;
      setWelcome({ isNew, firstName });
      const delay = isNew ? WELCOME_DELAY_NEW_MS : WELCOME_DELAY_RETURNING_MS;
      setTimeout(() => {
        if (!cancelled) setEntered(true);
      }, delay);
    });

    return () => {
      cancelled = true;
    };
  }, [authUser]);

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
      // Hard rule 1: no error state. If the callable fails end to end
      // (network down, cold-start timeout), fall back to a step that is
      // always safe to show — core.js already guarantees this for every
      // failure *inside* the function; this covers the request never
      // completing at all.
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
    if (authUser && step) {
      addHistoryEntry(authUser.uid, {
        type: 'step',
        text: step,
        assignmentText: assignment,
      }).catch(() => {
        // Logging failure never blocks the loop the student is in the
        // middle of — same "no error state" principle as everywhere else.
      });
    }
    requestStep({ text: assignment, level: promptLevel, done, reason: 'next' });
  }

  function handleTooBig() {
    const level = Math.min(promptLevel + 1, MAX_PROMPT_LEVEL);
    setPromptLevel(level);
    requestStep({ text: assignment, level, done: completedSteps, reason: 'too_big' });
  }

  if (authUser === undefined) {
    return <main className="min-h-dvh bg-paper" />;
  }

  if (!authUser || !entered) {
    return <LandingPage signedIn={!!authUser} welcome={welcome} onSignIn={signInWithGoogle} />;
  }

  if (view === 'myWork') {
    return <MyWork uid={authUser.uid} onBack={() => setView('task')} />;
  }

  if (assignment === null) {
    return <Entry onStart={handleStart} onMyWork={() => setView('myWork')} />;
  }

  return <Step step={step} pending={pending} onDone={handleDone} onTooBig={handleTooBig} />;
}
