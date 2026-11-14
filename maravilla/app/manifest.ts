import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maravilla · Cotoletteria Alcolica",
    short_name: "Maravilla",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b10",
    theme_color: "#0b0b10",
    lang: "it",
  };
}
