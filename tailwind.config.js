/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pet Shippers Guam Brand Colors
        'brand-navy': '#1B365D',        // Deep ocean blue (primary)
        'brand-coral': '#FF6B6B',       // Vibrant coral/pink (accent)
        'brand-sky': '#4A90B8',         // Pacific blue (secondary)
        'brand-light': '#F8FAFB',       // Clean white/light
        'brand-warm': '#FFF4F4',        // Warm coral tint
        'ink': '#111827',               // Keep existing dark
      },
    },
  },
  plugins: [],
};