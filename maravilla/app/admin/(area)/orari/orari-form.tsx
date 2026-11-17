"use client";

import { useState } from "react";
import { NOMI_GIORNI } from "@/lib/datetime";
import type { Orario } from "@/lib/tipi";
import { useAzione } from "../azione";

export function OrariForm({ iniziali }: { iniziali: Orario[] }) {
  const [giorni, setGiorni] = useState<Orario[]>(
    NOMI_GIORNI.map((_, g) => iniziali.find((o) => o.giorno === g) ?? { giorno: g, chiuso: false, apertura: "19:00", chiusura: "23:30" }),
  );
  const { occupato, errori, esegui } = useAzione();
  const cambia = (g: number, parziale: Partial<Orario>) => setGiorni((v) => v.map((o) => (o.giorno === g ? { ...o, ...parziale } : o)));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        esegui("POST", "orari", giorni);
      }}
    >
      {giorni.map((o) => (
        <div key={o.giorno} className="scheda space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{NOMI_GIORNI[o.giorno]}</h2>
            <label className="flex min-h-[44px] items-center gap-2 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-[#D8BE82]" checked={o.chiuso} onChange={(e) => cambia(o.giorno, { chiuso: e.target.checked })} />
              Chiuso
            </label>
          </div>
          {!o.chiuso && (
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <div>
                <label htmlFor={`a${o.giorno}`} className="etichetta">Apre</label>
                <input id={`a${o.giorno}`} type="time" className="campo" value={o.apertura} onChange={(e) => cambia(o.giorno, { apertura: e.target.value })} />
              </div>
              <div>
                <label htmlFor={`c${o.giorno}`} className="etichetta">Chiude</label>
                <input id={`c${o.giorno}`} type="time" className="campo" value={o.chiusura} onChange={(e) => cambia(o.giorno, { chiusura: e.target.value })} />
              </div>
            </div>
          )}
          {errori[`g${o.giorno}`] && <p className="errore">{errori[`g${o.giorno}`]}</p>}
        </div>
      ))}
      <button type="submit" disabled={occupato} className="bottone w-full">{occupato ? "Salvo…" : "Salva orari"}</button>
    </form>
  );
}
