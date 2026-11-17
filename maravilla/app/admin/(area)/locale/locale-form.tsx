"use client";

import { useState } from "react";
import type { Locale } from "@/lib/tipi";
import { useAzione } from "../azione";

const CAMPI: { chiave: keyof Locale; etichetta: string; tipo?: string; lungo?: boolean; aiuto?: string }[] = [
  { chiave: "nome", etichetta: "Nome del locale" },
  { chiave: "claim", etichetta: "Frase sotto il logo", aiuto: "Es. La prima cotoletteria alcolica d'Italia" },
  { chiave: "indirizzo", etichetta: "Indirizzo", aiuto: "Compare in Home con il link alle indicazioni" },
  { chiave: "telefono", etichetta: "Telefono", tipo: "tel" },
  { chiave: "instagram", etichetta: "Link Instagram", tipo: "url", aiuto: "Con https://" },
  { chiave: "note", etichetta: "Presentazione breve", lungo: true, aiuto: "Una o due righe in Home" },
];

export function LocaleForm({ iniziale }: { iniziale: Locale }) {
  const [v, setV] = useState<Locale>(iniziale);
  const { occupato, errori, esegui } = useAzione();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        esegui("POST", "locale", v);
      }}
    >
      {CAMPI.map((c) => (
        <div key={c.chiave}>
          <label htmlFor={c.chiave} className="etichetta">{c.etichetta}</label>
          {c.lungo ? (
            <textarea id={c.chiave} rows={3} className="campo py-3" value={v[c.chiave]} onChange={(e) => setV({ ...v, [c.chiave]: e.target.value })} />
          ) : (
            <input id={c.chiave} type={c.tipo ?? "text"} className="campo" value={v[c.chiave]} onChange={(e) => setV({ ...v, [c.chiave]: e.target.value })} />
          )}
          {c.aiuto && <p className="mt-1 text-xs text-salvia">{c.aiuto}</p>}
          {errori[c.chiave] && <p className="errore">{errori[c.chiave]}</p>}
        </div>
      ))}
      <button type="submit" disabled={occupato} className="bottone w-full">{occupato ? "Salvo…" : "Salva"}</button>
    </form>
  );
}
