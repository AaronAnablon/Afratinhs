/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/utils/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // School green from the logo
        brand: {
          50: '#effaf2',
          100: '#d9f2e0',
          200: '#b5e4c4',
          300: '#83cf9e',
          400: '#4fb374',
          500: '#2c9656',
          600: '#1e7944',
          700: '#196139',
          800: '#174d30',
          900: '#143f29',
          950: '#0a2316',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
}
