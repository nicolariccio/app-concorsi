import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maravilla · Cotoletteria Alcolica",
    short_name: "Maravilla",
    start_url: "/",
    display: "standalone",
    background_color: "#ddd6c6",
    theme_color: "#ddd6c6",
    lang: "it",
  };
}
