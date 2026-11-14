import { NextResponse } from "next/server";
import { validaPrenotazione } from "@/lib/prenotazione";

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 400 });
  }

  const esito = validaPrenotazione(corpo);
  if (!esito.ok) {
    return NextResponse.json({ messaggio: "Controlla i campi", errori: esito.errori }, { status: 422 });
  }

  const url = process.env.SUPABASE_URL;
  const chiave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chiave) {
    // Senza database le prenotazioni non vengono salvate: ok solo in sviluppo.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ messaggio: "Prenotazioni non ancora attive" }, { status: 503 });
    }
    console.warn("[prenota] database non configurato: prenotazione NON salvata");
    return NextResponse.json({ ok: true });
  }

  const res = await fetch(`${url}/rest/v1/prenotazioni`, {
    method: "POST",
    headers: {
      apikey: chiave,
      Authorization: `Bearer ${chiave}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(esito.valore),
  });
  if (!res.ok) {
    console.error("[prenota] errore database", res.status);
    return NextResponse.json({ messaggio: "Non riusciamo a salvare, riprova" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
