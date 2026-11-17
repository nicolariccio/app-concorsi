import { describe, expect, it } from "vitest";
import { addGiorni, prossimiGiorni, statCarte, statPrenotazioni, ultimiGiorni } from "../lib/statistiche";

const p = (data: string, ora: string, persone: number, stato = "confermata") => ({ data, ora, persone, stato });
// venerdì 20 novembre 2026
const righe = [
  p("2026-11-20", "20:00", 4),
  p("2026-11-20", "20:30", 2, "in_attesa"),
  p("2026-11-20", "21:00", 6, "annullata"),
  p("2026-11-21", "20:00", 5), // sabato
  p("2026-11-14", "20:00", 3), // sabato precedente
  p("2026-10-01", "20:00", 9), // fuori periodo
];

describe("date", () => {
  it("somma e sottrae giorni, anche a cavallo di mese e anno", () => {
    expect(addGiorni("2026-11-30", 1)).toBe("2026-12-01");
    expect(addGiorni("2026-01-01", -1)).toBe("2025-12-31");
    expect(addGiorni("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("gli ultimi N giorni includono oggi", () => {
    expect(ultimiGiorni("2026-11-20", 7)).toEqual({ da: "2026-11-14", a: "2026-11-20" });
    expect(ultimiGiorni("2026-11-20", 1)).toEqual({ da: "2026-11-20", a: "2026-11-20" });
  });
});

describe("statistiche prenotazioni", () => {
  const s = statPrenotazioni(righe, "2026-11-14", "2026-11-21");
  it("conta prenotazioni e coperti senza le annullate", () => {
    expect(s.prenotazioni).toBe(4);
    expect(s.coperti).toBe(4 + 2 + 5 + 3);
    expect(s.mediaPersone).toBe(3.5);
  });
  it("annullate e in attesa", () => {
    expect(s.annullate).toBe(1);
    expect(s.percentualeAnnullate).toBe(20); // 1 su 5 nel periodo
    expect(s.inAttesa).toBe(1);
  });
  it("coperti per giorno della settimana (0 = lunedì)", () => {
    expect(s.perGiornoSettimana).toEqual([0, 0, 0, 0, 6, 8, 0]);
  });
  it("coperti per ora, in ordine", () => {
    expect(s.perOra).toEqual([{ ora: "20:00", coperti: 12 }, { ora: "20:30", coperti: 2 }]);
  });
  it("ogni giorno del periodo compare, anche a zero", () => {
    expect(s.perGiorno).toHaveLength(8);
    expect(s.perGiorno[0]).toEqual({ data: "2026-11-14", coperti: 3 });
    expect(s.perGiorno[1]).toEqual({ data: "2026-11-15", coperti: 0 });
    expect(s.perGiorno.at(-1)).toEqual({ data: "2026-11-21", coperti: 5 });
  });
  it("periodo vuoto: tutti zeri, nessuna divisione per zero", () => {
    const v = statPrenotazioni([], "2026-11-14", "2026-11-20");
    expect(v).toMatchObject({ prenotazioni: 0, coperti: 0, mediaPersone: 0, annullate: 0, percentualeAnnullate: 0 });
    expect(v.perGiorno).toHaveLength(7);
  });
});

describe("prossimi giorni e carte", () => {
  it("prossimi 7 giorni, con zeri e senza annullate", () => {
    const r = prossimiGiorni(righe, "2026-11-20", 7);
    expect(r).toHaveLength(7);
    expect(r[0]).toEqual({ data: "2026-11-20", prenotazioni: 2, coperti: 6 });
    expect(r[1]).toEqual({ data: "2026-11-21", prenotazioni: 1, coperti: 5 });
    expect(r[2]).toEqual({ data: "2026-11-22", prenotazioni: 0, coperti: 0 });
  });
  it("carte: totali, nuove nel periodo, premi e timbri", () => {
    const carte = [
      { creata_il: "2026-11-20T10:00:00Z", timbri: 3, premi: 1 },
      { creata_il: "2026-10-01T10:00:00Z", timbri: 7, premi: 0 },
    ];
    expect(statCarte(carte, "2026-11-14", "2026-11-20")).toEqual({ totali: 2, nuove: 1, premiRiscattati: 1, timbriInCircolazione: 10 });
    expect(statCarte([], "2026-11-14", "2026-11-20")).toEqual({ totali: 0, nuove: 0, premiRiscattati: 0, timbriInCircolazione: 0 });
  });
});
