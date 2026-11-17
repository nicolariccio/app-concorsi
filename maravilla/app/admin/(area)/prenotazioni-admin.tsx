"use client";

import { NOMI_GIORNI, giornoSettimana } from "@/lib/datetime";
import { linkWhatsApp } from "@/lib/whatsapp";
import type { PrenotazioneRiga } from "@/lib/tipi";
import { useAzione } from "./azione";

function Riga({ p, nomeLocale }: { p: PrenotazioneRiga; nomeLocale: string }) {
  const { occupato, esegui } = useAzione();
  const whatsapp = p.stato === "confermata" ? linkWhatsApp(p, nomeLocale) : null;
  return (
    <li className="scheda space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-baseline gap-3">
          <span className="font-display text-3xl font-bold">{p.ora}</span>
          <span className="font-semibold">{p.nome}</span>
        </p>
        <span className="text-sm text-salvia">{p.persone} persone</span>
      </div>
      {p.note && <p className="text-sm text-salvia">{p.note}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={p.stato === "confermata" ? "rounded-full border border-panna px-3 py-1 text-xs font-semibold" : "rounded-full bg-oro px-3 py-1 text-xs font-semibold text-notte"}>
          {p.stato === "confermata" ? "Confermata" : "In attesa"}
        </span>
        <span className="flex gap-2">
          <a href={`tel:${p.telefono.replace(/\s/g, "")}`} className="bottone-piccolo">Chiama</a>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="bottone-piccolo">WhatsApp</a>
          )}
          {p.stato !== "confermata" && (
            <button type="button" disabled={occupato} className="bottone-piccolo bg-panna text-notte" onClick={() => esegui("POST", "prenotazioni", { id: p.id, stato: "confermata" }, "Confermata")}>
              Conferma
            </button>
          )}
          <button
            type="button"
            disabled={occupato}
            className="bottone-piccolo"
            onClick={() => window.confirm("Annullare questa prenotazione?") && esegui("POST", "prenotazioni", { id: p.id, stato: "annullata" }, "Annullata")}
          >
            Annulla
          </button>
        </span>
      </div>
    </li>
  );
}

export function PrenotazioniAdmin({ righe, oggi, nomeLocale }: { righe: PrenotazioneRiga[]; oggi: string; nomeLocale: string }) {
  if (righe.length === 0) return <p className="text-salvia">Nessuna prenotazione in arrivo.</p>;
  const giorni = [...new Set(righe.map((r) => r.data))];
  return (
    <div className="space-y-6">
      {giorni.map((g) => (
        <div key={g} className="space-y-3">
          <h2 className="text-2xl font-semibold text-oro">
            {g === oggi ? "Oggi" : `${NOMI_GIORNI[giornoSettimana(g)]} ${g.split("-").reverse().slice(0, 2).join("/")}`}
          </h2>
          <ul className="space-y-3">{righe.filter((r) => r.data === g).map((p) => <Riga key={p.id} p={p} nomeLocale={nomeLocale} />)}</ul>
        </div>
      ))}
    </div>
  );
}
