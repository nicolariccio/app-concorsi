import { describe, expect, it } from "vitest";
import { leggiReel, urlIncorporamento } from "../lib/instagram";
import { validaLocale } from "../lib/validazione";

describe("link del reel di Instagram", () => {
  it("accetta reel e post, e li riduce alla forma pulita senza parametri di tracciamento", () => {
    expect(leggiReel("https://www.instagram.com/reel/DCx_AbC1234/?igsh=MWxhZGZ2Z3Q3dGU1dg==")).toEqual({ ok: true, link: "https://www.instagram.com/reel/DCx_AbC1234/", codice: "DCx_AbC1234" });
    expect(leggiReel("https://instagram.com/reel/DCx_AbC1234")).toMatchObject({ ok: true, codice: "DCx_AbC1234" });
    expect(leggiReel("https://www.instagram.com/p/CxyZ-12345/")).toMatchObject({ ok: true, link: "https://www.instagram.com/p/CxyZ-12345/" });
    expect(leggiReel("https://www.instagram.com/reels/DCx_AbC1234/")).toMatchObject({ ok: true, link: "https://www.instagram.com/reel/DCx_AbC1234/" });
  });
  it("vuoto è ammesso e toglie il reel dalla Home", () => {
    expect(leggiReel("")).toEqual({ ok: true, link: "", codice: "" });
    expect(leggiReel(undefined)).toEqual({ ok: true, link: "", codice: "" });
  });
  it("rifiuta profili, altri siti, finti domini, http e testo", () => {
    for (const x of [
      "https://www.instagram.com/maravilla_food_drink/",
      "https://www.instagram.com/",
      "https://evil.example/reel/DCx_AbC1234/",
      "https://instagram.com.evil.example/reel/DCx_AbC1234/",
      "https://notinstagram.com/reel/DCx_AbC1234/",
      "http://www.instagram.com/reel/DCx_AbC1234/",
      "javascript:alert(1)",
      "https://www.instagram.com/reel/../x/",
      "https://www.instagram.com/reel/a/",
      "boh",
    ]) expect(leggiReel(x).ok, x).toBe(false);
  });
  it("l'indirizzo dell'iframe è sempre sul dominio di Instagram", () => {
    expect(urlIncorporamento("https://www.instagram.com/reel/DCx_AbC1234/")).toBe("https://www.instagram.com/reel/DCx_AbC1234/embed/");
    expect(urlIncorporamento("https://www.instagram.com/p/CxyZ-12345/")).toBe("https://www.instagram.com/p/CxyZ-12345/embed/");
    expect(urlIncorporamento("")).toBe("");
    expect(urlIncorporamento("https://evil.example/reel/abcdef/")).toBe("");
  });
  it("Info: salva il link pulito e rifiuta quello sbagliato", () => {
    const ok = validaLocale({ nome: "M", link_reel: "https://www.instagram.com/reel/DCx_AbC1234/?igsh=zzz" });
    expect(ok.ok && ok.valore.link_reel).toBe("https://www.instagram.com/reel/DCx_AbC1234/");
    expect(validaLocale({ nome: "M", link_reel: "" }).ok).toBe(true);
    const no = validaLocale({ nome: "M", link_reel: "https://www.instagram.com/maravilla_food_drink/" });
    expect(!no.ok && no.errori.link_reel).toBeTruthy();
  });
});
