"use client";

import { useState } from "react";
import { ALLERGENI } from "@/lib/allergeni";
import { prezzoPerCampo } from "@/lib/prezzo";
import type { Categoria, Piatto } from "@/lib/tipi";
import { useAzione } from "../azione";

// Forma che l'API si aspetta (il prezzo è un testo, es. "9,50").
const perApi = (p: Piatto, extra: Partial<Piatto> = {}) => {
  const m = { ...p, ...extra };
  return {
    id: m.id,
    categoria_id: m.categoria_id,
    nome: m.nome,
    descrizione: m.descrizione,
    prezzo: prezzoPerCampo(m.prezzo_cent),
    allergeni: m.allergeni,
    esaurito: m.esaurito,
    visibile: m.visibile,
    ordine: m.ordine,
  };
};

/** Sposta l'elemento `da` in `a` e rinumera 10, 20, 30… */
function riordina<T extends { ordine: number }>(lista: T[], da: number, a: number): T[] {
  const copia = [...lista];
  const [spostato] = copia.splice(da, 1);
  copia.splice(a, 0, spostato);
  return copia.map((x, i) => ({ ...x, ordine: (i + 1) * 10 }));
}

type Bozza = { nome: string; descrizione: string; prezzo: string; allergeni: string[]; esaurito: boolean; visibile: boolean };

function PiattoForm({
  categoriaId,
  piatto,
  ordine,
  onSu,
  onGiu,
}: {
  categoriaId: string;
  piatto?: Piatto;
  ordine: number;
  onSu?: () => void;
  onGiu?: () => void;
}) {
  const vuoto: Bozza = { nome: "", descrizione: "", prezzo: "", allergeni: [], esaurito: false, visibile: true };
  const [v, setV] = useState<Bozza>(
    piatto
      ? { nome: piatto.nome, descrizione: piatto.descrizione, prezzo: prezzoPerCampo(piatto.prezzo_cent), allergeni: piatto.allergeni, esaurito: piatto.esaurito, visibile: piatto.visibile }
      : vuoto,
  );
  const { occupato, errori, esegui } = useAzione();
  const id = piatto?.id ?? "nuovo" + categoriaId;
  const corpo = { id: piatto?.id, categoria_id: categoriaId, ordine: piatto?.ordine ?? ordine, ...v };

  return (
    <form
      className="space-y-3 rounded-xl border border-bordo p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const esito = await esegui("POST", "piatti", corpo);
        if (esito.ok && !piatto) setV(vuoto);
      }}
    >
      <div className="grid grid-cols-[1fr_96px] gap-3">
        <div>
          <label htmlFor={`n${id}`} className="etichetta">{piatto ? "Nome" : "Nuovo piatto"}</label>
          <input id={`n${id}`} className="campo" value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} />
          {errori.nome && <p className="errore">{errori.nome}</p>}
        </div>
        <div>
          <label htmlFor={`p${id}`} className="etichetta">Prezzo €</label>
          <input id={`p${id}`} inputMode="decimal" placeholder="9,50" className="campo" value={v.prezzo} onChange={(e) => setV({ ...v, prezzo: e.target.value })} />
          {errori.prezzo && <p className="errore">{errori.prezzo}</p>}
        </div>
      </div>
      <div>
        <label htmlFor={`d${id}`} className="etichetta">Ingredienti o descrizione</label>
        <input id={`d${id}`} className="campo" value={v.descrizione} onChange={(e) => setV({ ...v, descrizione: e.target.value })} />
      </div>
      <details className="rounded-xl border border-bordo px-4 py-2">
        <summary className="min-h-[36px] cursor-pointer py-1 text-sm text-salvia">
          Allergeni{v.allergeni.length > 0 ? ` (${v.allergeni.length})` : ""}
        </summary>
        <div className="grid grid-cols-2 gap-x-3 pb-2">
          {ALLERGENI.map((a) => (
            <label key={a.id} className="flex min-h-[44px] items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#D8BE82]"
                checked={v.allergeni.includes(a.id)}
                onChange={(e) => setV({ ...v, allergeni: e.target.checked ? [...v.allergeni, a.id] : v.allergeni.filter((x) => x !== a.id) })}
              />
              {a.nome}
            </label>
          ))}
        </div>
      </details>
      <div className="flex flex-wrap gap-x-5">
        <label className="flex min-h-[44px] items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-[#D8BE82]" checked={v.esaurito} onChange={(e) => setV({ ...v, esaurito: e.target.checked })} />
          Esaurito
        </label>
        <label className="flex min-h-[44px] items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-[#D8BE82]" checked={v.visibile} onChange={(e) => setV({ ...v, visibile: e.target.checked })} />
          Visibile sul sito
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={occupato} className="bottone-piccolo bg-panna text-notte">{piatto ? "Salva" : "Aggiungi"}</button>
        {piatto && (
          <>
            <button type="button" disabled={occupato} className="bottone-piccolo" aria-label="Sposta su" onClick={onSu}>↑</button>
            <button type="button" disabled={occupato} className="bottone-piccolo" aria-label="Sposta giù" onClick={onGiu}>↓</button>
            <button
              type="button"
              disabled={occupato}
              className="bottone-piccolo"
              onClick={() => window.confirm(`Eliminare "${piatto.nome}"?`) && esegui("DELETE", "piatti", { id: piatto.id }, "Eliminato")}
            >
              Elimina
            </button>
          </>
        )}
      </div>
    </form>
  );
}

function CategoriaBox({
  categoria,
  piatti,
  onSu,
  onGiu,
}: {
  categoria: Categoria;
  piatti: Piatto[];
  onSu: () => void;
  onGiu: () => void;
}) {
  const [nome, setNome] = useState(categoria.nome);
  const { occupato, errori, esegui } = useAzione();

  const muovi = (i: number, a: number) => {
    if (a < 0 || a >= piatti.length) return;
    esegui("POST", "piatti", riordina(piatti, i, a).map((p) => perApi(p)), "Spostato");
  };

  return (
    <section className="scheda space-y-4">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          esegui("POST", "categorie", { id: categoria.id, nome, ordine: categoria.ordine });
        }}
      >
        <label htmlFor={`c${categoria.id}`} className="etichetta">Categoria</label>
        <input id={`c${categoria.id}`} className="campo font-display text-2xl font-semibold" value={nome} onChange={(e) => setNome(e.target.value)} />
        {errori.nome && <p className="errore">{errori.nome}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={occupato} className="bottone-piccolo bg-panna text-notte">Salva nome</button>
          <button type="button" disabled={occupato} className="bottone-piccolo" aria-label="Sposta categoria su" onClick={onSu}>↑</button>
          <button type="button" disabled={occupato} className="bottone-piccolo" aria-label="Sposta categoria giù" onClick={onGiu}>↓</button>
          <button
            type="button"
            disabled={occupato}
            className="bottone-piccolo"
            onClick={() => window.confirm(`Eliminare "${categoria.nome}" e tutti i suoi piatti?`) && esegui("DELETE", "categorie", { id: categoria.id }, "Eliminata")}
          >
            Elimina categoria
          </button>
        </div>
      </form>

      {piatti.map((p, i) => (
        <PiattoForm
          key={`${p.id}-${p.ordine}-${p.nome}-${p.prezzo_cent}-${p.esaurito}-${p.visibile}-${p.descrizione}-${p.allergeni.join()}`}
          categoriaId={categoria.id}
          piatto={p}
          ordine={p.ordine}
          onSu={() => muovi(i, i - 1)}
          onGiu={() => muovi(i, i + 1)}
        />
      ))}
      <PiattoForm key={`nuovo-${piatti.length}`} categoriaId={categoria.id} ordine={(piatti.at(-1)?.ordine ?? 0) + 10} />
    </section>
  );
}

export function MenuAdmin({ categorie, piatti }: { categorie: Categoria[]; piatti: Piatto[] }) {
  const [nuova, setNuova] = useState("");
  const { occupato, errori, esegui } = useAzione();

  const muovi = (i: number, a: number) => {
    if (a < 0 || a >= categorie.length) return;
    esegui("POST", "categorie", riordina(categorie, i, a).map(({ id, nome, ordine }) => ({ id, nome, ordine })), "Spostata");
  };

  return (
    <div className="space-y-5">
      {categorie.map((c, i) => (
        <CategoriaBox
          key={`${c.id}-${c.nome}-${c.ordine}`}
          categoria={c}
          piatti={piatti.filter((p) => p.categoria_id === c.id)}
          onSu={() => muovi(i, i - 1)}
          onGiu={() => muovi(i, i + 1)}
        />
      ))}
      <form
        className="scheda space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const esito = await esegui("POST", "categorie", { nome: nuova, ordine: (categorie.at(-1)?.ordine ?? 0) + 10 }, "Categoria aggiunta");
          if (esito.ok) setNuova("");
        }}
      >
        <label htmlFor="nuova-cat" className="etichetta">Nuova categoria</label>
        <input id="nuova-cat" className="campo" placeholder="Es. Cotolette" value={nuova} onChange={(e) => setNuova(e.target.value)} />
        {errori.nome && <p className="errore">{errori.nome}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={occupato} className="bottone-piccolo bg-panna text-notte">Aggiungi categoria</button>
        </div>
      </form>
    </div>
  );
}
