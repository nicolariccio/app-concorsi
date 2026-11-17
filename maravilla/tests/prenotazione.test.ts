import { describe, expect, it } from "vitest";
import { validaPrenotazione } from "../lib/prenotazione";
import type { Orario } from "../lib/tipi";

// 2026-11-14 è un sabato, ore 12:00 a Roma (11:00 UTC).
const adesso = new Date("2026-11-14T11:00:00Z");
const tutti = (apertura: string, chiusura: string, chiusi: number[] = []): Orario[] =>
  [0, 1, 2, 3, 4, 5, 6].map((giorno) => ({ giorno, chiuso: chiusi.includes(giorno), apertura, chiusura }));
const orari = tutti("19:00", "23:30", [0]); // lunedì chiuso
const base = { nome: "Mario", telefono: "333 1234567", data: "2026-11-20", ora: "20:00", persone: 4, note: "" }; // venerdì

describe("validaPrenotazione", () => {
  it("accetta una prenotazione valida", () => {
    expect(validaPrenotazione(base, orari, adesso).ok).toBe(true);
  });
  it("rifiuta un giorno di chiusura", () => {
    const r = validaPrenotazione({ ...base, data: "2026-11-16" }, orari, adesso); // lunedì
    expect(!r.ok && r.errori.data).toBe("Quel giorno siamo chiusi");
  });
  it("rifiuta una data passata", () => {
    expect(validaPrenotazione({ ...base, data: "2026-11-13" }, orari, adesso).ok).toBe(false);
  });
  it("rifiuta un orario fuori dalle fasce", () => {
    const r = validaPrenotazione({ ...base, ora: "03:00" }, orari, adesso);
    expect(!r.ok && r.errori.ora).toBeTruthy();
  });
  it("rifiuta un orario già passato oggi, accetta uno futuro", () => {
    const sera = new Date("2026-11-14T19:30:00Z"); // 20:30 a Roma
    expect(validaPrenotazione({ ...base, data: "2026-11-14", ora: "20:00" }, orari, sera).ok).toBe(false);
    expect(validaPrenotazione({ ...base, data: "2026-11-14", ora: "21:00" }, orari, sera).ok).toBe(true);
  });
  it("usa la data di Roma e non quella UTC", () => {
    const tardi = new Date("2026-11-14T23:30:00Z"); // 00:30 del 15 a Roma
    expect(validaPrenotazione({ ...base, data: "2026-11-14" }, orari, tardi).ok).toBe(false);
  });
  it("con chiusura dopo la mezzanotte accetta le fasce notturne", () => {
    const notte = tutti("19:00", "01:00");
    expect(validaPrenotazione({ ...base, ora: "23:30" }, notte, adesso).ok).toBe(true);
    expect(validaPrenotazione({ ...base, ora: "00:00" }, notte, adesso).ok).toBe(true);
  });
  it("senza orari impostati non accetta prenotazioni", () => {
    expect(validaPrenotazione(base, [], adesso).ok).toBe(false);
  });
  it("controlla telefono, persone e input nullo", () => {
    expect(validaPrenotazione({ ...base, telefono: "abc" }, orari, adesso).ok).toBe(false);
    expect(validaPrenotazione({ ...base, persone: 99 }, orari, adesso).ok).toBe(false);
    expect(validaPrenotazione({ ...base, persone: 0 }, orari, adesso).ok).toBe(false);
    expect(validaPrenotazione(null, orari, adesso).ok).toBe(false);
  });
});
