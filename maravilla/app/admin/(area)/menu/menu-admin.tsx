"use client";

import { useState } from "react";
import { ALLERGENI } from "@/lib/allergeni";
import { prezzoPerCampo } from "@/lib/prezzo";
import type { Categoria, Gruppo, Piatto } from "@/lib/tipi";
import { CampoFoto } from "../campo-foto";
import { useAzione } from "../azione";

type PiattoConFoto = Piatto & { foto_url?: string };

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
    foto: m.foto ?? "",
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

type Bozza = { nome: string; descrizione: string; prezzo: string; allergeni: string[]; esaurito: boolean; visibile: boolean; foto: string };

function PiattoForm({
  categoriaId,
  piatto,
  ordine,
  onSu,
  onGiu,
}: {
  categoriaId: string;
  piatto?: PiattoConFoto;
  ordine: number;
  onSu?: () => void;
  onGiu?: () => void;
}) {
  const vuoto: Bozza = { nome: "", descrizione: "", prezzo: "", allergeni: [], esaurito: false, visibile: true, foto: "" };
  const [v, setV] = useState<Bozza>(
    piatto
      ? { nome: piatto.nome, descrizione: piatto.descrizione, prezzo: prezzoPerCampo(piatto.prezzo_cent), allergeni: piatto.allergeni, esaurito: piatto.esaurito, visibile: piatto.visibile, foto: piatto.foto ?? "" }
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
      <CampoFoto id={`f${id}`} etichetta="Foto del piatto" anteprimaIniziale={piatto?.foto_url ?? ""} onCambia={(foto) => setV({ ...v, foto })} />
      <details className="rounded-xl border border-bordo px-4 py-2">
        <summary className="min-h-[36px] cursor-pointer py-1 text-sm text-salvia">
          Allergeni{v.allergeni.length > 0 ? ` (${v.allergeni.length})` : ""}
        </summary>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 pb-2">
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
  piatti: PiattoConFoto[];
  onSu: () => void;
  onGiu: () => void;
}) {
  const [nome, setNome] = useState(categoria.nome);
  const [gruppo, setGruppo] = useState<Gruppo>(categoria.gruppo ?? "food");
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
          esegui("POST", "categorie", { id: categoria.id, nome, gruppo, ordine: categoria.ordine });
        }}
      >
        <label htmlFor={`c${categoria.id}`} className="etichetta">Categoria</label>
        <input id={`c${categoria.id}`} className="campo font-display text-2xl font-semibold" value={nome} onChange={(e) => setNome(e.target.value)} />
        {errori.nome && <p className="errore">{errori.nome}</p>}
        <label htmlFor={`g${categoria.id}`} className="etichetta">Sezione del menu</label>
        <select id={`g${categoria.id}`} className="campo" value={gruppo} onChange={(e) => setGruppo(e.target.value as Gruppo)}>
          <option value="food">Food</option>
          <option value="drink">Drink</option>
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={occupato} className="bottone-piccolo bg-panna text-notte">Salva</button>
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
          key={`${p.id}-${p.ordine}-${p.nome}-${p.prezzo_cent}-${p.esaurito}-${p.visibile}-${p.foto}-${p.descrizione}-${p.allergeni.join()}`}
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

const GRUPPI: { id: Gruppo; titolo: string }[] = [
  { id: "food", titolo: "Food" },
  { id: "drink", titolo: "Drink" },
];

export function MenuAdmin({ categorie, piatti }: { categorie: Categoria[]; piatti: PiattoConFoto[] }) {
  const [nuova, setNuova] = useState("");
  const [nuovoGruppo, setNuovoGruppo] = useState<Gruppo>("food");
  const { occupato, errori, esegui } = useAzione();
  const gruppoDi = (c: Categoria): Gruppo => c.gruppo ?? "food";

  // Si riordina dentro la propria sezione (Food o Drink).
  const muovi = (g: Gruppo, i: number, a: number) => {
    const lista = categorie.filter((c) => gruppoDi(c) === g);
    if (a < 0 || a >= lista.length) return;
    esegui("POST", "categorie", riordina(lista, i, a).map(({ id, nome, ordine }) => ({ id, nome, gruppo: g, ordine })), "Spostata");
  };

  return (
    <div className="space-y-8">
      {GRUPPI.map((g) => {
        const lista = categorie.filter((c) => gruppoDi(c) === g.id);
        return (
          <section key={g.id} className="space-y-4" aria-label={g.titolo}>
            <h2 className="border-b border-bordo pb-2 text-3xl font-semibold text-oro">{g.titolo}</h2>
            {lista.length === 0 && <p className="text-salvia">Nessuna categoria in {g.titolo}.</p>}
            {lista.map((c, i) => (
              <CategoriaBox
                key={`${c.id}-${c.nome}-${c.ordine}-${gruppoDi(c)}`}
                categoria={c}
                piatti={piatti.filter((p) => p.categoria_id === c.id)}
                onSu={() => muovi(g.id, i, i - 1)}
                onGiu={() => muovi(g.id, i, i + 1)}
              />
            ))}
          </section>
        );
      })}
      <form
        className="scheda space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const esito = await esegui("POST", "categorie", { nome: nuova, gruppo: nuovoGruppo, ordine: (categorie.at(-1)?.ordine ?? 0) + 10 }, "Categoria aggiunta");
          if (esito.ok) setNuova("");
        }}
      >
        <label htmlFor="nuova-gruppo" className="etichetta">Nuova categoria in</label>
        <select id="nuova-gruppo" className="campo" value={nuovoGruppo} onChange={(e) => setNuovoGruppo(e.target.value as Gruppo)}>
          <option value="food">Food (es. Antipasti, Cotolette)</option>
          <option value="drink">Drink (es. Soft drink, Signature cocktails, Vini)</option>
        </select>
        <label htmlFor="nuova-cat" className="etichetta">Nome della categoria</label>
        <input id="nuova-cat" className="campo" placeholder="Es. Antipasti" value={nuova} onChange={(e) => setNuova(e.target.value)} />
        {errori.nome && <p className="errore">{errori.nome}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={occupato} className="bottone-piccolo bg-panna text-notte">Aggiungi categoria</button>
        </div>
      </form>
    </div>
  );
}
