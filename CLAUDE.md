# Adaptive Task Support

A task-initiation tool for students with ADHD (grades 6–9). The student pastes an
assignment and gets **one next physical action** at a time. When they stall, the
demand goes **down**, never up.

Full context: `docs/BRD.md`, `docs/DESIGN.md`, `docs/spec.md`. Read them before
making architectural decisions.

**Stack:** React (Vite) + Tailwind + Firebase (Auth, Firestore, Functions, Hosting,
Storage). **App name:** Bloom. **Firebase project:** `bloom-aba`.

**Auth changed from anonymous-only to Google sign-in, deliberately, mid-project.**
Every user now signs in with Google before reaching the tool. This is a real
departure from BR1's original "no account" framing — recorded here as a decision,
not left as a silent contradiction between the docs and the app. See "Landing page
& account model" below for the full reasoning, the privacy tradeoff, and exactly
what's still scoped away from the student tool despite this change.

---

## Hard rules — never violate these

These are product requirements, not preferences. If a change would break one,
stop and ask.

1. **No red anywhere.** No error states, no alerts, no warning colors. A step that
   didn't work is quietly replaced by a smaller one.
2. **No exclamation marks, no praise, no encouragement** in any UI copy or any
   AI-generated step. Flat, plain tone.
3. **One focal element on screen at all times, on Entry and Step.** No nav bar,
   no sidebar, no logo, no persistent chrome, no dashboard for the student.
   Two scoped exceptions, both deliberate: LandingPage.jsx (a different design
   register entirely — see below) and a single small "My work" text link on
   Entry only, never on Step. The in-task screen is untouched.
4. **Never show a list of steps — on Entry and Step.** One step, then the next.
   The previous step is gone. Scoped exception: MyWork.jsx, a separate screen the
   student opts into via the Entry link, showing their real history of completed
   steps and uploads. This was an explicit product decision (student asked for
   it directly), not a drift — see below.
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

**Steps follow the student's draft, not a fixed decomposition.** The
assignment is never broken into a step list up front — each step is
generated from what is actually on the page at that moment. A student who
writes four paragraphs off one step is further along than the step count
implies, and the next step has to start from *there*, not from wherever a
sequence says they should be.

`functions/draftMap.js` does the positional read deterministically —
paragraph/sentence/word counts, whether there's a title, and whether the
draft breaks off mid-sentence — and `prompt.js` passes it as `STRUCTURE`
alongside a `STOPPED HERE` tail of the last ~240 characters. **This is plain
counting on purpose.** Measured: asked to infer its own position from several
paragraphs of prose, the model anchors on early content and returns a step
for a section the student already finished — it told a student who had
written through their campfire paragraph to write more about the boat, and
in one case to "read the draft from the beginning," sending a stuck student
backward. Facts it cannot misread fixed both.

Rules that came out of measuring against the live models, all load-bearing:
- **Forward only.** Lowering the demand on a stall means a *smaller* piece of
  the same next thing, never a backward or passive one. Without this stated
  explicitly, "drop the demand" gets read as "have them re-read what they
  wrote" — the classic avoidance trap this product exists to avoid.
- **Same page, no new materials.** No dictionaries, websites, or separate
  sheets. Observed repeatedly on the fallback tier otherwise.
- **Mid-sentence is an override**, not an inference — when `endsMidSentence`
  is true the step is to finish that one sentence, stated before all other
  guidance. Without it the models latch onto the dangling final word.

**Keep this prompt short.** It was cut from ~640 tokens back to ~340 after
the long version routinely pushed tier-1 generation past its 4000ms timeout
— which silently downgrades to the flatter tier-2 model and produces *worse*
steps than the extra instruction buys. Re-measure tier-1 latency before
adding to it.

**Honest limitation:** "the draft is long enough, switch to writing the
ending" is the least reliable of these. Position-tracking and forward-only
hold up consistently across runs; ending-recognition works on tier 1 but
often degrades to a generic "write the next sentence" on the fallback tier.
Worth revisiting with a stronger tier-1 model rather than more prompt text.

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

## Landing page & account model

This app started zero-account (BR1, hard rule 3 as originally written). That
changed by explicit product decision, in two steps:

1. Every user signs in with Google before reaching the tool, device
   remembered afterward via Firebase Auth's normal persisted session — no
   custom fingerprinting, just the SDK's default local persistence.
2. **The signer-in and the student are not assumed to be the same person.**
   The population now explicitly includes kindergarten-age kids, who can't
   realistically manage an OAuth flow or meaningfully consent to one. The
   resolved model: an **adult** (parent/teacher) authenticates via Google —
   that's the entire job Google sign-in does now, pure device trust, nothing
   about the adult is ever shown or stored. The **child** — the actual
   student — is selected or added afterward from `ChildPicker.jsx`, a plain
   list of names/pictures with no login of their own. One Google account can
   cover several children (siblings, a shared classroom device).

Both changes were raised as conflicts against the hard rules before being
built, and both were reaffirmed with specific implementation detail, so
they're recorded as decisions, not silent drift. **Kindergarten support was
explicitly scoped to sign-in/entry only** — the core loop (assignments, text
steps, prompt levels 0–4) is unchanged and still built for grades 6–9;
`functions/prompt.js` and `validate.js` were not touched for this. If the
tool needs a genuinely different interaction model for pre-literate kids
(pictures/audio instead of paragraphs), that's a separate decision to make
explicitly, not something to infer from this pass.

**Marketing copy was removed by request.** `LandingPage.jsx` no longer has a
tagline or persuasive body text — just a plain company-name header (`Bloom`,
a placeholder pending the real name — one constant,
`LandingPage.jsx`'s `COMPANY_NAME`) and one flat sentence. The floating
breathing widget stayed; that's a functional sign-in affordance the user
asked for as a feature, not sales copy, and it's still the one surface
allowed ambient motion — `Entry.jsx` and `Step.jsx` remain untouched: one
focal element, no ambient motion, the one-crossfade budget. What still holds
everywhere regardless of register: no red, no exclamation marks, no sound
that plays without an explicit action.

**PII minimization, now stricter than the first pass.** The first version of
this stored a first name off the Google profile for "Welcome back, {name}."
That's gone — the adult's Google identity is never read for a name, email,
or photo at all; `profiles/{uid}` holds nothing but timestamps. Welcome
messages now use the **child's** self-chosen name (typed once, into
`ChildPicker.jsx`, by whoever set them up) — data the family/classroom
supplied directly, not pulled from an OAuth profile. This is a meaningfully
smaller privacy footprint than the previous version, driven by the same
BRD.md COPPA/PII constraint, made sharper now that the population explicitly
includes kindergarten-age children.

**"My work" (`MyWork.jsx`)** is the real history list — now
`profiles/{uid}/children/{childId}/history/{entryId}`, nested under the
specific child so siblings/classmates sharing one adult's account don't see
each other's work. Security is still enforced one level up, at the adult's
uid (`firestore.rules`, `storage.rules`) — a selected child is a UI concept,
not a separate Firebase Auth principal. This is a deliberate simplification:
it avoids building a second, parallel identity system under time pressure,
at the cost of siblings on the *same* account technically sharing a security
boundary (not from each other, cross-account access is still fully denied —
see the verification below — but a technically sophisticated sibling
inspecting their own authenticated requests could reach another child's
history under the *same* Google account). Acceptable for a shared
family/classroom device; would need real per-child auth if children ever
used the tool independently of the adult's session. This is a genuinely
different privacy posture than `summaries/{uid}` (DESIGN.md section 2):
summaries stay aggregate-only and adult-readable; history holds real content
and has no adult read path anywhere. Do not conflate the two, and do not
give any adult surface access to the `history` subcollection.

**Read-aloud.** Step.jsx has a "Listen" button using the browser's
`SpeechSynthesis` API — no cloud call, no key, no cost. Explicit user action
only, never auto-plays (hard rule 5). Speech is cancelled on Done, Too big,
and any step change, so it can never narrate a step the student already left.
This is the read-the-step-aloud slice of spec.md F24; word-synced
highlighting is the fuller scope and isn't built.

---

## Premade assignment

`Entry.jsx`'s textarea now opens pre-filled with a real assignment (a summer-
break reflection for English class) instead of blank — an explicit product
decision, not a shortcut: the point is that a student can land on the tool
and see the whole loop work without having to type or paste anything first.
It's still a plain `useState` initial value, fully editable, same as before.

## Stall detection

Built this pass: real silent-stall detection (spec.md Part 2) — auto-shrink
on a genuine stall, and fading back down after two independent completions.
**Deliberately not built**, by explicit product decision: modality
auto-switch (stall #2 on DESIGN.md's ladder) and a break-offer screen (stall
#3) — both are separate decisions with their own UI surface, not silently
folded into this pass.

**The workspace textarea on Step.jsx** is the first real text-input surface
there, a scoped exception to hard rule 3 the same way the "My work" link and
LandingPage are — the demand is real: the student needs somewhere to
actually write for a *written* assignment. `workSoFar` is owned by
`App.jsx`, cumulative across the whole assignment (feeds the LLM via
`functions/prompt.js`'s `WORK_SO_FAR`), and resets only when a new
assignment starts.

**The math is in `src/lib/scoring.js`, coefficients straight from spec.md/
DESIGN.md**, unchanged from the docs. The one thing the docs didn't pin down
is what counts as "a sentence boundary or a genuine pause" — resolved here as
either a ≥4s gap since the last keystroke, or the draft ending in
`. ! ? \n` with ≥1s settled. Score is only ever computed at one of those gate
moments, never mid-sentence. `src/hooks/useStuckDetector.js` collects the
raw counts (keystrokes, a Backspace/Delete count, tab-away count, and
`workSoFar.length` diffs) that feed the formula — see hard rule 7 below for
why it never touches the string itself.

**Escalation logic lives directly in `App.jsx`**, not a `useStepEngine.js`
hook — this MVP only builds 2 of DESIGN.md's 7 escalation rows (silent stall
→ shrink, fading), and every other piece of task-loop state there is already
a flat `useState` with plain handler functions. Revisit as a real hook if
the fuller ladder gets built.

**Firestore**: `profiles/{uid}/children/{childId}/sessions/{sessionId}` (one
per assignment attempt) and its `steps/{stepId}` subcollection (one per
generated step) — nested under the child, the same pattern `history` already
uses, replacing an older flat `sessions/{sid}` schema in `firestore.rules`
that predated the child model and was never actually written to. Step docs
hold **only counts and timestamps** — `target` (the step's own text, same
category of content `history.js` already stores), `promptLevel`, `latencyMs`,
`keystrokes`, `deletes`, `netChars`, `tabAways`, `modality`, `rejected`,
`independent`, `outcome`, `stuckScoreAtIntervention`. Never the student's
draft. `src/lib/sessions.js` is the write path, mirroring `history.js`'s
fire-and-forget style. `expectedSeconds` (the cold-start-90s, then
rolling-median-of-last-10 duration used in the score formula) is stored
per child in `profile.js`'s `updateExpectedSeconds`, recomputed only on an
independently completed step.

**Hard rule 7, made concrete here**: `useStuckDetector.js`'s keydown handler
only ever records a timestamp and classifies Backspace/Delete — the same
category of check as `Entry.jsx`'s existing `e.key === 'Enter'` — never the
character typed. `workSoFar` is read only for `.length` and its trailing
punctuation. Verified directly: a scripted check against the Firestore
emulator confirmed every written step doc contains only the fields listed
above, nothing resembling draft content.

## Worked examples when stuck

`generateExample` (`functions/example.js`) returns one concrete sentence the
student could actually put on the page — shown **only** after a stall or a
rejected step, never on a step they are moving through fine. An example on
every step is one more thing to read on a screen that is deliberately one
thing at a time.

**It is a second, separate callable on purpose.** The step must never wait on
it: `Step.jsx` renders the step immediately and the example appears when it
arrives, so a slow or failed example costs nothing. Folding it into
`generateStep` would also have pushed that prompt past its tier-1 latency
budget (see "Step generation rules").

Rules learned from live testing, all load-bearing:
- **Send the draft, not just the tail.** With only the last 240 characters
  the model wrote "We rented a little boat on **Lake Tahoe**" for a student
  whose draft says Lake Anna — the name sat outside the window, so it
  invented one. An example that contradicts the student's own page is worse
  than no example.
- **Filter instructional openers, not bare pronouns.** The first version
  rejected anything starting with "it", "this", or "here", which silently
  threw away good sentences — "It was scary at first" is exactly the voice
  we want. `META_START` now matches whole phrases ("you could", "try to",
  "for example").
- Rendered as a hairline + muted label + one bold sentence. No colour, no
  box, nothing that reads as a warning.

## Extensions can break hard rule 1 for us

`Step.jsx`'s workspace textarea carries `spellCheck="false"`,
`data-gramm="false"`, and `data-enable-grammarly="false"`. Found by testing
on a real machine: Grammarly attaches to that textarea and draws **red
squiggles under the student's own sentences** — precisely the corrective
red-ink signal this product exists to avoid, on the one surface where the
student is being asked to take a risk. Our own CSS cannot reach it; opting
the field out can. We cannot control every extension, but we decline the
common ones. Keep these attributes on any future student writing surface.

## Adult analytics dashboard

BRD.md scopes this (O5, BR6/7, BR10/11, §10 metrics) and DESIGN.md reserved
its design language (IBM Plex Mono, "flat rows and hairlines, no cards") and
a Firestore shape (`summaries/{uid}`, a `recomputeSummary` Cloud Function,
`shares/{code}`) — none of which was ever built until this pass, and this
pass **doesn't build that architecture**. `summaries`/`shares` in
`firestore.rules` stay as dormant, forward-looking stubs, untouched.

**Why the departure**: DESIGN.md's model assumed a second, non-owning adult
granted revocable access by the student via a share code. This app's real
adult is the signed-in account owner (the "Kindergarten &
adult-authenticates-child-selects model" above) — they already fully read
everything under their own uid, by design. There's no boundary left for a
server-written aggregate doc to protect. **Explicit, temporary
simplification, confirmed with the user**: the signed-in adult sees
`AdultView.jsx` directly for the child they've selected, reached via a
second small Entry-only link ("Progress", same category as "My work" —
never on Step). The real share-code/second-adult model is still the target
eventually, not abandoned.

`src/lib/analytics.js` computes all four metrics **client-side, live**, by
reading the child's own `sessions`/`steps` (already fully readable, no rules
change). This also means the data "keeps building over time" for free —
nothing is cached or needs a recompute trigger. It returns only derived
aggregates — `promptLevelSeries`, `stallRecovery`, `completion`,
`timeToFirstKeystroke` — and structurally never returns `target` or
`assignmentText`, even though it reads docs that contain them. That's the
real privacy boundary for this feature (hard rule 10, applied here even
though the account-ownership tradeoff means it isn't strictly required):
`AdultView.jsx` never has access to content, only counts.

**"Assignment completion" is an honest proxy, not a real signal.** Nothing
in the app marks an assignment finished — the loop just keeps generating
"next" steps. A session counts as "completed" here if its most recent
logged step ended with `outcome: 'completed'` (not mid-reject, not
mid-stall). Labeled as a proxy in the UI copy itself, not presented as true
completion tracking.

`useStuckDetector.js` gained one more captured count,
`firstKeystrokeMs` — BRD's "seconds from assignment on screen to first
character" — set once per step, meaningful only on a session's
chronologically-first step doc. Still just a timestamp diff, same hard-rule-7
category as everything else it tracks.

Charts (`src/components/TrendChart.jsx`) are hand-rolled SVG, no new
dependency — matches `Crossfade.jsx`'s existing precedent. Tokens only, no
new hues, no red/green status coding on rates.

## Verification

Before claiming anything works: run it, and confirm the output. Do not report a
feature complete based on the code looking correct.

Test the constraints explicitly — grep for `red`, `!`, `spinner`, `analytics`,
`streak` before finishing a session.
