import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Earthy "Groundwork" palette
        ground: {
          50: "#f6f5f1",
          100: "#e9e6dd",
          200: "#d4cdbc",
          300: "#b8ac92",
          400: "#9c8c6e",
          500: "#84745a",
          600: "#6b5d49",
          700: "#564b3d",
          800: "#473e35",
          900: "#3d362f",
          950: "#221d18",
        },
        clay: {
          400: "#d98a5f",
          500: "#c9703f",
          600: "#b15a30",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
