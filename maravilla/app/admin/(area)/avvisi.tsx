"use client";

import { useEffect, useState } from "react";

export function Avvisi() {
  const [avviso, setAvviso] = useState<{ testo: string; ok: boolean } | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const ascolta = (e: Event) => {
      setAvviso((e as CustomEvent).detail);
      clearTimeout(t);
      t = setTimeout(() => setAvviso(null), 3000);
    };
    window.addEventListener("avviso", ascolta);
    return () => {
      window.removeEventListener("avviso", ascolta);
      clearTimeout(t);
    };
  }, []);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center px-5">
      {avviso && (
        <p className={`rounded-full px-5 py-3 text-sm font-semibold shadow-lg ${avviso.ok ? "bg-panna text-notte" : "bg-errore text-notte"}`}>{avviso.testo}</p>
      )}
    </div>
  );
}
