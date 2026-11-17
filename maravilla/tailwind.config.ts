import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        notte: "#0E1F11",
        carta: "#15301A",
        bordo: "#27432C",
        linea: "#3C5C42",
        panna: "#F4EFE3",
        salvia: "#B5C2B3",
        oro: "#D8BE82",
        errore: "#F0A39A",
      },
      fontFamily: {
        sans: ["Jost", "system-ui", "sans-serif"],
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
