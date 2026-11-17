"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { chiamaAdmin, type EsitoApi } from "@/lib/clientApi";

/** Esegue una chiamata admin, mostra l'esito e ricarica i dati della pagina. */
export function useAzione() {
  const router = useRouter();
  const [occupato, setOccupato] = useState(false);
  const [messaggio, setMessaggio] = useState("");
  const [errori, setErrori] = useState<Record<string, string>>({});

  async function esegui(metodo: "POST" | "DELETE", risorsa: string, corpo: unknown, ok = "Salvato"): Promise<EsitoApi> {
    setOccupato(true);
    setErrori({});
    setMessaggio("");
    const esito = await chiamaAdmin(metodo, risorsa, corpo);
    setOccupato(false);
    setErrori(esito.errori);
    const testo = esito.ok ? ok : esito.messaggio || "Errore";
    setMessaggio(testo);
    // L'avviso vive fuori dal modulo: dopo il salvataggio la pagina si ricarica e il modulo può sparire.
    window.dispatchEvent(new CustomEvent("avviso", { detail: { testo, ok: esito.ok } }));
    if (esito.ok) router.refresh();
    return esito;
  }

  return { occupato, errori, esegui };
}
