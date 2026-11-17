/** Nome file valido: un UUID con estensione .jpg (lo generiamo noi, mai scelto dall'utente). */
export const RE_FOTO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i;

/** Indirizzo pubblico di una foto. Vuoto se non c'è. Si usa solo lato server. */
export function urlFoto(percorso: string | null | undefined): string {
  if (!percorso || !RE_FOTO.test(percorso)) return "";
  const url = process.env.SUPABASE_URL;
  if (url && process.env.SUPABASE_SERVICE_ROLE_KEY) return `${url.replace(/\/$/, "")}/storage/v1/object/public/foto/${percorso}`;
  return `/api/foto/${percorso}`; // solo prove locali (DATI_SU_FILE)
}
