const THEME_KEY = 'bloomaba:theme'

export function getInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage unavailable — fall through to system preference
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // storage unavailable — theme still applies for this session
  }
}
