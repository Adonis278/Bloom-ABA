# Bloom

**One next physical action, sized to the student.** A task-initiation tool for
students with ADHD (grades 6–9). Start an assignment, get one step. Say it's
too big, get a smaller one. Go quiet because you're stuck, and the tool
notices on its own and quietly makes the next step smaller. No dashboard for
the student, no list of steps — just the one thing to do next.

**Live:** https://bloom-aba.web.app

Built for **Track 1, IncludAI 2026**. Full product context is in
[`docs/BRD.md`](docs/BRD.md), [`docs/DESIGN.md`](docs/DESIGN.md), and
[`docs/spec.md`](docs/spec.md).

> Every other tool tries to hold the student's attention. This one tries to
> need less of it.

---

## What's built

**The student loop**

- **Entry** — one textarea, pre-filled with a real assignment so the tool can
  be used without typing anything first. Fully editable.
- **Step** — one lit card, one step, a workspace to actually write in, and
  `[Done]` `[Too big]` `[Listen]` (read-aloud via the browser's own speech
  synthesis — no cloud call, explicit action only, never auto-plays).
- **Steps follow the student's draft, not a fixed decomposition.** The
  assignment is never broken into a step list up front. Each step is generated
  from what is actually on the page at that moment — a student who writes four
  paragraphs off one step gets a step that continues from *there*.
  `functions/draftMap.js` reads position deterministically (paragraph and
  sentence counts, whether the draft breaks off mid-sentence) and hands the
  model facts rather than asking it to infer them from prose.
- **Silent-stall detection.** Keystroke *timing* — never content — feeds the
  scoring formula in `src/lib/scoring.js`. When a student goes quiet and the
  score crosses the threshold at a sentence boundary or a genuine pause, the
  next step gets smaller on its own, with no button pressed. Two independent
  completions fade the demand back up.
- **A worked example when stuck.** After a stall or a rejected step, one
  concrete sentence the student could actually write appears under the step.
  Never on a step they're moving through fine.

**Behind it**

- **`generateStep`** — Cloud Function producing one physical, zero-decision,
  ≤25-word action; validates its own output and regenerates on a rule break.
- **`generateExample`** — a second, separate callable so the step never waits
  on it.
- **A failsafe model chain** (NVIDIA → NVIDIA → Anthropic) so one provider
  having a bad day doesn't take the app down with it.
- **Google sign-in by an adult, child selected afterward.** The adult
  authenticates (pure device trust — nothing about them is stored, not even a
  name); the actual student is picked from `ChildPicker`. One account covers
  siblings or a shared classroom device.
- **My work** — history of completed steps and uploaded files, per child.
- **Progress** — an adult-facing view of four metrics (prompt level over time,
  stall recovery, an honestly-labeled completion proxy, time-to-first-
  keystroke), computed live from the child's own session data and returning
  only aggregates — never assignment or step content.

**Not built, deliberately** — modality auto-switch, the break-offer screen,
the student-granted share-code flow for a second adult, accessibility controls
beyond read-aloud, and any real "assignment finished" signal. See
[`HANDOFF.md`](HANDOFF.md). The camera is out of scope permanently
(`docs/spec.md` → Open Decisions).

**The rules this app is built against are non-negotiable, not preferences.**
Read [`CLAUDE.md`](CLAUDE.md) before touching UI or generation logic — no red
anywhere, no exclamation marks, one focal element on screen, never a list of
steps, no loading spinners, keystroke *timing* only and never content, no
third-party analytics. Every one of those is a stated product decision, not
an oversight.

---

## Stack

React (Vite) + Tailwind · Firebase (Auth, Firestore, Functions, Hosting,
Storage) · NVIDIA NIM + Anthropic for generation. No charting library — the
trend charts are hand-rolled SVG.

```
src/
  App.jsx                  screen state, task loop, escalation + fading
  screens/LandingPage.jsx  sign-in, the one surface with ambient motion
  screens/ChildPicker.jsx  which student is using it
  screens/Entry.jsx        the assignment textarea
  screens/Step.jsx         the lit card, workspace, example, read-aloud
  screens/MyWork.jsx       history + uploads
  screens/AdultView.jsx    the four metrics, mono readout
  components/Crossfade.jsx the one 450ms transition the motion budget allows
  components/TrendChart.jsx hand-rolled SVG line chart
  hooks/useStuckDetector.js keystroke TIMING only — never content
  lib/scoring.js           the stall formula (spec.md Part 2)
  lib/sessions.js          per-step logging (counts and timestamps only)
  lib/analytics.js         live aggregation; structurally cannot return content
  lib/profile.js           adult profile + children + expectedSeconds
  lib/history.js  lib/uploads.js  lib/firebase.js  lib/generateStep.js
  index.css                design tokens (DESIGN.md §9) — never hardcode a color

functions/
  index.js                 onCall handlers, secrets binding
  core.js                  retry/validation/fallback orchestration
  prompt.js                prompt construction (spec.md Part 3)
  draftMap.js              deterministic read of where the draft stops
  example.js               the worked-example callable
  validate.js              the step-rules gate
  providers/               NVIDIA + Anthropic callers, and the failsafe chain
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
npm run emulators   # functions, hosting, firestore, auth, storage
npm run dev
```

`.env.development.local` (gitignored) with `VITE_USE_EMULATOR=true` points
the client at both emulators instead of the live project — create it if it's
missing:

```
VITE_USE_EMULATOR=true
```

Use `.env.development.local`, not `.env.local` — Vite loads `.env.local` in
*every* mode, including `vite build`, so it would leak the emulator host into
a production bundle. `.env.development.local` only loads for `vite` (dev
mode), never for `vite build`.

Open `http://localhost:5173`. Paste an assignment, hit Start.

---

## Deploying

```bash
npm run build
firebase functions:secrets:set NVIDIA_API_KEY
firebase functions:secrets:set ANTHROPIC_API_KEY   # optional third fallback tier
firebase deploy
```

Firestore, Storage, and Authentication each need to be initialized once in the
Firebase console before their first deploy — `firebase deploy` fails with a
clear "has not been set up" message until you do. All three are provisioned on
`bloom-aba`; Storage uses a no-cost regional bucket with our own rules
(`storage.rules`) deployed over the locked-down default.

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
request) and **IBM Plex Mono** (the adult Progress view — deliberately plainer,
flat rows and hairlines, no cards; it's an instrument readout, not the
product).

The student's workspace also carries `spellCheck="false"` and
`data-gramm="false"`. Found by testing on a real machine: Grammarly attaches
to that textarea and draws **red squiggles under the student's own
sentences** — exactly the corrective red-ink signal this product exists to
avoid, on the one surface where they're being asked to take a risk. Our CSS
can't reach it; opting the field out can. Keep these on any future student
writing surface.

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

## Where this stands

Deployed and working end to end at https://bloom-aba.web.app. Verified by
driving the live site as a student: start an assignment, type a partial draft,
go quiet, and watch the step shrink on its own and a worked example appear —
plus scripted checks against the Firestore emulator confirming step documents
hold only counts and timestamps, and that a second signed-in account is denied
access to another's data.

**Honest about what isn't proven.** No neurodivergent student has used this
yet — every "student" in testing so far has been a scripted browser. Per
`docs/BRD.md` §10 that evidence (baseline run, intervention run, minimum three
users, failures reported) is the work that matters most, and it hasn't
happened.

**Known limitations**, in priority order:

1. **Step quality is bimodal.** When the tier-1 model answers (~1s) steps are
   sharp and well-anchored to the draft. When it exceeds its 4s timeout, the
   8B fallback produces noticeably weaker steps. Measured ~6/8 under 4s. The
   fix is a stronger tier-1 model, not more prompt text — re-measure before
   changing the chain.
2. **Recognizing "the draft is long enough, write the ending"** is the least
   reliable behaviour. Position-tracking and forward-only hold up
   consistently; ending-recognition degrades on the fallback tier.
3. **No assignment-completion signal exists.** The Progress view's completion
   number is a labeled proxy (did the session's last step end cleanly), not
   true completion tracking.

## License / status

Hackathon submission for IncludAI 2026, Track 1. Not yet licensed for reuse
outside the competition.
