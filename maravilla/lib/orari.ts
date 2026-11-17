import { giornoSettimana } from "./datetime";
import type { Orario } from "./tipi";

const RE_ORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function oraValida(s: string): boolean {
  return RE_ORA.test(s);
}

export function minuti(ora: string): number {
  const [h, m] = ora.split(":").map(Number);
  return h * 60 + m;
}

function formatta(totMinuti: number): string {
  const t = totMinuti % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Fasce prenotabili: ogni `passo` minuti, dall'apertura fino a `margine` minuti prima della chiusura. */
export function fasceOrarie(o: Orario | undefined, passo = 30, margine = 60): string[] {
  if (!o || o.chiuso || !oraValida(o.apertura) || !oraValida(o.chiusura)) return [];
  const a = minuti(o.apertura);
  let c = minuti(o.chiusura);
  if (c <= a) c += 1440; // chiude dopo la mezzanotte
  const fasce: string[] = [];
  for (let t = a; t <= c - margine; t += passo) fasce.push(formatta(t));
  return fasce;
}

export function orarioDelGiorno(orari: Orario[], data: string): Orario | undefined {
  const g = giornoSettimana(data);
  return orari.find((o) => o.giorno === g);
}

/** Minuti dall'inizio del giorno di apertura (una fascia dopo la mezzanotte supera 1440). */
export function minutiFascia(o: Orario, ora: string): number {
  const m = minuti(ora);
  return m < minuti(o.apertura) ? m + 1440 : m;
}

export function testoOrario(o: Orario | undefined): string {
  if (!o) return "";
  return o.chiuso ? "Chiuso" : `${o.apertura} – ${o.chiusura}`;
}
