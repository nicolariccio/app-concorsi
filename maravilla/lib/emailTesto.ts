import { dataEstesa } from "./whatsapp";

type Pren = { nome: string; telefono: string; data: string; ora: string; persone: number; note: string };
export type TipoAvviso = "nuova" | "modificata" | "annullata";

const TITOLI: Record<TipoAvviso, string> = {
  nuova: "Nuova richiesta di prenotazione",
  modificata: "Prenotazione MODIFICATA dal cliente",
  annullata: "Prenotazione ANNULLATA dal cliente",
};
const CODA: Record<TipoAvviso, string> = {
  nuova: "Aprila nel pannello per confermarla.",
  modificata: "È tornata in attesa: aprila nel pannello per confermarla di nuovo.",
  annullata: "Il tavolo è di nuovo libero.",
};

/** Contenuto dell'email al gestore. */
export function emailPrenotazione(tipo: TipoAvviso, p: Pren, locale: string) {
  const righe = [
    `${TITOLI[tipo]} per ${locale}.`,
    "",
    `Quando: ${dataEstesa(p.data)} alle ${p.ora}`,
    `Persone: ${p.persone}`,
    `Nome: ${p.nome}`,
    `Telefono: ${p.telefono}`,
    ...(p.note ? [`Note: ${p.note}`] : []),
    "",
    CODA[tipo],
  ];
  const prefisso = tipo === "nuova" ? "Prenotazione" : tipo === "modificata" ? "Modificata" : "Annullata";
  return { subject: `${prefisso}: ${dataEstesa(p.data)} ${p.ora}, ${p.persone} persone`, text: righe.join("\n") };
}

export const emailNuovaPrenotazione = (p: Pren, locale: string) => emailPrenotazione("nuova", p, locale);
