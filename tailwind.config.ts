import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      // ── Color Palette ──────────────────────────────────────────────────────
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        eco: {
          50:  "#f0faf6",
          100: "#C4E4D9",
          200: "#8EC3B0",
          300: "#5EA68D",
          400: "#3D8A72",
          500: "#1A403E",
          600: "#122c2b",
          700: "#0d1f1e",
          800: "#081514",
          900: "#040d0d",
        },
        cream: {
          50:  "#fdfaf2",
          100: "#FAF6EB",
          200: "#f5eed7",
          300: "#ede3c0",
        },
        ai: {
          // Violet accent for AI-specific elements
          100: "#ede9fe",
          200: "#c4b5fd",
          300: "#a78bfa",
          400: "#7c3aed",
          500: "#5b21b6",
        },
      },

      // ── Font Family ───────────────────────────────────────────────────────
      fontFamily: {
        inter:   ["Inter", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },

      // ── Box Shadow ────────────────────────────────────────────────────────
      boxShadow: {
        "glow-eco":  "0 0 20px rgba(142, 195, 176, 0.45)",
        "glow-ai":   "0 0 20px rgba(167, 139, 250, 0.45)",
        "glow-lg":   "0 0 40px rgba(142, 195, 176, 0.35)",
        "send-idle": "0 4px 12px rgba(26, 64, 62, 0.25)",
        "send-glow": "0 0 24px rgba(142, 195, 176, 0.7), 0 4px 16px rgba(26,64,62,0.3)",
      },

      // ── Border Radius ─────────────────────────────────────────────────────
      borderRadius: {
        "2.5xl": "1.25rem",
        "3xl":   "1.5rem",
        "4xl":   "2rem",
      },

      // ── Keyframes ─────────────────────────────────────────────────────────
      keyframes: {
        // Ambient float for particles
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)", opacity: "0.25" },
          "33%":       { transform: "translateY(-22px) rotate(120deg)", opacity: "0.7" },
          "66%":       { transform: "translateY(-10px) rotate(240deg)", opacity: "0.45" },
        },
        // Skeleton shimmer
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        // AI glow pulse on send button & AI badge
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(142, 195, 176, 0.35)" },
          "50%":       { boxShadow: "0 0 28px rgba(142, 195, 176, 0.75), 0 0 8px rgba(26,64,62,0.4)" },
        },
        // Blinking cursor for typewriter
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0" },
        },
        // Pulsing dots for AI thinking
        dotBounce: {
          "0%, 80%, 100%": { transform: "scale(0)", opacity: "0.3" },
          "40%":            { transform: "scale(1)", opacity: "1" },
        },
        // Slide in from bottom
        slideInUp: {
          from: { opacity: "0", transform: "translateY(16px) scale(0.97)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Scale bounce for AI bubble entrance
        bounceIn: {
          "0%":   { opacity: "0", transform: "scale(0.82)" },
          "60%":  { transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // Fade in
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        // Rotate for AI logo mark
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        // Gradient border flow
        gradientFlow: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },

      // ── Animation Utilities ───────────────────────────────────────────────
      animation: {
        float:         "float 8s ease-in-out infinite",
        "float-slow":  "float 12s ease-in-out infinite",
        "float-fast":  "float 5s ease-in-out infinite",
        shimmer:       "shimmer 1.6s linear infinite",
        "glow-pulse":  "glowPulse 2s ease-in-out infinite",
        blink:         "blink 1s step-end infinite",
        "dot-1":       "dotBounce 1.2s ease-in-out 0s infinite",
        "dot-2":       "dotBounce 1.2s ease-in-out 0.2s infinite",
        "dot-3":       "dotBounce 1.2s ease-in-out 0.4s infinite",
        "slide-up":    "slideInUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        "bounce-in":   "bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "fade-in":     "fadeIn 0.3s ease-out both",
        "spin-slow":   "spinSlow 8s linear infinite",
        "gradient-flow": "gradientFlow 4s ease infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
