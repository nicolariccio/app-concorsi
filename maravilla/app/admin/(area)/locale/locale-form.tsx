"use client";

import { useState } from "react";
import type { Locale } from "@/lib/tipi";
import { PIATTAFORME } from "@/lib/consegna";
import { CampoFoto } from "../campo-foto";
import { useAzione } from "../azione";

type Campo = "nome" | "claim" | "indirizzo" | "telefono" | "instagram" | "note";
type Valori = Omit<Locale, "coperti_max" | "fedelta_timbri"> & { coperti_max: string; fedelta_timbri: string };

const CAMPI: { chiave: Campo; etichetta: string; tipo?: string; lungo?: boolean; aiuto?: string }[] = [
  { chiave: "nome", etichetta: "Nome del locale" },
  { chiave: "claim", etichetta: "Frase sotto il logo", aiuto: "Es. La prima cotoletteria alcolica d'Italia" },
  { chiave: "indirizzo", etichetta: "Indirizzo", aiuto: "Compare in Home con il link alle indicazioni" },
  { chiave: "telefono", etichetta: "Telefono", tipo: "tel" },
  { chiave: "instagram", etichetta: "Link Instagram", tipo: "url", aiuto: "Con https://" },
  { chiave: "note", etichetta: "Presentazione breve", lungo: true, aiuto: "Una o due righe in Home" },
];

export function LocaleForm({ iniziale, fotoHomeUrl }: { iniziale: Locale; fotoHomeUrl: string }) {
  const [v, setV] = useState<Valori>({ ...iniziale, coperti_max: iniziale.coperti_max?.toString() ?? "", fedelta_timbri: iniziale.fedelta_timbri?.toString() ?? "" });
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
      <fieldset className="space-y-4 rounded-2xl border border-bordo p-4">
        <legend className="px-2 font-display text-2xl font-semibold text-oro">Ultimo reel di Instagram</legend>
        <p className="text-sm text-salvia">Apri il reel su Instagram, tocca i tre puntini, scegli &quot;Copia link&quot; e incollalo qui. Quando pubblichi un nuovo reel, sostituisci il link. Lascia vuoto per non mostrarlo.</p>
        <div>
          <label htmlFor="link_reel" className="etichetta">Link del reel</label>
          <input id="link_reel" type="url" inputMode="url" className="campo" placeholder="https://www.instagram.com/reel/…" value={v.link_reel} onChange={(e) => setV({ ...v, link_reel: e.target.value })} />
          {errori.link_reel && <p className="errore">{errori.link_reel}</p>}
        </div>
      </fieldset>
      <fieldset className="space-y-4 rounded-2xl border border-bordo p-4">
        <legend className="px-2 font-display text-2xl font-semibold text-oro">Ordina a casa</legend>
        <p className="text-sm text-salvia">Incolla il link della tua pagina su Glovo e su Deliveroo: il sito mostra i pulsanti per ordinare. Lascia vuoto quello che non usi.</p>
        {PIATTAFORME.map((p) => (
          <div key={p.id}>
            <label htmlFor={p.campo} className="etichetta">Link {p.nome}</label>
            <input id={p.campo} type="url" inputMode="url" className="campo" placeholder={p.esempio} value={v[p.campo]} onChange={(e) => setV({ ...v, [p.campo]: e.target.value })} />
            {errori[p.campo] && <p className="errore">{errori[p.campo]}</p>}
          </div>
        ))}
      </fieldset>
      <fieldset className="space-y-4 rounded-2xl border border-bordo p-4">
        <legend className="px-2 font-display text-2xl font-semibold text-oro">Carta fedeltà</legend>
        <p className="text-sm text-salvia">Per attivarla servono sia i timbri sia il premio. Lasciali vuoti per tenerla spenta: il sito non la mostra.</p>
        <div>
          <label htmlFor="fedelta_timbri" className="etichetta">Timbri per ottenere il premio</label>
          <input id="fedelta_timbri" inputMode="numeric" className="campo" placeholder="Es. 10" value={v.fedelta_timbri} onChange={(e) => setV({ ...v, fedelta_timbri: e.target.value })} />
          {errori.fedelta_timbri && <p className="errore">{errori.fedelta_timbri}</p>}
        </div>
        <div>
          <label htmlFor="fedelta_premio" className="etichetta">Premio</label>
          <input id="fedelta_premio" className="campo" placeholder="Es. Una cotoletta in omaggio" value={v.fedelta_premio} onChange={(e) => setV({ ...v, fedelta_premio: e.target.value })} />
          {errori.fedelta_premio && <p className="errore">{errori.fedelta_premio}</p>}
        </div>
        <div>
          <label htmlFor="fedelta_regola" className="etichetta">Come si guadagna un timbro</label>
          <input id="fedelta_regola" className="campo" placeholder="Es. Un timbro per ogni ordine in sala" value={v.fedelta_regola} onChange={(e) => setV({ ...v, fedelta_regola: e.target.value })} />
        </div>
      </fieldset>
      <button type="submit" disabled={occupato} className="bottone w-full">{occupato ? "Salvo…" : "Salva"}</button>
    </form>
  );
}
