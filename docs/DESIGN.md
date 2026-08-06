# Design Document

**Adaptive Task Support** · Track 1, IncludAI 2026
Design v1 · React + Tailwind + Firebase

---

# Part I — Technical Design

## 1. Architecture

```
┌─────────────────────────────────────────────┐
│  React SPA (Vite + Tailwind)                │
│  Firebase Hosting                           │
│                                             │
│  • Step surface     • Detector (in-browser) │
│  • Settings         • Local step buffer     │
└───────┬─────────────────────────┬───────────┘
        │                         │
        │ Firebase SDK            │ HTTPS
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│ Firebase Auth    │    │ Cloud Function       │
│ (anonymous)      │    │ generateStep()       │
└──────────────────┘    │  → Anthropic API     │
                        └──────────────────────┘
┌─────────────────────────────────────────────┐
│ Firestore                                   │
│  profiles / sessions / steps / summaries    │
│  shares                                     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Cloud Function  recomputeSummary()          │
│  onWrite(steps) → summaries/{uid}           │
└─────────────────────────────────────────────┘
```

**Why each piece:**

| Service | Use | Note |
|---|---|---|
| **Firebase Auth** | Anonymous sign-in | No email, no password, no PII. Satisfies "no account" while giving a stable uid. |
| **Firestore** | All persistence | Real-time listeners power the adult dashboard without polling. |
| **Cloud Functions** | LLM proxy + summary aggregation | The API key must never reach the client. |
| **Hosting** | Static SPA | One-command deploy. |

**Deliberately not used:** Analytics, Crashlytics, Performance Monitoring, Cloud Messaging. Every one of them is third-party tracking on a minor. Their absence is a stated feature.

---

## 2. Data model

```
profiles/{uid}
  createdAt
  workingPromptLevel: 0-4
  expectedSeconds: number        // rolling median, cold start 90
  rules: string[]                // student-authored AI constraints
  interests: { knowsAbout, doesForFun, wantsAsBreak }
  theme: { tint, textScale, lineHeight, weight, contrast }
  recoverySound: string | null

sessions/{sessionId}
  uid
  assignmentText                 // NEVER exposed to shares
  startedAt, endedAt
  outcome: 'completed' | 'abandoned' | 'break'

sessions/{sessionId}/steps/{stepId}
  target: string
  promptLevel: 0-4
  latencyMs, keystrokes, deletes, netChars, tabAways
  modality: 'text' | 'audio' | 'visual'
  rejected: 'too_big' | 'too_vague' | 'missing_prereq' | null
  independent: boolean
  outcome: 'completed' | 'shrunk' | 'abandoned'
  stuckScoreAtIntervention: number | null
  createdAt

summaries/{uid}                  // AGGREGATES ONLY — the adult-readable doc
  workingStepSeconds
  stallsByHour: { [hour]: count }
  effectiveModalities: { text, audio, visual }
  completionRate
  promptLevelTrend: number[]
  chosenReward, rewardThreshold, thresholdHitRate
  updatedAt
  // contains no assignment text, no step text, no keystroke content

shares/{shareCode}
  ownerUid
  role: 'parent' | 'teacher'
  createdAt, revokedAt
  lastOpenedAt, openCount
```

### The critical design decision

**Adults never read the student's collections.** They read `summaries/{uid}` only — a separate document containing nothing but derived aggregates, written by a Cloud Function.

This enforces "adults never see content" **at the database layer**, not in UI code. Even a bug in the dashboard cannot leak an assignment, because the data isn't reachable.

Say this in the demo. It's a genuine architectural claim, not a promise.

---

## 3. Security rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    // Student owns everything under their uid
    match /profiles/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /sessions/{sid} {
      allow read, write: if request.auth.uid == resource.data.uid;
      match /steps/{stepId} {
        allow read, write: if request.auth.uid ==
          get(/databases/$(db)/documents/sessions/$(sid)).data.uid;
      }
    }

    // Summaries: student reads own; holder of a live share code reads
    match /summaries/{uid} {
      allow read: if request.auth.uid == uid
        || hasLiveShare(uid, request.auth.uid);
      allow write: if false;          // Cloud Function only
    }

    match /shares/{code} {
      allow read:   if request.auth != null;
      allow create, update, delete:
        if request.auth.uid == resource.data.ownerUid;
    }
  }
}

function hasLiveShare(ownerUid, viewerUid) {
  return exists(/databases/$(db)/documents/shares/$(viewerUid))
    && get(...).data.ownerUid == ownerUid
    && get(...).data.revokedAt == null;
}
```

Adults have **no write path anywhere**. They cannot set goals, assign work, or change settings. This is structural, not policy.

---

## 4. Cloud Functions

### `generateStep`

```javascript
exports.generateStep = onCall(async (req) => {
  const { assignment, workSoFar, completedSteps,
          promptLevel, reason } = req.data;
  const profile = await getProfile(req.auth.uid);

  const step = await callAnthropic(buildPrompt({
    assignment, workSoFar, completedSteps,
    promptLevel, reason,
    rules: profile.rules,
    interests: profile.interests
  }));

  // Validation gate — regenerate if the step contains a decision
  if (/\b(decide|choose|think about|consider|pick which)\b/i.test(step)) {
    return retryWithStricterPrompt(...);
  }
  if (step.split(/\s+/).length > 25) return retryShorter(...);

  return { step };
});
```

Model: `claude-sonnet-4-6`. Target latency <3s.

### `recomputeSummary`

Firestore trigger on `sessions/{sid}/steps/{stepId}` write. Recomputes the aggregate doc. Never copies text.

---

## 5. Front-end structure

```
src/
  App.jsx
  screens/
    Entry.jsx           // assignment intake
    Step.jsx            // the one lit card
    Rules.jsx           // student-authored constraints
    Settings.jsx        // tint, text, audio
    Summary.jsx         // exportable one-pager
    AdultView.jsx       // mono readout
  hooks/
    useStuckDetector.js // keystroke + interaction scoring
    useStepEngine.js    // prompt level, escalation, fading
    useProfile.js       // Firestore profile sync
  lib/
    scoring.js
    firebase.js
  theme/
    tokens.js
```

### `useStuckDetector`

Runs entirely in the browser. Buffers keystroke **timing** — never characters. Emits `{ score, reason }` and gates evaluation on sentence boundaries or genuine pauses.

```javascript
const score =
    2.0 * (secondsOnStep / expectedSeconds)
  + 1.5 * (secondsSinceLastKey / 30)
  + 1.5 * tabAwayCount
  + 1.0 * (backspaceRatio > 0.4 ? 1 : 0)
  + 1.0 * (netChars <= 0 && keystrokes > 20 ? 1 : 0)
  + 3.0 * (rejectedThisStep ? 1 : 0);
```

Intervene at ≥3.0. **Never mid-sentence.**

### `useStepEngine`

| Trigger | Action |
|---|---|
| `too_big` | promptLevel + 1 |
| `too_vague` | same level, `reason=too_vague` |
| `missing_prereq` | insert fetch step |
| silent stall #1 | promptLevel + 1 |
| silent stall #2 | change modality |
| silent stall #3 | offer break |
| 2 independent completions | promptLevel − 1 (fading) |

---

# Part II — Visual Design

## 6. Color theory

The palette is not decoration here. For a population with weak sensory filtering, **color is load**, and the color decisions are part of the intervention.

### Principle 1 — Saturation drives arousal

Chroma, not hue, is what makes an interface feel loud. Every surface color is held at low saturation (roughly 4–12% in HSL). The interface should feel like overcast daylight, not a screen demanding attention.

### Principle 2 — Hue carries physiological weight

Long-wavelength hues (red, orange) are alerting and threat-associated. Short-wavelength green and blue-green are the calmest region of the spectrum and the most common choice in clinical and sensory-regulation environments.

**Our ground is a desaturated sage-grey.** Green-adjacent, near-neutral, and it sits at the lowest-arousal end without being cold or clinical.

### Principle 3 — Maximum contrast is not optimal contrast

Pure black on pure white is 21:1 and causes **halation** — text appearing to shimmer or bleed — which is a well-documented source of visual stress for dyslexic readers.

**Target 10–14:1 for body text, never 21:1.** Off-white ground, near-black-but-not-black ink. WCAG AA is a floor we exceed; maximum contrast is a ceiling we stay under.

### Principle 4 — One accent, and it belongs to the student

Default state has **no accent color at all.** The only chromatic element in the product is a warm ochre rule that appears on the rules the student wrote themselves.

The most colorful thing on screen is the thing the student owns. That is a design statement the judges can see without being told.

### Principle 5 — Never encode meaning in hue alone

Roughly 1 in 12 males has a color vision deficiency. Every state that could be signaled by color is also signaled by weight, position, or text.

### Principle 6 — No red, anywhere

Red is threat-coded and this population has elevated rejection sensitivity. **There is no error state in this product.** A step that didn't work is replaced quietly by a smaller one — no red, no alarm, no exclamation mark.

### Principle 7 — Tint is a student preference, not a treatment

Some readers report that a colored background reduces visual stress. The clinical evidence for colored overlays is contested, so we offer tint as **preference**, never as remedy, and make no claim about it.

Five tints, all luminance-matched so contrast ratios hold constant:

| Tint | Hex | |
|---|---|---|
| Sage | `#DDE1DB` | default |
| Sand | `#E3DFD6` | warm |
| Mist | `#D9DFE2` | cool |
| Rose | `#E4DCDC` | soft warm |
| Slate | `#2A2E2B` | dark, not black |

Dark mode uses `#2A2E2B`, never `#000` — pure black with light text produces halation on OLED.

### Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#DDE1DB` | `#2A2E2B` | page ground |
| `card` | `#F1F3EF` | `#353A36` | the one lit surface |
| `ink` | `#222722` | `#E8EBE7` | body text (~12:1) |
| `muted` | `#535A53` | `#A3AAA3` | secondary (~5.5:1) |
| `line` | `#C3CABF` | `#454B46` | hairlines |
| `warm` | `#7A6A4F` | `#B39B74` | student's own rules only |

---

## 7. Typography

**Atkinson Hyperlegible** — designed by the Braille Institute specifically to differentiate easily-confused characters (I/l/1, O/0, b/d). Chosen for the subject, not for style.

**IBM Plex Mono** — adult dashboard only.

> **Type encodes audience.** The student gets the legibility face. Adults get an instrument readout. The dashboard is deliberately not a designed experience, because it isn't the product.

| Role | Size | Weight | Line height |
|---|---|---|---|
| Step text | 31px | 700 | 1.33 |
| Sub / hint | 17px | 400 italic | 1.55 |
| Body | 17px | 400 | 1.55 |
| Buttons | 15px | 400/700 | 1 |
| Adult rows | 14px mono | 400 | 1.5 |
| Labels | 11–12px mono | 500 | uppercase, .11em |

All of size, line-height, letter-spacing, and weight are student-adjustable.

---

## 8. Layout & motion

- **One focal element, always.** Single centered card, max-width 620px, generous margins, nothing in the corners.
- **No persistent chrome.** No nav bar, no sidebar, no logo watching.
- **Progress is shape only** — position, never contents.
- **Motion:** one 450ms crossfade when a step is replaced. Nothing else moves, ever. `prefers-reduced-motion` removes even that.
- **Adult view:** flat rows and hairlines, no cards, no shadows.

---

## 9. Tailwind config

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        card:  'rgb(var(--card)  / <alpha-value>)',
        ink:   'rgb(var(--ink)   / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line:  'rgb(var(--line)  / <alpha-value>)',
        warm:  'rgb(var(--warm)  / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        step: ['1.94rem', { lineHeight: '1.33', letterSpacing: '-0.012em' }],
      },
      boxShadow: {
        lit: '0 1px 2px rgb(34 39 34 / .05), 0 14px 40px -18px rgb(34 39 34 / .22)',
      },
      transitionDuration: { step: '450ms' },
    },
  },
};
```

```css
/* index.css — tints swap variables, components never change */
:root        { --paper:221 225 219; --card:241 243 239; --ink:34 39 34;
               --muted:83 90 83;   --line:195 202 191; --warm:122 106 79; }
[data-tint="sand"]  { --paper:227 223 214; --card:245 242 236; }
[data-tint="mist"]  { --paper:217 223 226; --card:238 242 244; }
[data-tint="rose"]  { --paper:228 220 220; --card:245 240 240; }
[data-theme="dark"] { --paper:42 46 43;  --card:53 58 54; --ink:232 235 231;
                      --muted:163 170 163; --line:69 75 70; --warm:179 155 116; }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

Student text controls map to a scale multiplier on the root font size, so every size scales together.

---

## 10. Accessibility spec

| Requirement | Implementation |
|---|---|
| Keyboard complete | Every action reachable by Tab; visible 2px focus ring |
| Screen reader | `aria-live="polite"` on the step region so replacement is announced |
| Contrast | ≥10:1 body, ≥4.5:1 secondary |
| Touch targets | ≥44px |
| Reading level | All UI copy ≤ grade 5 |
| Reduced motion | Honored globally |
| No auto-play | Sound and speech require explicit action |
| No color-only meaning | Every state also carries weight, text, or position |
| Text scaling | Student-controlled, up to 200% without layout break |

---

## 11. Build order

| Day | Ship |
|---|---|
| **Aug 5 AM** | Vite + Tailwind + tokens, Firebase project, anonymous auth |
| **Aug 5 PM** | `generateStep` function, Entry + Step screens, deploy publicly |
| **Aug 6 AM** | `useStuckDetector`, escalation ladder, Firestore step logging |
| **Aug 6 PM** | Rules screen, accessibility controls, tints, read-aloud |
| **Aug 7 AM** | `recomputeSummary`, Summary screen, AdultView, share codes |
| **Aug 7 PM** | **Feature freeze.** Co-design session two. Tune thresholds. |
| **Aug 8** | Video, writeup, repo, submit early |

**If behind on Aug 6 evening:** cut the adult view and share codes. The student loop plus detection plus evidence is a complete submission. The dashboard is not.

---

## 12. Design rationale, in one line

> Every other tool tries to hold the student's attention. This one tries to need less of it — and the palette, the type, the silence, and the empty corners are all that thesis made visible.
