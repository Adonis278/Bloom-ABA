import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

/* profiles/{uid} — uid is the AUTHENTICATED ADULT's Firebase Auth uid (the
   parent/teacher who signed in with Google). This document holds nothing
   about the adult at all — not even a name. The Google account is purely a
   device-trust / authentication mechanism now; the adult is never shown or
   stored anywhere in this app. See CLAUDE.md "Kindergarten & the
   adult-authenticates, child-selects model" for the full reasoning.

   profiles/{uid}/children/{childId} — the actual students. A single Google
   account can have several: a parent with more than one kid, a teacher with
   a shared classroom device. Selecting a child is a UI action, not a
   security boundary — every child under one adult account shares that
   adult's Firestore security scope (firestore.rules still checks only
   request.auth.uid == uid). This is a deliberate simplification: it avoids
   building a second, parallel identity/security system under time
   pressure, at the cost of siblings on the same account technically being
   able to read each other's history if they inspected requests directly.
   Acceptable for this use case (a shared family or classroom device); would
   need real per-child auth if this became a service where children access
   the tool independently of the adult's session. */

export async function ensureAdultProfile(uid) {
  const ref = doc(db, 'profiles', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { createdAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
  } else {
    await setDoc(ref, { lastSeenAt: serverTimestamp() }, { merge: true });
  }
}

export async function listChildren(uid) {
  const q = query(collection(db, 'profiles', uid, 'children'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createChild(uid, { name, avatar }) {
  const ref = await addDoc(collection(db, 'profiles', uid, 'children'), {
    name: name?.trim() || null,
    avatar: avatar || null,
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  });
  return ref.id;
}

export async function touchChild(uid, childId) {
  await setDoc(
    doc(db, 'profiles', uid, 'children', childId),
    { lastSeenAt: serverTimestamp() },
    { merge: true },
  );
}
