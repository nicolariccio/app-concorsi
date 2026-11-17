"use client";

import { useState } from "react";
import type { CartaFedelta } from "@/lib/tipi";
import { AzioniCarta } from "./azioni-carta";

export function CarteAdmin({ carte, target, nomeLocale, origine }: { carte: CartaFedelta[]; target: number; nomeLocale: string; origine: string }) {
  const [q, setQ] = useState("");
  const cifre = q.replace(/\D/g, "");
  const trovate = carte.filter((c) => {
    const t = q.trim().toLowerCase();
    return !t || c.nome.toLowerCase().includes(t) || (cifre.length >= 3 && c.telefono.includes(cifre));
  });

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="cerca" className="etichetta">Cerca per nome o telefono</label>
        <input id="cerca" type="search" className="campo" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {carte.length === 0 && <p className="text-salvia">Nessuna carta ancora. I clienti la creano da <span className="text-panna">/carta</span>.</p>}
      <ul className="space-y-3">
        {trovate.map((c) => {
          const link = `${origine}/carta/${c.codice}`;
          const wa = `https://wa.me/${c.telefono}?text=${encodeURIComponent(`Ciao ${c.nome}, ecco la tua carta fedeltà di ${nomeLocale}: ${link}`)}`;
          return (
            <li key={c.id} className="scheda space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">{c.nome}</p>
                <p className="font-display text-2xl font-bold tabular-nums">{c.timbri}<span className="text-salvia"> / {target}</span></p>
              </div>
              <p className="text-sm text-salvia">+{c.telefono} · premi riscattati: {c.premi}</p>
              <AzioniCarta id={c.id} timbri={c.timbri} target={target} nome={c.nome} />
              <div className="flex gap-2">
                <a href={`tel:+${c.telefono}`} className="bottone-piccolo">Chiama</a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="bottone-piccolo">Invia il link su WhatsApp</a>
              </div>
            </li>
          );
        })}
      </ul>
      {carte.length > 0 && trovate.length === 0 && <p className="text-salvia">Nessuna carta trovata.</p>}
    </div>
  );
}
