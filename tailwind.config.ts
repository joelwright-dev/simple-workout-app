import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        // v2 "agentic" palette: warm paper, near-black ink, one vivid accent.
        paper: "#f4f3ef",
        surface: "#ffffff",
        ink: {
          DEFAULT: "#181715",
          soft: "#3f3c38",
          muted: "#78736c",
          faint: "#a8a39b",
        },
        line: "#e9e6df",
        accent: {
          DEFAULT: "#6d5efc",
          soft: "#ece9ff",
          ink: "#3a2fb0",
        },
        // Kept for any not-yet-migrated bits.
        ground: {
          50: "#f6f5f1",
          100: "#e9e6dd",
          200: "#d4cdbc",
          300: "#b8ac92",
          500: "#84745a",
          600: "#6b5d49",
          700: "#564b3d",
          900: "#3d362f",
        },
        clay: { 500: "#c9703f", 600: "#b15a30" },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(24,23,21,0.04), 0 8px 24px -12px rgba(24,23,21,0.12)",
        lift: "0 2px 4px rgba(24,23,21,0.05), 0 18px 40px -16px rgba(24,23,21,0.22)",
      },
    },
  },
  plugins: [],
} satisfies Config;
