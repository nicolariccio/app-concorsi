import { NextResponse } from "next/server";
import { origineOk } from "@/lib/auth";
import { avvisaGestore } from "@/lib/avviso";
import { aggiornaPrenotazioneSe, getChiusure, getLocale, getOrari, limitiCoperti, prenotazioniDelGiorno, trovaPrenotazionePerCodice } from "@/lib/dati";
import { modificabile } from "@/lib/modificaPrenotazione";
import { orarioDelGiorno } from "@/lib/orari";
import { validaPrenotazione } from "@/lib/prenotazione";

// Limite per indirizzo: 30 richieste all'ora.
const richieste = new Map<string, { n: number; da: number }>();
const FINESTRA_MS = 60 * 60 * 1000;

// Il cliente annulla o cambia la propria prenotazione con il link segreto (codice nell'indirizzo).
export async function POST(req: Request, { params }: { params: Promise<{ codice: string }> }) {
  if (!(await origineOk())) return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "locale";
  const t = richieste.get(ip);
  const attivo = t && Date.now() - t.da < FINESTRA_MS;
  if (attivo && t.n >= 30) return NextResponse.json({ messaggio: "Troppi tentativi, riprova più tardi" }, { status: 429 });
  richieste.set(ip, { n: attivo ? t.n + 1 : 1, da: attivo ? t.da : Date.now() });

  const { codice } = await params;
  const corpo = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (corpo.azione !== "annulla" && corpo.azione !== "modifica") return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 422 });

  try {
    const p = await trovaPrenotazionePerCodice(codice);
    if (!p) return NextResponse.json({ messaggio: "Prenotazione non trovata" }, { status: 404 });
    const [orari, locale] = await Promise.all([getOrari(), getLocale()]);
    const ok = modificabile(p, orarioDelGiorno(orari, p.data));
    if (!ok.ok) return NextResponse.json({ messaggio: ok.motivo }, { status: 409 });

    if (corpo.azione === "annulla") {
      if (!(await aggiornaPrenotazioneSe(p, { stato: "annullata" })))
        return NextResponse.json({ messaggio: "La prenotazione è appena cambiata: riprova" }, { status: 409 });
      await avvisaGestore(p, locale.nome, "annullata");
      return NextResponse.json({ ok: true, stato: "annullata" });
    }

    // Modifica: stessi controlli di una prenotazione nuova (orari, chiusure, coperti), senza contare questa stessa.
    const dataNuova = typeof corpo.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(corpo.data) ? corpo.data : p.data;
    const [chiusure, tutte, regole] = await Promise.all([getChiusure(), prenotazioniDelGiorno(dataNuova), limitiCoperti()]);
    const nuovo = { nome: p.nome, telefono: p.telefono, note: p.note, data: corpo.data ?? p.data, ora: corpo.ora ?? p.ora, persone: corpo.persone ?? p.persone };
    const esito = validaPrenotazione(nuovo, orari, new Date(), {
      chiusure,
      regole,
      prenotazioni: tutte.filter((x) => x.id !== p.id),
      copertiMax: locale.coperti_max,
    });
    if (!esito.ok) return NextResponse.json({ messaggio: "Controlla i campi", errori: esito.errori }, { status: 422 });
    const { data, ora, persone } = esito.valore;
    // Una modifica torna "in attesa": il gestore la deve confermare di nuovo.
    if (!(await aggiornaPrenotazioneSe(p, { data, ora, persone, stato: "in_attesa" })))
      return NextResponse.json({ messaggio: "La prenotazione è appena cambiata: riprova" }, { status: 409 });
    await avvisaGestore({ ...p, data, ora, persone }, locale.nome, "modificata");
    return NextResponse.json({ ok: true, stato: "in_attesa" });
  } catch {
    console.error("[prenotazione] aggiornamento non riuscito"); // nessun dato personale nei log
    return NextResponse.json({ messaggio: "Non riusciamo a salvare, riprova" }, { status: 502 });
  }
}
