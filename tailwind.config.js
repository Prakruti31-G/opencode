/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ink: the dark ground everything sits on (near-black, faintly warm)
        ink: {
          DEFAULT: '#0A0A0B',
          950: '#0A0A0B', // app background
          900: '#101012', // panels / chrome
          850: '#151518', // raised rows
          800: '#1B1B1F', // hover / inputs
          700: '#26262B', // strong surface
        },
        // Rules and outlines — structure, never decoration
        line: {
          DEFAULT: '#26262B',
          strong: '#3A3A42',
        },
        // Bone: warm off-white text & primary actions
        bone: {
          DEFAULT: '#EDEAE3',
          dim: '#A5A39C',
          faint: '#71706B',
        },
        // Status: the only chromatic colour in the core flow
        status: {
          pending: '#E9B949',
          approved: '#5BD08C',
          rejected: '#F0655F',
          changes: '#F08A3C',
        },
      },
      fontFamily: {
        sans: ['"Archivo Variable"', 'Archivo', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '5px',
        lg: '7px',
      },
    },
  },
  plugins: [],
}
