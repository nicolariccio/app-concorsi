import "server-only";
import { randomUUID } from "node:crypto";
import { NonConfigurato, store, type Riga } from "./store";
import type { Categoria, Evento, Locale, Orario, Piatto, PrenotazioneRiga } from "./tipi";

const porOrdine = <T extends { ordine: number }>(a: T[]) => [...a].sort((x, y) => x.ordine - y.ordine);

/** Per le pagine pubbliche: se il database non c'è, la pagina resta vuota invece di rompersi. */
async function oVuoto<T>(f: () => Promise<T>, vuoto: T): Promise<T> {
  try {
    return await f();
  } catch (e) {
    if (e instanceof NonConfigurato) return vuoto;
    console.error("[dati] lettura non riuscita"); // nessun dato personale nei log
    return vuoto;
  }
}

export const localeVuoto: Locale = { nome: "Maravilla", claim: "", indirizzo: "", telefono: "", instagram: "", note: "" };

export function getLocale(): Promise<Locale> {
  return oVuoto(async () => {
    const r = (await store().lista("locale"))[0];
    return r ? ({ ...localeVuoto, ...r } as Locale) : localeVuoto;
  }, localeVuoto);
}

export function getOrari(): Promise<Orario[]> {
  return oVuoto(async () => {
    const righe = (await store().lista("orari")) as unknown as Orario[];
    return righe.sort((a, b) => a.giorno - b.giorno);
  }, []);
}

export function getCategorie(): Promise<Categoria[]> {
  return oVuoto(async () => porOrdine((await store().lista("categorie_menu")) as unknown as Categoria[]), []);
}

export function getPiatti(): Promise<Piatto[]> {
  return oVuoto(async () => porOrdine((await store().lista("piatti")) as unknown as Piatto[]), []);
}

export function getEventi(): Promise<Evento[]> {
  return oVuoto(async () => porOrdine((await store().lista("eventi")) as unknown as Evento[]), []);
}

/** Menu pubblico: per gruppo (Food, Drink), solo categorie con almeno un piatto visibile. */
export async function getMenuPubblico() {
  const [categorie, piatti] = await Promise.all([getCategorie(), getPiatti()]);
  const conPiatti = categorie
    .map((c) => ({ ...c, gruppo: c.gruppo ?? "food", piatti: piatti.filter((p) => p.categoria_id === c.id && p.visibile) }))
    .filter((c) => c.piatti.length > 0);
  return (["food", "drink"] as const)
    .map((g) => ({ gruppo: g, categorie: conPiatti.filter((c) => c.gruppo === g) }))
    .filter((g) => g.categorie.length > 0);
}

export function getPrenotazioni(): Promise<PrenotazioneRiga[]> {
  return oVuoto(async () => {
    const righe = (await store().lista("prenotazioni")) as unknown as PrenotazioneRiga[];
    return righe.sort((a, b) => (a.data + a.ora).localeCompare(b.data + b.ora));
  }, []);
}

// Scritture: lasciano propagare gli errori (le usano le API admin).
export const nuovoId = () => randomUUID();

export async function salvaRighe(tabella: string, righe: Riga[], chiave = "id") {
  await store().salva(tabella, righe, chiave);
}
export async function eliminaRiga(tabella: string, id: string) {
  await store().elimina(tabella, "id", id);
}
export async function aggiornaStato(id: string, stato: string) {
  await store().aggiorna("prenotazioni", "id", id, { stato });
}
export async function inserisciPrenotazione(p: Riga) {
  await store().inserisci("prenotazioni", { id: randomUUID(), creata_il: new Date().toISOString(), stato: "in_attesa", ...p });
}
