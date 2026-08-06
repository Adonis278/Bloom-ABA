const SETTINGS_KEY = 'bloomaba:settings'
const SHARING_KEY = 'bloomaba:sharing'

export const DEFAULT_SETTINGS = {
  version: 1,
  aiRules: {
    smallerSteps: false,
    readAloud: false,
  },
  textSize: 'standard',
  reward: {
    enabled: false,
    message: '',
    everyNSteps: 5,
  },
}

export const DEFAULT_SHARING = {
  version: 1,
  shareCurrentStep: false,
  shareStuckFrequency: false,
  shareNothing: true,
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode, quota) — fail silently, in-memory state still works
  }
}

export function getSettings() {
  return readJSON(SETTINGS_KEY, DEFAULT_SETTINGS)
}

export function setSettings(settings) {
  writeJSON(SETTINGS_KEY, settings)
}

export function getSharing() {
  return readJSON(SHARING_KEY, DEFAULT_SHARING)
}

export function setSharing(sharing) {
  writeJSON(SHARING_KEY, sharing)
}
