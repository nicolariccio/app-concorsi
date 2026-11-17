"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ALT, DURATA, LARG, PIATTO, PUNTI_BOMBA, PUNTI_COTOLETTA, muoviGiocatore, nuovoStato, passo, type Evento, type Oggetto, type Stato } from "@/lib/gioco";

const CHIAVE_RECORD = "maravilla_gioco_record";

function leggiRecord(): number {
  try {
    return Number(window.localStorage.getItem(CHIAVE_RECORD)) || 0;
  } catch {
    return 0;
  }
}
function salvaRecord(punti: number) {
  try {
    window.localStorage.setItem(CHIAVE_RECORD, String(punti));
  } catch {
    /* il record resta solo per questa partita */
  }
}

// Su iPhone più vecchi roundRect non esiste: si ripiega su un rettangolo.
function rettangolo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof c.roundRect === "function") c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

// ---- disegno: tutto con forme semplici, nessuna immagine da caricare ----
// Generatore casuale con seme fisso: ogni cotoletta ha sempre la stessa panatura.
function casuale(seme: number) {
  let x = seme;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

const LARG_SPRITE = 78;
const ALT_SPRITE = 58;
const SCALA_SPRITE = 3; // disegnata più grande e rimpicciolita: resta nitida sugli schermi retina
let sprite: HTMLCanvasElement[] | null = null;

/** Una cotoletta disegnata una volta sola: sagoma irregolare, doratura, panatura, bordo fritto e riflesso. */
function creaCotoletta(seme: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = LARG_SPRITE * SCALA_SPRITE;
  cv.height = ALT_SPRITE * SCALA_SPRITE;
  const c = cv.getContext("2d")!;
  c.scale(SCALA_SPRITE, SCALA_SPRITE);
  c.translate(LARG_SPRITE / 2, ALT_SPRITE / 2);
  const r = casuale(seme);

  // sagoma di una fetta battuta: ovale schiacciato e un po' storto, non un rettangolo
  const dx = (r() - 0.5) * 3;
  const dy = (r() - 0.5) * 3;
  const forma = () => {
    c.beginPath();
    c.moveTo(-22 + dx, -2);
    c.bezierCurveTo(-23, -15 + dy, -8, -19, 4, -18 + dy);
    c.bezierCurveTo(16, -17, 24 - dx, -9, 22, 2);
    c.bezierCurveTo(21, 13 + dy, 8, 19, -5 + dx, 17);
    c.bezierCurveTo(-16, 15, -22 - dx, 9, -22 + dx, -2);
    c.closePath();
  };

  // l'osso della milanese che esce da un lato: è quello che fa "leggere" subito una cotoletta
  c.save();
  c.lineCap = "round";
  c.strokeStyle = "#A99468";
  c.lineWidth = 6.4;
  c.beginPath();
  c.moveTo(-16, 8);
  c.lineTo(-29, 12);
  c.stroke();
  c.strokeStyle = "#F1E8CF";
  c.lineWidth = 4.4;
  c.stroke();
  for (const [x, y] of [[-31, 9.5], [-31.5, 15]]) {
    c.fillStyle = "#F1E8CF";
    c.strokeStyle = "#A99468";
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(x, y, 3.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }
  c.restore();

  // ombra morbida sotto
  c.save();
  c.shadowColor = "rgba(0,0,0,0.5)";
  c.shadowBlur = 7;
  c.shadowOffsetY = 3;
  forma();
  c.fillStyle = "#B47A30";
  c.fill();
  c.restore();

  // doratura: più chiara al centro, più scura verso il bordo
  const g = c.createRadialGradient(-6, -6, 2, 0, 0, 30);
  g.addColorStop(0, "#F2D078");
  g.addColorStop(0.55, "#DEAA50");
  g.addColorStop(1, "#B67C32");
  forma();
  c.fillStyle = g;
  c.fill();

  c.save();
  forma();
  c.clip();

  // briciole di pangrattato, chiare e scure
  for (let i = 0; i < 130; i++) {
    const x = (r() - 0.5) * 50;
    const y = (r() - 0.5) * 40;
    const raggio = 0.5 + r() * 1.5;
    c.fillStyle = r() < 0.5 ? `rgba(255,238,176,${0.25 + r() * 0.45})` : `rgba(118,68,18,${0.2 + r() * 0.4})`;
    c.beginPath();
    c.ellipse(x, y, raggio * (1 + r()), raggio, r() * Math.PI, 0, Math.PI * 2);
    c.fill();
  }
  // bolle della frittura: piccoli rilievi chiari con l'ombra dal lato opposto
  for (let i = 0; i < 5; i++) {
    const x = (r() - 0.5) * 34;
    const y = (r() - 0.5) * 26;
    const raggio = 2.5 + r() * 3;
    c.fillStyle = "rgba(120,70,20,0.18)";
    c.beginPath();
    c.arc(x + 1, y + 1, raggio, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,230,150,0.28)";
    c.beginPath();
    c.arc(x - 0.5, y - 0.5, raggio * 0.8, 0, Math.PI * 2);
    c.fill();
  }
  // bordo più cotto e croccante, dentro la sagoma
  forma();
  c.lineWidth = 7;
  c.strokeStyle = "rgba(110,60,15,0.42)";
  c.stroke();
  // riflesso di luce in alto a sinistra
  const luce = c.createRadialGradient(-9, -9, 1, -9, -9, 16);
  luce.addColorStop(0, "rgba(255,248,210,0.55)");
  luce.addColorStop(1, "rgba(255,248,210,0)");
  c.fillStyle = luce;
  c.fillRect(-30, -30, 60, 60);
  c.restore();

  forma();
  c.lineWidth = 1.6;
  c.strokeStyle = "#8F5A22";
  c.stroke();
  return cv;
}

function disegnaCotoletta(c: CanvasRenderingContext2D, o: Oggetto, t: number) {
  if (!sprite) sprite = [11, 23, 37].map(creaCotoletta);
  const immagine = sprite[o.id % sprite.length];
  const k = (o.r / 20) * 1.12; // un po' più grande della zona di presa: si legge meglio sul telefono
  c.save();
  c.translate(o.x, o.y);
  c.rotate(Math.sin(t * 3 + o.id) * 0.25 + o.giro);
  c.drawImage(immagine, (-LARG_SPRITE / 2) * k, (-ALT_SPRITE / 2) * k, LARG_SPRITE * k, ALT_SPRITE * k);
  c.restore();
}

function disegnaBomba(c: CanvasRenderingContext2D, o: Oggetto, t: number) {
  c.save();
  c.translate(o.x, o.y);
  c.fillStyle = "#171717";
  c.strokeStyle = "#F4EFE3";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, o.r, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = "rgba(244,239,227,0.35)";
  c.beginPath();
  c.arc(-o.r * 0.35, -o.r * 0.35, o.r * 0.28, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#F4EFE3";
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(o.r * 0.4, -o.r * 0.85);
  c.quadraticCurveTo(o.r * 0.9, -o.r * 1.5, o.r * 0.5, -o.r * 1.8);
  c.stroke();
  const lampo = 3 + Math.sin(t * 20 + o.id) * 1.5; // la miccia che scintilla
  c.fillStyle = "#FF6A3D";
  c.beginPath();
  c.arc(o.r * 0.5, -o.r * 1.8, lampo, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export function Gioco() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stato = useRef<Stato>(nuovoStato());
  const bersaglio = useRef(LARG / 2);
  const tasti = useRef({ sinistra: false, destra: false });
  const lampo = useRef({ colore: "", forza: 0 });
  const scoppi = useRef<{ x: number; y: number; testo: string; vita: number; colore: string }[]>([]);
  const gira = useRef(false);
  const [fase, setFase] = useState<"pronto" | "gioco" | "fine">("pronto");
  const [punti, setPunti] = useState(0);
  const [tempoResto, setTempoResto] = useState(DURATA);
  const [record, setRecord] = useState(0);
  const [nuovoRecord, setNuovoRecord] = useState(false);
  const [riepilogo, setRiepilogo] = useState({ prese: 0, bombe: 0 });
  const [durata, setDurata] = useState(DURATA);

  useEffect(() => {
    setRecord(leggiRecord());
    // ?durata=10 accorcia la partita (serve per provare il gioco)
    const d = Number(new URLSearchParams(window.location.search).get("durata"));
    if (d >= 5 && d <= 120) setDurata(d);
  }, []);

  const disegna = useCallback((t: number) => {
    const el = canvas.current;
    const c = el?.getContext("2d");
    if (!el || !c) return;
    const s = stato.current;
    c.setTransform(el.width / LARG, 0, 0, el.height / ALT, 0, 0);
    c.clearRect(0, 0, LARG, ALT);
    c.fillStyle = "#0E1F11";
    c.fillRect(0, 0, LARG, ALT);
    c.fillStyle = "#12291A";
    for (let i = 0; i < 6; i++) c.fillRect(0, i * 100 + ((t * 20) % 100) - 100, LARG, 40); // strisce che scorrono piano
    for (const o of s.oggetti) (o.tipo === "cotoletta" ? disegnaCotoletta : disegnaBomba)(c, o, t);
    // piatto
    c.fillStyle = "#F4EFE3";
    c.beginPath();
    rettangolo(c, s.giocatoreX - PIATTO.larg / 2, PIATTO.y, PIATTO.larg, PIATTO.alt, 8);
    c.fill();
    c.fillStyle = "#D8BE82";
    c.fillRect(s.giocatoreX - PIATTO.larg / 2 + 10, PIATTO.y + 5, PIATTO.larg - 20, 3);
    // punti che volano
    c.font = "700 18px Jost, system-ui, sans-serif";
    c.textAlign = "center";
    for (const p of scoppi.current) {
      c.globalAlpha = Math.max(0, p.vita);
      c.fillStyle = p.colore;
      c.fillText(p.testo, p.x, p.y - (1 - p.vita) * 40);
    }
    c.globalAlpha = 1;
    if (lampo.current.forza > 0) {
      c.fillStyle = lampo.current.colore;
      c.globalAlpha = lampo.current.forza * 0.35;
      c.fillRect(0, 0, LARG, ALT);
      c.globalAlpha = 1;
    }
  }, []);

  const avvia = useCallback(() => {
    stato.current = nuovoStato(durata);
    bersaglio.current = LARG / 2;
    scoppi.current = [];
    lampo.current = { colore: "", forza: 0 };
    setPunti(0);
    setTempoResto(durata);
    setNuovoRecord(false);
    setFase("gioco");
  }, [durata]);

  // ciclo di gioco
  useEffect(() => {
    if (fase !== "gioco") return;
    gira.current = true;
    let ultimo = performance.now();
    let id = 0;
    let ultimoMostrato = -1;

    const ciclo = (ora: number) => {
      if (!gira.current) return;
      const dt = (ora - ultimo) / 1000;
      ultimo = ora;
      const s = stato.current;
      // tastiera: il piatto scorre; dito o mouse: segue il bersaglio
      const dir = (tasti.current.destra ? 1 : 0) - (tasti.current.sinistra ? 1 : 0);
      if (dir !== 0) bersaglio.current += dir * 460 * dt;
      bersaglio.current = Math.min(LARG, Math.max(0, bersaglio.current));
      muoviGiocatore(s, bersaglio.current);

      const eventi: Evento[] = passo(s, dt);
      for (const e of eventi) {
        const bomba = e.tipo === "bomba";
        scoppi.current.push({ x: e.x, y: PIATTO.y - 6, testo: bomba ? `${PUNTI_BOMBA}` : `+${PUNTI_COTOLETTA}`, vita: 1, colore: bomba ? "#FF6A3D" : "#F4EFE3" });
        lampo.current = { colore: bomba ? "#FF3B30" : "#D8BE82", forza: bomba ? 1 : 0.4 };
      }
      scoppi.current = scoppi.current.map((p) => ({ ...p, vita: p.vita - dt * 1.6 })).filter((p) => p.vita > 0);
      lampo.current.forza = Math.max(0, lampo.current.forza - dt * 3);
      disegna(ora / 1000);

      const resto = Math.ceil(s.durata - s.tempo);
      if (resto !== ultimoMostrato) {
        ultimoMostrato = resto;
        setTempoResto(resto);
      }
      setPunti(s.punti);

      if (s.finito) {
        gira.current = false;
        const migliore = leggiRecord();
        if (s.punti > migliore) {
          salvaRecord(s.punti);
          setRecord(s.punti);
          setNuovoRecord(s.punti > 0);
        }
        setRiepilogo({ prese: s.prese, bombe: s.bombe });
        setFase("fine");
        return;
      }
      id = requestAnimationFrame(ciclo);
    };
    id = requestAnimationFrame(ciclo);

    // se la scheda passa in secondo piano il gioco si ferma da solo
    const nascosta = () => {
      if (document.hidden) ultimo = performance.now();
    };
    document.addEventListener("visibilitychange", nascosta);
    return () => {
      gira.current = false;
      cancelAnimationFrame(id);
      document.removeEventListener("visibilitychange", nascosta);
    };
  }, [fase, disegna]);

  // controlli: dito o mouse sull'area di gioco, frecce o A/D da tastiera
  useEffect(() => {
    const giu = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") tasti.current.sinistra = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") tasti.current.destra = true;
      if (stato.current && (e.key === "ArrowLeft" || e.key === "ArrowRight") && gira.current) e.preventDefault();
    };
    const su = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") tasti.current.sinistra = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") tasti.current.destra = false;
    };
    window.addEventListener("keydown", giu);
    window.addEventListener("keyup", su);
    return () => {
      window.removeEventListener("keydown", giu);
      window.removeEventListener("keyup", su);
    };
  }, []);

  useEffect(() => {
    disegna(0); // quadro iniziale: il piatto, senza oggetti
  }, [disegna, fase]);

  function segui(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    bersaglio.current = ((e.clientX - r.left) / r.width) * LARG;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between" aria-live="off">
        <p className="font-display text-3xl font-bold tabular-nums">
          {punti} <span className="font-sans text-sm font-medium text-salvia">punti</span>
        </p>
        <p className="text-sm text-salvia">
          Record <span className="font-semibold text-panna tabular-nums">{record}</span> · <span className="tabular-nums">{tempoResto}</span> s
        </p>
      </div>

      <div className="relative mx-auto w-full" style={{ maxWidth: `min(100%, calc((100svh - 250px) * ${LARG / ALT}))` }}>
        <canvas
          ref={canvas}
          width={LARG * 2}
          height={ALT * 2}
          role="img"
          aria-label="Area di gioco: sposta il piatto per prendere le cotolette ed evitare le bombe"
          onPointerDown={(e) => { segui(e); e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={segui}
          className="block w-full touch-none select-none rounded-2xl border border-bordo"
          style={{ aspectRatio: `${LARG} / ${ALT}` }}
        />
        {fase !== "gioco" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-notte/90 p-6 text-center">
            {fase === "pronto" ? (
              <>
                <p className="font-display text-3xl font-bold leading-tight">Prendi le cotolette, evita le bombe</p>
                <p className="text-salvia">
                  Ogni cotoletta vale +{PUNTI_COTOLETTA}, ogni bomba toglie {Math.abs(PUNTI_BOMBA)}. Hai {durata} secondi. Trascina il dito per muovere il piatto.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-5xl font-bold">{punti} punti</p>
                {nuovoRecord && <p className="font-semibold text-oro">Nuovo record!</p>}
                <p className="text-salvia">
                  {riepilogo.prese} cotolette prese, {riepilogo.bombe} {riepilogo.bombe === 1 ? "bomba" : "bombe"}.
                </p>
              </>
            )}
            <button type="button" className="bottone" onClick={avvia}>{fase === "pronto" ? "Gioca" : "Gioca ancora"}</button>
            {fase === "fine" && (
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/prenota" className="bottone-piccolo">Prenota un tavolo</Link>
                <Link href="/menu" className="bottone-piccolo">Guarda il menu</Link>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="hidden text-center text-xs text-salvia sm:block">Con la tastiera: frecce sinistra e destra.</p>
    </div>
  );
}
