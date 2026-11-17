import { NextResponse } from "next/server";
import { avvisaGestore } from "@/lib/avviso";
import { getChiusure, getLocale, getOrari, getPrenotazioni, inserisciPrenotazione } from "@/lib/dati";
import { validaPrenotazione } from "@/lib/prenotazione";
import { NonConfigurato } from "@/lib/store";

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 400 });
  }

  const [orari, chiusure, prenotazioni, locale] = await Promise.all([getOrari(), getChiusure(), getPrenotazioni(), getLocale()]);
  if (orari.length === 0)
    return NextResponse.json({ messaggio: "Le prenotazioni online non sono ancora attive" }, { status: 503 });

  const esito = validaPrenotazione(corpo, orari, new Date(), { chiusure, prenotazioni, copertiMax: locale.coperti_max });
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
