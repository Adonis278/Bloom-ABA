import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';

/* Client-side, live aggregation over the child's own sessions/steps —
   deliberately not the summaries/{uid} + recomputeSummary Cloud Function
   DESIGN.md originally planned. That architecture assumed a separate,
   share-code-granted adult; this app's adult already owns the account and
   already fully reads this data (see CLAUDE.md "Kindergarten & the
   adult-authenticates, child-selects model"), so there's no boundary left
   for a server-side aggregate doc to protect. Computing live also means
   the numbers "keep building over time" for free — every session ever
   logged is already here, nothing needs recomputing on a trigger.

   The one boundary that DOES still matter: this file must never return
   `target` or `assignmentText` to its caller, even though the raw docs it
   reads contain them (CLAUDE.md hard rule 10 — adults get patterns, never
   content). Enforced here structurally: only the four aggregate shapes
   below ever leave this function. */

const MAX_SESSIONS = 50;

/* Sessions started after the finish line existed carry a real
   outcome: 'completed' written by finishSession(). Older sessions predate it
   and have outcome null forever, so they fall back to the original proxy —
   did the last logged step end cleanly. Real signal where we have one,
   labelled honestly where we don't. */
function sessionCompleted(session) {
  if (session.outcome === 'completed') return true;
  if (session.outcome != null) return false;
  const last = session.steps[session.steps.length - 1];
  return last?.outcome === 'completed';
}

export async function computeChildAnalytics(uid, childId) {
  const sessionsSnap = await getDocs(
    query(
      collection(db, 'profiles', uid, 'children', childId, 'sessions'),
      orderBy('startedAt', 'asc'),
      limit(MAX_SESSIONS),
    ),
  );

  const sessions = await Promise.all(
    sessionsSnap.docs.map(async (sDoc) => {
      const stepsSnap = await getDocs(
        query(
          collection(db, 'profiles', uid, 'children', childId, 'sessions', sDoc.id, 'steps'),
          orderBy('createdAt', 'asc'),
        ),
      );
      return {
        startedAt: sDoc.data().startedAt ?? null,
        outcome: sDoc.data().outcome ?? null,
        steps: stepsSnap.docs.map((d) => d.data()),
      };
    }),
  );

  const promptLevelSeries = [];
  const timeToFirstKeystroke = [];
  const completionSessions = [];
  let shrunkTotal = 0;
  let shrunkRecovered = 0;

  for (const session of sessions) {
    const { steps } = session;
    if (steps.length === 0) continue;

    for (let i = 0; i < steps.length; i += 1) {
      const s = steps[i];
      const t = s.createdAt?.toMillis?.() ?? null;

      if (s.outcome === 'completed' && t !== null) {
        promptLevelSeries.push({ t, level: s.promptLevel });
      }

      if (s.outcome === 'shrunk') {
        shrunkTotal += 1;
        if (steps[i + 1]?.outcome === 'completed') shrunkRecovered += 1;
      }
    }

    const first = steps[0];
    if (typeof first.firstKeystrokeMs === 'number' && session.startedAt) {
      timeToFirstKeystroke.push({
        t: session.startedAt.toMillis(),
        seconds: first.firstKeystrokeMs / 1000,
      });
    }

    completionSessions.push({
      t: session.startedAt?.toMillis?.() ?? null,
      completed: sessionCompleted(session),
    });
  }

  const completedCount = completionSessions.filter((s) => s.completed).length;

  return {
    promptLevelSeries,
    stallRecovery: {
      total: shrunkTotal,
      recovered: shrunkRecovered,
      rate: shrunkTotal > 0 ? shrunkRecovered / shrunkTotal : null,
    },
    completion: {
      rate: completionSessions.length > 0 ? completedCount / completionSessions.length : null,
      sessions: completionSessions,
    },
    timeToFirstKeystroke,
  };
}
