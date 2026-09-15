import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marca: {
          900: "#001F3A",
          800: "#003057",
          600: "#1B6CA8",
          400: "#4A90C4",
          200: "#8FBBDB",
          50:  "#EDF3F8",
        },
      },
      fontFamily: {
        sans: ["Archivo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
