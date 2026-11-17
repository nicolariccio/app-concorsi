// Chiamate dal pannello admin (solo lato browser).
export type EsitoApi = { ok: boolean; messaggio: string; errori: Record<string, string> };

export async function chiamaAdmin(metodo: "POST" | "DELETE", risorsa: string, corpo: unknown): Promise<EsitoApi> {
  try {
    const res = await fetch(`/api/admin/${risorsa}`, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return { ok: false, messaggio: "Accesso scaduto", errori: {} };
    }
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, messaggio: json.messaggio ?? "", errori: json.errori ?? {} };
  } catch {
    return { ok: false, messaggio: "Connessione assente, riprova", errori: {} };
  }
}
