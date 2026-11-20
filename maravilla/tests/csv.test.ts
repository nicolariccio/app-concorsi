import { describe, expect, it } from "vitest";
import { cella, creaCsv } from "../lib/csv";

describe("CSV", () => {
  it("racchiude tra virgolette quando serve e raddoppia le virgolette", () => {
    expect(cella("Mario")).toBe("Mario");
    expect(cella('Il "Rosso"')).toBe('"Il ""Rosso"""');
    expect(cella("a;b")).toBe('"a;b"');
    expect(cella("riga1\nriga2")).toBe('"riga1\nriga2"');
    expect(cella("a,b")).toBe('"a,b"');
  });
  it("valori vuoti, numeri e liste", () => {
    expect(cella(null)).toBe("");
    expect(cella(undefined)).toBe("");
    expect(cella(0)).toBe("0");
    expect(cella(["glutine", "uova"])).toBe('"glutine; uova"'); // il ; è il separatore: la cella va tra virgolette
  });
  it("neutralizza le formule di Excel", () => {
    for (const x of ["=SOMMA(A1)", "+39 333 1234567", "-5", "@cmd", "\tx"]) expect(cella(x).startsWith("'") || cella(x).startsWith("\"'")).toBe(true);
    expect(cella("=1+1")).toBe("'=1+1");
  });
  it("il file ha intestazione, separatore ; e accenti leggibili", () => {
    const csv = creaCsv([{ chiave: "nome", titolo: "Nome" }, { chiave: "n", titolo: "Persone" }], [{ nome: "Società", n: 4 }, { nome: "A;B", n: 2 }]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.split("\r\n")).toEqual(["﻿Nome;Persone", "Società;4", '"A;B";2', ""]);
  });
});
