import { notFound } from "next/navigation";
import { getLocale, getOrari, trovaPrenotazionePerCodice } from "@/lib/dati";
import { oggiRoma } from "@/lib/datetime";
import { modificabile } from "@/lib/modificaPrenotazione";
import { orarioDelGiorno } from "@/lib/orari";
import { MAX_PERSONE } from "@/lib/prenotazione";
import { dataEstesa } from "@/lib/whatsapp";
import { AzioniPrenotazione } from "./azioni-prenotazione";

export const dynamic = "force-dynamic";
export const metadata = { title: "La tua prenotazione · Maravilla", robots: { index: false } };

const STATI = { in_attesa: "In attesa di conferma", confermata: "Confermata", annullata: "Annullata" } as const;

export default async function Prenotazione({ params }: { params: Promise<{ codice: string }> }) {
  const { codice } = await params;
  let p, orari, locale;
  try {
    [p, orari, locale] = await Promise.all([trovaPrenotazionePerCodice(codice), getOrari(), getLocale()]);
  } catch {
    // Un errore del database non deve sembrare "prenotazione inesistente".
    return (
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold">La tua prenotazione</h1>
        <p className="text-salvia">In questo momento non riusciamo a leggerla. Riprova tra poco.</p>
      </div>
    );
  }
  if (!p) notFound();

  const verifica = modificabile(p, orarioDelGiorno(orari, p.data));
  const nome = p.nome.split(" ")[0];

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-semibold leading-none">Ciao {nome}</h1>
      <section aria-label="Prenotazione" className="scheda space-y-2">
        <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${p.stato === "annullata" ? "text-errore" : "text-oro"}`}>{STATI[p.stato]}</p>
        <p className="font-display text-3xl font-bold leading-tight">{dataEstesa(p.data)}</p>
        <p className="text-lg">
          alle {p.ora} · {p.persone === 1 ? "1 persona" : `${p.persone} persone`}
        </p>
      </section>
      <AzioniPrenotazione
        codice={codice}
        persone={p.persone}
        data={p.data}
        ora={p.ora}
        stato={p.stato}
        consentito={verifica.ok}
        motivo={verifica.ok ? "" : verifica.motivo}
        oggi={oggiRoma()}
        maxPersone={MAX_PERSONE}
        telefono={locale.telefono}
      />
    </div>
  );
}
