/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
    }
  },
  variants: {
    extend: {
      backdropFilter: ['responsive'],
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}