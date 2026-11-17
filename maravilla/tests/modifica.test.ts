import { describe, expect, it } from "vitest";
import { emailPrenotazione } from "../lib/emailTesto";
import { minutiAllaPrenotazione, modificabile, ORE_LIMITE } from "../lib/modificaPrenotazione";
import type { Orario } from "../lib/tipi";
import { messaggioConferma } from "../lib/whatsapp";

const orario: Orario = { giorno: 4, chiuso: false, apertura: "19:00", chiusura: "02:00" };
// venerdì 20 novembre 2026, ore 12:00 a Roma (11:00 UTC)
const adesso = new Date("2026-11-20T11:00:00Z");

describe("modifica della prenotazione da parte del cliente", () => {
  it("calcola i minuti mancanti, anche tra giorni diversi", () => {
    expect(minutiAllaPrenotazione("2026-11-20", "20:00", orario, adesso)).toBe(8 * 60);
    expect(minutiAllaPrenotazione("2026-11-21", "20:00", orario, adesso)).toBe(32 * 60);
    expect(minutiAllaPrenotazione("2026-11-20", "11:00", { ...orario, apertura: "10:00" }, adesso)).toBe(-60);
  });
  it("una fascia dopo mezzanotte conta come il giorno dopo", () => {
    // le 00:30 della prenotazione del venerdì sono 12 ore e 30 dopo le 12:00 di venerdì
    expect(minutiAllaPrenotazione("2026-11-20", "00:30", orario, adesso)).toBe(12 * 60 + 30);
  });
  it("si può cambiare fino a 3 ore prima, non dopo", () => {
    expect(modificabile({ data: "2026-11-20", ora: "20:00", stato: "confermata" }, orario, adesso).ok).toBe(true);
    // alle 17:30 mancano 2 ore e mezza alle 20:00
    const tardi = new Date("2026-11-20T16:30:00Z");
    const r = modificabile({ data: "2026-11-20", ora: "20:00", stato: "confermata" }, orario, tardi);
    expect(!r.ok && r.motivo).toContain(`${ORE_LIMITE} ore`);
    // esattamente 3 ore prima: ancora consentito
    expect(modificabile({ data: "2026-11-20", ora: "20:00", stato: "in_attesa" }, orario, new Date("2026-11-20T16:00:00Z")).ok).toBe(true);
  });
  it("una prenotazione passata o annullata non si tocca", () => {
    expect(modificabile({ data: "2026-11-19", ora: "20:00", stato: "confermata" }, orario, adesso).ok).toBe(false);
    const r = modificabile({ data: "2026-11-25", ora: "20:00", stato: "annullata" }, orario, adesso);
    expect(!r.ok && r.motivo).toBe("La prenotazione è già annullata.");
  });
});

describe("messaggi", () => {
  const p = { nome: "Mario", data: "2026-11-20", ora: "20:30", persone: 4, telefono: "333 1234567", note: "" };
  it("la conferma WhatsApp può includere il link per cambiare", () => {
    expect(messaggioConferma(p, "Maravilla")).not.toContain("http");
    expect(messaggioConferma(p, "Maravilla", "https://sito.it/prenotazione/abc")).toContain("Per cambiarla o annullarla: https://sito.it/prenotazione/abc A presto!");
  });
  it("le email al gestore distinguono nuova, modificata, annullata", () => {
    expect(emailPrenotazione("nuova", p, "Maravilla").subject).toMatch(/^Prenotazione:/);
    const m = emailPrenotazione("modificata", p, "Maravilla");
    expect(m.subject).toMatch(/^Modificata:/);
    expect(m.text).toContain("MODIFICATA dal cliente");
    expect(m.text).toContain("confermarla di nuovo");
    const a = emailPrenotazione("annullata", p, "Maravilla");
    expect(a.subject).toMatch(/^Annullata:/);
    expect(a.text).toContain("ANNULLATA dal cliente");
  });
});
