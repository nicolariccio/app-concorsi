import { describe, expect, it } from "vitest";
import { validaPrenotazione } from "../lib/prenotazione";

const adesso = new Date(2026, 10, 14, 12, 0);
const base = { nome: "Mario", telefono: "333 1234567", data: "2026-11-20", ora: "20:00", persone: 4, note: "" };

describe("validaPrenotazione", () => {
  it("accetta una prenotazione valida", () => {
    expect(validaPrenotazione(base, adesso).ok).toBe(true);
  });
  it("accetta la data di oggi", () => {
    expect(validaPrenotazione({ ...base, data: "2026-11-14" }, adesso).ok).toBe(true);
  });
  it("rifiuta una data passata", () => {
    const r = validaPrenotazione({ ...base, data: "2026-11-13" }, adesso);
    expect(r.ok).toBe(false);
  });
  it("rifiuta telefono non valido", () => {
    const r = validaPrenotazione({ ...base, telefono: "abc" }, adesso);
    expect(!r.ok && r.errori.telefono).toBeTruthy();
  });
  it("rifiuta orario fuori fasce", () => {
    const r = validaPrenotazione({ ...base, ora: "03:00" }, adesso);
    expect(!r.ok && r.errori.ora).toBeTruthy();
  });
  it("rifiuta troppe persone e zero persone", () => {
    expect(validaPrenotazione({ ...base, persone: 99 }, adesso).ok).toBe(false);
    expect(validaPrenotazione({ ...base, persone: 0 }, adesso).ok).toBe(false);
  });
  it("gestisce input nullo", () => {
    expect(validaPrenotazione(null, adesso).ok).toBe(false);
  });
});
