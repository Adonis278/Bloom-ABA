import confetti from 'canvas-confetti'

const COLORS = ['#7C3AED', '#EC4899', '#FB923C', '#FBBF24', '#A3E635', '#38BDF8']

export function celebrate() {
  if (typeof window === 'undefined') return
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: COLORS,
    disableForReducedMotion: true,
  })
}
