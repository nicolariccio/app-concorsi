"use client";

import { useState } from "react";
import { locale } from "@/lib/locale";

type Stato = "idle" | "invio" | "ok" | "errore";

export default function Prenota() {
  const [stato, setStato] = useState<Stato>("idle");
  const [errori, setErrori] = useState<Record<string, string>>({});
  const [messaggio, setMessaggio] = useState("");

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
      if (res.ok) {
        setStato("ok");
      } else {
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
      <div className="scheda space-y-2 text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="text-2xl font-black">Richiesta inviata!</h1>
        <p className="text-zinc-400">Ti confermiamo la prenotazione al numero che hai indicato.</p>
      </div>
    );
  }

  const err = (c: string) => errori[c] && <p className="mt-1 text-sm text-magenta">{errori[c]}</p>;

  return (
    <form onSubmit={invia} className="space-y-5">
      <h1 className="text-3xl font-black">Prenota un tavolo</h1>
      <label className="block">Nome<input name="nome" required className="campo mt-1" autoComplete="name" />{err("nome")}</label>
      <label className="block">Telefono<input name="telefono" type="tel" required className="campo mt-1" autoComplete="tel" />{err("telefono")}</label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">Data<input name="data" type="date" required className="campo mt-1" />{err("data")}</label>
        <label className="block">Ora
          <select name="ora" required className="campo mt-1" defaultValue="">
            <option value="" disabled>Scegli</option>
            {locale.fasceOrarie.map((o) => <option key={o}>{o}</option>)}
          </select>{err("ora")}
        </label>
      </div>
      <label className="block">Persone<input name="persone" type="number" min={1} max={locale.maxPersone} defaultValue={2} required className="campo mt-1" />{err("persone")}</label>
      <label className="block">Note (facoltative)<textarea name="note" rows={2} maxLength={300} className="campo mt-1" /></label>
      {stato === "errore" && <p className="text-magenta">{messaggio}</p>}
      <button type="submit" disabled={stato === "invio"} className="bottone w-full disabled:opacity-60">
        {stato === "invio" ? "Invio…" : "Invia richiesta"}
      </button>
    </form>
  );
}
