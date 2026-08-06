// Mock implementation of the UI/backend contract:
//   getNextStep({ assignmentInput, history, rejectReason })
//     -> { stepId, stepText, modality, suggestBreak }
//
// Pure function of its inputs: it re-derives everything from assignmentInput
// and history on every call, with no module-level mutable state. That's what
// keeps the "stuck" signal invisible to the rest of the app (only this file
// ever looks at reject streaks) and what makes swapping in a real backend
// later a change confined to this file's internals.

const WRAP_UP_CHUNKS = ['Look over what you did.', 'Put it where it needs to go.']

const VAGUE_TEMPLATES = [
  (chunk) => `Specifically: ${chunk}`,
  (chunk) => `Start with the first part: ${chunk}`,
  (chunk) => `Just this one small part: ${chunk}`,
]

const MATERIAL_KEYWORDS = ['paper', 'pencil', 'laptop', 'book', 'notebook']

function splitAssignmentIntoChunks(assignmentInput) {
  const text = assignmentInput.trim()
  if (!text) return ['Get started on your task.', ...WRAP_UP_CHUNKS]

  let chunks = text
    .split(/[.;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (chunks.length <= 1) {
    chunks = text
      .split(/\s+and\s+|,/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  if (chunks.length <= 1) {
    chunks = [text]
  }

  return [...chunks, ...WRAP_UP_CHUNKS]
}

function rejectStreak(history) {
  let n = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].status === 'rejected') n++
    else break
  }
  return n
}

function shrinkChunk(chunk, streak) {
  const words = chunk.split(/\s+/).filter(Boolean)
  if (words.length <= 3) return chunk
  const targetLen = Math.max(3, Math.ceil(words.length / (1 + streak)))
  return words.slice(0, targetLen).join(' ')
}

function makeVague(chunk, streak) {
  const template = VAGUE_TEMPLATES[Math.min(streak - 2, VAGUE_TEMPLATES.length - 1)]
  return template(chunk)
}

function makeMaterialsStep(assignmentInput) {
  const lower = assignmentInput.toLowerCase()
  const found = MATERIAL_KEYWORDS.filter((word) => lower.includes(word))
  if (found.length > 0) {
    return `Get what you need first: ${found.join(', ')}.`
  }
  return 'Get what you need first: paper and a pencil.'
}

function modalityForStreak(streak) {
  if (streak >= 4) return 'guided'
  if (streak >= 2) return 'simplified'
  return 'standard'
}

export async function getNextStep({ assignmentInput, history, rejectReason }) {
  const chunks = splitAssignmentIntoChunks(assignmentInput)
  const chunkIndex = history.filter((entry) => entry.status === 'done').length
  const streak = rejectStreak(history)
  const modality = modalityForStreak(streak)
  const suggestBreak = streak >= 4

  if (chunkIndex >= chunks.length) {
    return {
      stepId: crypto.randomUUID(),
      stepText: 'You finished this assignment.',
      modality,
      suggestBreak,
    }
  }

  let stepText = chunks[chunkIndex]

  if (rejectReason === 'too_big') {
    stepText = shrinkChunk(stepText, streak)
  } else if (rejectReason === 'too_vague') {
    stepText = makeVague(stepText, streak)
  } else if (rejectReason === 'missing_materials') {
    stepText = makeMaterialsStep(assignmentInput)
  } else if (streak >= 2) {
    stepText = shrinkChunk(stepText, streak)
  }

  return {
    stepId: crypto.randomUUID(),
    stepText,
    modality,
    suggestBreak,
  }
}
