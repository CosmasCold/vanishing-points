import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./logic/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0a0a0f",
        shadow: "#12121a",
        fog: "#1e1e2e",
        ash: "#8b8b9a",
        bone: "#c4c4b5",
        ember: "#8b4513",
        specter: "#4a6741",
        warning: "#7c2d12",
      },
      fontFamily: {
        cinzel: ["var(--font-cinzel)", "Cinzel", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Space Mono", "Courier New", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        drift: "drift 20s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        flicker: "flicker 2.8s infinite",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "32%": { opacity: "0.6" },
          "33%": { opacity: "0.9" },
          "41%": { opacity: "0.5" },
          "42%": { opacity: "0.85" },
          "61%": { opacity: "0.45" },
          "62%": { opacity: "0.75" },
          "80%": { opacity: "0.5" },
          "81%": { opacity: "0.9" },
        },
      },
    },
  },
  plugins: [],
};

export default config;