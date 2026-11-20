import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { COLONNE_CARTE, COLONNE_PRENOTAZIONI, creaCsv } from "@/lib/csv";
import { esportaTabella, esportaTutto } from "@/lib/dati";
import { oggiRoma } from "@/lib/datetime";

export const dynamic = "force-dynamic";

// Scarica una copia dei dati. Solo per chi ha l'accesso admin: contiene nomi e telefoni dei clienti.
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ messaggio: "Accesso richiesto" }, { status: 401 });
  const formato = new URL(req.url).searchParams.get("formato") ?? "json";
  const giorno = oggiRoma();
  const intestazioni = (nome: string, tipo: string) => ({
    "Content-Type": `${tipo}; charset=utf-8`,
    "Content-Disposition": `attachment; filename="${nome}"`,
    "Cache-Control": "no-store",
  });

  try {
    if (formato === "json") {
      const corpo = JSON.stringify({ creata_il: new Date().toISOString(), tabelle: await esportaTutto() }, null, 2);
      return new NextResponse(corpo, { headers: intestazioni(`maravilla-copia-${giorno}.json`, "application/json") });
    }
    if (formato === "prenotazioni" || formato === "carte") {
      const prenotazioni = formato === "prenotazioni";
      const righe = await esportaTabella(prenotazioni ? "prenotazioni" : "carte_fedelta");
      if (prenotazioni) righe.sort((a, b) => `${b.data}${b.ora}`.localeCompare(`${a.data}${a.ora}`));
      return new NextResponse(creaCsv(prenotazioni ? COLONNE_PRENOTAZIONI : COLONNE_CARTE, righe), {
        headers: intestazioni(`maravilla-${formato}-${giorno}.csv`, "text/csv"),
      });
    }
    return NextResponse.json({ messaggio: "Formato sconosciuto" }, { status: 400 });
  } catch {
    console.error("[backup] lettura non riuscita");
    return NextResponse.json({ messaggio: "Non riusciamo a leggere i dati, riprova" }, { status: 502 });
  }
}
