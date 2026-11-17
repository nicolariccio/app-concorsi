// Sessione admin: cookie firmato con HMAC. Nessuna dipendenza da Next, così si testa da solo.
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const DURATA_SESSIONE_S = 12 * 3600;

function firma(valore: string, segreto: string): string {
  return createHmac("sha256", segreto).update(valore).digest("hex");
}

export function creaSessione(segreto: string, adessoMs: number = Date.now()): string {
  const scade = Math.floor(adessoMs / 1000) + DURATA_SESSIONE_S;
  return `${scade}.${firma(String(scade), segreto)}`;
}

export function sessioneValida(cookie: string | undefined, segreto: string, adessoMs: number = Date.now()): boolean {
  if (!cookie || !segreto) return false;
  const [scade, f] = cookie.split(".");
  if (!scade || !f || !/^\d+$/.test(scade)) return false;
  const attesa = Buffer.from(firma(scade, segreto));
  const ricevuta = Buffer.from(f);
  if (attesa.length !== ricevuta.length || !timingSafeEqual(attesa, ricevuta)) return false;
  return Number(scade) > Math.floor(adessoMs / 1000);
}

/** Confronto a tempo costante (si confrontano gli hash, che hanno sempre la stessa lunghezza). */
export function passwordCorretta(inserita: string, attesa: string): boolean {
  if (!attesa) return false;
  const a = createHash("sha256").update(inserita).digest();
  const b = createHash("sha256").update(attesa).digest();
  return timingSafeEqual(a, b);
}

/** Le scritture devono arrivare dal nostro stesso sito. */
export function origineAmmessa(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
