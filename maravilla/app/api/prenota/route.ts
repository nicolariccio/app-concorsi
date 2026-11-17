import { NextResponse } from "next/server";
import { getOrari, inserisciPrenotazione } from "@/lib/dati";
import { validaPrenotazione } from "@/lib/prenotazione";
import { NonConfigurato } from "@/lib/store";

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 400 });
  }

  const orari = await getOrari();
  if (orari.length === 0)
    return NextResponse.json({ messaggio: "Le prenotazioni online non sono ancora attive" }, { status: 503 });

  const esito = validaPrenotazione(corpo, orari);
  if (!esito.ok) return NextResponse.json({ messaggio: "Controlla i campi", errori: esito.errori }, { status: 422 });

  try {
    await inserisciPrenotazione(esito.valore);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof NonConfigurato) return NextResponse.json({ messaggio: "Prenotazioni non ancora attive" }, { status: 503 });
    console.error("[prenota] salvataggio non riuscito"); // nessun dato personale nei log
    return NextResponse.json({ messaggio: "Non riusciamo a salvare, riprova" }, { status: 502 });
  }
}
