import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

/* profiles/{uid}/children/{childId}/sessions/{sessionId} — one per
   assignment attempt; profiles/.../sessions/{id}/steps/{stepId} — one per
   generated step. Nested under the child, matching history.js's pattern,
   not the adult uid directly — same reasoning as history.js: security is
   still enforced one level up at the adult's uid (firestore.rules), and
   this keeps exactly one sessions schema instead of resurrecting the old
   flat, pre-child-model one.

   Step docs hold ONLY counts and timestamps (CLAUDE.md hard rule 7) — never
   the student's actual draft text. See useStuckDetector.js for where those
   counts come from. */

export function startSession(uid, childId, assignmentText) {
  const ref = doc(collection(db, 'profiles', uid, 'children', childId, 'sessions'));
  setDoc(ref, {
    assignmentText,
    startedAt: serverTimestamp(),
    endedAt: null,
    outcome: null,
  }).catch(() => {
    // Fire-and-forget, same principle as history.js/profile.js — logging
    // must never block the loop the student is in the middle of.
  });
  return ref.id;
}

/* Closes the session out when the assignment actually reaches the length it
   asked for. Until this existed, endedAt/outcome stayed null forever and the
   Progress view could only show a proxy for completion — see CLAUDE.md
   "Ending an assignment". */
export function finishSession(uid, childId, sessionId) {
  if (!sessionId) return;
  setDoc(
    doc(db, 'profiles', uid, 'children', childId, 'sessions', sessionId),
    { endedAt: serverTimestamp(), outcome: 'completed' },
    { merge: true },
  ).catch(() => {});
}

export function addStepEntry(uid, childId, sessionId, entry) {
  if (!sessionId) return;
  addDoc(collection(db, 'profiles', uid, 'children', childId, 'sessions', sessionId, 'steps'), {
    target: entry.target ?? null,
    promptLevel: entry.promptLevel,
    latencyMs: entry.latencyMs,
    keystrokes: entry.keystrokes,
    deletes: entry.deletes,
    netChars: entry.netChars,
    tabAways: entry.tabAways,
    firstKeystrokeMs: entry.firstKeystrokeMs ?? null,
    modality: entry.modality ?? 'text',
    rejected: entry.rejected ?? null,
    independent: entry.independent,
    outcome: entry.outcome,
    stuckScoreAtIntervention: entry.stuckScoreAtIntervention ?? null,
    createdAt: serverTimestamp(),
  }).catch(() => {});
}
