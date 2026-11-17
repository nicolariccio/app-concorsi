import { describe, expect, it } from "vitest";
import { ALT, DURATA, LARG, PIATTO, PUNTI_BOMBA, PUNTI_COTOLETTA, difficolta, muoviGiocatore, nuovoStato, passo, type Oggetto } from "../lib/gioco";

const sequenza = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};
const oggetto = (tipo: "cotoletta" | "bomba", x: number, y: number, id = 1): Oggetto => ({ id, tipo, x, y, r: tipo === "bomba" ? 16 : 20, v: 200, giro: 0 });

describe("minigioco", () => {
  it("una cotoletta sul piatto dà punti", () => {
    const s = nuovoStato();
    s.prossimoSpawn = 99;
    muoviGiocatore(s, 180);
    s.oggetti = [oggetto("cotoletta", 180, PIATTO.y - 10)];
    const e = passo(s, 0.016);
    expect(s.punti).toBe(PUNTI_COTOLETTA);
    expect(s.prese).toBe(1);
    expect(e[0].tipo).toBe("presa");
    expect(s.oggetti).toHaveLength(0);
  });
  it("una bomba toglie punti, ma non si scende sotto zero", () => {
    const s = nuovoStato();
    s.prossimoSpawn = 99;
    muoviGiocatore(s, 180);
    s.punti = 40;
    s.oggetti = [oggetto("bomba", 180, PIATTO.y - 10)];
    expect(passo(s, 0.016)[0].tipo).toBe("bomba");
    expect(s.punti).toBe(40 + PUNTI_BOMBA);
    s.punti = 10;
    s.oggetti = [oggetto("bomba", 180, PIATTO.y - 10)];
    passo(s, 0.016);
    expect(s.punti).toBe(0);
    expect(s.bombe).toBe(2);
  });
  it("un oggetto lontano dal piatto cade senza effetti", () => {
    const s = nuovoStato();
    s.prossimoSpawn = 99;
    muoviGiocatore(s, 60);
    s.oggetti = [oggetto("cotoletta", 300, PIATTO.y - 10), oggetto("bomba", 300, PIATTO.y - 10, 2)];
    passo(s, 0.016);
    expect(s.punti).toBe(0);
    expect(s.oggetti).toHaveLength(2);
  });
  it("gli oggetti non presi spariscono in fondo, senza penalità", () => {
    const s = nuovoStato();
    s.prossimoSpawn = 99;
    muoviGiocatore(s, 40);
    s.oggetti = [oggetto("cotoletta", 320, ALT + 30)];
    passo(s, 0.016);
    expect(s.oggetti).toHaveLength(0);
    expect(s.punti).toBe(0);
  });
  it("il piatto resta dentro lo schermo", () => {
    const s = nuovoStato();
    muoviGiocatore(s, -500);
    expect(s.giocatoreX).toBe(PIATTO.larg / 2);
    muoviGiocatore(s, 9999);
    expect(s.giocatoreX).toBe(LARG - PIATTO.larg / 2);
  });
  it("compaiono oggetti nel tempo, sempre dentro lo schermo, bombe e cotolette", () => {
    const s = nuovoStato();
    let bombe = 0, cotolette = 0;
    for (let i = 0; i < 1400 && !s.finito; i++) {
      passo(s, 1 / 60);
      for (const o of s.oggetti) {
        expect(o.x - o.r).toBeGreaterThanOrEqual(0);
        expect(o.x + o.r).toBeLessThanOrEqual(LARG);
      }
    }
    const s2 = nuovoStato();
    for (let i = 0; i < 600; i++) {
      passo(s2, 1 / 60);
      bombe = Math.max(bombe, s2.oggetti.filter((o) => o.tipo === "bomba").length);
      cotolette = Math.max(cotolette, s2.oggetti.filter((o) => o.tipo === "cotoletta").length);
    }
    expect(bombe).toBeGreaterThan(0);
    expect(cotolette).toBeGreaterThan(0);
  });
  it("la partita finisce a tempo scaduto e poi non cambia più", () => {
    const s = nuovoStato(5);
    for (let i = 0; i < 400; i++) passo(s, 1 / 60);
    expect(s.finito).toBe(true);
    expect(s.tempo).toBe(5);
    expect(s.oggetti).toHaveLength(0);
    const punti = s.punti;
    passo(s, 1);
    expect(s.punti).toBe(punti);
  });
  it("un salto lungo di tempo non fa saltare oggetti né la partita", () => {
    const s = nuovoStato();
    s.prossimoSpawn = 99;
    s.oggetti = [oggetto("cotoletta", 300, 0)];
    passo(s, 10); // come se la scheda fosse rimasta ferma 10 secondi
    expect(s.tempo).toBeLessThanOrEqual(0.05);
    expect(s.oggetti[0].y).toBeLessThan(20);
  });
  it("la difficoltà cresce e resta nei limiti", () => {
    const a = difficolta(0), b = difficolta(1);
    expect(b.velocita).toBeGreaterThan(a.velocita);
    expect(b.intervallo).toBeLessThan(a.intervallo);
    expect(b.probBomba).toBeGreaterThan(a.probBomba);
    expect(difficolta(-3)).toEqual(a);
    expect(difficolta(9)).toEqual(b);
  });
  it("con un generatore fisso il gioco è ripetibile", () => {
    const a = nuovoStato(), b = nuovoStato();
    const r1 = sequenza(0.1, 0.5, 0.9, 0.3), r2 = sequenza(0.1, 0.5, 0.9, 0.3);
    for (let i = 0; i < 300; i++) {
      passo(a, 1 / 60, r1);
      passo(b, 1 / 60, r2);
    }
    expect(a.oggetti.map((o) => [o.tipo, Math.round(o.x), Math.round(o.y)])).toEqual(b.oggetti.map((o) => [o.tipo, Math.round(o.x), Math.round(o.y)]));
    expect(DURATA).toBe(45);
  });
});
