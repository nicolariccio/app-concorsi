// Minigioco "Cotolette dal cielo": logica pura, senza disegno né input, così si prova nei test.
export const LARG = 360;
export const ALT = 560;
export const DURATA = 45; // secondi
export const PIATTO = { larg: 84, alt: 16, y: 508 };
export const PUNTI_COTOLETTA = 10;
export const PUNTI_BOMBA = -25;

export type Tipo = "cotoletta" | "bomba";
export type Oggetto = { id: number; tipo: Tipo; x: number; y: number; r: number; v: number; giro: number };
export type Stato = {
  tempo: number; // secondi trascorsi
  durata: number;
  punti: number;
  giocatoreX: number; // centro del piatto
  oggetti: Oggetto[];
  prossimoSpawn: number;
  prossimoId: number;
  prese: number;
  bombe: number;
  finito: boolean;
};
export type Evento = { tipo: "presa" | "bomba"; x: number; y: number };

export function nuovoStato(durata = DURATA): Stato {
  return { tempo: 0, durata, punti: 0, giocatoreX: LARG / 2, oggetti: [], prossimoSpawn: 0.5, prossimoId: 1, prese: 0, bombe: 0, finito: false };
}

/** Cresce dal facile (inizio) al difficile (fine): oggetti più veloci, più frequenti, più bombe. */
export function difficolta(avanzamento: number) {
  const a = Math.min(1, Math.max(0, avanzamento));
  return { intervallo: 0.9 - 0.5 * a, probBomba: 0.25 + 0.15 * a, velocita: 170 + 170 * a };
}

export function muoviGiocatore(s: Stato, x: number) {
  const meta = PIATTO.larg / 2;
  s.giocatoreX = Math.min(LARG - meta, Math.max(meta, x));
}

/** Fa avanzare il gioco di `dt` secondi. `rng` restituisce numeri tra 0 e 1. */
export function passo(s: Stato, dt: number, rng: () => number = Math.random): Evento[] {
  const eventi: Evento[] = [];
  if (s.finito) return eventi;
  dt = Math.min(dt, 0.05); // un salto lungo (scheda in secondo piano) non deve far saltare oggetti

  s.tempo = Math.min(s.durata, s.tempo + dt);
  const d = difficolta(s.tempo / s.durata);

  s.prossimoSpawn -= dt;
  while (s.prossimoSpawn <= 0 && s.tempo < s.durata) {
    const tipo: Tipo = rng() < d.probBomba ? "bomba" : "cotoletta";
    const r = tipo === "bomba" ? 16 : 20;
    s.oggetti.push({
      id: s.prossimoId++,
      tipo,
      r,
      x: r + rng() * (LARG - 2 * r),
      y: -r,
      v: d.velocita * (0.85 + rng() * 0.3),
      giro: (rng() - 0.5) * 0.8,
    });
    s.prossimoSpawn += d.intervallo;
  }

  const sinistra = s.giocatoreX - PIATTO.larg / 2;
  const destra = s.giocatoreX + PIATTO.larg / 2;
  s.oggetti = s.oggetti.filter((o) => {
    o.y += o.v * dt;
    const sulPiatto = o.y + o.r >= PIATTO.y && o.y - o.r <= PIATTO.y + PIATTO.alt && o.x + o.r * 0.6 >= sinistra && o.x - o.r * 0.6 <= destra;
    if (sulPiatto) {
      if (o.tipo === "cotoletta") {
        s.punti += PUNTI_COTOLETTA;
        s.prese++;
        eventi.push({ tipo: "presa", x: o.x, y: o.y });
      } else {
        s.punti = Math.max(0, s.punti + PUNTI_BOMBA); // non si scende sotto zero
        s.bombe++;
        eventi.push({ tipo: "bomba", x: o.x, y: o.y });
      }
      return false;
    }
    return o.y - o.r <= ALT; // fuori dallo schermo: sparisce senza penalità
  });

  if (s.tempo >= s.durata) {
    s.finito = true;
    s.oggetti = [];
  }
  return eventi;
}
