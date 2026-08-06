/** Tokens come from src/index.css. Never hardcode a color here or in a component. */
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
  plugins: [],
};
