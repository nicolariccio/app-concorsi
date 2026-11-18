// Il gestore incolla il link di un reel (o di un post) di Instagram; qui lo controlliamo e ne ricaviamo il codice.
const RE = /^\/(reels?|p|tv)\/([A-Za-z0-9_-]{5,30})\/?$/;

export type EsitoReel = { ok: true; link: string; codice: string } | { ok: false; errore: string };

export function leggiReel(testo: unknown): EsitoReel {
  const t = String(testo ?? "").trim();
  if (t === "") return { ok: true, link: "", codice: "" };
  if (t.length > 300) return { ok: false, errore: "Link troppo lungo" };
  let url: URL;
  try {
    url = new URL(t);
  } catch {
    return { ok: false, errore: "Incolla il link completo del reel (https://www.instagram.com/reel/…)" };
  }
  if (url.protocol !== "https:") return { ok: false, errore: "Il link deve iniziare con https://" };
  const host = url.hostname.toLowerCase();
  if (host !== "instagram.com" && host !== "www.instagram.com") return { ok: false, errore: "Non sembra un link di Instagram" };
  const m = RE.exec(url.pathname);
  if (!m) return { ok: false, errore: "Serve il link di un reel o di un post, non del profilo" };
  const codice = m[2];
  // si salva solo la forma pulita: niente parametri di tracciamento (?igsh=…)
  return { ok: true, link: `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${codice}/`, codice };
}

/** Indirizzo da mettere nell'iframe di incorporamento. */
export function urlIncorporamento(link: string): string {
  const r = leggiReel(link);
  return r.ok && r.codice ? `https://www.instagram.com/${new URL(r.link).pathname.split("/")[1]}/${r.codice}/embed/` : "";
}
