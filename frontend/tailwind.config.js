/** @type {import('tailwindcss').Config} */
// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#FF6100',
          600: '#FF9150',
          900: '#661C00',
        },
        gray: {
          
        }
      },
      fontFamily: {
        sans: ['Montserrat', ...defaultTheme.fontFamily.sans], // Set Montserrat as the default sans font
      },
    },
  },
  plugins: [],
}