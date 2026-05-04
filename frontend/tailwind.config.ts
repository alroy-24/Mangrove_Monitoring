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
        background: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        accent: {
          DEFAULT: "#16A34A",
          hover: "#15803D",
          light: "#DCFCE7",
        },
        teal: {
          DEFAULT: "#0D9488",
          light: "#CCFBF1",
        },
        foreground: "#1E293B",
        muted: "#64748B",
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
