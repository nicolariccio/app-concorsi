import { dataEstesa } from "./whatsapp";

type Pren = { nome: string; telefono: string; data: string; ora: string; persone: number; note: string };

/** Contenuto dell'email al gestore. */
export function emailNuovaPrenotazione(p: Pren, locale: string) {
  const righe = [
    `Nuova richiesta di prenotazione per ${locale}.`,
    "",
    `Quando: ${dataEstesa(p.data)} alle ${p.ora}`,
    `Persone: ${p.persone}`,
    `Nome: ${p.nome}`,
    `Telefono: ${p.telefono}`,
    ...(p.note ? [`Note: ${p.note}`] : []),
    "",
    "Aprila nel pannello per confermarla.",
  ];
  return { subject: `Prenotazione: ${dataEstesa(p.data)} ${p.ora}, ${p.persone} persone`, text: righe.join("\n") };
}
