/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#1352F1',
        'primary-dark': '#0e3db5',
        'primary-light': '#e8eeff',
        secondary: '#FF6B35',
        'bg-main': '#F8F9FA',
      },
      fontFamily: { sans: ['Noto Sans KR', 'sans-serif'] },
    },
  },
  plugins: [],
}
