"use client";

import { useRouter } from "next/navigation";
import { useAzione } from "../azione";

export function AzioniCarta({ id, timbri, target, nome }: { id: string; timbri: number; target: number; nome: string }) {
  const router = useRouter();
  const { occupato, esegui } = useAzione();
  const pronto = timbri >= target;
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={occupato} className="bottone-piccolo bg-panna text-notte" onClick={() => esegui("POST", "carta", { id, azione: "timbro" }, "Timbro aggiunto")}>
        Aggiungi timbro
      </button>
      {pronto && (
        <button type="button" disabled={occupato} className="bottone-piccolo border-oro text-oro" onClick={() => window.confirm(`Riscattare il premio per ${nome}?`) && esegui("POST", "carta", { id, azione: "premio" }, "Premio riscattato")}>
          Riscatta premio
        </button>
      )}
      <button type="button" disabled={occupato || timbri < 1} className="bottone-piccolo" onClick={() => window.confirm("Togliere l'ultimo timbro?") && esegui("POST", "carta", { id, azione: "storno" }, "Timbro tolto")}>
        Togli timbro
      </button>
      <button
        type="button"
        disabled={occupato}
        className="bottone-piccolo"
        onClick={async () => {
          if (!window.confirm(`Eliminare la carta di ${nome}? Nome e telefono vengono cancellati.`)) return;
          const esito = await esegui("DELETE", "carta", { id }, "Carta eliminata");
          if (esito.ok) router.replace("/admin/carta");
        }}
      >
        Elimina carta
      </button>
    </div>
  );
}
