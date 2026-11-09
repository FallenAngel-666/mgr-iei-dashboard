/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iei: {
          navy: {
            DEFAULT: '#0B2545',
            50: '#F0F5FA',
            100: '#E1EBF5',
            200: '#B8D0E8',
            300: '#8FB4DB',
            400: '#4D85C2',
            500: '#1B5EAA',
            600: '#134A8A',
            700: '#0E3768',
            800: '#0B2545',
            900: '#06162A',
            950: '#030B15'
          },
          gold: {
            DEFAULT: '#C59B27',
            50: '#FDFBF2',
            100: '#FAF4DB',
            200: '#F4E7B3',
            300: '#EED98A',
            400: '#E3C148',
            500: '#C59B27',
            600: '#9E7A1C',
            700: '#755A14',
            800: '#4E3C0D',
            900: '#281E06'
          },
          maroon: {
            DEFAULT: '#800000',
            600: '#660000',
            700: '#4D0000'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Cinzel', 'Trajan Pro', 'Georgia', 'serif']
      }
    },
  },
  plugins: [],
}
