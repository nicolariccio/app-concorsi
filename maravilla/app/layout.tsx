import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { locale } from "@/lib/locale";

export const metadata: Metadata = {
  title: `${locale.nome} · ${locale.claim}`,
  description: `${locale.claim}. ${locale.indirizzo}`,
};
export const viewport: Viewport = { themeColor: "#0b0b10", width: "device-width", initialScale: 1 };

const voci = [
  { href: "/menu", testo: "Menu" },
  { href: "/eventi", testo: "Eventi" },
  { href: "/prenota", testo: "Prenota" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="font-sans">
        <header className="sticky top-0 z-10 border-b border-bordo bg-notte/90 backdrop-blur">
          <nav className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
            <Link href="/" className="text-lg font-black tracking-wide">
              MARAVILLA <span className="text-fiamma">✨</span>
            </Link>
            <ul className="flex gap-5 text-sm font-medium text-zinc-300">
              {voci.map((v) => (
                <li key={v.href}>
                  <Link href={v.href} className="hover:text-fiamma">{v.testo}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="mx-auto max-w-2xl px-5 pb-24 pt-8">{children}</main>
      </body>
    </html>
  );
}
