/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #0D9488)',
          light: 'var(--color-primary-light, #14B8A6)',
          dark: 'var(--color-primary-dark, #0F766E)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #059669)',
          light: 'var(--color-secondary-light, #34D399)',
          dark: 'var(--color-secondary-dark, #065F46)',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
        },
        background: {
          DEFAULT: '#F8FAFC',
          dark: '#0F172A',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.03)',
        'premium-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
