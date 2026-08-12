/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './data/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        cloud: '#F8F9F5',
        earth: '#A58F78',
        sky: '#A9C9D8',
        grass: '#71876A',
        meadow: '#B6C5A8',
        sand: '#DED4C2',
        ink: '#20221E',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      letterSpacing: {
        nav: '-0.13px',
      },
      borderRadius: {
        nav: '10px',
        pill: '999px',
        navbar: '20px',
      },
      transitionTimingFunction: {
        'esenel-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
