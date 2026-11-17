import Link from "next/link";
import { getLocale, LIMITE_RIGHE, listaCarte, prenotazioniTra } from "@/lib/dati";
import { GIORNI_BREVI, giornoSettimana, oggiRoma } from "@/lib/datetime";
import { fedeltaAttiva } from "@/lib/fedelta";
import { addGiorni, prossimiGiorni, statCarte, statPrenotazioni, ultimiGiorni } from "@/lib/statistiche";
import { richiediAdmin } from "../guard";

export const dynamic = "force-dynamic";

const PERIODI = [7, 30, 90] as const;

const etichettaGiorno = (d: string) => `${GIORNI_BREVI[giornoSettimana(d)]} ${d.slice(8)}/${d.slice(5, 7)}`;

function Barra({ etichetta, valore, max, testo }: { etichetta: string; valore: number; max: number; testo: string }) {
  const pct = max > 0 ? Math.round((valore / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm text-salvia">{etichetta}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-bordo" aria-hidden="true">
        <div className="h-3 rounded-full bg-oro" style={{ width: `${valore > 0 ? Math.max(pct, 3) : 0}%` }} />
      </div>
      <span className="w-28 shrink-0 text-right text-sm tabular-nums">{testo}</span>
    </div>
  );
}

function Numero({ valore, etichetta, nota }: { valore: string | number; etichetta: string; nota?: string }) {
  return (
    <div className="scheda">
      <p className="font-display text-4xl font-bold leading-none">{valore}</p>
      <p className="mt-2 text-sm text-salvia">{etichetta}</p>
      {nota && <p className="text-xs text-salvia">{nota}</p>}
    </div>
  );
}

export default async function Statistiche({ searchParams }: { searchParams: Promise<{ giorni?: string }> }) {
  await richiediAdmin();
  const richiesti = Number((await searchParams).giorni);
  const giorni = (PERIODI as readonly number[]).includes(richiesti) ? richiesti : 30;
  const oggi = oggiRoma();
  const { da, a } = ultimiGiorni(oggi, giorni);

  let righe, locale;
  try {
    // 90 giorni indietro (il massimo) e 7 avanti, sempre: una sola lettura per tutte le sezioni.
    [righe, locale] = await Promise.all([prenotazioniTra(addGiorni(oggi, -89), addGiorni(oggi, 7)), getLocale()]);
  } catch {
    return <p className="text-salvia">Non riesco a leggere i dati in questo momento. Riprova tra poco.</p>;
  }
  const parziale = righe.length >= LIMITE_RIGHE;
  const s = statPrenotazioni(righe, da, a);
  const prossimi = prossimiGiorni(righe, oggi, 7);
  const maxProssimi = Math.max(0, ...prossimi.map((g) => g.coperti));
  const maxGiornoSett = Math.max(0, ...s.perGiornoSettimana);
  const maxOra = Math.max(0, ...s.perOra.map((o) => o.coperti));
  const maxGiorno = Math.max(0, ...s.perGiorno.map((g) => g.coperti));
  const migliore = s.perGiornoSettimana.some((c) => c > 0) ? s.perGiornoSettimana.indexOf(maxGiornoSett) : -1;

  let carte = null;
  let carteErrore = false;
  if (fedeltaAttiva(locale)) {
    try {
      carte = statCarte(await listaCarte(), da, a);
    } catch {
      carteErrore = true;
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold">Statistiche</h1>
        <nav aria-label="Periodo" className="flex gap-2">
          {PERIODI.map((n) => (
            <Link key={n} href={`/admin/statistiche?giorni=${n}`} aria-current={n === giorni ? "true" : undefined} className={`bottone-piccolo ${n === giorni ? "border-oro bg-oro text-notte" : ""}`}>
              {n} giorni
            </Link>
          ))}
        </nav>
        <p className="text-sm text-salvia">Dal {etichettaGiorno(da)} al {etichettaGiorno(a)}, per data della prenotazione. Le annullate non contano nei coperti.</p>
        {parziale && <p className="errore">Ci sono più di {LIMITE_RIGHE} prenotazioni nel periodo: i numeri sono parziali.</p>}
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-oro">Prenotazioni</h2>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <Numero valore={s.prenotazioni} etichetta="Prenotazioni" nota={s.inAttesa > 0 ? `${s.inAttesa} ancora in attesa` : undefined} />
          <Numero valore={s.coperti} etichetta="Coperti" />
          <Numero valore={s.mediaPersone.toString().replace(".", ",")} etichetta="Persone per prenotazione" />
          <Numero valore={s.annullate} etichetta="Annullate" nota={s.annullate > 0 ? `${s.percentualeAnnullate}% del totale` : undefined} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-oro">Prossimi 7 giorni</h2>
        <div className="scheda space-y-3">
          {prossimi.map((g) => (
            <Barra key={g.data} etichetta={etichettaGiorno(g.data)} valore={g.coperti} max={maxProssimi} testo={g.prenotazioni === 0 ? "nessuna" : `${g.prenotazioni} pren. · ${g.coperti} coperti`} />
          ))}
        </div>
      </div>

      {s.coperti > 0 ? (
        <>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-oro">Andamento dei coperti</h2>
            <div className="scheda space-y-2">
              <div className="flex h-28 items-end gap-px" role="img" aria-label={`Coperti per giorno: massimo ${maxGiorno}`}>
                {s.perGiorno.map((g) => (
                  <div key={g.data} className="flex-1 rounded-t-sm bg-oro" title={`${etichettaGiorno(g.data)}: ${g.coperti}`} style={{ height: `${g.coperti > 0 ? Math.max(Math.round((g.coperti / maxGiorno) * 100), 4) : 0}%`, opacity: g.coperti > 0 ? 1 : 0 }} />
                ))}
              </div>
              <p className="text-xs text-salvia">Una barra per giorno. Il giorno più pieno ha {maxGiorno} coperti.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-oro">Giorni della settimana</h2>
            <div className="scheda space-y-3">
              {s.perGiornoSettimana.map((c, i) => (
                <Barra key={i} etichetta={GIORNI_BREVI[i]} valore={c} max={maxGiornoSett} testo={`${c} coperti`} />
              ))}
              {migliore >= 0 && <p className="pt-1 text-sm text-salvia">Il giorno più pieno è {GIORNI_BREVI[migliore]}.</p>}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-oro">Fasce orarie</h2>
            <div className="scheda space-y-3">
              {s.perOra.map((o) => (
                <Barra key={o.ora} etichetta={o.ora} valore={o.coperti} max={maxOra} testo={`${o.coperti} coperti`} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-salvia">Nessuna prenotazione in questo periodo.</p>
      )}

      {carte && (
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-oro">Carta fedeltà</h2>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <Numero valore={carte.totali} etichetta="Carte create in tutto" />
            <Numero valore={carte.nuove} etichetta={`Nuove negli ultimi ${giorni} giorni`} />
            <Numero valore={carte.premiRiscattati} etichetta="Premi riscattati in tutto" />
            <Numero valore={carte.timbriInCircolazione} etichetta="Timbri da riscattare" />
          </div>
        </div>
      )}
      {carteErrore && <p className="errore">Non riesco a leggere le carte fedeltà in questo momento.</p>}
    </section>
  );
}
