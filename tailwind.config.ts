import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        foreground: "#1A1A1A",
        muted: "#6B6B6B",
        border: "#E5E5E0",
        accent: "#C0392B",
      },
      fontFamily: {
        serif: ["Newsreader", "Noto Serif Devanagari", "serif"],
        masthead: ["Instrument Serif", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
