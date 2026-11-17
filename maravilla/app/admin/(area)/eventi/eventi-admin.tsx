"use client";

import { useState } from "react";
import type { Evento } from "@/lib/tipi";
import { useAzione } from "../azione";

type Bozza = { id?: string; tipo: "evento" | "offerta"; titolo: string; quando: string; descrizione: string; attivo: boolean; ordine: number };

function Scheda({ iniziale, nuovo, ordine, onFatto }: { iniziale?: Evento; nuovo?: boolean; ordine: number; onFatto?: () => void }) {
  const vuoto: Bozza = { tipo: "evento", titolo: "", quando: "", descrizione: "", attivo: true, ordine };
  const [v, setV] = useState<Bozza>(iniziale ?? vuoto);
  const { occupato, errori, esegui } = useAzione();
  const id = iniziale?.id ?? "";

  return (
    <form
      className="scheda space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const esito = await esegui("POST", "eventi", v);
        if (esito.ok && nuovo) {
          setV(vuoto);
          onFatto?.();
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`t${id}`} className="etichetta">Tipo</label>
          <select id={`t${id}`} className="campo" value={v.tipo} onChange={(e) => setV({ ...v, tipo: e.target.value as Bozza["tipo"] })}>
            <option value="evento">Evento</option>
            <option value="offerta">Offerta</option>
          </select>
        </div>
        <label className="mt-6 flex min-h-[44px] items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-[#D8BE82]" checked={v.attivo} onChange={(e) => setV({ ...v, attivo: e.target.checked })} />
          Visibile sul sito
        </label>
      </div>
      <div>
        <label htmlFor={`ti${id}`} className="etichetta">Titolo</label>
        <input id={`ti${id}`} className="campo" value={v.titolo} onChange={(e) => setV({ ...v, titolo: e.target.value })} />
        {errori.titolo && <p className="errore">{errori.titolo}</p>}
      </div>
      <div>
        <label htmlFor={`q${id}`} className="etichetta">Quando</label>
        <input id={`q${id}`} className="campo" placeholder="Es. Ogni giovedì dalle 21" value={v.quando} onChange={(e) => setV({ ...v, quando: e.target.value })} />
      </div>
      <div>
        <label htmlFor={`d${id}`} className="etichetta">Descrizione</label>
        <textarea id={`d${id}`} rows={2} className="campo py-3" value={v.descrizione} onChange={(e) => setV({ ...v, descrizione: e.target.value })} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={occupato} className="bottone-piccolo bg-panna text-notte">{nuovo ? "Aggiungi" : "Salva"}</button>
        {iniziale && (
          <button
            type="button"
            disabled={occupato}
            className="bottone-piccolo"
            onClick={() => window.confirm("Eliminare questo elemento?") && esegui("DELETE", "eventi", { id: iniziale.id }, "Eliminato")}
          >
            Elimina
          </button>
        )}
      </div>
    </form>
  );
}

export function EventiAdmin({ eventi }: { eventi: Evento[] }) {
  const prossimo = (eventi.at(-1)?.ordine ?? 0) + 10;
  return (
    <div className="space-y-4">
      {eventi.map((e) => <Scheda key={`${e.id}-${e.titolo}-${e.quando}-${e.attivo}`} iniziale={e} ordine={e.ordine} />)}
      <h2 className="pt-2 text-2xl font-semibold text-oro">Aggiungi</h2>
      <Scheda key={eventi.length} nuovo ordine={prossimo} />
    </div>
  );
}
