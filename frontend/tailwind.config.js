/** @type {import('tailwindcss').Config} */

// Tokens de color semánticos financieros — fuente de verdad única
export const financialColors = {
  ingreso: {
    DEFAULT: '#16a34a',
    dark: '#14532d',
    light: '#dcfce7',
  },
  egreso: {
    DEFAULT: '#b91c1c',
    dark: '#7f1d1d',
    light: '#fee2e2',
  },
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
