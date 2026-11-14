import { locale } from "./locale";

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

export function oggi(adesso: Date = new Date()): string {
  const m = String(adesso.getMonth() + 1).padStart(2, "0");
  const g = String(adesso.getDate()).padStart(2, "0");
  return `${adesso.getFullYear()}-${m}-${g}`;
}

export function validaPrenotazione(input: unknown, adesso: Date = new Date()): Esito {
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
  if (!RE_DATA.test(data) || Number.isNaN(Date.parse(data))) e.data = "Data non valida";
  else if (data < oggi(adesso)) e.data = "La data è già passata";
  if (!locale.fasceOrarie.includes(ora)) e.ora = "Scegli un orario";
  if (!Number.isInteger(persone) || persone < 1 || persone > locale.maxPersone)
    e.persone = `Da 1 a ${locale.maxPersone} persone`;

  if (Object.keys(e).length) return { ok: false, errori: e };
  return { ok: true, valore: { nome, telefono, data, ora, persone, note } };
}
