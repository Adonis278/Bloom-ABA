/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1E1B2E',
        cloud: '#FFFFFF',
        purple: '#7C3AED',
        pink: '#EC4899',
        orange: '#FB923C',
        yellow: '#FBBF24',
        lime: '#A3E635',
        sky: '#38BDF8',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['Poppins', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        blobFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(24px, -32px) scale(1.08)' },
          '66%': { transform: 'translate(-20px, 18px) scale(0.94)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(236, 72, 153, 0.55)' },
          '50%': { boxShadow: '0 0 0 14px rgba(236, 72, 153, 0)' },
        },
        bounceIn: {
          '0%': { transform: 'translateY(100%)' },
          '70%': { transform: 'translateY(-6%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        blob1: 'blobFloat 14s ease-in-out infinite',
        blob2: 'blobFloat 18s ease-in-out infinite reverse',
        blob3: 'blobFloat 11s ease-in-out infinite',
        gradientShift: 'gradientShift 10s ease infinite',
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        popIn: 'popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pulseGlow: 'pulseGlow 2.2s ease-out infinite',
        bounceIn: 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
