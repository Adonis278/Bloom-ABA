# Business Requirements Document

**Adaptive Task Support** · Track 1, IncludAI 2026
BRD v1

---

## 1. Executive Summary

Students with ADHD don't fail assignments because they can't do the work. They fail because they can't start, and because they lose the thread partway through.

Applied Behavior Analysis already solves this through **task analysis** — breaking work into its smallest steps and reducing the demand when a learner stalls. The method works. It requires a trained practitioner in the room, and there aren't enough of them.

We are building that method as software the student operates themselves.

---

## 2. Problem & Opportunity

| | |
|---|---|
| US children with ADHD | ~7 million (roughly 1 in 9) |
| Receiving no school support | ~1 in 5 |
| Target segment (grades 6–9) | ~1.5–2M students |

**Three gaps we are addressing:**

1. **School support doesn't reach the moment.** 504 plans and IEPs grant extra time, seating, reduced quantity — all adjustments to the environment *around* the work. None help a student who cannot begin.
2. **The moment happens at home.** 8pm at a kitchen table, where no accommodation exists.
3. **Practitioners can't scale.** ABA delivery requires a technician physically present. Rural coverage is a known, stated gap.

**Existing tools stop one step short.** Task-breakdown apps produce a list and hand it over. For many students the list was never the problem — being unable to start item #1 is. They are also built as adult productivity tools, not for a 13-year-old with an assignment due Friday.

---

## 3. Objectives

| # | Objective | Success criterion |
|---|---|---|
| O1 | Reduce time to start a task | Measurable drop in time-to-first-keystroke vs. baseline |
| O2 | Recover students who stall mid-task | Stall events followed by resumed progress |
| O3 | Keep the tool usable without adult supervision | Zero-account entry; completion without prompting |
| O4 | Give students evidence about themselves | Exportable summary the student owns |
| O5 | Support adults without surveilling students | Adults see patterns; never content; student controls access |

---

## 4. Users

| User | Role | Needs |
|---|---|---|
| **Student** (grades 6–9, ADHD) | Primary | Start now. No judgment. No decisions. Nothing reported without consent. |
| **Parent** | Secondary, invited | Understand what actually helps. Run a reward system that fits the child. |
| **Teacher** | Secondary, invited | Know whether work is getting done and where support is needed. |
| **Behavior practitioner** | Advisory | Data in vocabulary they recognize. |

**The tool is built for the student.** Adults are guests in it, admitted by the student.

---

## 5. Scope

### In scope (v1)
- Assignment intake by paste, photo, or voice
- One-step-at-a-time generation with prompt-level control
- Stall detection from keystroke and interaction signals
- Automatic demand reduction and modality change
- Student-authored rules constraining AI output
- Accessibility controls: text size, spacing, weight, tint, read-aloud
- Session log and per-student profile
- Student-granted adult access to pattern summaries
- Exportable one-page student summary

### Out of scope
- Teaching content or explaining subject matter
- Grading, assessment, or comprehension scoring
- Camera or emotion recognition
- Streaks, leaderboards, points
- Native mobile app
- Clinical claims or diagnosis
- Integration with clinical platforms (CentralReach, Rethink)

---

## 6. Business Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR1 | A student can go from opening the app to a first actionable step in under 10 seconds, with no account | Must |
| BR2 | Only one step is visible at any time | Must |
| BR3 | When a student stalls, the demand decreases — never increases | Must |
| BR4 | Every AI-generated step names a physical action and requires no decisions | Must |
| BR5 | The system records timing and interaction data, never typed content | Must |
| BR6 | No data is visible to any adult until the student grants access | Must |
| BR7 | The student can revoke adult access at any time and sees when it is used | Must |
| BR8 | Nothing plays sound or motion without explicit student action | Must |
| BR9 | The student can set rules the AI must follow | Should |
| BR10 | Step difficulty increases again as the student succeeds | Should |
| BR11 | The student can export a summary of their own patterns | Should |
| BR12 | Adults can see a reward threshold the student set for themselves | Could |

---

## 7. Constraints

| Constraint | Implication |
|---|---|
| Submission deadline Aug 8, 11:59 PM PT | MVP must be demonstrable by Aug 6 |
| Users are minors | COPPA/FERPA exposure; no PII, no content logging |
| Population has sensory sensitivity (~50% auditory) | Nothing auto-plays; low-arousal visual design |
| Judged partly by neurodivergent advocates | No compliance mechanics, no surveillance framing |
| Technical execution is 10% of score | Optimize for evidence and usability, not architecture |
| LLM API key cannot ship client-side | Requires server-side proxy |

---

## 8. Assumptions

- Students have browser access on a phone or laptop at home
- Assignments arrive as text or can be photographed
- At least one neurodivergent user is available for co-design before Aug 7
- Latency under 3s is achievable for step generation

---

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| False-positive stall detection interrupts productive thinking | High — breaks core value | Gate checks on sentence boundaries; tune conservatively |
| Product reads as surveillance to judges | High | Student holds all access; timing not content; state it on screen |
| Idea overlaps existing task-breakdown tools | Medium | Differentiate on detection, fading, and measurement |
| Co-design evidence too thin | High — 55% of score | Two sessions minimum; deploy early to recruit more |
| Scope creep past MVP | Medium | Feature freeze Aug 7 morning |

---

## 10. Success Metrics

**Primary**

| Metric | Definition | Visible to student |
|---|---|---|
| Time-to-first-keystroke | Seconds from assignment on screen to first character | No |
| Stall recovery rate | Stalls followed by resumed progress | No |
| Assignment completion | Binary | No |

**Secondary**
- Prompt level required over time (should trend toward independent)
- Rejections before first action
- Return usage after the hackathon ends

**Method:** baseline run without the tool, timed. Intervention run on a comparable assignment. Minimum three users. Results reported honestly, including failures.

---

## 11. Positioning

> Every other tool tries to hold the student's attention. This one tries to need less of it.
