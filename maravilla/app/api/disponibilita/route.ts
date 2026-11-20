import { NextResponse } from "next/server";
import { disponibilita } from "@/lib/disponibilita";
import { getChiusure, getLocale, getOrari, limitiCoperti, prenotazioniDelGiorno, trovaPrenotazionePerCodice } from "@/lib/dati";
import type { LimiteCoperti } from "@/lib/coperti";

// Fasce prenotabili per una data: orari del giorno, chiusure straordinarie, fasce al completo.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const data = params.get("data") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data)))
    return NextResponse.json({ messaggio: "Data non valida" }, { status: 400 });
  let tutte;
  let regole: LimiteCoperti[];
  try {
    [tutte, regole] = await Promise.all([prenotazioniDelGiorno(data), limitiCoperti()]);
  } catch {
    return NextResponse.json({ messaggio: "Non riusciamo a controllare la disponibilità, riprova" }, { status: 502 });
  }
  const [orari, chiusure, locale] = await Promise.all([getOrari(), getChiusure(), getLocale()]);
  // Chi sta cambiando la propria prenotazione non deve "occupare" il suo stesso posto.
  const propria = params.get("escludi") ? await trovaPrenotazionePerCodice(params.get("escludi") as string).catch(() => null) : null;
  const prenotazioni = propria ? tutte.filter((x) => x.id !== propria.id) : tutte;
  return NextResponse.json(disponibilita({ orari, chiusure, prenotazioni, regole, copertiMax: locale.coperti_max, data }), {
    headers: { "Cache-Control": "no-store" },
  });
}
