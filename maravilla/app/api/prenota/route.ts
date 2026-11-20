import { NextResponse } from "next/server";
import { avvisaGestore } from "@/lib/avviso";
import { getChiusure, getLocale, getOrari, inserisciPrenotazione, limitiCoperti, prenotazioniDelGiorno } from "@/lib/dati";
import type { LimiteCoperti } from "@/lib/coperti";
import { validaPrenotazione } from "@/lib/prenotazione";
import { NonConfigurato } from "@/lib/store";

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 400 });
  }

  const dataRichiesta = typeof (corpo as { data?: unknown })?.data === "string" ? ((corpo as { data: string }).data) : "";
  let prenotazioni: Awaited<ReturnType<typeof prenotazioniDelGiorno>> = [];
  let regole: LimiteCoperti[] = [];
  const [orari, chiusure, locale] = await Promise.all([getOrari(), getChiusure(), getLocale()]);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataRichiesta)) {
    try {
      [prenotazioni, regole] = await Promise.all([prenotazioniDelGiorno(dataRichiesta), limitiCoperti()]);
    } catch {
      // Senza sapere chi ha già prenotato non si può rispettare il limite di coperti.
      return NextResponse.json({ messaggio: "Non riusciamo a controllare la disponibilità, riprova" }, { status: 502 });
    }
  }
  if (orari.length === 0)
    return NextResponse.json({ messaggio: "Le prenotazioni online non sono ancora attive" }, { status: 503 });

  const esito = validaPrenotazione(corpo, orari, new Date(), { chiusure, prenotazioni, regole, copertiMax: locale.coperti_max });
  if (!esito.ok) return NextResponse.json({ messaggio: "Controlla i campi", errori: esito.errori }, { status: 422 });

  let codice = "";
  try {
    codice = await inserisciPrenotazione(esito.valore);
  } catch (e) {
    if (e instanceof NonConfigurato) return NextResponse.json({ messaggio: "Prenotazioni non ancora attive" }, { status: 503 });
    console.error("[prenota] salvataggio non riuscito"); // nessun dato personale nei log
    return NextResponse.json({ messaggio: "Non riusciamo a salvare, riprova" }, { status: 502 });
  }
  await avvisaGestore(esito.valore, locale.nome); // se l'email non parte la prenotazione resta valida
  return NextResponse.json({ ok: true, codice });
}
