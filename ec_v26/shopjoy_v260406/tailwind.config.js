/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './bo.html',
    './disp-bo-ui.html',
    './disp-fo-ui.html',
    './pages/**/*.{js,html}',
    './components/**/*.{js,html}',
    './layout/**/*.{js,html}',
    './base/**/*.{js,html}',
    './assets/**/*.{js,html}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-pink': '#ec6c8e',
        'brand-pink-dark': '#d9587d',
        'brand-pink-light': '#f5a4c0',
        'brand-mint': '#4a9b7e',
        'brand-mint-dark': '#2d6b52',
        'brand-mint-light': '#e8f5f0',
        'brand-purple': '#7b4397',
        'brand-purple-dark': '#5a2e71',
        'brand-purple-light': '#f0e6ff',
      },
      maxWidth: {
        'admin': '1400px',
      },
    },
  },
  plugins: [],
  safelist: [
    'cols-1', 'cols-2', 'cols-3', 'cols-4',
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'grid-cols-5', 'grid-cols-6', 'grid-cols-12',
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6',
  ],
}
