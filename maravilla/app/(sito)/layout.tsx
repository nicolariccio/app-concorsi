import Link from "next/link";
import { getLocale } from "@/lib/dati";
import { fedeltaAttiva } from "@/lib/fedelta";

export default async function SitoLayout({ children }: { children: React.ReactNode }) {
  const voci = [
    { href: "/", testo: "Home" },
    { href: "/menu", testo: "Menu" },
    { href: "/prenota", testo: "Prenota" },
    { href: "/eventi", testo: "Eventi" },
    ...(fedeltaAttiva(await getLocale()) ? [{ href: "/carta", testo: "Carta" }] : []),
  ];
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-bordo bg-notte/95">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" width={36} height={36} className="rounded-full" />
            <span className="font-display text-[22px] font-bold tracking-[0.16em]">MARAVILLA</span>
          </Link>
          <nav aria-label="Principale" className="hidden gap-6 text-sm font-medium text-salvia sm:flex">
            {voci.map((v) => (
              <Link key={v.href} href={v.href} className="hover:text-oro">{v.testo}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 pb-32 pt-8 sm:pb-12">{children}</main>
      <nav aria-label="Principale" className="fixed inset-x-0 bottom-0 z-10 flex h-[calc(68px+env(safe-area-inset-bottom))] border-t border-bordo bg-notte pb-[env(safe-area-inset-bottom)] sm:hidden">
        {voci.map((v) => (
          <Link key={v.href} href={v.href} className="flex flex-1 items-center justify-center text-sm font-medium text-salvia active:text-oro">
            {v.testo}
          </Link>
        ))}
      </nav>
    </>
  );
}
