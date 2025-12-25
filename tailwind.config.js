/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Christmas palette - improved contrast for accessibility
        forest: {
          DEFAULT: '#0F4C2C',
          light: '#1A6B3F',
          dark: '#0A3320',
        },
        crimson: {
          DEFAULT: '#C62828',
          light: '#E53935',
          dark: '#8A171B',
        },
        gold: {
          DEFAULT: '#FFC107',
          light: '#FFD54F',
          dark: '#FFA000',
        },
        ivory: {
          DEFAULT: '#FFFFFF',
          warm: '#FFF9F0',
          cold: '#F5F5F5',
        },
        cocoa: {
          DEFAULT: '#2C1810',
          light: '#4E342E',
          dark: '#1A0F0A',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};


