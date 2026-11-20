import { NextResponse } from "next/server";
import { isAdmin, origineOk } from "@/lib/auth";
import { aggiornaStato, eliminaRiga, nuovoId, salvaRighe } from "@/lib/dati";
import { NonConfigurato } from "@/lib/store";
import {
  validaCategoria,
  validaChiusura,
  validaEvento,
  validaLimite,
  validaLocale,
  validaOrari,
  validaPiatto,
  validaStato,
  type Risultato,
} from "@/lib/validazione";

type Obj = Record<string, unknown>;

// Per ogni risorsa: come si valida e dove si salva.
const SALVABILI: Record<string, { tabella: string; chiave: string; valida: (x: unknown) => Risultato<Obj | Obj[]>; nuovoId: boolean }> = {
  locale: { tabella: "locale", chiave: "id", valida: validaLocale, nuovoId: false },
  orari: { tabella: "orari", chiave: "giorno", valida: validaOrari, nuovoId: false },
  categorie: { tabella: "categorie_menu", chiave: "id", valida: validaCategoria, nuovoId: true },
  piatti: { tabella: "piatti", chiave: "id", valida: validaPiatto, nuovoId: true },
  eventi: { tabella: "eventi", chiave: "id", valida: validaEvento, nuovoId: true },
  chiusure: { tabella: "chiusure", chiave: "id", valida: validaChiusura, nuovoId: true },
  limiti: { tabella: "limiti_coperti", chiave: "id", valida: validaLimite, nuovoId: true },
};
const ELIMINABILI: Record<string, string> = { categorie: "categorie_menu", piatti: "piatti", eventi: "eventi", chiusure: "chiusure", limiti: "limiti_coperti" };

async function controlli(): Promise<NextResponse | null> {
  if (!(await isAdmin())) return NextResponse.json({ messaggio: "Accesso richiesto" }, { status: 401 });
  if (!(await origineOk())) return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 403 });
  return null;
}

function erroreServer(e: unknown) {
  if (e instanceof NonConfigurato) return NextResponse.json({ messaggio: "Database non configurato" }, { status: 503 });
  console.error("[admin] scrittura non riuscita");
  return NextResponse.json({ messaggio: "Non riusciamo a salvare, riprova" }, { status: 502 });
}

export async function POST(req: Request, { params }: { params: Promise<{ risorsa: string }> }) {
  const bloccato = await controlli();
  if (bloccato) return bloccato;
  const { risorsa } = await params;

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 400 });
  }

  try {
    if (risorsa === "prenotazioni") {
      const v = validaStato(corpo);
      if (!v.ok) return NextResponse.json({ messaggio: "Dati non validi", errori: v.errori }, { status: 422 });
      await aggiornaStato(v.valore.id, v.valore.stato);
      return NextResponse.json({ ok: true });
    }

    const def = SALVABILI[risorsa];
    if (!def) return NextResponse.json({ messaggio: "Risorsa sconosciuta" }, { status: 404 });

    // Si può inviare un elemento o una lista (per riordinare più righe insieme).
    const elementi = Array.isArray(corpo) && risorsa !== "orari" ? corpo : [corpo];
    if (elementi.length > 100) return NextResponse.json({ messaggio: "Troppe righe" }, { status: 422 });
    const righe: Obj[] = [];
    for (const el of elementi) {
      const v = def.valida(el);
      if (!v.ok) return NextResponse.json({ messaggio: "Dati non validi", errori: v.errori }, { status: 422 });
      for (const r of Array.isArray(v.valore) ? v.valore : [v.valore]) {
        righe.push(def.nuovoId && !r.id ? { ...r, id: nuovoId() } : r);
      }
    }
    await salvaRighe(def.tabella, righe, def.chiave);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroreServer(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ risorsa: string }> }) {
  const bloccato = await controlli();
  if (bloccato) return bloccato;
  const { risorsa } = await params;
  const tabella = ELIMINABILI[risorsa];
  if (!tabella) return NextResponse.json({ messaggio: "Risorsa sconosciuta" }, { status: 404 });
  const id = String(((await req.json().catch(() => ({}))) as { id?: unknown }).id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ messaggio: "Id non valido" }, { status: 422 });
  try {
    await eliminaRiga(tabella, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroreServer(e);
  }
}
