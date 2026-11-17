"use client";

import { useMemo, useState } from "react";
import { giornoSettimana } from "@/lib/datetime";
import { fasceOrarie } from "@/lib/orari";
import type { Orario } from "@/lib/tipi";

type Stato = "idle" | "invio" | "ok" | "errore";

export function PrenotaForm({ orari, oggi, maxPersone }: { orari: Orario[]; oggi: string; maxPersone: number }) {
  const [stato, setStato] = useState<Stato>("idle");
  const [errori, setErrori] = useState<Record<string, string>>({});
  const [messaggio, setMessaggio] = useState("");
  const [data, setData] = useState("");
  const [ora, setOra] = useState("");

  const giorno = data ? orari.find((o) => o.giorno === giornoSettimana(data)) : undefined;
  const fasce = useMemo(() => fasceOrarie(giorno), [giorno]);
  const chiuso = data !== "" && fasce.length === 0;

  async function invia(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setStato("invio");
    setErrori({});
    const dati = Object.fromEntries(new FormData(ev.currentTarget));
    try {
      const res = await fetch("/api/prenota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dati),
      });
      const json = await res.json();
      if (res.ok) setStato("ok");
      else {
        setErrori(json.errori ?? {});
        setMessaggio(json.messaggio ?? "Qualcosa è andato storto, riprova.");
        setStato("errore");
      }
    } catch {
      setMessaggio("Connessione assente, riprova.");
      setStato("errore");
    }
  }

  if (stato === "ok") {
    return (
      <div className="scheda space-y-2">
        <h1 className="text-4xl font-semibold">Richiesta inviata.</h1>
        <p className="text-salvia">Ti confermiamo la prenotazione al numero che hai indicato.</p>
      </div>
    );
  }

  const err = (c: string) => errori[c] && <p className="errore">{errori[c]}</p>;

  return (
    <form onSubmit={invia} className="space-y-5">
      <h1 className="text-5xl font-semibold leading-none">Prenota un tavolo</h1>
      <div>
        <label htmlFor="nome" className="etichetta">Nome</label>
        <input id="nome" name="nome" required className="campo" autoComplete="name" />
        {err("nome")}
      </div>
      <div>
        <label htmlFor="telefono" className="etichetta">Telefono</label>
        <input id="telefono" name="telefono" type="tel" required className="campo" autoComplete="tel" />
        {err("telefono")}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="data" className="etichetta">Data</label>
          <input id="data" name="data" type="date" min={oggi} required className="campo" value={data} onChange={(e) => { setData(e.target.value); setOra(""); }} />
          {err("data")}
        </div>
        <div>
          <label htmlFor="ora" className="etichetta">Ora</label>
          <select id="ora" name="ora" required className="campo" value={ora} onChange={(e) => setOra(e.target.value)} disabled={fasce.length === 0}>
            <option value="" disabled>{data ? (chiuso ? "Chiuso" : "Scegli") : "Prima la data"}</option>
            {fasce.map((f) => <option key={f}>{f}</option>)}
          </select>
          {err("ora")}
        </div>
      </div>
      {chiuso && <p className="errore">Quel giorno siamo chiusi.</p>}
      <div>
        <label htmlFor="persone" className="etichetta">Persone</label>
        <input id="persone" name="persone" type="number" min={1} max={maxPersone} defaultValue={2} required className="campo" />
        {err("persone")}
      </div>
      <div>
        <label htmlFor="note" className="etichetta">Note (facoltative)</label>
        <textarea id="note" name="note" rows={2} maxLength={300} className="campo py-3" />
      </div>
      {stato === "errore" && <p className="errore">{messaggio}</p>}
      <button type="submit" disabled={stato === "invio" || chiuso} className="bottone w-full">
        {stato === "invio" ? "Invio…" : "Invia richiesta"}
      </button>
    </form>
  );
}
