/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui'],
        body: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        board: {
          light: '#f8f6e9',
          dark: '#7b8f6f',
        },
        accent: {
          primary: '#22c55e',
          soft: '#a7f3d0',
        },
      },
    },
  },
  plugins: [],
};
