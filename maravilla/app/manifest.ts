import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maravilla · Cotoletteria Alcolica",
    short_name: "Maravilla",
    start_url: "/",
    display: "standalone",
    background_color: "#0E1F11",
    theme_color: "#0E1F11",
    lang: "it",
    icons: [{ src: "/logo.png", sizes: "512x512", type: "image/png" }],
  };
}
