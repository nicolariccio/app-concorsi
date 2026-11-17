// Le date del locale sono sempre quelle di Roma, anche se il server gira in UTC.
const TZ = "Europe/Rome";

function parti(adesso: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(adesso)) o[p.type] = p.value;
  return o;
}

export function oggiRoma(adesso: Date = new Date()): string {
  const p = parti(adesso);
  return `${p.year}-${p.month}-${p.day}`;
}

export function minutiRoma(adesso: Date = new Date()): number {
  const p = parti(adesso);
  return Number(p.hour) * 60 + Number(p.minute);
}

/** 0 = lunedì … 6 = domenica, da una data AAAA-MM-GG. */
export function giornoSettimana(data: string): number {
  const [y, m, d] = data.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export const NOMI_GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
