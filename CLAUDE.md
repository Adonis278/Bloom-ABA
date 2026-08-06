# Adaptive Task Support

A task-initiation tool for students with ADHD (grades 6–9). The student pastes an
assignment and gets **one next physical action** at a time. When they stall, the
demand goes **down**, never up.

Full context: `docs/BRD.md`, `docs/DESIGN.md`, `docs/spec.md`. Read them before
making architectural decisions.

**Stack:** React (Vite) + Tailwind + Firebase (Auth, Firestore, Functions, Hosting).
**App name:** Bloom. **Firebase project:** `bloom-aba`. Auth is **anonymous
only** — no sign-up, no email, no login screen. A student lands straight on
the entry screen. "Bloom" is browser-tab identity only — it does not appear
as a logo or chrome on the student surface (hard rule 3).

---

## Hard rules — never violate these

These are product requirements, not preferences. If a change would break one,
stop and ask.

1. **No red anywhere.** No error states, no alerts, no warning colors. A step that
   didn't work is quietly replaced by a smaller one.
2. **No exclamation marks, no praise, no encouragement** in any UI copy or any
   AI-generated step. Flat, plain tone.
3. **One focal element on screen at all times.** No nav bar, no sidebar, no logo,
   no persistent chrome, no dashboard for the student.
4. **Never show a list of steps.** One step, then the next. The previous step is gone.
5. **Nothing auto-plays.** No sound, no motion, no speech without explicit user action.
6. **No streaks, points, badges, leaderboards, or progress percentages.**
7. **Log keystroke TIMING only.** Never log, store, or transmit typed characters.
   No content replay. This is non-negotiable — users are minors.
8. **No third-party analytics.** No Firebase Analytics, Crashlytics, or Performance
   Monitoring. Their absence is a product feature.
9. **No LLM API key ever touches the client.** Every key lives in Cloud Secret
   Manager and is read only inside a Cloud Function. All generation goes through
   `generateStep`. This holds for every provider, not just Anthropic.
10. **Adults have no write path** to any Firestore collection, and read only
    `summaries/{uid}` — derived aggregates, never content.
11. **Motion budget: one 450ms crossfade** when a step is replaced. Nothing else
    animates. `prefers-reduced-motion` removes even that.
12. **No loading spinners.** If generation is pending, the previous step stays on
    screen unchanged.

    On the *first* generation there is no previous step, so the rule needs a
    case it did not have. The answer is not a spinner: the card crossfades —
    using the one 450ms crossfade already in the motion budget — to a single
    quiet line, then crossfades again to the first step. No loop, no
    indeterminate motion, no new animation, no color. See "Waiting states" below.

---

## Design tokens

Never hardcode a color. Use the CSS variables in `src/index.css`.

| Token | Light | Use |
|---|---|---|
| `paper` | `#DDE1DB` | page ground |
| `card` | `#F1F3EF` | the one lit surface |
| `ink` | `#222722` | body text (~12:1 contrast) |
| `muted` | `#535A53` | secondary text |
| `line` | `#C3CABF` | hairlines |
| `warm` | `#7A6A4F` | **only** on the student's own rules |

Contrast target is **10–14:1 for body text, never 21:1** — maximum contrast causes
halation and visual stress for dyslexic readers. Do not "improve" contrast to pure
black on pure white.

**Type:** Atkinson Hyperlegible for the student surface. IBM Plex Mono for the adult
dashboard only. The adult view is deliberately plainer — rows and hairlines, no cards.

---

## Step generation rules

Every generated step must:
- Name one physical action, starting with a verb (open, type, write, find, read)
- Be completable in under 2 minutes
- Require zero decisions
- Be 25 words or fewer
- Contain none of: *decide, choose, think about, consider, pick which*

The Cloud Function validates output against these and regenerates on failure.
The first step of any assignment is **preparatory** (open a doc, type the date) —
a guaranteed win before any real demand.

**The gate also needs a floor, not just a ceiling.** The tier-2 model has been
observed returning the single word `"Bend."` — which passes every rule as
written: it is under 25 words, it starts with a physical verb, and it contains
no decision word. It would have gone to a student. A step must also name an
object, so reject anything under ~4 words and regenerate. The word cap is not
the only way a step can be useless.

**Prompt levels 0–4:**
0 independent · 1 exact starting words · 2 literal words to type ·
3 three options to pick from · 4 full text to copy and alter one word

Stall or reject → level goes up (easier). Two independent completions → level goes
down (harder). Both directions matter.

---

## Model providers

Generation runs through an ordered chain in `functions/providers/index.js`. Each
tier is skipped when its key is absent and moved past on any failure — timeout,
non-2xx, unprovisioned model, or an empty completion.

| Order | Model | Measured |
|---|---|---|
| 1 | `meta/llama-3.1-70b-instruct` (NVIDIA) | 2.1s, best context use |
| 2 | `meta/llama-3.1-8b-instruct` (NVIDIA) | 0.9s, valid but flatter |
| 3 | `claude-sonnet-4-6` (Anthropic) | needs a key; the model DESIGN.md §4 specifies |

Measured against project `bloom-aba` on 2026-08-06 with a real first-step prompt.
**Do not reorder from intuition — re-measure.** `llama-3.3-70b-instruct`,
`nemotron-70b`, and `mistral-nemo-12b` all look like obvious picks and are all
unusable here (two 404, one times out past 20s). Reasoning-tuned models on the
NVIDIA endpoint return their output in `reasoning_content` and leave `content`
empty, so they fail the chain rather than returning a step.

Timeouts tighten down the chain. A slow tier is a failed tier — the whole point
is to stay inside the 10-second budget.

## Waiting states

Never a spinner. Looping motion is sustained sensory load for this population,
and an indeterminate one says "wait, unknown duration" to a student who is
already avoiding the task — an invitation to leave.

Instead: one 450ms crossfade to a single flat line, grade-5 reading level, in
`muted`. **"Reading it."** Then a second crossfade to the step. That is two uses
of the one motion the budget allows, no loop, and it names what is happening
rather than gesturing at it. `prefers-reduced-motion` turns both into instant swaps.

Worst realistic wait if the chain falls all the way through is ~13s, so a second
line at ~7s ("Still reading.") is reasonable. One line is the floor; anything
that spins, pulses, or fills is not.

## Verification

Before claiming anything works: run it, and confirm the output. Do not report a
feature complete based on the code looking correct.

Test the constraints explicitly — grep for `red`, `!`, `spinner`, `analytics`,
`streak` before finishing a session.
