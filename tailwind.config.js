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
        // New Year / Reveillon palette
        forest: { // Mapped to Midnight Blue (Backgrounds)
          DEFAULT: '#020617', // slate-950
          light: '#0f172a',   // slate-900
          dark: '#000000',    // black
        },
        crimson: { // Mapped to Silver/Platinum (Accents/Buttons)
          DEFAULT: '#475569', // slate-600
          light: '#94a3b8',   // slate-400
          dark: '#1e293b',    // slate-800
        },
        gold: {
          DEFAULT: '#FFD700', // Gold
          light: '#FDE68A',   // Amber-200
          dark: '#B45309',    // Amber-700
        },
        ivory: {
          DEFAULT: '#FFFFFF',
          warm: '#F8FAFC',    // Slate-50 (Cooler white)
          cold: '#F1F5F9',    // Slate-100
        },
        cocoa: { // Mapped to Obsidian (Text)
          DEFAULT: '#1E293B', // Slate-800
          light: '#334155',   // Slate-700
          dark: '#0F172A',    // Slate-900
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


