import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090b",
        panel: "#111113",
        line: "#2a2a2f",
        accent: "#38bdf8",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56,189,248,0.2), 0 24px 80px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
