/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-bg': 'linear-gradient(135deg, #67b88f, #5aa8af, #fdffff)',
      },
    },
  },
  plugins: [],
}