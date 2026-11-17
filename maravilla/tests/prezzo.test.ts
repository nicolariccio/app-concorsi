import { describe, expect, it } from "vitest";
import { formattaPrezzo, parsePrezzo, prezzoPerCampo } from "../lib/prezzo";

describe("prezzo", () => {
  it("accetta virgola e punto", () => {
    expect(parsePrezzo("9,50")).toBe(950);
    expect(parsePrezzo("9.5")).toBe(950);
    expect(parsePrezzo("12")).toBe(1200);
    expect(parsePrezzo("12 €")).toBe(1200);
  });
  it("vuoto è nessun prezzo, il resto è errore", () => {
    expect(parsePrezzo("")).toBeNull();
    expect(parsePrezzo("abc")).toBeUndefined();
    expect(parsePrezzo("9,999")).toBeUndefined();
    expect(parsePrezzo("-3")).toBeUndefined();
  });
  it("formatta in euro", () => {
    expect(formattaPrezzo(950)).toBe("9,50 €");
    expect(formattaPrezzo(1200)).toBe("12,00 €");
    expect(formattaPrezzo(null)).toBe("");
    expect(prezzoPerCampo(905)).toBe("9,05");
  });
});
