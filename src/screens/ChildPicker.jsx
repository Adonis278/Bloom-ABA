import { useState } from 'react';

const AVATARS = ['🦊', '🐻', '🐢', '🐧', '🦉', '🐸', '🐨', '🦁'];

/* Shown once an adult has signed in, before the actual student's session
   starts. One Google account can cover more than one child — a parent with
   siblings, a teacher with a shared device — so this is where "which one of
   you is this" gets answered, without ever asking a young child to sign
   into anything themselves.

   Presentational, like LandingPage.jsx: App.jsx owns loading the child
   list, creating a new one, and touching lastSeenAt. This component just
   renders whatever state it's given and calls back up.

   Plain register throughout — no marketing copy, generously large tap
   targets, minimal reading required. This screen is the part of the app
   most likely to be used by the youngest kids in the room. */
export default function ChildPicker({ children, showAddForm, onPick, onAdd, onShowAddForm, onBackToList }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    await onAdd({ name, avatar });
  }

  if (children === null) {
    return <main className="min-h-dvh bg-paper" />;
  }

  if (showAddForm) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 py-16">
        <div className="w-full max-w-[420px] text-center">
          <p className="mb-8 text-step font-bold">What's your name?</p>

          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type a name"
            className="card-lit tap w-full px-5 text-center text-[1.0625rem] text-ink outline-none placeholder:text-muted"
          />

          <p className="mb-3 mt-8 text-[0.9375rem] text-muted">Pick a picture</p>
          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                aria-pressed={avatar === a}
                className={`flex h-16 w-16 items-center justify-center rounded-full border text-3xl ${
                  avatar === a ? 'border-warm' : 'border-line'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="tap rounded-lg border border-line px-6 text-[0.9375rem] font-bold disabled:opacity-40"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
            {children.length > 0 && (
              <button
                type="button"
                onClick={onBackToList}
                className="tap rounded-lg px-6 text-[0.875rem] text-muted"
              >
                Back
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh grid place-items-center px-6 py-16">
      <div className="w-full max-w-[420px] text-center">
        <p className="mb-8 text-step font-bold">Who's this?</p>

        <div className="flex flex-col gap-3">
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onPick(child)}
              className="card-lit tap flex items-center gap-4 px-5 py-4 text-left"
            >
              <span className="text-3xl">{child.avatar || '🙂'}</span>
              <span className="text-[1.0625rem] font-bold">{child.name || 'Friend'}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={onShowAddForm}
            className="tap rounded-lg border border-line px-6 text-[0.9375rem] text-muted"
          >
            + Add someone
          </button>
        </div>
      </div>
    </main>
  );
}
