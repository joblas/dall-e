/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      fontFamily: {
        inter: ['Inter var', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 1px 0 rgba(189,192,207,0.06),0 10px 16px -1px rgba(189,192,207,0.2)',
        cardhover: '0 0 1px 0 rgba(189,192,207,0.06),0 10px 16px -1px rgba(189,192,207,0.4)',
        'card-dark': '0 0 1px 0 rgba(0,0,0,0.3),0 10px 16px -1px rgba(0,0,0,0.5)',
        'cardhover-dark': '0 0 1px 0 rgba(0,0,0,0.4),0 10px 16px -1px rgba(0,0,0,0.6)',
      },
      colors: {
        'primary': '#6469ff',
        'primary-dark': '#4a4dff',
        'secondary': '#f9fafe',
        'secondary-dark': '#1a1a2e',
        'text-primary': '#222328',
        'text-primary-dark': '#e1e1e6',
        'text-secondary': '#666e75',
        'text-secondary-dark': '#a1a1aa',
        'border-light': '#e6ebf4',
        'border-dark': '#2a2a3a',
      },
    },
  },
  plugins: [],
};