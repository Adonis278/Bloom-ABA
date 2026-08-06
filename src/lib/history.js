import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase.js';

/* profiles/{uid}/history/{entryId} — the real history list the student
   asked for. This is a deliberate, scoped exception to hard rule 4 ("never
   show a list of steps") — see CLAUDE.md for why it's allowed here and not
   in the live Entry/Step loop.

   Content here is the step text itself and the assignment it belongs to —
   NOT the same privacy posture as summaries/{uid} (DESIGN.md section 2),
   which stays aggregate-only for adults. This collection is owned and
   readable only by the student (see firestore.rules); no adult path reads
   it. */

export async function addHistoryEntry(uid, { type, text, assignmentText, fileName = null, fileUrl = null }) {
  await addDoc(collection(db, 'profiles', uid, 'history'), {
    type, // 'step' | 'upload'
    text: text ?? null,
    assignmentText: assignmentText ?? null,
    fileName,
    fileUrl,
    createdAt: serverTimestamp(),
  });
}

const HISTORY_PAGE_SIZE = 100;

export async function listHistory(uid) {
  const q = query(
    collection(db, 'profiles', uid, 'history'),
    orderBy('createdAt', 'desc'),
    limit(HISTORY_PAGE_SIZE),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
