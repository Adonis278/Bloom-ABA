# Adaptive Task Support

**Track 1 — IncludAI 2026**
Spec v4

---

## Problem

Students with ADHD don't fail assignments because they can't do the work. They fail at two moments: **they can't start, and they get stuck partway through.**

About **7 million US children** have ADHD — roughly 1 in 9. Around **1 in 5** get no school support at all.

**Scope:** grades 6–9.

---

## Solution

**Task analysis without a practitioner in the room.** One step at a time, sized to the individual learner.

The student enters an assignment. The tool returns one next physical action — small enough to just do. It watches for stalling, and when the student is stuck it doesn't repeat itself. It changes method.

### Methods (from ABA practice)

- **Keep the demand low** — one step, ~2 minutes, no decisions
- **Shape tolerance** — steps grow only as the student succeeds
- **Collect data** — every stall, reject, and completion logged
- **Simplify on failure** — stuck means the step gets smaller, never louder

### Three roles, one tool built for the student

| Role | Gets |
|---|---|
| **Student** | The tool itself. Full control. Sees everything. |
| **Parent** | Pattern summary — what step size works, when they stall, what helps |
| **Teacher** | Same summary, plus assignment-level completion |

Adults get **patterns, not surveillance**. The student sees exactly what's shared and can turn any of it off.

---

## Part 1 — Starting

The tool has its own initiation cost. If opening it takes executive function, we've moved the freeze rather than solved it.

**Target: under 10 seconds and zero decisions from open to first step.**

### Cheap entry
- Open directly to a step, never a menu or dashboard
- Returning users land on their last unfinished step
- Never show a blank page — last assignment pre-filled, or one-tap "same as last time"
- Photograph the assignment instead of typing it out
- Installable to phone home screen (PWA)

### The first step never fails
The first step is preparatory, not part of the assignment:

> *Open a blank doc.*
> *Type today's date at the top.*

Two guaranteed wins before the first real demand. This is **behavioral momentum** — compliance carries over.

### Step wording rules

| Rule | Bad | Good |
|---|---|---|
| Physical verb first | "Think about causes" | "Type the words…" |
| Name the exact object | "Start your essay" | "Open the doc called *Civil War*" |
| Say where | "Add a citation" | "At the end of paragraph 2, type…" |
| No choices | "Pick a cause" | "Write about slavery. We'll get to the others." |
| Cap length | 40 words | ≤25 words |

**Validation:** any step containing *decide, choose, think about, consider* is broken. Regenerate automatically.

### Re-entry is the real battle
- Auto-save always; closing the tab costs nothing
- Return to the exact step, plus one line of what was already done
- Offer a break **before** they abandon — a chosen break returns, an abandonment doesn't
- No guilt on re-entry. Ever.

---

## Part 2 — Detecting stuck

**Stuck is the absence of progress, not the absence of activity.** Someone retyping the same sentence for four minutes is more stuck than someone still for 30 seconds thinking.

### Signals — all browser-native, no camera

| Signal | Source | Means |
|---|---|---|
| Time on step | timestamp at render | base clock |
| Time-to-first-keystroke | first `keydown` | initiation latency — primary |
| Typing gaps | inter-key intervals | losing the thread |
| Net progress | chars added − deleted | churn without gain |
| Backspace ratio | deletes ÷ total keys | rewriting the same thing |
| Idle | no key/mouse/scroll | disengagement |
| Tab-away | `visibilitychange` | escape behaviour — strong |
| Rejects | their button taps | ground truth — weight highest |

### Score

```
score =
  2.0 * (secondsOnStep / expectedSeconds)
+ 1.5 * (secondsSinceLastKey / 30)
+ 1.5 * (tabAwayCount)
+ 1.0 * (backspaceRatio > 0.4 ? 1 : 0)
+ 1.0 * (netChars <= 0 && keystrokes > 20 ? 1 : 0)
+ 3.0 * (rejectedThisStep ? 1 : 0)
```

Intervene at ~3.0. Transparent weighted sum, not a model — we can explain it, and we can tune it against a real user.

### Gate on natural breaks
Check at sentence boundaries or genuine pauses, never mid-sentence. **False positives are worse than false negatives** — interrupting productive thinking breaks the one thing that makes this tool different.

### Cold start
Default `expectedSeconds` = 90. After each completed step, recompute the student's own median. By step five the threshold is theirs.

### Camera — deferred
Optional, opt-in, on-device only, coarse signals (presence, gaze-away duration), **no emotion inference**, visible indicator, one tap to kill. Not in v1 or v2. Keystroke timing gets ~80% of the signal at ~5% of the risk.

---

## Part 3 — Adjusting

### Route by reason, not severity

| What happened | What's wrong | What changes |
|---|---|---|
| Tapped **too big** | Demand too high | Shrink the step |
| Tapped **too vague** | Unclear action | Same size, more concrete |
| Tapped **don't have what I need** | Missing prerequisite | Insert a fetch step first |
| **Silent stall** | Unknown | Drop one prompt level, log what worked |

### Prompt hierarchy

| Level | What the step looks like |
|---|---|
| **0 — Independent** | "Write one sentence about why the South wanted to leave." |
| **1 — Specified** | "Write one sentence starting with 'The South wanted…'" |
| **2 — Partial model** | "Type these three words: *the South wanted*" |
| **3 — Recognition** | "Which is closest? (a)…(b)…(c)… — pick one, I'll write it in." |
| **4 — Full model** | "Here's a sentence. Type it, then change one word." |

**Level 3 is the biggest single drop in demand** — recall becomes recognition. Producing a sentence is hard; picking one is easy.

### Fading — going back up
Two independent completions → drop one prompt level. Three → drop another. Working level stored per student.

**Without fading this is an accommodation. With it, it's an intervention.** Say this out loud in the demo.

### Other levers
- **Modality** — read aloud, or icon + three words. Use when shrinking twice hasn't worked; the problem may be intake, not demand.
- **Presentation** — size, spacing, weight, warmer contrast. (Damon: changing colour increases attending.)
- **Load** — strip to step text and one button.
- **Break** — third failure, student-set return. Prevents ending on failure.

### Generation prompt

```
Give ONE next physical action.

PROMPT_LEVEL: {0-4}
  0 = state the action, they figure out how
  1 = state the action with exact starting words
  2 = give literal words to type (max 5)
  3 = give 3 options, they pick one
  4 = give full text, they copy and change one word

REASON: {too_big | too_vague | missing_prereq | silent_stall}
  too_big        -> same goal, less of it
  too_vague      -> same size, name the exact physical action
  missing_prereq -> the step is to GET the thing they need
  silent_stall   -> drop one prompt level

STUDENT_RULES:  {their own constraints}
STUDENT_WORLD:  {interests — examples/analogies/options only}
LAST_STEP:      {what they were stuck on}
WORK_SO_FAR:    {their current draft}

Max 25 words. No praise. No exclamation marks.
Return only the step.
```

---

## Part 4 — Knowing the student

Standard ABA practice calls this **preference assessment**. Familiarity reduces cognitive load and converts recall into recognition — it isn't decoration.

**Three questions, student-entered, editable any time:**
1. What do you know a lot about?
2. What do you do when you're not doing schoolwork?
3. What's something you'd want as a break?

### The guardrail

> **Interest is the vehicle for the step. Never a thing beside the step.**

| ✅ Vehicle | ❌ Beside |
|---|---|
| Example sentence uses their world | Image of their favourite thing appears |
| Analogy drawn from what they know | Themed animation plays |
| Level-3 options are familiar | Game unlocks after 3 steps |
| Read-aloud voice they chose | Character mascot talks to them |

The right column is what edtech does. For a brain that can't disengage from interesting things, it's an exit, not a re-entry cue.

### The familiar cue
One short sound the student picks (1–2s), played **only** on stuck recovery. After a few sessions it stops being a sound and becomes a signal. Cheap, quiet, doesn't compete with the task.

Interest data stays on-device, visible and deletable by the student.

---

## Part 5 — UI direction

**The design is the intervention.** For weak sensory filtering, every saturated colour and moving element is load. Restraint that's visible reads as intentional.

### Tokens

| | |
|---|---|
| Paper | `#DDE1DB` desaturated sage-grey |
| Card | `#F1F3EF` — the only lit surface on the page |
| Ink | `#222722` |
| Muted | `#535A53` |
| Line | `#C3CABF` |
| Warm accent | `#7A6A4F` — **used only on the student's own rules** |

**No accent colour in the default state.** Colour appears only where the student put it.

### Type
- **Atkinson Hyperlegible** — designed by the Braille Institute to distinguish easily-confused characters. Subject-grounded, not stylistic.
- **IBM Plex Mono** — adult dashboard only. Type encodes who the screen is for: legibility face for the student, instrument readout for adults.

### Layout
- Single centred card, generous margins, nothing in the corners
- Step text 31px / weight 700
- Actions below, tonal, no colour
- Progress: shape only, position never contents
- Adult view deliberately plainer — rows and hairlines, not a designed experience

### Motion
One slow crossfade when a step is replaced. Nothing else. `prefers-reduced-motion` respected.

**Mockup:** `adaptive-task-support-mockup.html` — six clickable screens.

---

## MVP — what ships first

**Paste an assignment → get one next action → tap Done → get the next one.** Plus the *Too big* button that regenerates smaller.

| | |
|---|---|
| Screens | 2 |
| Buttons on the step | 2 (Done, Too big) |
| Storage | in-memory |
| Accounts / backend | none |

**Not in v1:** camera, dashboard, audio, voice input, summary export, rules box, read-aloud, progress bar, modality switching, preference profile.

**Ship tonight, nearly free:**
1. First step is always preparatory (one line in the prompt)
2. Reject any step containing a decision word (one regex + retry)

---

## Functional Requirements

### Core
- **F1** — Enter assignment by paste, photo, or voice
- **F2** — Return one next physical action (~2 min, no decisions)
- **F3** — One step on screen, never the list
- **F4** — Mark done → next step
- **F5** — Generate against current draft, not just the original assignment
- **F6** — Validate output: regenerate if it contains a decision word
- **F7** — First step of any assignment is preparatory
- **F8** — Auto-save; return to exact step with one line of context

### Detect
- **F9** — Log keystroke timing: first-key latency, gaps, backspace ratio, net chars, idle
- **F10** — Log tab-away events
- **F11** — One-tap reject: *too big / too vague / don't have what I need*
- **F12** — Weighted stuck score with per-student threshold
- **F13** — Gate checks on sentence boundaries or genuine pauses
- **F14** — Recompute `expectedSeconds` from the student's own median after each step

### Adjust
- **F15** — Route response by reject reason
- **F16** — Prompt levels 0–4
- **F17** — Escalate on repeat: shrink → change modality → offer break
- **F18** — Fade: drop a prompt level after consecutive independent completions
- **F19** — Behavioural momentum: two easy wins before a hard demand
- **F20** — Store working prompt level per student

### Student control
- **F21** — Plain-language rules the AI must follow
- **F22** — Three-question interest profile, editable
- **F23** — Self-chosen recovery sound
- **F24** — Read-aloud with synced highlighting
- **F25** — Voice input to report progress
- **F26** — Adjustable text: size, spacing, weight, colour, contrast
- **F27** — Optional audio conditions, off by default
- **F28** — Self-set reward and threshold
- **F29** — Progress as position only
- **F30** — Sharing panel: student sees and controls what each adult sees

### Parent / teacher
- **F31** — Invite by student-generated code; adults cannot self-enroll
- **F32** — Pattern summary: working step size, stall times, effective modalities, completion rate
- **F33** — Token economy view: chosen reward, threshold, hit rate
- **F34** — Never shows assignment content, draft text, or keystroke content
- **F35** — Student sees every view an adult opens

### Output
- **F36** — Stuck score plotted over the session with interventions marked
- **F37** — Event log timeline: stalls, interventions, recoveries
- **F38** — Exportable one-page summary the student owns

---

## Non-Functional Requirements

### Sensory safety
- **N1** — Nothing auto-plays: no sound, no motion
- **N2** — One focal element on screen, always
- **N3** — No red, no alarms, no error states
- **N4** — WCAG AA contrast minimum
- **N5** — Interface copy at grade 5 reading level or below
- **N6** — `prefers-reduced-motion` respected

### Zero friction
- **N7** — No account for the student; no onboarding gate
- **N8** — Assignment to first step in under 10 seconds
- **N9** — Works on a phone browser; installable to home screen

### Privacy
- **N10** — Keystroke **timing** only. Content never logged or transmitted.
- **N11** — No content replay. (This is where we diverge from process-analytics tools.)
- **N12** — Camera frames never leave the device and are never stored
- **N13** — No analytics, no third-party tracking
- **N14** — Stuck score and timing never shown to the student
- **N15** — Nothing shared with any adult until the student turns it on
- **N16** — Plain-language privacy statement on first screen

### Technical
- **N17** — Step returns in under 3 seconds
- **N18** — Last step visible offline
- **N19** — Degrades fully without camera or microphone
- **N20** — Public repo, one-command deploy

---

## Data schema

Log once per step, in vocabulary a behaviour analyst can read:

```json
{
  "target":       "step text",
  "promptLevel":  0,
  "latencyMs":    11400,
  "keystrokes":   62,
  "deletes":      9,
  "netChars":     41,
  "tabAways":     0,
  "modality":     "text",
  "rejected":     null,
  "independent":  true,
  "outcome":      "completed",
  "timestamp":    "..."
}
```

One log, two consumers: the detector reads the current row, analytics reads the history.

**On CentralReach / Rethink:** their APIs are provisioned by sales, gated behind HIPAA BAAs, and expose practice operations — rosters, scheduling, billing — not initiation latency. We build our own and borrow their vocabulary. The data we collect doesn't exist in any clinical system today.

---

## Out of Scope

No content teaching. No accounts or backend for students. No streaks or leaderboards. No native app. No clinical claims. No emotion recognition. No Socratic questioning — our students' bottleneck is initiation, not comprehension; adding a question adds demand.

---

## Open Decisions

**1. Camera.** COPPA/FERPA exposure, reads as surveillance of neurodivergent kids, and gaze models are trained largely on neurotypical faces — atypical gaze is a diagnostic feature of our population. Recommendation: cut from v1 and v2 entirely.

**2. Token economy.** Genesis and Damon raised it and it works, but adult-controlled rewards are the sharpest edge of the ABA critique. Our version: the student picks the reward, sets the threshold, and the tool never withholds it.

**3. Keystroke timing, never content.** Logging *what* a minor types is keylogging. Logging *when* is measurement.

---

## Measurement Plan

| Metric | Definition | Shown to student? |
|---|---|---|
| **Time-to-first-keystroke** | Seconds from assignment on screen to first character | No |
| **Rejections before first action** | How small the step had to get | No |
| **Completion** | Did they finish? | No |

**Method:** baseline run with no tool, timed. Intervention run on a comparable assignment. Target ≥3 users.

**Rules:** the student never sees the timer — it's evidence, not a feature. Report honestly, including users it didn't work for.

---

## Timeline

| Day | Focus |
|---|---|
| **Aug 4** | Register, Discord, recruit users, first co-design session |
| **Aug 5** | Core loop only. Deploy publicly. |
| **Aug 6** | Detection + adjustment + accessibility |
| **Aug 7** | Second co-design session, baseline/intervention timing, make the changes |
| **Aug 8** | Video first, then writeup, then repo, then submit early |

**Submissions close Saturday, Aug 8, 11:59 PM PT.**

---

## Judging Alignment

| Criterion | Weight | Covered by |
|---|---|---|
| Impact on Neurodivergent Youth | 30% | Measured before/after data, multiple users, honest reporting |
| Innovation in AI Application | 25% | Stuck detection, prompt hierarchy, fading, draft-state generation, user-authored rules |
| Usability & Accessibility | 25% | One thing on screen, zero-decision entry, nothing auto-plays, student holds the key |
| Technical Execution | 10% | Working prototype, clean public repo |
| Presentation Quality | 10% | 3-min video opening and closing on the student's voice |

80% of the score is not code. The video carries 65 of those points — treat it as the deliverable.

---

## Positioning

> Every other tool tries to hold the student's attention. This one tries to need less of it.
