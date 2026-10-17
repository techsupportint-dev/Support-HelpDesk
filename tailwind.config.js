/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#060527',
        brandBlue: '#3B5BDB',
        brandLight: '#EEF2FF',
      }
    },
  },
  plugins: [],
}
