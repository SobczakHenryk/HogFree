/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F5F5',
          tertiary: '#E5E5E5',
        },
        primary: {
          DEFAULT: '#2DD4BF',
          light: '#5EEAD4',
          dark: '#14B8A6',
        },
        accent: {
          blue: '#3B82F6',
          teal: '#2DD4BF',
        },
        trend: {
          up: '#22C55E',
          down: '#EF4444',
        },
        text: {
          primary: '#171717',
          secondary: '#525252',
          tertiary: '#737373',
        },
        border: {
          DEFAULT: '#E5E5E5',
          light: '#D4D4D4',
        },
      },
      fontFamily: {
        inter: ['Inter_400Regular', 'sans-serif'],
        'inter-medium': ['Inter_500Medium', 'sans-serif'],
        'inter-semibold': ['Inter_600SemiBold', 'sans-serif'],
        'inter-bold': ['Inter_700Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
