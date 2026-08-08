/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        hairline: 'rgb(var(--color-hairline) / <alpha-value>)',
        sand: 'rgb(var(--color-sand) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        quiet: 'rgb(var(--color-quiet) / <alpha-value>)',
        trail: 'rgb(var(--color-trail) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces Variable', 'Georgia', 'serif'],
        body: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
        chrome: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
