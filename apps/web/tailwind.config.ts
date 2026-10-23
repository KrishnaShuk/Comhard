import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "rgb(var(--text-rgb) / <alpha-value>)",
        surface: "var(--surface)",
        border: "rgb(var(--border-rgb) / <alpha-value>)",
        input: "var(--input)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          hover: "var(--accent-hover)",
          tint: "rgb(var(--accent-tint-rgb) / <alpha-value>)",
          "tint-text": "var(--accent-tint-text)",
        },
        sla: {
          ontrack: "var(--sla-on-track)",
          late: "var(--sla-late)",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        float: "var(--shadow-float)",
      },
      transitionDuration: {
        hover: "100ms",
        card: "120ms",
        drop: "160ms",
      },
    },
  },
  plugins: [animate],
};

export default config;
