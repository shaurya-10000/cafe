// tailwind.config.ts — cleaned up
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // NOTE: colors.cafe intentionally removed — the palette now lives
      // entirely in globals.css @theme. Do not reintroduce it here.
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "smooth-bounce": "bounce 3s infinite",
        marquee: "marquee 45s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;