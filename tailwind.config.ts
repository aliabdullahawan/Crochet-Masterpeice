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
        // Crochet Masterpiece Brand Palette
        cream: {
          50:  "#FFFDF7",
          100: "#FFF8ED",
          200: "#FFF1D6",
          300: "#FFE8B8",
          DEFAULT: "#F5EDD6",
        },
        blush: {
          50:  "#FFF0F3",
          100: "#FFD6DE",
          200: "#FFB3C1",
          300: "#FF8FA3",
          400: "#FF6B87",
          DEFAULT: "#F4B8C1",
        },
        mauve: {
          50:  "#F9F0FA",
          100: "#F0D6F5",
          200: "#E0B0EB",
          300: "#CC88DD",
          400: "#B060C8",
          DEFAULT: "#C9A0DC",
        },
        caramel: {
          50:  "#FAF3EA",
          100: "#F0DEC0",
          200: "#E5C490",
          300: "#D4A055",
          400: "#B8812A",
          DEFAULT: "#C8956C",
        },
        latte: {
          50:  "#F7F3EE",
          100: "#EDE0D0",
          200: "#DEC9AE",
          300: "#C8AA84",
          400: "#A8845A",
          DEFAULT: "#B89070",
        },
        rose: {
          50:  "#FFF5F5",
          100: "#FFE0E0",
          200: "#FFC0C0",
          300: "#FF9999",
          400: "#FF7070",
          DEFAULT: "#E8A0A8",
        },
        // Text colors
        ink: {
          light: "#7A6655",
          DEFAULT: "#4A3728",
          dark: "#2D1F14",
        },
      },
      fontFamily: {
        // Elegant serif for headings
        display: ["'Playfair Display'", "Georgia", "serif"],
        // Soft handwriting feel for accents
        script: ["'Dancing Script'", "cursive"],
        // Clean readable body font
        body: ["'Lato'", "sans-serif"],
        // Elegant for UI elements
        sans: ["'Nunito'", "sans-serif"],
      },
      backgroundImage: {
        "cream-gradient": "linear-gradient(135deg, #FFF8ED 0%, #F5EDD6 40%, #F0DEC0 70%, #FFD6DE 100%)",
        "hero-gradient": "linear-gradient(160deg, #FFF8ED 0%, #F5EDD6 30%, #F0D6F5 60%, #FFD6DE 100%)",
        "card-gradient": "linear-gradient(145deg, rgba(255,248,237,0.9) 0%, rgba(245,237,214,0.95) 100%)",
        "blush-gradient": "linear-gradient(135deg, #FFD6DE 0%, #F4B8C1 50%, #E8A0A8 100%)",
        "mauve-gradient": "linear-gradient(135deg, #F0D6F5 0%, #C9A0DC 50%, #B060C8 100%)",
        "yarn-pattern": "radial-gradient(circle at 20% 80%, rgba(244,184,193,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(201,160,220,0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(245,237,214,0.8) 0%, #FFF8ED 70%)",
      },
      boxShadow: {
        "soft": "0 4px 20px rgba(184, 130, 42, 0.12), 0 2px 8px rgba(244, 184, 193, 0.2)",
        "card": "0 8px 32px rgba(74, 55, 40, 0.1), 0 2px 8px rgba(244, 184, 193, 0.15)",
        "glow-blush": "0 0 30px rgba(244, 184, 193, 0.5), 0 0 60px rgba(244, 184, 193, 0.2)",
        "glow-mauve": "0 0 30px rgba(201, 160, 220, 0.5), 0 0 60px rgba(201, 160, 220, 0.2)",
        "button": "0 4px 15px rgba(200, 149, 108, 0.4), 0 2px 6px rgba(244, 184, 193, 0.3)",
        "button-hover": "0 8px 25px rgba(200, 149, 108, 0.5), 0 4px 12px rgba(244, 184, 193, 0.4)",
        "input": "inset 0 2px 4px rgba(74, 55, 40, 0.05), 0 1px 3px rgba(244, 184, 193, 0.2)",
        "navbar": "0 4px 30px rgba(74, 55, 40, 0.08), 0 1px 0px rgba(244, 184, 193, 0.3)",
      },
      borderRadius: {
        "xl": "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "3rem",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "spin-slow": "spin 20s linear infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-down": "slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.6s ease forwards",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "bloom": "bloom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "shard": "shardOut 0.7s ease-out forwards",
        "petal-fall": "petalFall 8s ease-in infinite",
        "yarn-unwind": "yarnUnwind 1.5s ease-in-out forwards",
        "morph-in": "morphIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "typewriter": "typewriter 2s steps(30) forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-12px) rotate(1deg)" },
          "66%": { transform: "translateY(-6px) rotate(-1deg)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bloom: {
          "0%": { opacity: "0", transform: "scale(0.6) rotate(-5deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        shardOut: {
          "0%": { opacity: "1", transform: "translate(0, 0) scale(1)" },
          "100%": { opacity: "0", transform: "translate(var(--tx), var(--ty)) scale(0.3) rotate(var(--rot))" },
        },
        petalFall: {
          "0%": { transform: "translateY(-20px) translateX(0px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) translateX(60px) rotate(360deg)", opacity: "0" },
        },
        yarnUnwind: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        morphIn: {
          "0%": { opacity: "0", transform: "scale(0.9) translateY(10px)", filter: "blur(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)", filter: "blur(0)" },
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
      },
      transitionTimingFunction: {
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
