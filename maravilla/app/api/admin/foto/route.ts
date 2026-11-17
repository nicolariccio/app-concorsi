import { NextResponse } from "next/server";
import { isAdmin, origineOk } from "@/lib/auth";
import { eJpeg, MAX_BYTE, salvaFoto } from "@/lib/foto";
import { urlFoto } from "@/lib/fotoUrl";
import { NonConfigurato } from "@/lib/store";

// Riceve una foto JPEG (già ridimensionata dal browser) e la salva nello Storage.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ messaggio: "Accesso richiesto" }, { status: 401 });
  if (!(await origineOk())) return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 403 });

  const dichiarata = Number(req.headers.get("content-length") ?? 0);
  if (dichiarata > MAX_BYTE + 1024) return NextResponse.json({ messaggio: "Foto troppo grande" }, { status: 413 });
  const dati = Buffer.from(await req.arrayBuffer());
  if (dati.length > MAX_BYTE) return NextResponse.json({ messaggio: "Foto troppo grande" }, { status: 413 });
  if (!eJpeg(dati)) return NextResponse.json({ messaggio: "Formato non valido" }, { status: 415 });

  try {
    const percorso = await salvaFoto(dati);
    return NextResponse.json({ ok: true, percorso, url: urlFoto(percorso) });
  } catch (e) {
    if (e instanceof NonConfigurato) return NextResponse.json({ messaggio: "Archivio foto non configurato" }, { status: 503 });
    console.error("[foto] salvataggio non riuscito");
    return NextResponse.json({ messaggio: "Non riusciamo a salvare la foto, riprova" }, { status: 502 });
  }
}
