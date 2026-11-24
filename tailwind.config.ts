import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand Soluusi (soluusi.com): hijau primary, oranye aksen, bg terang
        soluusi: {
          green: "#007648",
          "green-dark": "#00573a",
          "green-light": "#e6f2ec",
          orange: "#ff6600",
          surface: "#f5f8fa",
          line: "#e8e8e8",
          ink: "#3f4254",
          muted: "#5e6278",
        },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
