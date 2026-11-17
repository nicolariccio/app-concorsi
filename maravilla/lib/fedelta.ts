import { randomInt } from "node:crypto";
import { numeroWhatsApp } from "./whatsapp";
import type { CartaFedelta, Locale } from "./tipi";

// Senza lettere e cifre ambigue (0, 1, i, l, o): 16 caratteri, circa 79 bit.
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";
export const RE_CODICE = /^[a-z2-9]{16}$/;
export const PAUSA_TIMBRO_S = 30;
export const COOKIE_CARTA = "maravilla_carta";
export const MAX_TIMBRI_ALLA_VOLTA = 10;

export function generaCodice(): string {
  return Array.from({ length: 16 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

/** Solo cifre con prefisso del paese; null se non è un numero valido. */
export function normalizzaTelefono(t: string): string | null {
  return numeroWhatsApp(t);
}

/** La carta compare sul sito solo se il gestore ha impostato timbri e premio. */
export function fedeltaAttiva(l: Pick<Locale, "fedelta_timbri" | "fedelta_premio">): boolean {
  return !!l.fedelta_timbri && l.fedelta_timbri > 0 && l.fedelta_premio.trim() !== "";
}

export type Iscrizione = { nome: string; telefono: string };

export function validaIscrizione(x: unknown): { ok: true; valore: Iscrizione } | { ok: false; errori: Record<string, string> } {
  const r = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const e: Record<string, string> = {};
  const nome = String(r.nome ?? "").trim();
  const telefono = normalizzaTelefono(String(r.telefono ?? ""));
  if (nome.length < 2 || nome.length > 60) e.nome = "Inserisci il nome";
  if (!telefono) e.telefono = "Numero di telefono non valido";
  if (r.consenso !== true) e.consenso = "Per iscriverti serve il consenso";
  if (Object.keys(e).length) return { ok: false, errori: e };
  return { ok: true, valore: { nome, telefono: telefono as string } };
}

export type Azione = "timbro" | "storno" | "premio";
type Stato = Pick<CartaFedelta, "timbri" | "premi" | "ultimo_timbro">;

/** Calcola come cambia la carta; non tocca il database. */
export function applicaAzione(
  carta: Stato,
  azione: Azione,
  timbriPerPremio: number,
  adesso: Date = new Date(),
  quantita = 1,
): { ok: true; modifiche: Partial<Stato> } | { ok: false; messaggio: string } {
  if (azione === "timbro") {
    if (!Number.isInteger(quantita) || quantita < 1 || quantita > MAX_TIMBRI_ALLA_VOLTA)
      return { ok: false, messaggio: `Si possono dare da 1 a ${MAX_TIMBRI_ALLA_VOLTA} timbri alla volta` };
    if (carta.ultimo_timbro && adesso.getTime() - new Date(carta.ultimo_timbro).getTime() < PAUSA_TIMBRO_S * 1000)
      return { ok: false, messaggio: "Timbro appena aggiunto: aspetta qualche secondo" };
    return { ok: true, modifiche: { timbri: carta.timbri + quantita, ultimo_timbro: adesso.toISOString() } };
  }
  if (azione === "storno") {
    if (carta.timbri < 1) return { ok: false, messaggio: "La carta non ha timbri" };
    return { ok: true, modifiche: { timbri: carta.timbri - 1 } };
  }
  if (carta.timbri < timbriPerPremio) return { ok: false, messaggio: `Mancano ${timbriPerPremio - carta.timbri} timbri` };
  return { ok: true, modifiche: { timbri: carta.timbri - timbriPerPremio, premi: carta.premi + 1 } };
}

export function statoCarta(timbri: number, timbriPerPremio: number) {
  return { pieni: Math.min(timbri, timbriPerPremio), mancanti: Math.max(0, timbriPerPremio - timbri), premioPronto: timbri >= timbriPerPremio };
}

/** Il percorso dopo il login vale solo se resta dentro l'area admin. */
export function percorsoSicuro(next: string | null | undefined): string {
  return next && /^\/admin(\/[A-Za-z0-9._~\-/]*)?$/.test(next) && !next.includes("//") && !next.split("/").includes("..") ? next : "/admin";
}
