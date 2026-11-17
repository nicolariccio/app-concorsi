"use client";

import { useState } from "react";
import type { Locale } from "@/lib/tipi";
import { CampoFoto } from "../campo-foto";
import { useAzione } from "../azione";

type Campo = Exclude<keyof Locale, "coperti_max">;
type Valori = Omit<Locale, "coperti_max"> & { coperti_max: string };

const CAMPI: { chiave: Campo; etichetta: string; tipo?: string; lungo?: boolean; aiuto?: string }[] = [
  { chiave: "nome", etichetta: "Nome del locale" },
  { chiave: "claim", etichetta: "Frase sotto il logo", aiuto: "Es. La prima cotoletteria alcolica d'Italia" },
  { chiave: "indirizzo", etichetta: "Indirizzo", aiuto: "Compare in Home con il link alle indicazioni" },
  { chiave: "telefono", etichetta: "Telefono", tipo: "tel" },
  { chiave: "instagram", etichetta: "Link Instagram", tipo: "url", aiuto: "Con https://" },
  { chiave: "note", etichetta: "Presentazione breve", lungo: true, aiuto: "Una o due righe in Home" },
];

export function LocaleForm({ iniziale, fotoHomeUrl }: { iniziale: Locale; fotoHomeUrl: string }) {
  const [v, setV] = useState<Valori>({ ...iniziale, coperti_max: iniziale.coperti_max?.toString() ?? "" });
  const { occupato, errori, esegui } = useAzione();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        esegui("POST", "locale", v);
      }}
    >
      <div>
        <CampoFoto id="foto_home" etichetta="Foto della Home" forma="arco" anteprimaIniziale={fotoHomeUrl} onCambia={(f) => setV((x) => ({ ...x, foto_home: f }))} />
        {errori.foto_home && <p className="errore">{errori.foto_home}</p>}
      </div>
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
      <div>
        <label htmlFor="coperti_max" className="etichetta">Coperti massimi per fascia oraria</label>
        <input id="coperti_max" inputMode="numeric" className="campo" placeholder="Nessun limite" value={v.coperti_max} onChange={(e) => setV({ ...v, coperti_max: e.target.value })} />
        <p className="mt-1 text-xs text-salvia">Oltre questo numero di persone in una fascia (es. 20:30) il sito non accetta altre prenotazioni. Lascia vuoto per non avere limiti.</p>
        {errori.coperti_max && <p className="errore">{errori.coperti_max}</p>}
      </div>
      <button type="submit" disabled={occupato} className="bottone w-full">{occupato ? "Salvo…" : "Salva"}</button>
    </form>
  );
}
