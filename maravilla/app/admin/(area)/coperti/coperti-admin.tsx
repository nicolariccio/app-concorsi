"use client";

import { useState } from "react";
import { testoLimite, type LimiteCoperti, type TrattoLimite } from "@/lib/coperti";
import { GIORNI_BREVI } from "@/lib/datetime";
import { useAzione } from "../azione";

type Bozza = { id?: string; giorni: number[]; soloOrari: boolean; ora_da: string; ora_a: string; max_coperti: string };

const daRegola = (r: LimiteCoperti): Bozza => ({ id: r.id, giorni: r.giorni, soloOrari: !!r.ora_da, ora_da: r.ora_da ?? "20:00", ora_a: r.ora_a ?? "22:00", max_coperti: String(r.max_coperti) });
const vuota = (): Bozza => ({ giorni: [], soloOrari: false, ora_da: "20:00", ora_a: "22:00", max_coperti: "" });

function descrizione(b: Bozza | LimiteCoperti) {
  const giorni = b.giorni.length === 0 ? "Tutti i giorni" : b.giorni.map((g) => GIORNI_BREVI[g]).join(", ");
  const da = "soloOrari" in b ? (b.soloOrari ? b.ora_da : null) : b.ora_da;
  const a = "soloOrari" in b ? b.ora_a : b.ora_a;
  return `${giorni} · ${da ? `dalle ${da} alle ${a}` : "tutto il giorno"}`;
}

function Regola({ iniziale, nuova, onFatto }: { iniziale?: LimiteCoperti; nuova?: boolean; onFatto?: () => void }) {
  const [v, setV] = useState<Bozza>(iniziale ? daRegola(iniziale) : vuota());
  const { occupato, errori, esegui } = useAzione();
  const id = iniziale?.id ?? "nuova";
  const corpo = { id: v.id, giorni: v.giorni, ora_da: v.soloOrari ? v.ora_da : "", ora_a: v.soloOrari ? v.ora_a : "", max_coperti: v.max_coperti };

  return (
    <form
      className="scheda space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const esito = await esegui("POST", "limiti", corpo, nuova ? "Regola aggiunta" : "Regola salvata");
        if (esito.ok && nuova) {
          setV(vuota());
          onFatto?.();
        }
      }}
    >
      <fieldset>
        <legend className="etichetta">Giorni</legend>
        <div className="flex flex-wrap gap-2">
          {GIORNI_BREVI.map((nome, g) => {
            const attivo = v.giorni.includes(g);
            return (
              <label key={g} className={`flex min-h-[44px] min-w-[52px] cursor-pointer items-center justify-center rounded-full border-[1.5px] px-3 text-sm font-semibold ${attivo ? "border-oro bg-oro text-notte" : "border-linea text-panna"}`}>
                <input type="checkbox" className="sr-only" checked={attivo} onChange={(e) => setV({ ...v, giorni: e.target.checked ? [...v.giorni, g].sort() : v.giorni.filter((x) => x !== g) })} />
                {nome}
              </label>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-salvia">{v.giorni.length === 0 ? "Nessun giorno scelto: la regola vale ogni giorno." : "Vale solo nei giorni scelti."}</p>
        {errori.giorni && <p className="errore">{errori.giorni}</p>}
      </fieldset>

      <div className="space-y-3">
        <label className="flex min-h-[44px] items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-[#D8BE82]" checked={v.soloOrari} onChange={(e) => setV({ ...v, soloOrari: e.target.checked })} />
          Solo in certi orari
        </label>
        {v.soloOrari && (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <div>
              <label htmlFor={`da${id}`} className="etichetta">Dalle</label>
              <input id={`da${id}`} type="time" className="campo" value={v.ora_da} onChange={(e) => setV({ ...v, ora_da: e.target.value })} />
            </div>
            <div>
              <label htmlFor={`a${id}`} className="etichetta">Alle</label>
              <input id={`a${id}`} type="time" className="campo" value={v.ora_a} onChange={(e) => setV({ ...v, ora_a: e.target.value })} />
            </div>
            <p className="col-span-2 -mt-1 text-xs text-salvia">Vale per le fasce che iniziano in questo intervallo, estremi compresi. Dopo mezzanotte scrivi l&apos;ora vera (es. fino alle 01:00).</p>
          </div>
        )}
        {errori.ora_da && <p className="errore">{errori.ora_da}</p>}
      </div>

      <div>
        <label htmlFor={`m${id}`} className="etichetta">Coperti massimi per fascia</label>
        <input id={`m${id}`} inputMode="numeric" className="campo" placeholder="Es. 30 (0 = nessuna prenotazione online)" value={v.max_coperti} onChange={(e) => setV({ ...v, max_coperti: e.target.value })} />
        {errori.max_coperti && <p className="errore">{errori.max_coperti}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={occupato} className="bottone-piccolo bg-panna text-notte">{nuova ? "Aggiungi regola" : "Salva"}</button>
        {iniziale && (
          <button type="button" disabled={occupato} className="bottone-piccolo" onClick={() => window.confirm("Eliminare questa regola?") && esegui("DELETE", "limiti", { id: iniziale.id }, "Regola eliminata")}>
            Elimina
          </button>
        )}
      </div>
    </form>
  );
}

export function CopertiAdmin({ regole, riassunto }: { regole: LimiteCoperti[]; riassunto: { giorno: string; breve: string; tratti: TrattoLimite[] | null }[] }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-oro">Come vale oggi</h2>
        <div className="scheda space-y-3">
          {riassunto.map((g) => (
            <div key={g.giorno} className="space-y-1">
              <p className="font-semibold">{g.giorno}</p>
              {g.tratti === null ? (
                <p className="text-sm text-salvia">Chiuso</p>
              ) : (
                <ul className="text-sm text-salvia">
                  {g.tratti.map((t, i) => (
                    <li key={i}>
                      {t.da === t.a ? t.da : `${t.da}–${t.a}`}: <span className="text-panna">{testoLimite(t.limite)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-oro">Le tue regole</h2>
        <p className="text-sm text-salvia">
          Se più regole valgono insieme vince la più specifica: prima giorno e orario, poi solo il giorno, poi solo l&apos;orario, infine quelle per tutti i giorni. A parità vince il limite più basso.
        </p>
        {regole.length === 0 && <p className="text-salvia">Nessuna regola: vale solo il limite generale.</p>}
        {regole.map((r) => (
          <div key={`${r.id}-${r.max_coperti}-${r.giorni.join()}-${r.ora_da}-${r.ora_a}`} className="space-y-2">
            <p className="text-sm text-salvia">{descrizione(r)}: <span className="font-semibold text-panna">{testoLimite(r.max_coperti)}</span></p>
            <Regola iniziale={r} />
          </div>
        ))}
        <h3 className="pt-2 text-2xl font-semibold">Aggiungi una regola</h3>
        <Regola key={regole.length} nuova />
      </div>
    </div>
  );
}
