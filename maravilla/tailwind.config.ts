import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        notte: "#ddd6c6",
        carta: "#d2cab8",
        bordo: "#b9b19c",
        fiamma: "#455733",
        magenta: "#8a2d2d",
      },
      fontFamily: { sans: ["system-ui", "ui-sans-serif", "Segoe UI", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
