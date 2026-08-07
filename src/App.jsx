import { useCallback, useEffect, useRef, useState } from 'react';
import { auth, onAuthStateChanged, signInWithGoogle } from './lib/firebase.js';
import { ensureAdultProfile, listChildren, createChild, touchChild, updateExpectedSeconds } from './lib/profile.js';
import { addHistoryEntry } from './lib/history.js';
import { startSession, addStepEntry } from './lib/sessions.js';
import { medianOf, EXPECTED_SECONDS_DEFAULT } from './lib/scoring.js';
import { useStuckDetector } from './hooks/useStuckDetector.js';
import LandingPage from './screens/LandingPage.jsx';
import ChildPicker from './screens/ChildPicker.jsx';
import Entry from './screens/Entry.jsx';
import Step from './screens/Step.jsx';
import MyWork from './screens/MyWork.jsx';
import AdultView from './screens/AdultView.jsx';
import { generateStep } from './lib/generateStep.js';

const MAX_PROMPT_LEVEL = 4;
const FALLBACK_STEP = 'Open the document you are working on.';
const WELCOME_DELAY_NEW_MS = 1600;
const WELCOME_DELAY_RETURNING_MS = 1100;

/* Two-layer identity, driving the screen selection below:

     authUser   — the adult (parent/teacher) who signed in with Google.
                  Pure device-trust/authentication. Never shown, never
                  stored beyond a bare uid — see profile.js.
     activeChild — the actual student using the tool right now. Selected
                  from (or added to) the list of children under authUser's
                  account via ChildPicker. A UI concept, not a separate
                  Firebase Auth identity — see CLAUDE.md "Kindergarten &
                  the adult-authenticates, child-selects model".

   Screen order: authUser resolving -> LandingPage (sign in) -> ChildPicker
   (who's using it) -> a brief welcome beat -> Entry/Step/MyWork, keyed off
   activeChild, not authUser. */
export default function App() {
  const [authUser, setAuthUser] = useState(undefined);
  const [children, setChildren] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeChild, setActiveChild] = useState(null);
  const [justCreated, setJustCreated] = useState(false);
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState('task'); // 'task' | 'myWork' | 'adultView'

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user ?? null);
      if (!user) {
        setChildren(null);
        setActiveChild(null);
        setEntered(false);
        setShowAddForm(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!authUser) return undefined;
    let cancelled = false;

    ensureAdultProfile(authUser.uid)
      .then(() => listChildren(authUser.uid))
      .then((list) => {
        if (cancelled) return;
        setChildren(list);
        if (list.length === 1) {
          setActiveChild(list[0]);
          touchChild(authUser.uid, list[0].id).catch(() => {});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  useEffect(() => {
    if (!activeChild) return undefined;
    const delay = justCreated ? WELCOME_DELAY_NEW_MS : WELCOME_DELAY_RETURNING_MS;
    const t = setTimeout(() => setEntered(true), delay);
    return () => clearTimeout(t);
  }, [activeChild, justCreated]);

  function handlePickChild(child) {
    setJustCreated(false);
    setEntered(false);
    setActiveChild(child);
    touchChild(authUser.uid, child.id).catch(() => {});
  }

  async function handleAddChild({ name, avatar }) {
    const id = await createChild(authUser.uid, { name, avatar });
    setJustCreated(true);
    setEntered(false);
    setActiveChild({ id, name: name?.trim() || null, avatar });
  }

  const [assignment, setAssignment] = useState(null);
  const [step, setStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [promptLevel, setPromptLevel] = useState(0);
  const [pending, setPending] = useState(false);
  const [workSoFar, setWorkSoFar] = useState('');
  const [independentStreak, setIndependentStreak] = useState(0);
  const [expectedSeconds, setExpectedSeconds] = useState(EXPECTED_SECONDS_DEFAULT);

  // workSoFar mirrored into a ref so requestStep always sends the latest
  // draft without needing to be recreated on every keystroke — same
  // ref-mirrors-state pattern Step.jsx already uses for `step`.
  const workSoFarRef = useRef('');
  workSoFarRef.current = workSoFar;
  const sessionIdRef = useRef(null);
  // Per-child rolling window of completed-step durations, seeded from
  // Firestore and kept in sync locally so fading/expectedSeconds don't lag
  // a render behind — see profile.js's updateExpectedSeconds.
  const samplesRef = useRef([]);

  useEffect(() => {
    if (!activeChild) return;
    samplesRef.current = activeChild.expectedSecondsSamples ?? [];
    setExpectedSeconds(activeChild.expectedSeconds ?? EXPECTED_SECONDS_DEFAULT);
  }, [activeChild]);

  const requestStep = useCallback(async ({ text, level, done, reason }) => {
    setPending(true);
    try {
      const next = await generateStep({
        assignment: text,
        workSoFar: workSoFarRef.current,
        completedSteps: done,
        promptLevel: level,
        reason,
      });
      setStep(next);
    } catch {
      // Hard rule 1: no error state. core.js already guarantees a usable
      // step for every failure *inside* the function; this covers the
      // request never completing at all.
      setStep(FALLBACK_STEP);
    } finally {
      setPending(false);
    }
  }, []);

  // Silent-stall detection (spec.md Part 2) — active only while a real step
  // is actually on screen. See CLAUDE.md "Stall detection" for scope: this
  // MVP builds auto-shrink + fading only, not the fuller escalation ladder.
  const detector = useStuckDetector({
    active: Boolean(activeChild) && entered && view === 'task' && assignment !== null && !pending && step !== null,
    step,
    workSoFar,
    expectedSeconds,
    onStall: handleSilentStall,
  });

  function handleStart(text) {
    setAssignment(text);
    setWorkSoFar('');
    workSoFarRef.current = '';
    setIndependentStreak(0);
    if (authUser && activeChild) {
      sessionIdRef.current = startSession(authUser.uid, activeChild.id, text);
    }
    requestStep({ text, level: 0, done: [], reason: 'first' });
  }

  function handleDone() {
    const done = step ? [...completedSteps, step] : completedSteps;
    setCompletedSteps(done);

    let nextLevel = promptLevel;

    if (authUser && activeChild && step) {
      addHistoryEntry(authUser.uid, activeChild.id, {
        type: 'step',
        text: step,
        assignmentText: assignment,
      }).catch(() => {
        // Logging failure never blocks the loop the student is in the
        // middle of — same "no error state" principle as everywhere else.
      });

      const metrics = detector.getStepMetrics();
      addStepEntry(authUser.uid, activeChild.id, sessionIdRef.current, {
        target: step,
        promptLevel,
        independent: true,
        outcome: 'completed',
        ...metrics,
      });

      // Fading (spec.md): two independent completions in a row drop the
      // demand back down. The streak resets either way, so the next pair
      // starts fresh.
      const streak = independentStreak + 1;
      if (streak >= 2) {
        nextLevel = Math.max(promptLevel - 1, 0);
        setIndependentStreak(0);
      } else {
        setIndependentStreak(streak);
      }
      setPromptLevel(nextLevel);

      const nextSamples = [...samplesRef.current, metrics.latencyMs / 1000].slice(-10);
      samplesRef.current = nextSamples;
      setExpectedSeconds(medianOf(nextSamples));
      updateExpectedSeconds(authUser.uid, activeChild.id, nextSamples).catch(() => {});
    }

    requestStep({ text: assignment, level: nextLevel, done, reason: 'next' });
  }

  function handleTooBig() {
    const level = Math.min(promptLevel + 1, MAX_PROMPT_LEVEL);
    setPromptLevel(level);
    setIndependentStreak(0);

    if (authUser && activeChild && step) {
      detector.noteReject();
      addStepEntry(authUser.uid, activeChild.id, sessionIdRef.current, {
        target: step,
        promptLevel,
        rejected: 'too_big',
        independent: false,
        outcome: 'rejected',
        ...detector.getStepMetrics(),
      });
    }

    requestStep({ text: assignment, level, done: completedSteps, reason: 'too_big' });
  }

  function handleSilentStall(score) {
    const level = Math.min(promptLevel + 1, MAX_PROMPT_LEVEL);
    setPromptLevel(level);
    setIndependentStreak(0);

    if (authUser && activeChild && step) {
      addStepEntry(authUser.uid, activeChild.id, sessionIdRef.current, {
        target: step,
        promptLevel,
        rejected: null,
        independent: false,
        outcome: 'shrunk',
        stuckScoreAtIntervention: score,
        ...detector.getStepMetrics(),
      });
    }

    requestStep({ text: assignment, level, done: completedSteps, reason: 'silent_stall' });
  }

  if (authUser === undefined) {
    return <main className="min-h-dvh bg-paper" />;
  }

  if (!authUser) {
    return <LandingPage onSignIn={signInWithGoogle} />;
  }

  if (!activeChild) {
    return (
      <ChildPicker
        children={children}
        showAddForm={showAddForm || (children !== null && children.length === 0)}
        onPick={handlePickChild}
        onAdd={handleAddChild}
        onShowAddForm={() => setShowAddForm(true)}
        onBackToList={() => setShowAddForm(false)}
      />
    );
  }

  if (!entered) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 py-16">
        <p className="text-step font-bold" aria-live="polite">
          {justCreated ? 'Welcome' : 'Welcome back'}
          {activeChild.name ? `, ${activeChild.name}` : ''}.
        </p>
      </main>
    );
  }

  if (view === 'myWork') {
    return (
      <MyWork
        uid={authUser.uid}
        childId={activeChild.id}
        childName={activeChild.name}
        onBack={() => setView('task')}
      />
    );
  }

  if (view === 'adultView') {
    return (
      <AdultView
        uid={authUser.uid}
        childId={activeChild.id}
        childName={activeChild.name}
        onBack={() => setView('task')}
      />
    );
  }

  if (assignment === null) {
    return (
      <Entry
        onStart={handleStart}
        onMyWork={() => setView('myWork')}
        onProgress={() => setView('adultView')}
      />
    );
  }

  return (
    <Step
      step={step}
      pending={pending}
      onDone={handleDone}
      onTooBig={handleTooBig}
      workSoFar={workSoFar}
      onWorkSoFarChange={setWorkSoFar}
    />
  );
}
