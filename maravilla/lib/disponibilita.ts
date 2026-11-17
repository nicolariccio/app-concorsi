import { minutiRoma, oggiRoma } from "./datetime";
import { fasceOrarie, minutiFascia, orarioDelGiorno } from "./orari";
import type { Orario } from "./tipi";

export type Chiusura = { id: string; dal: string; al: string; motivo: string };
type Occupazione = { data: string; ora: string; persone: number; stato: string };

export function chiusuraDelGiorno(chiusure: Chiusura[], data: string): Chiusura | undefined {
  return chiusure.find((c) => c.dal <= data && data <= c.al);
}

/** Coperti già prenotati in una fascia (le prenotazioni annullate non contano). */
export function copertiInFascia(prenotazioni: Occupazione[], data: string, ora: string): number {
  return prenotazioni
    .filter((p) => p.data === data && p.ora === ora && p.stato !== "annullata")
    .reduce((somma, p) => somma + p.persone, 0);
}

export type Disponibilita = { chiuso: boolean; motivo: string; fasce: { ora: string; libera: boolean }[] };

export function disponibilita(p: {
  orari: Orario[];
  chiusure: Chiusura[];
  prenotazioni: Occupazione[];
  copertiMax: number | null;
  data: string;
  adesso?: Date;
}): Disponibilita {
  const adesso = p.adesso ?? new Date();
  const chiusura = chiusuraDelGiorno(p.chiusure, p.data);
  if (chiusura) return { chiuso: true, motivo: chiusura.motivo, fasce: [] };
  const o = orarioDelGiorno(p.orari, p.data);
  if (!o || o.chiuso) return { chiuso: true, motivo: "", fasce: [] };
  const oggi = p.data === oggiRoma(adesso);
  const fasce = fasceOrarie(o)
    .filter((ora) => !oggi || minutiFascia(o, ora) > minutiRoma(adesso))
    .map((ora) => ({ ora, libera: p.copertiMax == null || copertiInFascia(p.prenotazioni, p.data, ora) < p.copertiMax }));
  return { chiuso: false, motivo: "", fasce };
}
