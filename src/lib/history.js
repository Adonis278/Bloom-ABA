import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase.js';

/* profiles/{uid}/children/{childId}/history/{entryId} — the real history
   list the student asked for. A deliberate, scoped exception to hard rule 4
   ("never show a list of steps") — see CLAUDE.md for why it's allowed here
   and not in the live Entry/Step loop.

   Nested under the specific child now, not the adult uid directly, so
   siblings or students sharing one adult's Google account don't see each
   other's work. Security is still enforced one level up, at the adult uid
   (firestore.rules) — see CLAUDE.md "Kindergarten & the
   adult-authenticates, child-selects model" for why that's an acceptable
   simplification here. */

export async function addHistoryEntry(uid, childId, { type, text, assignmentText, fileName = null, fileUrl = null }) {
  await addDoc(collection(db, 'profiles', uid, 'children', childId, 'history'), {
    type, // 'step' | 'upload'
    text: text ?? null,
    assignmentText: assignmentText ?? null,
    fileName,
    fileUrl,
    createdAt: serverTimestamp(),
  });
}

const HISTORY_PAGE_SIZE = 100;

export async function listHistory(uid, childId) {
  const q = query(
    collection(db, 'profiles', uid, 'children', childId, 'history'),
    orderBy('createdAt', 'desc'),
    limit(HISTORY_PAGE_SIZE),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
