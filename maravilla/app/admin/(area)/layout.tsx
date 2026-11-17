import Link from "next/link";
import { richiediAdmin } from "./guard";
import { Avvisi } from "./avvisi";
import { EsciBottone } from "./esci";

const voci = [
  { href: "/admin", testo: "Prenotazioni" },
  { href: "/admin/menu", testo: "Menu" },
  { href: "/admin/orari", testo: "Orari" },
  { href: "/admin/eventi", testo: "Eventi" },
  { href: "/admin/carta", testo: "Carta" },
  { href: "/admin/statistiche", testo: "Statistiche" },
  { href: "/admin/locale", testo: "Info" },
];

export default async function AreaAdmin({ children }: { children: React.ReactNode }) {
  await richiediAdmin();
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={36} height={36} className="rounded-full" />
          <span className="font-display text-xl font-bold tracking-[0.14em]">GESTIONE</span>
        </div>
        <EsciBottone />
      </header>
      <nav aria-label="Gestione" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {voci.map((v) => (
          <Link key={v.href} href={v.href} className="bottone-piccolo shrink-0">{v.testo}</Link>
        ))}
        <Link href="/" className="bottone-piccolo shrink-0 border-transparent text-salvia">Vedi il sito</Link>
      </nav>
      {children}
      <Avvisi />
    </div>
  );
}
