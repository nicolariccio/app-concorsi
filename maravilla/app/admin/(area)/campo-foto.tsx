"use client";

import { useRef, useState } from "react";

const LATO_MAX = 1600;

/** Ridimensiona nel browser: lato lungo 1600 px, JPEG. Risparmia dati e toglie i dati nascosti della foto (posizione). */
async function ridimensiona(file: File): Promise<Blob> {
  const img = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scala = Math.min(1, LATO_MAX / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scala);
  canvas.height = Math.round(img.height * scala);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  return await new Promise<Blob>((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error("conversione"))), "image/jpeg", 0.82));
}

export function CampoFoto({
  id,
  etichetta,
  anteprimaIniziale,
  onCambia,
  forma = "quadrata",
}: {
  id: string;
  etichetta: string;
  anteprimaIniziale: string;
  onCambia: (percorso: string) => void;
  forma?: "quadrata" | "arco";
}) {
  const [anteprima, setAnteprima] = useState(anteprimaIniziale);
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function scegli(file: File | undefined) {
    if (!file) return;
    setErrore("");
    setOccupato(true);
    try {
      let blob: Blob;
      try {
        blob = await ridimensiona(file);
      } catch {
        setErrore("Non riesco a leggere questa foto. Prova con un'altra.");
        return;
      }
      const res = await fetch("/api/admin/foto", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: blob }).catch(() => null);
      if (res?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const json = res ? await res.json().catch(() => ({})) : {};
      if (!res || !res.ok) {
        setErrore(json.messaggio || "Connessione assente, riprova");
        return;
      }
      setAnteprima(json.url);
      onCambia(json.percorso);
    } finally {
      setOccupato(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p className="etichetta">{etichetta}</p>
      <div className="flex items-center gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden border border-bordo bg-notte text-xs text-salvia ${
            forma === "arco" ? "h-28 w-24 rounded-t-[999px] rounded-b-xl" : "h-24 w-24 rounded-xl"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {anteprima ? <img src={anteprima} alt="" className="h-full w-full object-cover" /> : "Nessuna foto"}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={id} className={`bottone-piccolo cursor-pointer ${occupato ? "opacity-60" : ""}`}>
            {occupato ? "Carico…" : anteprima ? "Cambia foto" : "Scegli foto"}
          </label>
          <input id={id} ref={input} type="file" accept="image/*" className="sr-only" disabled={occupato} onChange={(e) => scegli(e.target.files?.[0])} />
          {anteprima && (
            <button
              type="button"
              className="bottone-piccolo"
              disabled={occupato}
              onClick={() => {
                setAnteprima("");
                onCambia("");
              }}
            >
              Togli foto
            </button>
          )}
        </div>
      </div>
      {errore && <p className="errore">{errore}</p>}
      <p className="mt-1 text-xs text-salvia">La foto viene salvata quando premi Salva.</p>
    </div>
  );
}
