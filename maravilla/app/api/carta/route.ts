import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { origineOk } from "@/lib/auth";
import { creaCarta, getLocale, trovaCartaPerTelefono } from "@/lib/dati";
import { COOKIE_CARTA, fedeltaAttiva, generaCodice, validaIscrizione } from "@/lib/fedelta";

// Limite alle iscrizioni (per processo): 5 ogni ora per indirizzo.
const iscrizioni = new Map<string, { n: number; da: number }>();
const FINESTRA_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  if (!(await origineOk())) return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 403 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "locale";
  const t = iscrizioni.get(ip);
  const attivo = t && Date.now() - t.da < FINESTRA_MS;
  if (attivo && t.n >= 5) return NextResponse.json({ messaggio: "Troppi tentativi, riprova più tardi" }, { status: 429 });

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 400 });
  }

  if (!fedeltaAttiva(await getLocale())) return NextResponse.json({ messaggio: "La carta fedeltà non è ancora attiva" }, { status: 503 });
  const v = validaIscrizione(corpo);
  if (!v.ok) return NextResponse.json({ messaggio: "Controlla i campi", errori: v.errori }, { status: 422 });
  iscrizioni.set(ip, { n: attivo ? t.n + 1 : 1, da: attivo ? t.da : Date.now() });

  try {
    if (await trovaCartaPerTelefono(v.valore.telefono))
      return NextResponse.json({ messaggio: "Per questo numero esiste già una carta: chiedi al personale di inviartela." }, { status: 409 });
    const codice = generaCodice();
    await creaCarta({ codice, ...v.valore });
    (await cookies()).set(COOKIE_CARTA, codice, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return NextResponse.json({ ok: true, codice });
  } catch {
    console.error("[carta] iscrizione non riuscita"); // nessun dato personale nei log
    return NextResponse.json({ messaggio: "Non riusciamo a creare la carta, riprova" }, { status: 502 });
  }
}
