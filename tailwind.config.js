/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#FF4500',
          600: '#CC3700',
          900: '#661C00',
        },
      },
    },
  },
  plugins: [],
}