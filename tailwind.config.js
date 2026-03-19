/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040810',
          900: '#0A0F1E',
          800: '#0F1629',
          700: '#151D35',
          600: '#1E2A4A',
        },
        accent: '#3B82F6',
      },
    },
  },
  plugins: [],
}

