"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Disponibilita } from "@/lib/disponibilita";
import type { Stato } from "@/lib/tipi";

export function AzioniPrenotazione({
  codice,
  persone,
  data: dataIniziale,
  ora: oraIniziale,
  stato,
  consentito,
  motivo,
  oggi,
  maxPersone,
  telefono,
}: {
  codice: string;
  persone: number;
  data: string;
  ora: string;
  stato: Stato;
  consentito: boolean;
  motivo: string;
  oggi: string;
  maxPersone: number;
  telefono: string;
}) {
  const router = useRouter();
  const [modifica, setModifica] = useState(false);
  const [data, setData] = useState(dataIniziale);
  const [ora, setOra] = useState(oraIniziale);
  const [n, setN] = useState(persone);
  const [disp, setDisp] = useState<Disponibilita | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [messaggio, setMessaggio] = useState("");
  const [errori, setErrori] = useState<Record<string, string>>({});
  const [fatto, setFatto] = useState("");

  useEffect(() => {
    if (!modifica || !data) return;
    let attuale = true;
    fetch(`/api/disponibilita?data=${data}&escludi=${codice}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => attuale && setDisp(d))
      .catch(() => attuale && setDisp(null));
    return () => {
      attuale = false;
    };
  }, [modifica, data, codice]);

  async function invia(corpo: Record<string, unknown>) {
    setOccupato(true);
    setMessaggio("");
    setErrori({});
    const res = await fetch(`/api/prenotazione/${codice}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setOccupato(false);
    if (res?.ok) {
      setFatto(corpo.azione === "annulla" ? "Prenotazione annullata." : "Prenotazione aggiornata: il locale la confermerà di nuovo.");
      setModifica(false);
      router.refresh();
      return;
    }
    setErrori(json.errori ?? {});
    setMessaggio(res ? (json.messaggio ?? "Qualcosa è andato storto") : "Connessione assente, riprova");
  }

  const chiama = telefono ? (
    <a href={`tel:${telefono.replace(/\s/g, "")}`} className="bottone-vuoto">Chiama {telefono}</a>
  ) : null;

  if (stato === "annullata") return <div className="space-y-4">{fatto && <p role="status" className="text-oro">{fatto}</p>}</div>;
  if (!consentito)
    return (
      <div className="space-y-4">
        <p className="text-salvia">{motivo}</p>
        {chiama}
      </div>
    );

  return (
    <div className="space-y-4">
      {fatto && <p role="status" className="text-oro">{fatto}</p>}
      {!modifica ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" className="bottone" onClick={() => { setFatto(""); setModifica(true); }}>Cambia la prenotazione</button>
          <button type="button" disabled={occupato} className="bottone-vuoto" onClick={() => window.confirm("Annullare la prenotazione?") && invia({ azione: "annulla" })}>
            Annulla la prenotazione
          </button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            invia({ azione: "modifica", data, ora, persone: n });
          }}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
            <div>
              <label htmlFor="m-data" className="etichetta">Data</label>
              <input id="m-data" type="date" min={oggi} required className="campo" value={data} onChange={(e) => { setData(e.target.value); setOra(""); }} />
              {errori.data && <p className="errore">{errori.data}</p>}
            </div>
            <div>
              <label htmlFor="m-ora" className="etichetta">Ora</label>
              <select id="m-ora" required className="campo" value={ora} onChange={(e) => setOra(e.target.value)}>
                <option value="" disabled>Scegli</option>
                {(disp?.fasce ?? (ora ? [{ ora, libera: true }] : [])).map((f) => (
                  <option key={f.ora} value={f.ora} disabled={!f.libera}>{f.libera ? f.ora : `${f.ora} · al completo`}</option>
                ))}
              </select>
              {errori.ora && <p className="errore">{errori.ora}</p>}
            </div>
          </div>
          {disp?.chiuso && <p className="errore">Quel giorno siamo chiusi{disp.motivo ? `: ${disp.motivo}` : ""}.</p>}
          <div>
            <label htmlFor="m-persone" className="etichetta">Persone</label>
            <input id="m-persone" type="number" min={1} max={maxPersone} required className="campo" value={n} onChange={(e) => setN(Number(e.target.value))} />
            {errori.persone && <p className="errore">{errori.persone}</p>}
          </div>
          {messaggio && <p className="errore">{messaggio}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={occupato || !!disp?.chiuso} className="bottone">{occupato ? "Salvo…" : "Salva le modifiche"}</button>
            <button type="button" className="bottone-vuoto" onClick={() => { setModifica(false); setMessaggio(""); }}>Lascia com&apos;è</button>
          </div>
          <p className="text-xs text-salvia">Dopo la modifica il locale deve confermare di nuovo.</p>
        </form>
      )}
      {!modifica && messaggio && <p className="errore">{messaggio}</p>}
    </div>
  );
}
