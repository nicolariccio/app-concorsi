import { giornoSettimana, oggiRoma } from "./datetime";
import type { CartaFedelta } from "./tipi";

type Pren = { data: string; ora: string; persone: number; stato: string };

/** Aggiunge (o toglie) giorni a una data AAAA-MM-GG. */
export function addGiorni(data: string, n: number): string {
  const [y, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Gli ultimi `giorni` giorni, oggi compreso. */
export function ultimiGiorni(oggi: string, giorni: number): { da: string; a: string } {
  return { da: addGiorni(oggi, -(giorni - 1)), a: oggi };
}

export type StatPrenotazioni = {
  prenotazioni: number;
  coperti: number;
  mediaPersone: number;
  annullate: number;
  percentualeAnnullate: number;
  inAttesa: number;
  perGiornoSettimana: number[]; // coperti, 0 = lunedì … 6 = domenica
  perOra: { ora: string; coperti: number }[];
  perGiorno: { data: string; coperti: number }[];
};

/** Statistiche sulle prenotazioni con data tra `da` e `a`. Le annullate non contano nei coperti. */
export function statPrenotazioni(righe: Pren[], da: string, a: string): StatPrenotazioni {
  const nelPeriodo = righe.filter((r) => r.data >= da && r.data <= a);
  const valide = nelPeriodo.filter((r) => r.stato !== "annullata");
  const annullate = nelPeriodo.length - valide.length;
  const coperti = valide.reduce((s, r) => s + r.persone, 0);

  const perGiornoSettimana = [0, 0, 0, 0, 0, 0, 0];
  const perOraMappa = new Map<string, number>();
  const perGiornoMappa = new Map<string, number>();
  for (const r of valide) {
    perGiornoSettimana[giornoSettimana(r.data)] += r.persone;
    perOraMappa.set(r.ora, (perOraMappa.get(r.ora) ?? 0) + r.persone);
    perGiornoMappa.set(r.data, (perGiornoMappa.get(r.data) ?? 0) + r.persone);
  }

  // Ogni giorno del periodo compare, anche con zero coperti.
  const perGiorno: { data: string; coperti: number }[] = [];
  for (let d = da; d <= a; d = addGiorni(d, 1)) perGiorno.push({ data: d, coperti: perGiornoMappa.get(d) ?? 0 });

  return {
    prenotazioni: valide.length,
    coperti,
    mediaPersone: valide.length ? Math.round((coperti / valide.length) * 10) / 10 : 0,
    annullate,
    percentualeAnnullate: nelPeriodo.length ? Math.round((annullate / nelPeriodo.length) * 100) : 0,
    inAttesa: valide.filter((r) => r.stato === "in_attesa").length,
    perGiornoSettimana,
    perOra: [...perOraMappa].map(([ora, c]) => ({ ora, coperti: c })).sort((x, y) => x.ora.localeCompare(y.ora)),
    perGiorno,
  };
}

/** I prossimi `n` giorni a partire da oggi, con prenotazioni e coperti. */
export function prossimiGiorni(righe: Pren[], oggi: string, n = 7): { data: string; prenotazioni: number; coperti: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const data = addGiorni(oggi, i);
    const del = righe.filter((r) => r.data === data && r.stato !== "annullata");
    return { data, prenotazioni: del.length, coperti: del.reduce((s, r) => s + r.persone, 0) };
  });
}

export type StatCarte = { totali: number; nuove: number; premiRiscattati: number; timbriInCircolazione: number };

/** Carte create tra `da` e `a` (date AAAA-MM-GG, fuso di Roma già applicato da chi chiama). */
export function statCarte(carte: Pick<CartaFedelta, "creata_il" | "timbri" | "premi">[], da: string, a: string): StatCarte {
  const giornoRoma = (iso: string) => oggiRoma(new Date(iso));
  return {
    totali: carte.length,
    nuove: carte.filter((c) => giornoRoma(c.creata_il) >= da && giornoRoma(c.creata_il) <= a).length,
    premiRiscattati: carte.reduce((s, c) => s + c.premi, 0),
    timbriInCircolazione: carte.reduce((s, c) => s + c.timbri, 0),
  };
}
