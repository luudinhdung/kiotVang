/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kiot: {
          blue: '#0070F4',
          darkBlue: '#0056B3',
          navBg: '#0070F4',
          navActive: '#0055B8',
          bg: '#F0F2F5',
          border: '#E2E8F0',
          tableHeader: '#EBF3FF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
