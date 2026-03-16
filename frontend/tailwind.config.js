/** @type {import('tailwindcss').Config} */

// Tokens de color semánticos financieros — fuente de verdad única
export const financialColors = {
  ingreso: '#16a34a',
  egreso: '#b91c1c',
};

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rojo: {
          DEFAULT: '#df0d10',
          dark: '#b00a0c',
          light: '#ff3336',
        },
        ingreso: financialColors.ingreso,
        egreso: financialColors.egreso,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
