"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [errore, setErrore] = useState("");
  const [occupato, setOccupato] = useState(false);

  async function invia(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setOccupato(true);
    setErrore("");
    const password = String(new FormData(ev.currentTarget).get("password") ?? "");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setOccupato(false);
    if (res?.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      setErrore(res ? ((await res.json().catch(() => ({}))).messaggio ?? "Errore") : "Connessione assente");
    }
  }

  return (
    <form onSubmit={invia} className="space-y-4">
      <div>
        <label htmlFor="password" className="etichetta">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="campo" />
        {errore && <p className="errore">{errore}</p>}
      </div>
      <button type="submit" disabled={occupato} className="bottone w-full">{occupato ? "Accesso…" : "Entra"}</button>
    </form>
  );
}
