import { NOMI_GIORNI, giornoSettimana } from "./datetime";

/** Numero per wa.me: solo cifre, con prefisso del paese (senza prefisso si assume l'Italia). */
export function numeroWhatsApp(telefono: string): string | null {
  let t = telefono.replace(/[\s.\-()]/g, "");
  if (t.startsWith("+")) t = t.slice(1);
  else if (t.startsWith("00")) t = t.slice(2);
  else if (/^[03]/.test(t)) t = "39" + t; // numero italiano senza prefisso
  return /^\d{8,15}$/.test(t) ? t : null;
}

export function dataEstesa(data: string): string {
  const [, m, g] = data.split("-");
  const mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  return `${NOMI_GIORNI[giornoSettimana(data)].toLowerCase()} ${Number(g)} ${mesi[Number(m) - 1]}`;
}

export function messaggioConferma(p: { nome: string; data: string; ora: string; persone: number }, locale: string): string {
  const persone = p.persone === 1 ? "1 persona" : `${p.persone} persone`;
  return `Ciao ${p.nome}, la tua prenotazione da ${locale} per ${dataEstesa(p.data)} alle ${p.ora}, ${persone}, è confermata. A presto!`;
}

/** Link che apre WhatsApp con il messaggio già scritto; null se il numero non è valido. */
export function linkWhatsApp(p: { nome: string; telefono: string; data: string; ora: string; persone: number }, locale: string): string | null {
  const n = numeroWhatsApp(p.telefono);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(messaggioConferma(p, locale))}` : null;
}
