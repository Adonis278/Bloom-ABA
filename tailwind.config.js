/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF7',
        surface: '#F2EFE6',
        hairline: '#E3DCCB',
        sand: '#DCC9AE',
        ink: '#1F2422',
        accent: '#4A6D68',
        quiet: '#5B6472',
        trail: '#B8B2A0',
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
