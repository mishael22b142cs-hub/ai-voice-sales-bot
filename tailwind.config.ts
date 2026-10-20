import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          500: "#4361ee",
          600: "#3347c9",
          700: "#27379b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
