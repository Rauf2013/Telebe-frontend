/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — refined teal. Calm, academic, distinctive (not yet-another-indigo).
        brand: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Accent — warm amber. Used sparingly for highlights / celebration moments.
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Ink — deep slate for headings and high-emphasis text.
        ink: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          500: '#64748b',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans:    ['"Inter"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Inter Tight is Inter's tighter sibling — denser, slightly more architectural.
        display: ['"Inter Tight"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft:  '0 2px 12px -2px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)',
        lift:  '0 12px 32px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -4px rgba(15, 23, 42, 0.06)',
        glow:  '0 0 0 1px rgba(13, 148, 136, 0.10), 0 8px 24px -8px rgba(13, 148, 136, 0.25)',
      },
      animation: {
        'fade-in-up':  'fadeInUp 0.5s ease-out',
        'feed-scroll': 'feedScroll 30s linear infinite',
        'marquee':     'marquee 36s linear infinite',
        'pulse-dot':   'pulseDot 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        feedScroll: {
          '0%':   { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1', transform: 'scale(1.4)' },
        },
      },
    },
  },
  plugins: [],
}
