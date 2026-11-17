import { minutiRoma, oggiRoma } from "./datetime";
import { minutiFascia } from "./orari";
import type { Orario } from "./tipi";

/** Il cliente può cambiare o annullare da solo fino a questo numero di ore prima. */
export const ORE_LIMITE = 3;

function giorniTra(da: string, a: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(a) - t(da)) / 86400000);
}

/** Minuti da adesso all'ora della prenotazione (negativi se è già passata). */
export function minutiAllaPrenotazione(data: string, ora: string, orario: Orario | undefined, adesso: Date): number {
  const [h, m] = ora.split(":").map(Number);
  // una fascia dopo la mezzanotte appartiene al giorno di apertura: conta come "il giorno dopo"
  const minutiSlot = orario ? minutiFascia(orario, ora) : h * 60 + m;
  return giorniTra(oggiRoma(adesso), data) * 1440 + minutiSlot - minutiRoma(adesso);
}

export function modificabile(
  p: { data: string; ora: string; stato: string },
  orario: Orario | undefined,
  adesso: Date = new Date(),
): { ok: true } | { ok: false; motivo: string } {
  if (p.stato === "annullata") return { ok: false, motivo: "La prenotazione è già annullata." };
  if (minutiAllaPrenotazione(p.data, p.ora, orario, adesso) < ORE_LIMITE * 60)
    return { ok: false, motivo: `Si può cambiare o annullare fino a ${ORE_LIMITE} ore prima. Chiamaci per modifiche dell'ultimo momento.` };
  return { ok: true };
}
