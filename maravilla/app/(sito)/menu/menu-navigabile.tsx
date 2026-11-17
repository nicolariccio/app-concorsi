"use client";

import { useState } from "react";
import { nomiAllergeni } from "@/lib/allergeni";
import { formattaPrezzo } from "@/lib/prezzo";
import type { Piatto } from "@/lib/tipi";

type Gruppo = {
  gruppo: "food" | "drink";
  categorie: { id: string; nome: string; piatti: (Piatto & { foto_url: string })[] }[];
};

const ETICHETTE = { food: "Food", drink: "Drink" } as const;

export function MenuNavigabile({ gruppi }: { gruppi: Gruppo[] }) {
  const [gruppo, setGruppo] = useState(gruppi[0].gruppo);
  const [scelte, setScelte] = useState<Record<string, string>>({});

  const attivo = gruppi.find((g) => g.gruppo === gruppo) ?? gruppi[0];
  const categoria = attivo.categorie.find((c) => c.id === scelte[attivo.gruppo]) ?? attivo.categorie[0];

  return (
    <div className="space-y-5">
      {gruppi.length > 1 && (
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Food o Drink">
          {gruppi.map((g) => (
            <button
              key={g.gruppo}
              type="button"
              aria-pressed={g.gruppo === attivo.gruppo}
              onClick={() => setGruppo(g.gruppo)}
              className={`min-h-[52px] rounded-full font-display text-2xl font-semibold transition ${
                g.gruppo === attivo.gruppo ? "bg-panna text-notte" : "border-[1.5px] border-linea text-panna hover:border-panna"
              }`}
            >
              {ETICHETTE[g.gruppo]}
            </button>
          ))}
        </div>
      )}

      <div className="-mx-5 overflow-x-auto px-5" role="group" aria-label="Categorie">
        <div className="flex gap-2 pb-1">
          {attivo.categorie.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === categoria.id}
              onClick={() => setScelte({ ...scelte, [attivo.gruppo]: c.id })}
              className={`min-h-[44px] shrink-0 rounded-full px-5 text-[15px] font-semibold transition ${
                c.id === categoria.id ? "bg-oro text-notte" : "border-[1.5px] border-linea text-panna hover:border-oro"
              }`}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      <section aria-label={categoria.nome}>
        <h2 className="mb-2 text-3xl font-semibold text-oro">{categoria.nome}</h2>
        <ul className="divide-y divide-bordo border-y border-bordo">
          {categoria.piatti.map((p) => (
            <li key={p.id} className={`flex items-start gap-4 py-4 ${p.esaurito ? "opacity-60" : ""}`}>
              {p.foto_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.foto_url} alt="" width={80} height={80} loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-2xl font-bold leading-tight">
                  {p.nome}
                  {p.esaurito && <span className="ml-2 align-middle font-sans text-xs font-semibold uppercase tracking-wider text-oro">Esaurito</span>}
                </h3>
                {p.descrizione && <p className="text-salvia">{p.descrizione}</p>}
                {p.allergeni.length > 0 && <p className="mt-1 text-xs text-oro">Allergeni: {nomiAllergeni(p.allergeni)}</p>}
              </div>
              {p.prezzo_cent != null && <p className="font-display text-2xl font-bold tabular-nums">{formattaPrezzo(p.prezzo_cent)}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
