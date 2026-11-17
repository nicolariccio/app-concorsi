import { describe, expect, it } from "vitest";
import { creaSessione, origineAmmessa, passwordCorretta, sessioneValida } from "../lib/sessione";

describe("sessione admin", () => {
  const segreto = "segreto-di-prova";
  it("accetta una sessione appena creata", () => {
    expect(sessioneValida(creaSessione(segreto), segreto)).toBe(true);
  });
  it("rifiuta firma sbagliata, segreto sbagliato, cookie manomesso o vuoto", () => {
    const c = creaSessione(segreto);
    expect(sessioneValida(c, "altro")).toBe(false);
    expect(sessioneValida(c.replace(/.$/, "0"), segreto)).toBe(false);
    expect(sessioneValida("9999999999.abc", segreto)).toBe(false);
    expect(sessioneValida(undefined, segreto)).toBe(false);
    expect(sessioneValida(c, "")).toBe(false);
  });
  it("scade dopo 12 ore", () => {
    const c = creaSessione(segreto, 0);
    expect(sessioneValida(c, segreto, 11 * 3600 * 1000)).toBe(true);
    expect(sessioneValida(c, segreto, 13 * 3600 * 1000)).toBe(false);
  });
  it("password: se non è impostata nessuno entra", () => {
    expect(passwordCorretta("x", "")).toBe(false);
    expect(passwordCorretta("giusta", "giusta")).toBe(true);
    expect(passwordCorretta("sbagliata", "giusta")).toBe(false);
  });
  it("origine: solo dallo stesso sito", () => {
    expect(origineAmmessa("https://maravilla.it", "maravilla.it")).toBe(true);
    expect(origineAmmessa("https://altro.it", "maravilla.it")).toBe(false);
    expect(origineAmmessa(null, "maravilla.it")).toBe(false);
  });
});
