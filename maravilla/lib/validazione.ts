// Validazione dei dati inviati dal pannello admin. Funzioni pure, testate.
import { ID_ALLERGENI } from "./allergeni";
import { oraValida } from "./orari";
import { parsePrezzo } from "./prezzo";

export type Risultato<T> = { ok: true; valore: T } | { ok: false; errori: Record<string, string> };

type Obj = Record<string, unknown>;
const obj = (x: unknown): Obj => (x && typeof x === "object" ? (x as Obj) : {});
const testo = (x: unknown, max: number) => String(x ?? "").trim().slice(0, max);
const intero = (x: unknown, def = 0) => (Number.isInteger(Number(x)) ? Number(x) : def);
const UUID = /^[0-9a-f-]{36}$/i;

function idOpzionale(x: unknown): string | undefined | null {
  if (x === undefined || x === null || x === "") return undefined;
  return UUID.test(String(x)) ? String(x) : null; // null = non valido
}

export function validaLocale(x: unknown): Risultato<Obj> {
  const r = obj(x);
  const e: Record<string, string> = {};
  const nome = testo(r.nome, 80);
  if (!nome) e.nome = "Il nome è obbligatorio";
  const instagram = testo(r.instagram, 200);
  if (instagram && !/^https:\/\//.test(instagram)) e.instagram = "Inserisci il link completo (https://…)";
  const telefono = testo(r.telefono, 20);
  if (telefono && !/^\+?[0-9 ]{6,15}$/.test(telefono)) e.telefono = "Numero non valido";
  if (Object.keys(e).length) return { ok: false, errori: e };
  return {
    ok: true,
    valore: { id: 1, nome, claim: testo(r.claim, 120), indirizzo: testo(r.indirizzo, 160), telefono, instagram, note: testo(r.note, 400) },
  };
}

export function validaOrari(x: unknown): Risultato<Obj[]> {
  if (!Array.isArray(x) || x.length !== 7) return { ok: false, errori: { orari: "Servono i 7 giorni" } };
  const e: Record<string, string> = {};
  const righe: Obj[] = [];
  x.forEach((v, i) => {
    const r = obj(v);
    const chiuso = r.chiuso === true;
    const apertura = testo(r.apertura, 5);
    const chiusura = testo(r.chiusura, 5);
    if (!chiuso) {
      if (!oraValida(apertura) || !oraValida(chiusura)) e[`g${i}`] = "Orari non validi";
      else if (apertura === chiusura) e[`g${i}`] = "Apertura e chiusura coincidono";
    }
    righe.push({ giorno: i, chiuso, apertura: chiuso ? "00:00" : apertura, chiusura: chiuso ? "00:00" : chiusura });
  });
  return Object.keys(e).length ? { ok: false, errori: e } : { ok: true, valore: righe };
}

export function validaCategoria(x: unknown): Risultato<Obj> {
  const r = obj(x);
  const id = idOpzionale(r.id);
  const nome = testo(r.nome, 60);
  if (id === null) return { ok: false, errori: { id: "Id non valido" } };
  if (!nome) return { ok: false, errori: { nome: "Il nome è obbligatorio" } };
  return { ok: true, valore: { ...(id ? { id } : {}), nome, ordine: intero(r.ordine) } };
}

export function validaPiatto(x: unknown): Risultato<Obj> {
  const r = obj(x);
  const e: Record<string, string> = {};
  const id = idOpzionale(r.id);
  if (id === null) e.id = "Id non valido";
  const categoria = String(r.categoria_id ?? "");
  if (!UUID.test(categoria)) e.categoria_id = "Categoria non valida";
  const nome = testo(r.nome, 80);
  if (!nome) e.nome = "Il nome è obbligatorio";
  const prezzo = parsePrezzo(String(r.prezzo ?? ""));
  if (prezzo === undefined) e.prezzo = "Prezzo non valido (es. 9,50)";
  const allergeni = Array.isArray(r.allergeni) ? r.allergeni.map(String) : [];
  if (allergeni.some((a) => !ID_ALLERGENI.includes(a))) e.allergeni = "Allergene non valido";
  if (Object.keys(e).length) return { ok: false, errori: e };
  return {
    ok: true,
    valore: {
      ...(id ? { id } : {}),
      categoria_id: categoria,
      nome,
      descrizione: testo(r.descrizione, 200),
      prezzo_cent: prezzo as number | null,
      allergeni: [...new Set(allergeni)],
      esaurito: r.esaurito === true,
      visibile: r.visibile !== false,
      ordine: intero(r.ordine),
    },
  };
}

export function validaEvento(x: unknown): Risultato<Obj> {
  const r = obj(x);
  const e: Record<string, string> = {};
  const id = idOpzionale(r.id);
  if (id === null) e.id = "Id non valido";
  const titolo = testo(r.titolo, 80);
  if (!titolo) e.titolo = "Il titolo è obbligatorio";
  if (r.tipo !== "evento" && r.tipo !== "offerta") e.tipo = "Scegli evento o offerta";
  if (Object.keys(e).length) return { ok: false, errori: e };
  return {
    ok: true,
    valore: {
      ...(id ? { id } : {}),
      tipo: r.tipo,
      titolo,
      quando: testo(r.quando, 80),
      descrizione: testo(r.descrizione, 300),
      attivo: r.attivo !== false,
      ordine: intero(r.ordine),
    },
  };
}

export function validaStato(x: unknown): Risultato<{ id: string; stato: string }> {
  const r = obj(x);
  const id = String(r.id ?? "");
  const stato = String(r.stato ?? "");
  if (!UUID.test(id)) return { ok: false, errori: { id: "Id non valido" } };
  if (!["in_attesa", "confermata", "annullata"].includes(stato)) return { ok: false, errori: { stato: "Stato non valido" } };
  return { ok: true, valore: { id, stato } };
}
