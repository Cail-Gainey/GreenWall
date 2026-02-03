/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 启用 class 策略的暗色模式
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        slate: {
          800: '#1E293B',
          900: '#0F172A',
        },
        brand: {
          green: '#22C55E'
        }
      }
    },
  },
  plugins: [],
}

