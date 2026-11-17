import { describe, expect, it } from "vitest";
import { validaCategoria, validaEvento, validaLocale, validaOrari, validaPiatto, validaStato } from "../lib/validazione";

const CAT = "11111111-1111-4111-8111-111111111111";

describe("validazioni admin", () => {
  it("piatto: prezzo con la virgola e allergeni", () => {
    const r = validaPiatto({ categoria_id: CAT, nome: " Cotoletta ", prezzo: "9,50", allergeni: ["glutine", "uova", "uova"] });
    expect(r.ok && r.valore.prezzo_cent).toBe(950);
    expect(r.ok && r.valore.nome).toBe("Cotoletta");
    expect(r.ok && r.valore.allergeni).toEqual(["glutine", "uova"]);
  });
  it("piatto: errori su nome, prezzo, allergene, categoria", () => {
    expect(validaPiatto({ categoria_id: CAT, nome: "" }).ok).toBe(false);
    expect(validaPiatto({ categoria_id: CAT, nome: "A", prezzo: "x" }).ok).toBe(false);
    expect(validaPiatto({ categoria_id: CAT, nome: "A", allergeni: ["finto"] }).ok).toBe(false);
    expect(validaPiatto({ categoria_id: "no", nome: "A" }).ok).toBe(false);
    expect(validaPiatto({ id: "no", categoria_id: CAT, nome: "A" }).ok).toBe(false);
  });
  it("piatto senza prezzo è consentito", () => {
    const r = validaPiatto({ categoria_id: CAT, nome: "A", prezzo: "" });
    expect(r.ok && r.valore.prezzo_cent).toBeNull();
  });
  it("orari: serve ogni giorno, chiusura dopo mezzanotte ok", () => {
    const giorni = Array.from({ length: 7 }, () => ({ chiuso: false, apertura: "19:00", chiusura: "01:00" }));
    expect(validaOrari(giorni).ok).toBe(true);
    expect(validaOrari(giorni.slice(0, 6)).ok).toBe(false);
    expect(validaOrari(giorni.map((g, i) => (i === 2 ? { ...g, apertura: "9" } : g))).ok).toBe(false);
    expect(validaOrari(giorni.map((g, i) => (i === 2 ? { chiuso: true } : g))).ok).toBe(true);
  });
  it("categoria: il gruppo Food o Drink è obbligatorio", () => {
    expect(validaCategoria({ nome: "Antipasti", gruppo: "food" }).ok).toBe(true);
    expect(validaCategoria({ nome: "Vini", gruppo: "drink", ordine: 20 }).ok).toBe(true);
    expect(validaCategoria({ nome: "Vini" }).ok).toBe(false);
    expect(validaCategoria({ nome: "Vini", gruppo: "altro" }).ok).toBe(false);
    expect(validaCategoria({ nome: "", gruppo: "food" }).ok).toBe(false);
  });
  it("evento: tipo obbligatorio", () => {
    expect(validaEvento({ tipo: "evento", titolo: "DJ" }).ok).toBe(true);
    expect(validaEvento({ tipo: "altro", titolo: "DJ" }).ok).toBe(false);
    expect(validaEvento({ tipo: "offerta", titolo: "" }).ok).toBe(false);
  });
  it("locale: nome obbligatorio, link Instagram https", () => {
    expect(validaLocale({ nome: "Maravilla" }).ok).toBe(true);
    expect(validaLocale({ nome: "" }).ok).toBe(false);
    expect(validaLocale({ nome: "M", instagram: "javascript:alert(1)" }).ok).toBe(false);
  });
  it("stato prenotazione", () => {
    expect(validaStato({ id: CAT, stato: "confermata" }).ok).toBe(true);
    expect(validaStato({ id: CAT, stato: "boh" }).ok).toBe(false);
  });
});
