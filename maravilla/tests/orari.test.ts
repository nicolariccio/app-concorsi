import { describe, expect, it } from "vitest";
import { giornoSettimana } from "../lib/datetime";
import { fasceOrarie } from "../lib/orari";

const o = (apertura: string, chiusura: string, chiuso = false) => ({ giorno: 0, chiuso, apertura, chiusura });

describe("fasceOrarie", () => {
  it("ogni 30 minuti fino a un'ora prima della chiusura", () => {
    expect(fasceOrarie(o("19:00", "22:00"))).toEqual(["19:00", "19:30", "20:00", "20:30", "21:00"]);
  });
  it("gestisce la chiusura dopo la mezzanotte", () => {
    expect(fasceOrarie(o("22:00", "01:00"))).toEqual(["22:00", "22:30", "23:00", "23:30", "00:00"]);
    expect(fasceOrarie(o("22:00", "02:00"))).toEqual(["22:00", "22:30", "23:00", "23:30", "00:00", "00:30", "01:00"]);
  });
  it("giorno chiuso o orari non validi: nessuna fascia", () => {
    expect(fasceOrarie(o("19:00", "23:00", true))).toEqual([]);
    expect(fasceOrarie(o("25:00", "23:00"))).toEqual([]);
    expect(fasceOrarie(undefined)).toEqual([]);
  });
  it("apertura troppo vicina alla chiusura: nessuna fascia", () => {
    expect(fasceOrarie(o("19:00", "19:30"))).toEqual([]);
  });
});

describe("giornoSettimana", () => {
  it("0 è lunedì e 6 è domenica", () => {
    expect(giornoSettimana("2026-11-16")).toBe(0);
    expect(giornoSettimana("2026-11-22")).toBe(6);
    expect(giornoSettimana("2026-11-14")).toBe(5);
  });
});
