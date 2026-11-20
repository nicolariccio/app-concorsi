import { giornoSettimana } from "./datetime";
import { fasceOrarie, minuti, minutiFascia } from "./orari";
import type { Orario } from "./tipi";

export type LimiteCoperti = { id: string; giorni: number[]; ora_da: string | null; ora_a: string | null; max_coperti: number };

/** La regola riguarda questa data e questa fascia? */
export function regolaVale(r: LimiteCoperti, orario: Orario | undefined, data: string, ora: string): boolean {
  if (r.giorni.length > 0 && !r.giorni.includes(giornoSettimana(data))) return false;
  if (r.ora_da && r.ora_a) {
    // gli orari dopo la mezzanotte contano come "più tardi" dell'apertura (es. 00:30 dopo le 23:30)
    const base = orario ? minuti(orario.apertura) : 0;
    const adatta = (h: string) => (minuti(h) < base ? minuti(h) + 1440 : minuti(h));
    const slot = orario ? minutiFascia(orario, ora) : minuti(ora);
    const da = adatta(r.ora_da);
    let a = adatta(r.ora_a);
    if (a < da) a += 1440;
    return slot >= da && slot <= a;
  }
  return true;
}

const specificita = (r: LimiteCoperti) => (r.giorni.length > 0 ? 2 : 0) + (r.ora_da ? 1 : 0);

/**
 * Limite di coperti per una fascia: null = nessun limite.
 * Vince la regola più specifica (giorno + orario, poi solo giorno, poi solo orario, poi "tutti"); a parità il limite più basso.
 * Se nessuna regola vale, si usa il limite generale.
 */
export function limiteFascia(regole: LimiteCoperti[], generale: number | null, orario: Orario | undefined, data: string, ora: string): number | null {
  const valide = regole.filter((r) => regolaVale(r, orario, data, ora));
  if (valide.length === 0) return generale;
  const migliore = Math.max(...valide.map(specificita));
  return Math.min(...valide.filter((r) => specificita(r) === migliore).map((r) => r.max_coperti));
}

export type TrattoLimite = { da: string; a: string; limite: number | null };

/** Il limite di ogni fascia del giorno, con le fasce vicine dallo stesso limite unite (per mostrarlo al gestore). */
export function riassuntoGiorno(regole: LimiteCoperti[], generale: number | null, orario: Orario | undefined, data: string): TrattoLimite[] {
  const tratti: TrattoLimite[] = [];
  for (const ora of fasceOrarie(orario)) {
    const limite = limiteFascia(regole, generale, orario, data, ora);
    const ultimo = tratti.at(-1);
    if (ultimo && ultimo.limite === limite) ultimo.a = ora;
    else tratti.push({ da: ora, a: ora, limite });
  }
  return tratti;
}

export function testoLimite(l: number | null): string {
  return l === null ? "nessun limite" : l === 0 ? "nessuna prenotazione online" : `${l} coperti`;
}
