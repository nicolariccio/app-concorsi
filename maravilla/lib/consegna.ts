export type Piattaforma = { id: "glovo" | "deliveroo"; nome: string; campo: "link_glovo" | "link_deliveroo"; colore: string; domini: string[]; esempio: string };

export const PIATTAFORME: Piattaforma[] = [
  { id: "glovo", nome: "Glovo", campo: "link_glovo", colore: "#FFC244", domini: ["glovoapp.com", "glovo.com", "glovo.page.link"], esempio: "https://glovoapp.com/…" },
  { id: "deliveroo", nome: "Deliveroo", campo: "link_deliveroo", colore: "#00CCBC", domini: ["deliveroo.it", "deliveroo.com"], esempio: "https://deliveroo.it/…" },
];

/** Controlla il link incollato dal gestore: vuoto è ammesso, altrimenti https verso il sito della piattaforma. */
export function validaLinkConsegna(p: Piattaforma, valore: unknown): { ok: true; link: string } | { ok: false; errore: string } {
  const testo = String(valore ?? "").trim();
  if (testo === "") return { ok: true, link: "" };
  if (testo.length > 500) return { ok: false, errore: "Link troppo lungo" };
  let url: URL;
  try {
    url = new URL(testo);
  } catch {
    return { ok: false, errore: `Incolla il link completo della tua pagina su ${p.nome}` };
  }
  if (url.protocol !== "https:") return { ok: false, errore: "Il link deve iniziare con https://" };
  const host = url.hostname.toLowerCase();
  // Il dominio deve essere proprio quello della piattaforma (o un suo sottodominio come www): "glovoapp.com.evil.example" non passa.
  if (!p.domini.some((d) => host === d || host.endsWith(`.${d}`))) return { ok: false, errore: `Non sembra un link di ${p.nome} (${p.esempio})` };
  return { ok: true, link: url.toString() };
}

/** Le piattaforme per cui il gestore ha inserito un link. */
export function consegneAttive(l: { link_glovo?: string; link_deliveroo?: string }) {
  return PIATTAFORME.filter((p) => !!l[p.campo]).map((p) => ({ ...p, link: l[p.campo] as string }));
}
