import { NextResponse } from "next/server";
import { accedi, adminConfigurato, origineOk } from "@/lib/auth";

// Limite ai tentativi (per processo): 5 errori ogni 15 minuti per indirizzo.
const tentativi = new Map<string, { n: number; da: number }>();
const FINESTRA_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  if (!(await origineOk())) return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 403 });
  if (!adminConfigurato()) return NextResponse.json({ messaggio: "Accesso non configurato" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "locale";
  const t = tentativi.get(ip);
  if (t && Date.now() - t.da < FINESTRA_MS && t.n >= 5)
    return NextResponse.json({ messaggio: "Troppi tentativi, riprova tra qualche minuto" }, { status: 429 });

  let password = "";
  try {
    password = String(((await req.json()) as { password?: unknown }).password ?? "");
  } catch {
    return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 400 });
  }

  if (!(await accedi(password))) {
    const ancoraValido = t && Date.now() - t.da < FINESTRA_MS;
    tentativi.set(ip, { n: ancoraValido ? t.n + 1 : 1, da: ancoraValido ? t.da : Date.now() });
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ messaggio: "Password errata" }, { status: 401 });
  }
  tentativi.delete(ip);
  return NextResponse.json({ ok: true });
}
