"use client";

import { useState } from "react";

/**
 * L'ultimo reel di Instagram. Il video di Instagram (Meta) non viene caricato finché il cliente non preme il pulsante:
 * così nessun dato va a Meta e nessun suo cookie si attiva senza una scelta.
 */
export function UltimoReel({ incorporamento, link, profilo }: { incorporamento: string; link: string; profilo: string }) {
  const [attivo, setAttivo] = useState(false);
  return (
    <section className="space-y-3" aria-label="Ultimo reel">
      <h2 className="text-3xl font-semibold">Dal nostro Instagram</h2>
      {attivo ? (
        <iframe
          src={incorporamento}
          title="Ultimo reel di Instagram"
          loading="lazy"
          allow="encrypted-media; picture-in-picture"
          className="mx-auto block w-full max-w-sm rounded-2xl border border-bordo bg-carta"
          style={{ height: "min(720px, 150vw)" }}
        />
      ) : (
        <div className="scheda mx-auto flex max-w-sm flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-panna text-notte" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          </span>
          <p className="font-display text-2xl font-bold leading-tight">L&apos;ultimo reel</p>
          <button type="button" className="bottone" onClick={() => setAttivo(true)}>Guarda il reel</button>
          <p className="text-xs text-salvia">Premendo, il video viene caricato da Instagram (Meta), che può usare i suoi cookie.</p>
        </div>
      )}
      <p className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm">
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-oro">Aprilo su Instagram</a>
        {profilo && <a href={profilo} target="_blank" rel="noopener noreferrer" className="text-oro">Seguici su Instagram</a>}
      </p>
    </section>
  );
}
