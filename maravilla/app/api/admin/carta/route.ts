import { NextResponse } from "next/server";
import { isAdmin, origineOk } from "@/lib/auth";
import { aggiornaCartaSe, eliminaCarta, getLocale, trovaCartaPerId } from "@/lib/dati";
import { applicaAzione, fedeltaAttiva, type Azione } from "@/lib/fedelta";

const UUID = /^[0-9a-f-]{36}$/i;

async function controlli(): Promise<NextResponse | null> {
  if (!(await isAdmin())) return NextResponse.json({ messaggio: "Accesso richiesto" }, { status: 401 });
  if (!(await origineOk())) return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 403 });
  return null;
}

// Aggiungere o togliere un timbro e riscattare il premio: solo il personale, mai con il solo codice della carta.
export async function POST(req: Request) {
  const bloccato = await controlli();
  if (bloccato) return bloccato;
  const c = (await req.json().catch(() => ({}))) as { id?: unknown; azione?: unknown };
  const id = String(c.id ?? "");
  if (!UUID.test(id) || !["timbro", "storno", "premio"].includes(String(c.azione)))
    return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 422 });

  try {
    const locale = await getLocale();
    if (!fedeltaAttiva(locale)) return NextResponse.json({ messaggio: "La carta fedeltà non è attiva" }, { status: 409 });
    const carta = await trovaCartaPerId(id);
    if (!carta) return NextResponse.json({ messaggio: "Carta non trovata" }, { status: 404 });
    const esito = applicaAzione(carta, c.azione as Azione, locale.fedelta_timbri as number);
    if (!esito.ok) return NextResponse.json({ messaggio: esito.messaggio }, { status: 409 });
    if (!(await aggiornaCartaSe(carta, esito.modifiche)))
      return NextResponse.json({ messaggio: "La carta è appena cambiata: riprova" }, { status: 409 });
    return NextResponse.json({ ok: true, ...esito.modifiche });
  } catch {
    console.error("[carta] aggiornamento non riuscito");
    return NextResponse.json({ messaggio: "Non riusciamo a salvare, riprova" }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const bloccato = await controlli();
  if (bloccato) return bloccato;
  const id = String(((await req.json().catch(() => ({}))) as { id?: unknown }).id ?? "");
  if (!UUID.test(id)) return NextResponse.json({ messaggio: "Id non valido" }, { status: 422 });
  try {
    await eliminaCarta(id);
    return NextResponse.json({ ok: true });
  } catch {
    console.error("[carta] eliminazione non riuscita");
    return NextResponse.json({ messaggio: "Non riusciamo a eliminare, riprova" }, { status: 502 });
  }
}
