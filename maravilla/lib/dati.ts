import "server-only";
import { randomUUID } from "node:crypto";
import { urlFoto } from "./fotoUrl";
import { NonConfigurato, store, type Riga } from "./store";
import type { Chiusura } from "./disponibilita";
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

export const localeVuoto: Locale = { nome: "Maravilla", claim: "", indirizzo: "", telefono: "", instagram: "", note: "", coperti_max: null, foto_home: "", fedelta_timbri: null, fedelta_premio: "", fedelta_regola: "", link_glovo: "", link_deliveroo: "", link_reel: "" };

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
    .map((c) => ({ ...c, gruppo: c.gruppo ?? "food", piatti: piatti.filter((p) => p.categoria_id === c.id && p.visibile).map((p) => ({ ...p, foto_url: urlFoto(p.foto) })) }))
    .filter((c) => c.piatti.length > 0);
  return (["food", "drink"] as const)
    .map((g) => ({ gruppo: g, categorie: conPiatti.filter((c) => c.gruppo === g) }))
    .filter((g) => g.categorie.length > 0);
}

export function getChiusure(): Promise<Chiusura[]> {
  return oVuoto(async () => ((await store().lista("chiusure")) as unknown as Chiusura[]).sort((a, b) => a.dal.localeCompare(b.dal)), []);
}

/** Tetto di righe che Supabase restituisce di solito: oltre, le letture vengono troncate in silenzio. */
export const LIMITE_RIGHE = 1000;

const perData = (a: PrenotazioneRiga, b: PrenotazioneRiga) => (a.data + a.ora).localeCompare(b.data + b.ora);

// Letture che NON nascondono gli errori: una lista vuota per errore farebbe saltare i controlli sui coperti.
/** Prenotazioni di un solo giorno (per controllare i coperti). */
export async function prenotazioniDelGiorno(data: string): Promise<PrenotazioneRiga[]> {
  return ((await store().cerca("prenotazioni", "data", data, LIMITE_RIGHE)) as unknown as PrenotazioneRiga[]).sort(perData);
}

/** Prenotazioni tra due date (estremi inclusi), in ordine. */
export async function prenotazioniTra(da: string, a: string): Promise<PrenotazioneRiga[]> {
  return ((await store().intervallo("prenotazioni", "data", da, a, LIMITE_RIGHE)) as unknown as PrenotazioneRiga[]).sort(perData);
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
/** Salva la prenotazione e restituisce il codice segreto del suo link. */
export async function inserisciPrenotazione(p: Riga): Promise<string> {
  const codice = generaCodice();
  await store().inserisci("prenotazioni", { id: randomUUID(), creata_il: new Date().toISOString(), stato: "in_attesa", codice, ...p });
  return codice;
}

// Letture che non nascondono gli errori (come per la carta fedeltà).
export async function trovaPrenotazionePerCodice(codice: string): Promise<PrenotazioneRiga | null> {
  if (!RE_CODICE.test(codice)) return null;
  return ((await store().cerca("prenotazioni", "codice", codice, 1))[0] as unknown as PrenotazioneRiga) ?? null;
}

/** Aggiorna solo se la prenotazione è ancora com'era quando l'abbiamo letta. */
export async function aggiornaPrenotazioneSe(p: PrenotazioneRiga, modifiche: Riga): Promise<boolean> {
  const n = await store().aggiornaSe("prenotazioni", p.id, { stato: p.stato, data: p.data, ora: p.ora, persone: p.persone }, modifiche);
  return n === 1;
}

// --- Carta fedeltà. Letture che NON nascondono gli errori: "carta non trovata" non deve voler dire "database rotto".
import { generaCodice, RE_CODICE } from "./fedelta";
import type { CartaFedelta } from "./tipi";

export async function trovaCartaPerCodice(codice: string): Promise<CartaFedelta | null> {
  if (!RE_CODICE.test(codice)) return null;
  return ((await store().cerca("carte_fedelta", "codice", codice, 1))[0] as unknown as CartaFedelta) ?? null;
}

export async function trovaCartaPerTelefono(telefono: string): Promise<CartaFedelta | null> {
  return ((await store().cerca("carte_fedelta", "telefono", telefono, 1))[0] as unknown as CartaFedelta) ?? null;
}

export async function trovaCartaPerId(id: string): Promise<CartaFedelta | null> {
  return ((await store().cerca("carte_fedelta", "id", id, 1))[0] as unknown as CartaFedelta) ?? null;
}

export async function listaCarte(): Promise<CartaFedelta[]> {
  const righe = (await store().lista("carte_fedelta")) as unknown as CartaFedelta[];
  return righe.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
}

export async function creaCarta(c: { codice: string; nome: string; telefono: string }): Promise<void> {
  const ora = new Date().toISOString();
  await store().inserisci("carte_fedelta", { id: randomUUID(), ...c, consenso_il: ora, timbri: 0, premi: 0, ultimo_timbro: null, creata_il: ora });
}

/** Aggiorna solo se timbri e premi sono ancora quelli letti (due tocchi insieme non si sommano male). */
export async function aggiornaCartaSe(carta: CartaFedelta, modifiche: Riga): Promise<boolean> {
  const n = await store().aggiornaSe("carte_fedelta", carta.id, { timbri: carta.timbri, premi: carta.premi }, modifiche);
  return n === 1;
}

export async function eliminaCarta(id: string): Promise<void> {
  await store().elimina("carte_fedelta", "id", id);
}
