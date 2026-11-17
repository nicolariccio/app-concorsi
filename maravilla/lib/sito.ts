import "server-only";
import { headers } from "next/headers";

/** Indirizzo del sito dalla richiesta (https in produzione): serve per i link nei codici QR. */
export async function origineSito(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
