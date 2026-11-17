"use client";

import { useState } from "react";
import type { Chiusura } from "@/lib/disponibilita";
import { useAzione } from "../azione";

const formatta = (d: string) => d.split("-").reverse().join("/");

function Riga({ c }: { c: Chiusura }) {
  const { occupato, esegui } = useAzione();
  return (
    <li className="scheda flex items-center justify-between gap-3">
      <div>
        <p className="font-semibold">{c.dal === c.al ? formatta(c.dal) : `${formatta(c.dal)} – ${formatta(c.al)}`}</p>
        {c.motivo && <p className="text-sm text-salvia">{c.motivo}</p>}
      </div>
      <button
        type="button"
        disabled={occupato}
        className="bottone-piccolo"
        onClick={() => window.confirm("Eliminare questa chiusura?") && esegui("DELETE", "chiusure", { id: c.id }, "Eliminata")}
      >
        Elimina
      </button>
    </li>
  );
}

export function ChiusureAdmin({ chiusure }: { chiusure: Chiusura[] }) {
  const [dal, setDal] = useState("");
  const [al, setAl] = useState("");
  const [motivo, setMotivo] = useState("");
  const { occupato, errori, esegui } = useAzione();

  return (
    <div className="space-y-3">
      {chiusure.length === 0 && <p className="text-salvia">Nessuna chiusura in programma.</p>}
      <ul className="space-y-3">{chiusure.map((c) => <Riga key={c.id} c={c} />)}</ul>
      <form
        className="scheda space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const esito = await esegui("POST", "chiusure", { dal, al: al || dal, motivo }, "Chiusura aggiunta");
          if (esito.ok) {
            setDal("");
            setAl("");
            setMotivo("");
          }
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ch-dal" className="etichetta">Dal</label>
            <input id="ch-dal" type="date" className="campo" value={dal} onChange={(e) => setDal(e.target.value)} />
            {errori.dal && <p className="errore">{errori.dal}</p>}
          </div>
          <div>
            <label htmlFor="ch-al" className="etichetta">Al (facoltativo)</label>
            <input id="ch-al" type="date" className="campo" value={al} min={dal} onChange={(e) => setAl(e.target.value)} />
            {errori.al && <p className="errore">{errori.al}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="ch-motivo" className="etichetta">Motivo (facoltativo)</label>
          <input id="ch-motivo" className="campo" placeholder="Es. Ferie, serata privata" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <button type="submit" disabled={occupato} className="bottone-piccolo bg-panna text-notte">Aggiungi chiusura</button>
      </form>
    </div>
  );
}
