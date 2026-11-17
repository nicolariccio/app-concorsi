import Link from "next/link";
import { getEventi } from "@/lib/dati";

export const dynamic = "force-dynamic";
export const metadata = { title: "Eventi e offerte · Maravilla" };

export default async function Eventi() {
  const tutti = (await getEventi()).filter((e) => e.attivo);
  const eventi = tutti.filter((e) => e.tipo === "evento");
  const offerte = tutti.filter((e) => e.tipo === "offerta");
  return (
    <div className="space-y-8">
      <h1 className="text-5xl font-semibold leading-none">Eventi e offerte</h1>
      {tutti.length === 0 && <p className="text-salvia">Nessun evento in programma. Torna a trovarci presto.</p>}
      {eventi.map((e) => (
        <article key={e.id} className="scheda space-y-2">
          <h2 className="text-3xl font-bold leading-tight">{e.titolo}</h2>
          {e.quando && <p className="text-sm font-semibold text-oro">{e.quando}</p>}
          {e.descrizione && <p className="text-salvia">{e.descrizione}</p>}
          <Link href="/prenota" className="bottone mt-2">Prenota per questa serata</Link>
        </article>
      ))}
      {offerte.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-salvia">Offerte</h2>
          {offerte.map((e) => (
            <article key={e.id} className="scheda">
              <h3 className="text-2xl font-bold leading-tight">{e.titolo}</h3>
              {e.quando && <p className="text-sm text-oro">{e.quando}</p>}
              {e.descrizione && <p className="text-salvia">{e.descrizione}</p>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
