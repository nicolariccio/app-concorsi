import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        notte: "#0b0b10",
        carta: "#15151d",
        bordo: "#26263a",
        fiamma: "#ff6a3d",
        magenta: "#ff3d8b",
      },
      fontFamily: { sans: ["system-ui", "ui-sans-serif", "Segoe UI", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
