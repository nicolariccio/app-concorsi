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

import { RE_FOTO, urlFoto } from "../lib/fotoUrl";

describe("foto", () => {
  const nome = "11111111-2222-4333-8444-555555555555.jpg";
  it("accetta solo nomi generati da noi", () => {
    expect(RE_FOTO.test(nome)).toBe(true);
    for (const x of ["../x.jpg", "a.jpg", nome.replace(".jpg", ".svg"), "https://evil.example/x.jpg", `${nome}?x=1`, ""]) expect(RE_FOTO.test(x)).toBe(false);
  });
  it("piatto e locale: foto valida o vuota, altro rifiutato", () => {
    const CAT = "11111111-1111-4111-8111-111111111111";
    expect(validaPiatto({ categoria_id: CAT, nome: "A", foto: nome }).ok).toBe(true);
    expect(validaPiatto({ categoria_id: CAT, nome: "A", foto: "" }).ok).toBe(true);
    expect(validaPiatto({ categoria_id: CAT, nome: "A", foto: "https://evil.example/x.jpg" }).ok).toBe(false);
    expect(validaLocale({ nome: "M", foto_home: nome }).ok).toBe(true);
    expect(validaLocale({ nome: "M", foto_home: "../../etc/passwd" }).ok).toBe(false);
  });
  it("indirizzo: vuoto se non c'è la foto; locale in prova, Supabase con le chiavi", () => {
    const prima = { u: process.env.SUPABASE_URL, k: process.env.SUPABASE_SERVICE_ROLE_KEY };
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(urlFoto("")).toBe("");
    expect(urlFoto("xx")).toBe("");
    expect(urlFoto(nome)).toBe(`/api/foto/${nome}`);
    process.env.SUPABASE_URL = "https://abc.supabase.co/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "k";
    expect(urlFoto(nome)).toBe(`https://abc.supabase.co/storage/v1/object/public/foto/${nome}`);
    if (prima.u === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = prima.u;
    if (prima.k === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = prima.k;
  });
});
