/** "9,50" o "9.50" → 950 centesimi. Vuoto → null. Valore non valido → undefined. */
export function parsePrezzo(testo: string): number | null | undefined {
  const t = testo.trim().replace("€", "").trim();
  if (t === "") return null;
  if (!/^\d{1,4}([.,]\d{1,2})?$/.test(t)) return undefined;
  const [intero, dec = ""] = t.replace(",", ".").split(".");
  return Number(intero) * 100 + Number(dec.padEnd(2, "0"));
}

export function formattaPrezzo(cent: number | null | undefined): string {
  if (cent == null) return "";
  const euro = Math.floor(cent / 100);
  const c = cent % 100;
  return `${euro},${String(c).padStart(2, "0")} €`;
}

/** Per i campi di modifica: 950 → "9,50". */
export function prezzoPerCampo(cent: number | null | undefined): string {
  return cent == null ? "" : formattaPrezzo(cent).replace(" €", "");
}
