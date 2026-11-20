import { describe, expect, it } from "vitest";
import { limiteFascia, regolaVale, riassuntoGiorno, testoLimite, type LimiteCoperti } from "../lib/coperti";
import { disponibilita } from "../lib/disponibilita";
import { validaPrenotazione } from "../lib/prenotazione";
import type { Orario } from "../lib/tipi";
import { validaLimite } from "../lib/validazione";

const R = (max: number, giorni: number[] = [], da: string | null = null, a: string | null = null, id = "x"): LimiteCoperti => ({ id, giorni, ora_da: da, ora_a: a, max_coperti: max });
const orario: Orario = { giorno: 4, chiuso: false, apertura: "19:00", chiusura: "01:00" };
const VEN = "2026-11-20"; // venerdì (giorno 4)
const SAB = "2026-11-21"; // sabato (giorno 5)
const MAR = "2026-11-17"; // martedì (giorno 1)

describe("regole dei coperti", () => {
  it("senza regole vale il limite generale (o nessuno)", () => {
    expect(limiteFascia([], 30, orario, VEN, "20:00")).toBe(30);
    expect(limiteFascia([], null, orario, VEN, "20:00")).toBeNull();
  });
  it("una regola per giorno vale solo in quei giorni", () => {
    const r = [R(50, [4, 5])];
    expect(limiteFascia(r, 30, orario, VEN, "20:00")).toBe(50);
    expect(limiteFascia(r, 30, orario, SAB, "20:00")).toBe(50);
    expect(limiteFascia(r, 30, orario, MAR, "20:00")).toBe(30);
  });
  it("una regola per orario vale in tutti i giorni, estremi compresi", () => {
    const r = [R(20, [], "20:00", "21:00")];
    expect(limiteFascia(r, 40, orario, MAR, "19:30")).toBe(40);
    expect(limiteFascia(r, 40, orario, MAR, "20:00")).toBe(20);
    expect(limiteFascia(r, 40, orario, MAR, "21:00")).toBe(20);
    expect(limiteFascia(r, 40, orario, MAR, "21:30")).toBe(40);
  });
  it("giorno + orario batte solo giorno, che batte solo orario, che batte tutti", () => {
    const tutti = R(10), orarioSolo = R(20, [], "20:00", "21:00"), giornoSolo = R(30, [4]), preciso = R(40, [4], "20:00", "21:00");
    expect(limiteFascia([tutti, orarioSolo], null, orario, VEN, "20:30")).toBe(20);
    expect(limiteFascia([tutti, orarioSolo, giornoSolo], null, orario, VEN, "20:30")).toBe(30);
    expect(limiteFascia([tutti, orarioSolo, giornoSolo, preciso], null, orario, VEN, "20:30")).toBe(40);
    expect(limiteFascia([tutti, orarioSolo, giornoSolo, preciso], null, orario, VEN, "22:00")).toBe(30);
    expect(limiteFascia([tutti, orarioSolo, giornoSolo, preciso], null, orario, MAR, "22:00")).toBe(10);
  });
  it("a parità di specificità vince il limite più basso", () => {
    expect(limiteFascia([R(30, [4]), R(25, [4, 5])], null, orario, VEN, "20:00")).toBe(25);
  });
  it("limite 0 = nessuna prenotazione online, e conta come limite (non come 'nessun limite')", () => {
    expect(limiteFascia([R(0, [4], "22:00", "23:00")], 40, orario, VEN, "22:30")).toBe(0);
    expect(limiteFascia([R(0, [4], "22:00", "23:00")], 40, orario, VEN, "21:30")).toBe(40);
  });
  it("gli intervalli dopo la mezzanotte: 23:30–01:00 comprende 00:00 e 00:30", () => {
    const r = [R(10, [], "23:30", "01:00")];
    for (const ora of ["23:30", "00:00", "00:30", "01:00"]) expect(regolaVale(r[0], { ...orario, chiusura: "02:00" }, VEN, ora), ora).toBe(true);
    expect(regolaVale(r[0], { ...orario, chiusura: "02:00" }, VEN, "23:00")).toBe(false);
  });
  it("riassunto del giorno: fasce vicine con lo stesso limite unite", () => {
    const r = [R(40), R(20, [4], "20:00", "21:00")];
    expect(riassuntoGiorno(r, null, { ...orario, chiusura: "23:00" }, VEN)).toEqual([
      { da: "19:00", a: "19:30", limite: 40 },
      { da: "20:00", a: "21:00", limite: 20 },
      { da: "21:30", a: "22:00", limite: 40 },
    ]);
    expect(riassuntoGiorno([], null, { ...orario, chiuso: true }, VEN)).toEqual([]);
    expect(testoLimite(null)).toBe("nessun limite");
    expect(testoLimite(0)).toBe("nessuna prenotazione online");
    expect(testoLimite(30)).toBe("30 coperti");
  });
});

describe("le regole nella disponibilità e nelle prenotazioni", () => {
  const orari: Orario[] = [0, 1, 2, 3, 4, 5, 6].map((giorno) => ({ giorno, chiuso: false, apertura: "19:00", chiusura: "23:30" }));
  const adesso = new Date("2026-11-14T11:00:00Z");
  const regole = [R(6, [4], "20:00", "20:30"), R(0, [4], "22:00", "22:30")];
  const prenotazioni = [{ data: VEN, ora: "20:00", persone: 4, stato: "confermata" }];
  const base = { nome: "Mario", telefono: "333 1234567", data: VEN, ora: "20:00", persone: 2, note: "" };

  it("le fasce con limite pieno o a zero risultano non libere", () => {
    const d = disponibilita({ orari, chiusure: [], prenotazioni: [{ ...prenotazioni[0], persone: 6 }], regole, copertiMax: null, data: VEN, adesso });
    const stato = (ora: string) => d.fasce.find((f) => f.ora === ora)?.libera;
    expect(stato("20:00")).toBe(false); // 6 su 6
    expect(stato("20:30")).toBe(true); // regola 6, nessuno
    expect(stato("22:00")).toBe(false); // limite 0
    expect(stato("21:00")).toBe(true); // nessuna regola, nessun limite
  });
  it("la prenotazione rispetta il limite della fascia, non solo quello generale", () => {
    expect(validaPrenotazione(base, orari, adesso, { prenotazioni, regole, copertiMax: 100 }).ok).toBe(true); // 4+2 = 6
    expect(validaPrenotazione({ ...base, persone: 3 }, orari, adesso, { prenotazioni, regole, copertiMax: 100 }).ok).toBe(false); // 4+3 > 6
    const r0 = validaPrenotazione({ ...base, ora: "22:00" }, orari, adesso, { prenotazioni: [], regole, copertiMax: 100 });
    expect(!r0.ok && r0.errori.ora).toContain("al completo");
    expect(validaPrenotazione({ ...base, ora: "21:00", persone: 9 }, orari, adesso, { prenotazioni: [], regole, copertiMax: 100 }).ok).toBe(true);
  });
  it("senza regole continua a valere il limite generale di prima", () => {
    expect(validaPrenotazione({ ...base, persone: 3 }, orari, adesso, { prenotazioni, copertiMax: 6 }).ok).toBe(false);
    expect(validaPrenotazione({ ...base, persone: 2 }, orari, adesso, { prenotazioni, copertiMax: 6 }).ok).toBe(true);
  });
});

describe("validazione di una regola", () => {
  it("accetta giorni, orari e limite validi; ordina e toglie i doppioni", () => {
    const r = validaLimite({ giorni: [5, 4, 4], ora_da: "20:00", ora_a: "22:00", max_coperti: "30" });
    expect(r.ok && r.valore).toEqual({ giorni: [4, 5], ora_da: "20:00", ora_a: "22:00", max_coperti: 30 });
  });
  it("tutti i giorni e tutto il giorno: liste e orari vuoti; il limite 0 è ammesso", () => {
    const r = validaLimite({ max_coperti: 0 });
    expect(r.ok && r.valore).toEqual({ giorni: [], ora_da: null, ora_a: null, max_coperti: 0 });
  });
  it("rifiuta giorni, orari e limiti sbagliati", () => {
    for (const x of [
      { giorni: [7], max_coperti: 10 },
      { giorni: [-1], max_coperti: 10 },
      { ora_da: "20:00", max_coperti: 10 },
      { ora_da: "25:00", ora_a: "21:00", max_coperti: 10 },
      { max_coperti: "" },
      { max_coperti: -1 },
      { max_coperti: 501 },
      { max_coperti: 2.5 },
      { max_coperti: "abc" },
    ]) expect(validaLimite(x).ok, JSON.stringify(x)).toBe(false);
  });
});
