import { minutiRoma, oggiRoma } from "./datetime";
import { limiteFascia, type LimiteCoperti } from "./coperti";
import { chiusuraDelGiorno, copertiInFascia, type Chiusura } from "./disponibilita";
import { fasceOrarie, minutiFascia, orarioDelGiorno } from "./orari";
import type { Orario } from "./tipi";

export const MAX_PERSONE = 10;

export type Prenotazione = {
  nome: string;
  telefono: string;
  data: string; // AAAA-MM-GG
  ora: string; // HH:MM
  persone: number;
  note: string;
};

export type Esito = { ok: true; valore: Prenotazione } | { ok: false; errori: Record<string, string> };

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const RE_TEL = /^\+?[0-9 ]{8,15}$/;

/** Dati in più per i controlli sulle chiusure straordinarie e sui coperti. */
export type Contesto = {
  chiusure?: Chiusura[];
  prenotazioni?: { data: string; ora: string; persone: number; stato: string }[];
  copertiMax?: number | null;
  regole?: LimiteCoperti[];
};

export function validaPrenotazione(input: unknown, orari: Orario[], adesso: Date = new Date(), ctx: Contesto = {}): Esito {
  const e: Record<string, string> = {};
  const r = (input ?? {}) as Record<string, unknown>;
  const nome = String(r.nome ?? "").trim();
  const telefono = String(r.telefono ?? "").trim();
  const data = String(r.data ?? "").trim();
  const ora = String(r.ora ?? "").trim();
  const persone = Number(r.persone);
  const note = String(r.note ?? "").trim().slice(0, 300);

  if (nome.length < 2 || nome.length > 60) e.nome = "Inserisci il nome";
  if (!RE_TEL.test(telefono)) e.telefono = "Numero di telefono non valido";
  if (!Number.isInteger(persone) || persone < 1 || persone > MAX_PERSONE)
    e.persone = `Da 1 a ${MAX_PERSONE} persone`;

  const dataOk = RE_DATA.test(data) && !Number.isNaN(Date.parse(data));
  if (!dataOk) e.data = "Data non valida";
  else if (data < oggiRoma(adesso)) e.data = "La data è già passata";
  else {
    const o = orarioDelGiorno(orari, data);
    if (chiusuraDelGiorno(ctx.chiusure ?? [], data)) e.data = "Quel giorno siamo chiusi";
    else if (!o || o.chiuso) e.data = "Quel giorno siamo chiusi";
    else if (!fasceOrarie(o).includes(ora)) e.ora = "Scegli un orario";
    else if (data === oggiRoma(adesso) && minutiFascia(o, ora) <= minutiRoma(adesso)) e.ora = "Quell'orario è già passato";
    else {
      const limite = limiteFascia(ctx.regole ?? [], ctx.copertiMax ?? null, o, data, ora);
      if (limite !== null && copertiInFascia(ctx.prenotazioni ?? [], data, ora) + persone > limite)
        e.ora = "Questa fascia è al completo: scegli un altro orario";
    }
  }

  if (Object.keys(e).length) return { ok: false, errori: e };
  return { ok: true, valore: { nome, telefono, data, ora, persone, note } };
}
