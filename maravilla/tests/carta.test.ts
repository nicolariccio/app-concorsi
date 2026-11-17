import { describe, expect, it } from "vitest";
import { applicaAzione, fedeltaAttiva, generaCodice, normalizzaTelefono, percorsoSicuro, PAUSA_TIMBRO_S, RE_CODICE, statoCarta, validaIscrizione } from "../lib/fedelta";
import { validaLocale } from "../lib/validazione";

const carta = (t: number, ultimo: string | null = null) => ({ timbri: t, premi: 0, ultimo_timbro: ultimo });
const adesso = new Date("2026-11-20T20:00:00Z");

describe("codice e iscrizione", () => {
  it("il codice ha 16 caratteri validi e non si ripete", () => {
    const codici = new Set(Array.from({ length: 500 }, generaCodice));
    expect(codici.size).toBe(500);
    for (const c of codici) expect(RE_CODICE.test(c)).toBe(true);
    for (const x of ["", "abc", "ABCDEFGHJKMNPQRS", "abcdefghjkmnpqr0", "../../etc/passwd/..", "abcdefghjkmnpqrst"]) expect(RE_CODICE.test(x)).toBe(false);
  });
  it("normalizza il telefono in sole cifre con prefisso", () => {
    expect(normalizzaTelefono("333 123 4567")).toBe("393331234567");
    expect(normalizzaTelefono("+39 333 1234567")).toBe("393331234567");
    expect(normalizzaTelefono("boh")).toBeNull();
  });
  it("l'iscrizione richiede nome, telefono valido e consenso", () => {
    expect(validaIscrizione({ nome: "Mario", telefono: "333 1234567", consenso: true }).ok).toBe(true);
    const senza = validaIscrizione({ nome: "Mario", telefono: "333 1234567", consenso: false });
    expect(!senza.ok && senza.errori.consenso).toBeTruthy();
    expect(validaIscrizione({ nome: "M", telefono: "333 1234567", consenso: true }).ok).toBe(false);
    expect(validaIscrizione({ nome: "Mario", telefono: "123", consenso: true }).ok).toBe(false);
    expect(validaIscrizione(null).ok).toBe(false);
  });
});

describe("timbri e premio", () => {
  it("aggiunge un timbro", () => {
    const r = applicaAzione(carta(3), "timbro", 10, adesso);
    expect(r.ok && r.modifiche.timbri).toBe(4);
  });
  it("più timbri in una volta sola, da 1 a 10", () => {
    const r = applicaAzione(carta(1), "timbro", 10, adesso, 3);
    expect(r.ok && r.modifiche.timbri).toBe(4);
    expect(r.ok && r.modifiche.ultimo_timbro).toBe(adesso.toISOString());
    expect(applicaAzione(carta(0), "timbro", 10, adesso, 10).ok).toBe(true);
    for (const q of [0, 11, -2, 2.5, NaN]) expect(applicaAzione(carta(0), "timbro", 10, adesso, q).ok).toBe(false);
  });
  it("anche con più timbri vale la pausa contro i doppi tocchi", () => {
    const poco = new Date(adesso.getTime() - 5000).toISOString();
    expect(applicaAzione(carta(3, poco), "timbro", 10, adesso, 3).ok).toBe(false);
  });
  it("tre timbri bastano per il premio da 3", () => {
    const r = applicaAzione(carta(0), "timbro", 3, adesso, 3);
    expect(r.ok && r.modifiche.timbri).toBe(3);
  });
  it("rifiuta un secondo tocco entro la pausa, accetta dopo", () => {
    const poco = new Date(adesso.getTime() - (PAUSA_TIMBRO_S - 5) * 1000).toISOString();
    const tanto = new Date(adesso.getTime() - (PAUSA_TIMBRO_S + 5) * 1000).toISOString();
    expect(applicaAzione(carta(3, poco), "timbro", 10, adesso).ok).toBe(false);
    expect(applicaAzione(carta(3, tanto), "timbro", 10, adesso).ok).toBe(true);
  });
  it("togli timbro: non scende sotto zero", () => {
    expect(applicaAzione(carta(0), "storno", 10, adesso).ok).toBe(false);
    const r = applicaAzione(carta(2), "storno", 10, adesso);
    expect(r.ok && r.modifiche.timbri).toBe(1);
  });
  it("premio: solo al traguardo, e i timbri in più restano", () => {
    const poco = applicaAzione(carta(9), "premio", 10, adesso);
    expect(!poco.ok && poco.messaggio).toBe("Mancano 1 timbri");
    const preciso = applicaAzione(carta(10), "premio", 10, adesso);
    expect(preciso.ok && preciso.modifiche).toEqual({ timbri: 0, premi: 1 });
    const oltre = applicaAzione(carta(13), "premio", 10, adesso);
    expect(oltre.ok && oltre.modifiche).toEqual({ timbri: 3, premi: 1 });
  });
  it("stato della carta", () => {
    expect(statoCarta(4, 10)).toEqual({ pieni: 4, mancanti: 6, premioPronto: false });
    expect(statoCarta(12, 10)).toEqual({ pieni: 10, mancanti: 0, premioPronto: true });
  });
});

describe("impostazioni e percorso dopo il login", () => {
  it("la carta è attiva solo con timbri e premio", () => {
    expect(fedeltaAttiva({ fedelta_timbri: 10, fedelta_premio: "Una cotoletta" })).toBe(true);
    expect(fedeltaAttiva({ fedelta_timbri: null, fedelta_premio: "Una cotoletta" })).toBe(false);
    expect(fedeltaAttiva({ fedelta_timbri: 10, fedelta_premio: "  " })).toBe(false);
  });
  it("Info: timbri e premio vanno insieme", () => {
    expect(validaLocale({ nome: "M", fedelta_timbri: "10", fedelta_premio: "Cotoletta" }).ok).toBe(true);
    expect(validaLocale({ nome: "M", fedelta_timbri: "", fedelta_premio: "" }).ok).toBe(true);
    expect(validaLocale({ nome: "M", fedelta_timbri: "10", fedelta_premio: "" }).ok).toBe(false);
    expect(validaLocale({ nome: "M", fedelta_timbri: "", fedelta_premio: "Cotoletta" }).ok).toBe(false);
    expect(validaLocale({ nome: "M", fedelta_timbri: "99", fedelta_premio: "Cotoletta" }).ok).toBe(false);
  });
  it("dopo il login si torna solo dentro /admin", () => {
    expect(percorsoSicuro("/admin/carta/abcdefghjkmnpqrs")).toBe("/admin/carta/abcdefghjkmnpqrs");
    for (const x of ["https://evil.example", "//evil.example", "/menu", "/admin//evil", "/adminx", "", null, undefined, "/admin/../etc"]) {
      expect(percorsoSicuro(x as string)).toBe("/admin");
    }
  });
});
