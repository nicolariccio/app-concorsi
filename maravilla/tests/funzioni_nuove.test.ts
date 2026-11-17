import { describe, expect, it } from "vitest";
import { disponibilita } from "../lib/disponibilita";
import { emailNuovaPrenotazione } from "../lib/emailTesto";
import { validaPrenotazione } from "../lib/prenotazione";
import type { Orario } from "../lib/tipi";
import { validaChiusura, validaLocale } from "../lib/validazione";
import { dataEstesa, linkWhatsApp, messaggioConferma, numeroWhatsApp } from "../lib/whatsapp";

const orari: Orario[] = [0, 1, 2, 3, 4, 5, 6].map((giorno) => ({ giorno, chiuso: giorno === 0, apertura: "19:00", chiusura: "23:00" }));
// sabato 14 novembre 2026, ore 12:00 a Roma
const adesso = new Date("2026-11-14T11:00:00Z");
const venerdi = "2026-11-20";
const base = { nome: "Mario", telefono: "333 1234567", data: venerdi, ora: "20:00", persone: 4, note: "" };

describe("WhatsApp", () => {
  it("normalizza i numeri italiani e internazionali", () => {
    expect(numeroWhatsApp("333 123 4567")).toBe("393331234567");
    expect(numeroWhatsApp("081 1234567")).toBe("390811234567");
    expect(numeroWhatsApp("+39 333 1234567")).toBe("393331234567");
    expect(numeroWhatsApp("0044 7700 900123")).toBe("447700900123");
    expect(numeroWhatsApp("+44 7700 900123")).toBe("447700900123");
    expect(numeroWhatsApp("abc")).toBeNull();
    expect(numeroWhatsApp("123")).toBeNull();
  });
  it("scrive il messaggio di conferma in italiano", () => {
    expect(dataEstesa("2026-11-20")).toBe("venerdì 20 novembre");
    expect(messaggioConferma({ nome: "Mario", data: venerdi, ora: "20:30", persone: 4 }, "Maravilla")).toBe(
      "Ciao Mario, la tua prenotazione da Maravilla per venerdì 20 novembre alle 20:30, 4 persone, è confermata. A presto!",
    );
    expect(messaggioConferma({ nome: "Anna", data: venerdi, ora: "20:30", persone: 1 }, "Maravilla")).toContain("1 persona,");
  });
  it("il link codifica il testo e rifiuta numeri non validi", () => {
    const l = linkWhatsApp(base, "Maravilla");
    expect(l?.startsWith("https://wa.me/393331234567?text=")).toBe(true);
    expect(l).not.toContain(" ");
    expect(linkWhatsApp({ ...base, telefono: "boh" }, "Maravilla")).toBeNull();
  });
});

describe("email al gestore", () => {
  it("contiene i dati della prenotazione e le note solo se ci sono", () => {
    const e = emailNuovaPrenotazione({ ...base, note: "Seggiolone" }, "Maravilla");
    expect(e.subject).toBe("Prenotazione: venerdì 20 novembre 20:00, 4 persone");
    expect(e.text).toContain("Telefono: 333 1234567");
    expect(e.text).toContain("Note: Seggiolone");
    expect(emailNuovaPrenotazione(base, "Maravilla").text).not.toContain("Note:");
  });
});

describe("disponibilità, coperti e chiusure", () => {
  const prenotazioni = [
    { data: venerdi, ora: "20:00", persone: 6, stato: "confermata" },
    { data: venerdi, ora: "20:00", persone: 4, stato: "in_attesa" },
    { data: venerdi, ora: "20:30", persone: 8, stato: "annullata" },
  ];
  it("segna al completo la fascia che ha raggiunto il limite, ignorando le annullate", () => {
    const d = disponibilita({ orari, chiusure: [], prenotazioni, copertiMax: 10, data: venerdi, adesso });
    expect(d.fasce.find((f) => f.ora === "20:00")?.libera).toBe(false);
    expect(d.fasce.find((f) => f.ora === "20:30")?.libera).toBe(true);
  });
  it("senza limite tutte le fasce sono libere", () => {
    const d = disponibilita({ orari, chiusure: [], prenotazioni, copertiMax: null, data: venerdi, adesso });
    expect(d.fasce.every((f) => f.libera)).toBe(true);
  });
  it("una chiusura straordinaria blocca il giorno e riporta il motivo", () => {
    const chiusure = [{ id: "x", dal: "2026-11-19", al: "2026-11-21", motivo: "Ferie" }];
    const d = disponibilita({ orari, chiusure, prenotazioni: [], copertiMax: null, data: venerdi, adesso });
    expect(d).toMatchObject({ chiuso: true, motivo: "Ferie", fasce: [] });
    expect(disponibilita({ orari, chiusure, prenotazioni: [], copertiMax: null, data: "2026-11-22", adesso }).chiuso).toBe(false);
  });
  it("oggi non si propongono le fasce già passate", () => {
    const sera = new Date("2026-11-14T19:45:00Z"); // 20:45 a Roma
    const d = disponibilita({ orari, chiusure: [], prenotazioni: [], copertiMax: null, data: "2026-11-14", adesso: sera });
    expect(d.fasce.map((f) => f.ora)).toEqual(["21:00", "21:30", "22:00"]);
  });
  it("la prenotazione rispetta limite e chiusure", () => {
    expect(validaPrenotazione({ ...base, persone: 4 }, orari, adesso, { prenotazioni, copertiMax: 10 }).ok).toBe(false);
    expect(validaPrenotazione({ ...base, persone: 4, ora: "20:30" }, orari, adesso, { prenotazioni, copertiMax: 10 }).ok).toBe(true);
    expect(validaPrenotazione({ ...base, persone: 5 }, orari, adesso, { prenotazioni: [], copertiMax: 4 }).ok).toBe(false);
    const chiusure = [{ id: "x", dal: venerdi, al: venerdi, motivo: "" }];
    const r = validaPrenotazione(base, orari, adesso, { chiusure });
    expect(!r.ok && r.errori.data).toBe("Quel giorno siamo chiusi");
  });
});

describe("validazione chiusure e coperti", () => {
  it("chiusura: date valide, fine non prima dell'inizio", () => {
    expect(validaChiusura({ dal: "2026-12-24", al: "2026-12-26", motivo: "Natale" }).ok).toBe(true);
    expect(validaChiusura({ dal: "2026-12-24" }).ok).toBe(true);
    expect(validaChiusura({ dal: "2026-12-26", al: "2026-12-24" }).ok).toBe(false);
    expect(validaChiusura({ dal: "domani" }).ok).toBe(false);
  });
  it("coperti massimi: numero positivo o vuoto", () => {
    const r = validaLocale({ nome: "M", coperti_max: "20" });
    expect(r.ok && r.valore.coperti_max).toBe(20);
    const v = validaLocale({ nome: "M", coperti_max: "" });
    expect(v.ok && v.valore.coperti_max).toBeNull();
    expect(validaLocale({ nome: "M", coperti_max: "0" }).ok).toBe(false);
    expect(validaLocale({ nome: "M", coperti_max: "abc" }).ok).toBe(false);
  });
});
