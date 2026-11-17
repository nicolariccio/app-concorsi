import { NextResponse } from "next/server";
import { disponibilita } from "@/lib/disponibilita";
import { getChiusure, getLocale, getOrari, getPrenotazioni } from "@/lib/dati";

// Fasce prenotabili per una data: orari del giorno, chiusure straordinarie, fasce al completo.
export async function GET(req: Request) {
  const data = new URL(req.url).searchParams.get("data") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data)))
    return NextResponse.json({ messaggio: "Data non valida" }, { status: 400 });
  const [orari, chiusure, prenotazioni, locale] = await Promise.all([getOrari(), getChiusure(), getPrenotazioni(), getLocale()]);
  return NextResponse.json(disponibilita({ orari, chiusure, prenotazioni, copertiMax: locale.coperti_max, data }), {
    headers: { "Cache-Control": "no-store" },
  });
}
