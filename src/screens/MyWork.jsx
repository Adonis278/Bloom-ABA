import { useEffect, useRef, useState } from 'react';
import { listHistory } from '../lib/history.js';
import { uploadContent } from '../lib/uploads.js';
import { signOutUser } from '../lib/firebase.js';

/* The real history list of past steps and uploaded content, tied to the
   signed-in account — a deliberate, scoped exception to hard rule 4 ("never
   show a list of steps"). See CLAUDE.md "Landing page & account model" for
   why this is allowed here specifically and not on Entry/Step.

   Reached only from Entry's small "My work" link, never from Step — the
   in-task screen keeps its original one-focal-element purity untouched. */
export default function MyWork({ uid, onBack }) {
  const [entries, setEntries] = useState(null); // null = loading
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function refresh() {
    const list = await listHistory(uid);
    setEntries(list);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again later
    if (!file) return;
    setUploading(true);
    try {
      await uploadContent(uid, file);
      await refresh();
    } catch {
      // No error state shown (hard rule 1) — the upload just doesn't
      // appear in the list; the student can try again.
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-dvh px-6 py-16">
      <div className="mx-auto w-full max-w-[620px]">
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="tap rounded-lg px-3 text-[0.9375rem] text-muted"
          >
            Back
          </button>
          <button
            type="button"
            onClick={signOutUser}
            className="tap rounded-lg px-3 text-[0.8125rem] text-muted"
          >
            Sign out
          </button>
        </div>

        <h1 className="mb-8 text-step font-bold">My work</h1>

        <section className="card-lit mb-10 px-6 py-6">
          <p className="mb-3 text-[0.9375rem] text-muted">
            Upload something to learn from — notes, a photo of a page, a PDF.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full text-[0.9375rem]"
          />
          {uploading && <p className="mt-3 text-[0.8125rem] text-muted">Uploading.</p>}
        </section>

        {entries === null ? (
          <p className="text-[0.9375rem] text-muted">Loading.</p>
        ) : entries.length === 0 ? (
          <p className="text-[0.9375rem] text-muted">Nothing here yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <li key={entry.id} className="card-lit px-5 py-4">
                {entry.type === 'upload' ? (
                  <a
                    href={entry.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[0.9375rem] font-bold underline"
                  >
                    {entry.fileName}
                  </a>
                ) : (
                  <>
                    <p className="text-[0.9375rem] font-bold">{entry.text}</p>
                    {entry.assignmentText && (
                      <p className="mt-1 text-[0.8125rem] text-muted">{entry.assignmentText}</p>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
