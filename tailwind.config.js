// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 🔥 DEFAULT GLOBAL FONT → NONE
        sans: ["system-ui", "sans-serif"],

        // optional
        headline: ["var(--headline-font)"],
      }
    },
  },
  corePlugins: {
    preflight: true,
  },
  plugins: [],
};

