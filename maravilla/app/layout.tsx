import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maravilla · cotoletteria alcolica",
  description: "La prima cotoletteria alcolica d'Italia. Mugnano di Napoli.",
};
export const viewport: Viewport = { themeColor: "#0E1F11", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
