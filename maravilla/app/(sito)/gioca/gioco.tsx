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
function disegnaCotoletta(c: CanvasRenderingContext2D, o: Oggetto, t: number) {
  c.save();
  c.translate(o.x, o.y);
  c.rotate(Math.sin(t * 3 + o.id) * 0.25 + o.giro);
  c.fillStyle = "#D8BE82";
  c.strokeStyle = "#A8803A";
  c.lineWidth = 2.5;
  c.beginPath();
  rettangolo(c, -o.r, -o.r * 0.7, o.r * 2, o.r * 1.4, 11);
  c.fill();
  c.stroke();
  c.fillStyle = "#B9904A";
  for (const [dx, dy] of [[-8, -5], [3, -7], [9, 2], [-3, 4], [-11, 6]]) {
    c.beginPath();
    c.arc(dx, dy, 1.8, 0, Math.PI * 2);
    c.fill();
  }
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
