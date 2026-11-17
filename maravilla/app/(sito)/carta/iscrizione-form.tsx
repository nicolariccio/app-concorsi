"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function IscrizioneForm() {
  const router = useRouter();
  const [errori, setErrori] = useState<Record<string, string>>({});
  const [messaggio, setMessaggio] = useState("");
  const [occupato, setOccupato] = useState(false);

  async function invia(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setOccupato(true);
    setErrori({});
    setMessaggio("");
    const f = new FormData(ev.currentTarget);
    const res = await fetch("/api/carta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: f.get("nome"), telefono: f.get("telefono"), consenso: f.get("consenso") === "on" }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setOccupato(false);
    if (res?.ok) {
      router.replace(`/carta/${json.codice}`);
      return;
    }
    setErrori(json.errori ?? {});
    setMessaggio(res ? (json.messaggio ?? "Qualcosa è andato storto") : "Connessione assente, riprova");
  }

  return (
    <form onSubmit={invia} className="space-y-5">
      <div>
        <label htmlFor="nome" className="etichetta">Nome</label>
        <input id="nome" name="nome" required className="campo" autoComplete="name" />
        {errori.nome && <p className="errore">{errori.nome}</p>}
      </div>
      <div>
        <label htmlFor="telefono" className="etichetta">Telefono</label>
        <input id="telefono" name="telefono" type="tel" required className="campo" autoComplete="tel" />
        {errori.telefono && <p className="errore">{errori.telefono}</p>}
      </div>
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consenso" required className="mt-0.5 h-6 w-6 shrink-0 accent-[#D8BE82]" />
          <span>Acconsento al trattamento di nome e telefono per la carta fedeltà.</span>
        </label>
        {errori.consenso && <p className="errore">{errori.consenso}</p>}
      </div>
      {messaggio && <p className="errore">{messaggio}</p>}
      <button type="submit" disabled={occupato} className="bottone w-full">{occupato ? "Creo la carta…" : "Crea la mia carta"}</button>
    </form>
  );
}
