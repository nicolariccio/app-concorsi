import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NonConfigurato } from "./store";

export const MAX_BYTE = 3 * 1024 * 1024;

/** Solo JPEG veri: il browser converte sempre la foto in JPEG prima di inviarla. */
export function eJpeg(dati: Buffer): boolean {
  return dati.length > 3 && dati[0] === 0xff && dati[1] === 0xd8 && dati[2] === 0xff;
}

export async function salvaFoto(dati: Buffer): Promise<string> {
  const nome = `${randomUUID()}.jpg`;
  const url = process.env.SUPABASE_URL;
  const chiave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && chiave) {
    const res = await fetch(`${url.replace(/\/$/, "")}/storage/v1/object/foto/${nome}`, {
      method: "POST",
      headers: { apikey: chiave, Authorization: `Bearer ${chiave}`, "Content-Type": "image/jpeg", "Cache-Control": "max-age=31536000", "x-upsert": "false" },
      body: new Uint8Array(dati),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Storage: errore ${res.status}`);
    return nome;
  }
  // Solo prove locali: in sviluppo è automatico, altrimenti serve DATI_SU_FILE=1.
  if (process.env.NODE_ENV !== "production" || process.env.DATI_SU_FILE === "1") {
    const cartella = path.join(process.cwd(), ".dati", "foto");
    await fs.mkdir(cartella, { recursive: true });
    await fs.writeFile(path.join(cartella, nome), dati);
    return nome;
  }
  throw new NonConfigurato();
}

export async function leggiFotoLocale(nome: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(process.cwd(), ".dati", "foto", nome));
  } catch {
    return null;
  }
}
