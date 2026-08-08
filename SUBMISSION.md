# Bloom — IncludAI 2026, Track 1

> Every other tool tries to hold the student's attention. This one tries to need less of it.

|  |  |
|---|---|
| **Live app** | https://bloom-aba.web.app |
| **Repository** | https://github.com/Adonis278/Bloom-ABA |
| **Demo video** | **[TO FILL — 3 min, opens and closes on the student's voice]** |
| **Team** | **[TO FILL — names + roles]** |
| **Track** | 1 |

---

## The problem

Students with ADHD don't fail assignments because they can't do the work. They
fail because they **can't start**, and because they lose the thread partway
through.

Applied Behavior Analysis already solves this, through **task analysis** —
breaking work into its smallest steps and reducing the demand when a learner
stalls. The method works. It requires a trained practitioner in the room, and
there aren't enough of them. Roughly **7 million US children have ADHD**; about
1 in 5 receive no school support. The moment that matters is 8pm at a kitchen
table, where no accommodation exists.

Existing task-breakdown apps produce a list and hand it over. For many students
the list was never the problem — being unable to begin item #1 is.

**We built the practitioner's method as software the student operates
themselves.**

---

## What it does

The student opens the app and sees **one physical action**. Not a plan, not a
list — one thing.

1. **Entry** — an assignment is already on screen. Nothing to type to begin.
2. **One step at a time.** The first step is always preparatory (open a
   document, write the date) — a guaranteed win before any real demand.
3. **The student writes** in a workspace on the same screen.
4. **When they stall, the tool notices** — from keystroke *timing*, never
   content — and quietly replaces the step with a smaller one. No alert, no
   "are you stuck?", no red.
5. **When they're moving, the demand goes back up.** Two independent
   completions and the prompting fades.
6. **The assignment ends.** When the draft reaches the length the assignment
   asked for and is actually about the assignment, the loop stops.

---

## Innovation in AI application — 25%

Five things here are not standard prompt-wrapping. Each was **measured against
the live models**, not assumed.

**1. Steps are generated from the student's actual draft, not a fixed
decomposition.** The assignment is never broken into a step list up front. Each
step is generated from what is on the page *at that moment*, so a student who
writes four paragraphs off one step gets a step that continues from *there*.

**2. Position is computed deterministically, not inferred.**
`functions/draftMap.js` counts paragraphs and sentences and detects a
mid-sentence break, then hands the model facts. This was measured: asked to
infer its own position from several paragraphs of prose, the model anchored on
early content and told a student who had written through their campfire
paragraph to write more about the boat — and once told a stuck student to
*"read the draft from the beginning."* Facts it cannot misread fixed both.

**3. Stall detection from keystroke timing.** A scoring formula
(`src/lib/scoring.js`) combines time on step, time since last keystroke,
tab-aways, backspace ratio and net characters. It is evaluated **only at a
sentence boundary or a genuine pause**, never mid-sentence — false positives
interrupt productive thinking, which is worse than a missed catch.

**4. A prompt hierarchy that moves in both directions.** Levels 0–4, from
"state the action" to "here is the full text, change one word." A stall or a
reject moves it up (easier); two independent completions move it down. Fading
is the part most tools omit.

**5. The ending is gated on relevance, not just length.** 60 words about
mitochondria would otherwise reach a finish screen. A single classification
call checks the draft is an attempt at the assignment. **This is deliberately
one call, not an agent** — the question is bounded, and agentic looping would
multiply latency against a 10s budget where the top-tier model already times
out ~2 in 8 calls, degrading output rather than improving it.

**Reliability under real conditions.** Generation runs an ordered failsafe
chain (NVIDIA Llama-3.1-70B → 8B → Anthropic Sonnet). Every generated step is
validated against the product rules and regenerated if it breaks one. **There
is no error state** — the function always resolves to something a student can
act on.

---

## Usability & accessibility — 25%

The constraints below are **product requirements, not preferences**. They are
enforced in code and documented in `CLAUDE.md`.

| Rule | Why |
|---|---|
| **No red anywhere** | A step that didn't work is quietly replaced by a smaller one — never marked wrong |
| **No praise, no exclamation marks** | Flat tone; praise is a demand of its own |
| **One focal element** | No nav, no sidebar, no dashboard for the student |
| **Never a list of steps** | One step, then the next. The previous one is gone |
| **Nothing auto-plays** | ~50% of this population has auditory sensitivity |
| **No streaks, points, or progress bars** | No compliance mechanics |
| **No loading spinners** | Indeterminate motion says "wait, unknown duration" to someone already avoiding the task |
| **Motion budget: one 450ms crossfade** | `prefers-reduced-motion` removes even that |

**Typography and colour** are chosen for this population: Atkinson
Hyperlegible, and body contrast held at **10–14:1, never 21:1** — maximum
contrast causes halation and visual stress for dyslexic readers.

**Student-controlled display (F26):** text size, spacing, weight and tint.

**Read-aloud (F24):** browser speech synthesis, explicit action only, cancelled
the moment a step changes.

**One finding worth naming.** Testing on a real machine revealed **Grammarly
was drawing red squiggles under the student's own sentences** — exactly the
corrective red-ink signal this product exists to avoid, on the one surface
where the student is being asked to take a risk. Our CSS cannot reach a
browser extension; opting the field out can. Fixed.

---

## Privacy and safeguarding

Users are minors. This shaped the architecture, not just the copy.

- **Keystroke TIMING only.** Never characters, never content. Verified against
  the emulator: every logged step document contains only counts and
  timestamps.
- **No third-party analytics.** No Firebase Analytics, Crashlytics, or
  Performance Monitoring — their absence is a product feature.
- **No LLM key ever reaches the client.** All generation runs inside a Cloud
  Function with keys in Secret Manager.
- **Minimal PII.** The adult's Google identity is never read for a name,
  email, or photo. `profiles/{uid}` holds timestamps and nothing else.
- **Adults see patterns, never content.** The analytics layer structurally
  cannot return assignment or step text — enforced in code, not UI.
- **Security rules verified**, not assumed: real ID tokens for two separate
  accounts confirmed an owner can reach their own data and a different
  signed-in account is denied.

---

## Impact on neurodivergent youth — 30%

**[TO FILL — this section carries the most points. It needs real users.]**

The measurement protocol (BRD §10) is a baseline run without the tool, timed,
then an intervention run on a comparable assignment, **minimum three users**,
with results reported honestly including failures.

| Metric | Baseline | With Bloom |
|---|---|---|
| Time to first keystroke | **[FILL]** | **[FILL]** |
| Stalls followed by resumed progress | **[FILL]** | **[FILL]** |
| Assignment completed | **[FILL]** | **[FILL]** |
| Prompt level needed over time | — | **[FILL]** |

**Co-design sessions:** **[TO FILL — who, when, what changed as a result]**

**In their words:** **[TO FILL — direct quotes carry more than any metric here,
and the video should open and close on them]**

> Honest note for the writeup: the app instruments all four of these metrics
> automatically (`src/lib/analytics.js`), so a session produces the numbers
> without manual timing. The Progress view shows them per student.

---

## Technical execution — 10%

**Stack:** React (Vite) + Tailwind · Firebase (Auth, Firestore, Functions,
Hosting, Storage) · NVIDIA NIM + Anthropic. No charting library — the trend
charts are hand-rolled SVG.

```
src/
  screens/     LandingPage, ChildPicker, Entry, Step, MyWork, AdultView, Display
  hooks/       useStuckDetector.js     keystroke timing only, never content
  lib/         scoring.js  sessions.js  analytics.js  accessibility.js
functions/
  core.js      retry / validation / fallback orchestration
  prompt.js    prompt construction
  draftMap.js  deterministic read of where the draft stops
  target.js    assignment length and phase (building / ending / complete)
  relevance.js is this draft actually about the assignment
  validate.js  the step-rules gate
  providers/   NVIDIA + Anthropic, and the failsafe chain
```

**Measured latency:** first step ~1.5s cold, ~0.9s warm — inside the 10-second
budget (BR1). Model choice was benchmarked, not assumed: three
obvious-looking upgrades are unusable on this account (two 404, one times out
past 20s), and reasoning-tuned models return empty `content`.

---

## Honest limitations

Stated deliberately — the rubric rewards honest reporting, and every one of
these is documented in the repo.

1. **Step quality is bimodal.** When the top-tier model answers (~1.3s median)
   steps are sharp and well-anchored. When it exceeds its 4s timeout, the
   fallback produces noticeably weaker steps. The fix is a stronger tier-1
   model, not more prompt text.
2. **Off-topic drafts are only caught at the finish line.** A student drifting
   at 20 words isn't checked until they cross the target length. Catching drift
   earlier costs a model call per step against the latency budget.
3. **The length target is a heuristic.** It reads "60 words" or "one page" off
   the assignment and defaults to 120 words when it can't tell.
4. **Siblings on one account share a security boundary.** Cross-account access
   is fully denied, but per-child auth is not built — acceptable for a shared
   family device, not for independent use.
5. **Scoped out deliberately:** modality auto-switch, the break-offer screen,
   and the student-granted share-code flow for a second adult.

---

## Requirements coverage

| ID | Requirement | Status |
|---|---|---|
| BR1 | First actionable step in under 10s | Met (~1.5s cold) |
| BR2 | Only one step visible at any time | Met |
| BR3 | Demand decreases on stall, never increases | Met |
| BR4 | Every step is physical and decision-free | Met, validated server-side |
| BR5 | Timing and interaction data only, never content | Met, verified |
| BR6 | No data visible to an adult without student grant | **Partial** — the signed-in adult is the account owner; the share-code model is designed, not built |
| BR7 | Student can revoke adult access | **Not built** — follows BR6 |
| BR8 | Nothing plays sound or motion without explicit action | Met |
| BR9 | Student can set rules the AI must follow | **Not built** |
| BR10 | Difficulty increases again as the student succeeds | Met (fading) |
| BR11 | Student can export a summary | **Not built** |
| BR12 | Adults see a student-set reward threshold | **Not built** |

---

## What we'd build next

1. **Run the co-design protocol with more students** — the instrumentation
   already exists; it's the evidence that's thin.
2. **A stronger tier-1 model** to remove the quality cliff on timeout.
3. **The share-code consent flow** (BR6/BR7) — the real answer to "adults are
   guests, admitted by the student."
4. **Drift detection during the loop**, not only at the finish line.
