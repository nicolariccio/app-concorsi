import { describe, expect, it } from "vitest";
import { consegneAttive, PIATTAFORME, validaLinkConsegna } from "../lib/consegna";
import { validaLocale } from "../lib/validazione";

const glovo = PIATTAFORME[0];
const deliveroo = PIATTAFORME[1];

describe("link Glovo e Deliveroo", () => {
  it("accetta i link veri delle piattaforme", () => {
    expect(validaLinkConsegna(glovo, "https://glovoapp.com/it/it/napoli/maravilla/").ok).toBe(true);
    expect(validaLinkConsegna(glovo, "https://www.glovoapp.com/it/it/napoli/x").ok).toBe(true);
    expect(validaLinkConsegna(glovo, "https://glovo.page.link/abc123").ok).toBe(true);
    expect(validaLinkConsegna(deliveroo, "https://deliveroo.it/it/menu/napoli/vomero/maravilla").ok).toBe(true);
    expect(validaLinkConsegna(deliveroo, "https://www.deliveroo.com/menu/x").ok).toBe(true);
  });
  it("vuoto è ammesso e toglie il pulsante", () => {
    expect(validaLinkConsegna(glovo, "")).toEqual({ ok: true, link: "" });
    expect(validaLinkConsegna(glovo, "   ")).toEqual({ ok: true, link: "" });
    expect(validaLinkConsegna(glovo, undefined)).toEqual({ ok: true, link: "" });
  });
  it("rifiuta http, altri siti, finti sottodomini e schemi pericolosi", () => {
    for (const x of [
      "http://glovoapp.com/x",
      "https://evil.example/?glovoapp.com",
      "https://glovoapp.com.evil.example/x",
      "https://evilglovoapp.com/x",
      "javascript:alert(1)",
      "glovoapp.com/it",
      "https://deliveroo.it/x", // di un'altra piattaforma
      "boh",
    ]) expect(validaLinkConsegna(glovo, x).ok, x).toBe(false);
    for (const x of ["https://deliveroo.it.evil.example/x", "https://glovoapp.com/x", "http://deliveroo.it/x"]) expect(validaLinkConsegna(deliveroo, x).ok, x).toBe(false);
  });
  it("rifiuta link troppo lunghi", () => {
    expect(validaLinkConsegna(glovo, "https://glovoapp.com/" + "a".repeat(600)).ok).toBe(false);
  });
  it("le piattaforme attive sono quelle con un link", () => {
    expect(consegneAttive({})).toEqual([]);
    expect(consegneAttive({ link_glovo: "", link_deliveroo: "https://deliveroo.it/x" }).map((p) => p.id)).toEqual(["deliveroo"]);
    expect(consegneAttive({ link_glovo: "https://glovoapp.com/x", link_deliveroo: "https://deliveroo.it/x" }).map((p) => p.id)).toEqual(["glovo", "deliveroo"]);
  });
  it("Info: salva i link validi, rifiuta quelli sbagliati con l'errore sul campo giusto", () => {
    const ok = validaLocale({ nome: "M", link_glovo: "https://glovoapp.com/x", link_deliveroo: "" });
    expect(ok.ok && ok.valore.link_glovo).toBe("https://glovoapp.com/x");
    expect(ok.ok && ok.valore.link_deliveroo).toBe("");
    const no = validaLocale({ nome: "M", link_glovo: "https://evil.example", link_deliveroo: "http://deliveroo.it/x" });
    expect(!no.ok && no.errori.link_glovo).toBeTruthy();
    expect(!no.ok && no.errori.link_deliveroo).toBeTruthy();
  });
});
