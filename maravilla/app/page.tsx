import Link from "next/link";
import { locale, linkMappa } from "@/lib/locale";
import { eventi } from "@/lib/eventi";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-5 pt-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-fiamma">Mugnano di Napoli</p>
        <h1 className="text-5xl font-black leading-tight">
          La prima <span className="bg-gradient-to-r from-fiamma to-magenta bg-clip-text text-transparent">Cotoletteria Alcolica</span> d&apos;Italia 🏆
        </h1>
        <p className="text-lg text-zinc-400">Cotolette croccanti e drink. Vieni a trovarci.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/prenota" className="bottone">Prenota un tavolo</Link>
          <Link href="/menu" className="bottone-vuoto">Guarda il menu</Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Prossimamente</h2>
        {eventi.map((e) => (
          <Link key={e.id} href="/eventi" className="scheda block">
            <p className="font-semibold">{e.titolo}</p>
            <p className="text-sm text-fiamma">{e.quando}</p>
          </Link>
        ))}
      </section>

      <section className="scheda space-y-3">
        <h2 className="text-xl font-bold">Dove siamo</h2>
        <p className="text-zinc-300">{locale.indirizzo}</p>
        <div className="flex flex-wrap gap-3">
          <a href={linkMappa} target="_blank" rel="noopener noreferrer" className="bottone-vuoto">Mappa e orari su Google</a>
          <a href={locale.instagram} target="_blank" rel="noopener noreferrer" className="bottone-vuoto">Instagram</a>
        </div>
      </section>
    </div>
  );
}
