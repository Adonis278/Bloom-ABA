import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase.js';
import { addHistoryEntry } from './history.js';

// Generous enough for a photo of a textbook page or a PDF, not unlimited.
const MAX_FILE_BYTES = 20 * 1024 * 1024;

export async function uploadContent(uid, childId, file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('file too large');
  }

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storageRef = ref(storage, `uploads/${uid}/${childId}/${safeName}`);
  await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(storageRef);

  await addHistoryEntry(uid, childId, {
    type: 'upload',
    fileName: file.name,
    fileUrl,
  });

  return { fileName: file.name, fileUrl };
}
