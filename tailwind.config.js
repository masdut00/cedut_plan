/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wedding-rose': {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          DEFAULT: '#e11d48',
        },
        'wedding-gold': {
          50: '#fdfbf7',
          100: '#fbf7ee',
          200: '#f5ead4',
          300: '#eddcba',
          400: '#dfbe85',
          500: '#c59b27',
          600: '#b0841b',
          700: '#8a6512',
          DEFAULT: '#c59b27',
        },
        'wedding-slate': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          DEFAULT: '#475569',
        },
        'wedding-sage': {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#cfe0cf',
          300: '#a9c7aa',
          400: '#81a982',
          500: '#5f8e61',
          600: '#4c734e',
          DEFAULT: '#5f8e61',
        },
      },
    },
  },
  plugins: [],
}
