# Bloom

**One next physical action, sized to the student.** A task-initiation tool for
students with ADHD (grades 6–9). Paste an assignment, get one step. Say it's
too big, get a smaller one. No account, no dashboard, no list of steps — just
the one thing to do next.

Built for **Track 1, IncludAI 2026**. Full product context is in
[`docs/BRD.md`](docs/BRD.md), [`docs/DESIGN.md`](docs/DESIGN.md), and
[`docs/spec.md`](docs/spec.md).

> Every other tool tries to hold the student's attention. This one tries to
> need less of it.

---

## What's built

This is the MVP loop — the smallest version of the product that's actually
useful:

- **Entry screen** — one textarea, one Start button. Nothing else.
- **Step screen** — one lit card, one step, `[Done]` `[Too big]`.
- **`generateStep`** — a Cloud Function that turns an assignment into one
  physical, zero-decision, ≤25-word action, validates its own output, and
  regenerates if a step breaks a rule.
- **A failsafe model chain** (NVIDIA → NVIDIA → Anthropic) so one provider
  having a bad day doesn't take the app down with it.
- **Anonymous auth only.** No sign-up, no email, no login screen.

Not built yet, on purpose — see [`HANDOFF.md`](HANDOFF.md) for the full state
and what's next: stall detection, Firestore logging, the rules screen,
accessibility controls, the summary, the adult view. The camera is out of
scope permanently (see `docs/spec.md` → Open Decisions).

**The rules this app is built against are non-negotiable, not preferences.**
Read [`CLAUDE.md`](CLAUDE.md) before touching UI or generation logic — no red
anywhere, no exclamation marks, one focal element on screen, never a list of
steps, no loading spinners, keystroke *timing* only and never content, no
third-party analytics. Every one of those is a stated product decision, not
an oversight.

---

## Stack

React (Vite) + Tailwind · Firebase (Auth, Firestore, Functions, Hosting) ·
NVIDIA NIM + Anthropic for generation.

```
src/
  App.jsx                 screen state + step engine (in-memory this milestone)
  screens/Entry.jsx        the textarea
  screens/Step.jsx         the lit card
  components/Crossfade.jsx the one 450ms transition the motion budget allows
  lib/firebase.js          init, anonymous auth, emulator wiring
  lib/generateStep.js      callable wrapper
  index.css                design tokens (DESIGN.md §9) — never hardcode a color

functions/
  index.js                 onCall handler, secrets binding
  core.js                  retry/validation/fallback orchestration
  prompt.js                prompt construction (spec.md Part 3)
  validate.js               the step-rules gate
  providers/                NVIDIA + Anthropic callers, and the failsafe chain
```

---

## Running it locally

```bash
npm install
cd functions && npm install && cd ..
```

You need a `functions/.secret.local` with your own keys for the emulator —
this file is gitignored, never committed:

```
NVIDIA_API_KEY=your-nvidia-key
ANTHROPIC_API_KEY=your-anthropic-key-or-any-placeholder
```

`ANTHROPIC_API_KEY` needs *some* non-empty value even if you don't have a real
one — an empty or missing entry makes the local emulator fall through to a
live (and failing) call to Google Secret Manager on every request. See
`HANDOFF.md` if you want the full story on why.

Start both emulators and the dev server:

```bash
firebase emulators:start --only functions,auth --project bloom-aba
npm run dev
```

`.env.local` (gitignored) with `VITE_USE_EMULATOR=true` points the client at
both emulators instead of the live project — copy it if it's missing:

```
VITE_USE_EMULATOR=true
```

Open `http://localhost:5173`. Paste an assignment, hit Start.

---

## Deploying

```bash
npm run build
firebase functions:secrets:set NVIDIA_API_KEY
firebase functions:secrets:set ANTHROPIC_API_KEY   # optional third fallback tier
firebase deploy --only hosting,functions
```

Firebase project is `bloom-aba` (see `.firebaserc`). `.env` at the repo root
holds the public web config (API key, project ID, etc.) — this is safe to
commit; it identifies the project, it does not authorize anything, and access
is gated by Firestore rules and Auth server-side, not by this file being
secret.

**No LLM API key ever reaches the client.** Both providers are called only
from inside `generateStep`, with keys bound as Cloud Secret Manager secrets —
never in `.env`, never in the bundle. See `CLAUDE.md` hard rule 9.

---

## Design tokens

Every color in this app is a CSS variable from `src/index.css`, sourced
directly from `DESIGN.md` §9 — sage ground, one lit card, a warm ochre accent
that appears *only* on rules the student wrote themselves. No pure black,
no pure white: maximum contrast causes halation and visual stress for
dyslexic readers, so body text sits at 10–14:1, not 21:1. Never hardcode a
color in a component — add a token instead.

Type is **Atkinson Hyperlegible** (student surface, self-hosted, no font-CDN
request) and **IBM Plex Mono** (adult dashboard, not built yet).

---

## A note on the failsafe chain

`functions/providers/index.js` tries NVIDIA `llama-3.1-70b-instruct`, then
NVIDIA `llama-3.1-8b-instruct`, then Anthropic `claude-sonnet-4-6`, in that
order — measured against this project's actual API access, not picked from a
model-card comparison. The obvious-looking upgrades (`llama-3.3-70b`,
`nemotron-70b`, `mistral-nemo`) are unusable on this account: two 404, one
times out past 20 seconds. If you change the chain, re-measure — don't
reorder from intuition. The full benchmark table is in `HANDOFF.md`.

---

## License / status

Hackathon submission for IncludAI 2026, Track 1. Not yet licensed for reuse
outside the competition.
