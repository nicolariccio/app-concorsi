/** Una cella del CSV: tra virgolette se serve, e protetta dalle formule di Excel (=, +, -, @). */
export function cella(valore: unknown): string {
  let t = valore === null || valore === undefined ? "" : Array.isArray(valore) ? valore.join("; ") : String(valore);
  // Un testo che inizia con = + - @ verrebbe eseguito come formula da Excel: lo si rende un semplice testo.
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[",;\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

/** CSV con separatore ";" (così si apre bene in Excel in italiano) e BOM per gli accenti. */
export function creaCsv(colonne: { chiave: string; titolo: string }[], righe: Record<string, unknown>[]): string {
  const intestazione = colonne.map((c) => cella(c.titolo)).join(";");
  const corpo = righe.map((r) => colonne.map((c) => cella(r[c.chiave])).join(";"));
  return "﻿" + [intestazione, ...corpo].join("\r\n") + "\r\n";
}

export const COLONNE_PRENOTAZIONI = [
  { chiave: "data", titolo: "Data" },
  { chiave: "ora", titolo: "Ora" },
  { chiave: "persone", titolo: "Persone" },
  { chiave: "nome", titolo: "Nome" },
  { chiave: "telefono", titolo: "Telefono" },
  { chiave: "stato", titolo: "Stato" },
  { chiave: "note", titolo: "Note" },
  { chiave: "creata_il", titolo: "Creata il" },
];

export const COLONNE_CARTE = [
  { chiave: "nome", titolo: "Nome" },
  { chiave: "telefono", titolo: "Telefono" },
  { chiave: "timbri", titolo: "Timbri" },
  { chiave: "premi", titolo: "Premi riscattati" },
  { chiave: "consenso_il", titolo: "Consenso dato il" },
  { chiave: "creata_il", titolo: "Creata il" },
];
