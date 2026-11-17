// Validazione dei dati inviati dal pannello admin. Funzioni pure, testate.
import { ID_ALLERGENI } from "./allergeni";
import { RE_FOTO } from "./fotoUrl";
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
  const timbriTesto = String(r.fedelta_timbri ?? "").trim();
  const timbri = timbriTesto === "" ? null : Number(timbriTesto);
  if (timbri !== null && (!Number.isInteger(timbri) || timbri < 1 || timbri > 30)) e.fedelta_timbri = "Inserisci un numero da 1 a 30, oppure lascia vuoto";
  const premio = testo(r.fedelta_premio, 100);
  if ((timbri === null) !== (premio === "")) e.fedelta_premio = "Per attivare la carta servono sia i timbri sia il premio (o lasciali vuoti tutti e due)";
  const fotoHome = String(r.foto_home ?? "");
  if (fotoHome && !RE_FOTO.test(fotoHome)) e.foto_home = "Foto non valida";
  const copertiTesto = String(r.coperti_max ?? "").trim();
  const coperti = copertiTesto === "" ? null : Number(copertiTesto);
  if (coperti !== null && (!Number.isInteger(coperti) || coperti < 1 || coperti > 500)) e.coperti_max = "Inserisci un numero da 1 a 500, oppure lascia vuoto";
  if (Object.keys(e).length) return { ok: false, errori: e };
  return {
    ok: true,
    valore: { id: 1, coperti_max: coperti, foto_home: fotoHome, fedelta_timbri: timbri, fedelta_premio: premio, fedelta_regola: testo(r.fedelta_regola, 200), nome, claim: testo(r.claim, 120), indirizzo: testo(r.indirizzo, 160), telefono, instagram, note: testo(r.note, 400) },
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
  if (r.gruppo !== "food" && r.gruppo !== "drink") return { ok: false, errori: { gruppo: "Scegli Food o Drink" } };
  return { ok: true, valore: { ...(id ? { id } : {}), nome, gruppo: r.gruppo, ordine: intero(r.ordine) } };
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
  const foto = String(r.foto ?? "");
  if (foto && !RE_FOTO.test(foto)) e.foto = "Foto non valida";
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
      foto,
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

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

export function validaChiusura(x: unknown): Risultato<Obj> {
  const r = obj(x);
  const e: Record<string, string> = {};
  const id = idOpzionale(r.id);
  if (id === null) e.id = "Id non valido";
  const dal = String(r.dal ?? "");
  const al = String(r.al ?? dal);
  if (!RE_DATA.test(dal) || Number.isNaN(Date.parse(dal))) e.dal = "Data non valida";
  if (!RE_DATA.test(al) || Number.isNaN(Date.parse(al))) e.al = "Data non valida";
  else if (!e.dal && al < dal) e.al = "La fine non può essere prima dell'inizio";
  if (Object.keys(e).length) return { ok: false, errori: e };
  return { ok: true, valore: { ...(id ? { id } : {}), dal, al, motivo: testo(r.motivo, 80) } };
}
