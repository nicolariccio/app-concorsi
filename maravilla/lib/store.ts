import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

export type Riga = Record<string, unknown>;

export class NonConfigurato extends Error {
  constructor() {
    super("Database non configurato");
  }
}

export interface Store {
  lista(tabella: string): Promise<Riga[]>;
  salva(tabella: string, righe: Riga[], chiave: string): Promise<void>;
  inserisci(tabella: string, riga: Riga): Promise<void>;
  aggiorna(tabella: string, campo: string, valore: string, modifiche: Riga): Promise<void>;
  elimina(tabella: string, campo: string, valore: string): Promise<void>;
}

function supabase(url: string, chiave: string): Store {
  const intestazioni = {
    apikey: chiave,
    Authorization: `Bearer ${chiave}`,
    "Content-Type": "application/json",
  };
  const base = `${url.replace(/\/$/, "")}/rest/v1`;
  async function chiama(percorso: string, init: RequestInit) {
    const res = await fetch(`${base}/${percorso}`, { ...init, cache: "no-store", headers: { ...intestazioni, ...(init.headers ?? {}) } });
    if (!res.ok) throw new Error(`Database: errore ${res.status}`);
    return res;
  }
  return {
    async lista(t) {
      return (await (await chiama(`${t}?select=*`, {})).json()) as Riga[];
    },
    async salva(t, righe, chiave) {
      await chiama(`${t}?on_conflict=${chiave}`, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(righe),
      });
    },
    async inserisci(t, riga) {
      await chiama(t, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(riga) });
    },
    async aggiorna(t, campo, valore, modifiche) {
      await chiama(`${t}?${campo}=eq.${encodeURIComponent(valore)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(modifiche),
      });
    },
    async elimina(t, campo, valore) {
      await chiama(`${t}?${campo}=eq.${encodeURIComponent(valore)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    },
  };
}

// Solo per sviluppo: un file JSON al posto di Supabase. In produzione non viene mai usato.
function file(): Store {
  const percorso = path.join(process.cwd(), ".dati", "dati.json");
  async function leggi(): Promise<Record<string, Riga[]>> {
    try {
      return JSON.parse(await fs.readFile(percorso, "utf8"));
    } catch {
      return {};
    }
  }
  async function scrivi(d: Record<string, Riga[]>) {
    await fs.mkdir(path.dirname(percorso), { recursive: true });
    await fs.writeFile(percorso, JSON.stringify(d, null, 2));
  }
  return {
    async lista(t) {
      return (await leggi())[t] ?? [];
    },
    async salva(t, righe, chiave) {
      const d = await leggi();
      const tab = d[t] ?? [];
      for (const r of righe) {
        const i = tab.findIndex((x) => x[chiave] === r[chiave]);
        if (i >= 0) tab[i] = { ...tab[i], ...r };
        else tab.push(r);
      }
      d[t] = tab;
      await scrivi(d);
    },
    async inserisci(t, riga) {
      const d = await leggi();
      d[t] = [...(d[t] ?? []), riga];
      await scrivi(d);
    },
    async aggiorna(t, campo, valore, modifiche) {
      const d = await leggi();
      d[t] = (d[t] ?? []).map((r) => (r[campo] === valore ? { ...r, ...modifiche } : r));
      await scrivi(d);
    },
    async elimina(t, campo, valore) {
      const d = await leggi();
      d[t] = (d[t] ?? []).filter((r) => r[campo] !== valore);
      // come "on delete cascade" nel database
      if (t === "categorie_menu") d.piatti = (d.piatti ?? []).filter((r) => r.categoria_id !== valore);
      await scrivi(d);
    },
  };
}

export function store(): Store {
  const url = process.env.SUPABASE_URL;
  const chiave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && chiave) return supabase(url, chiave);
  // Il file JSON è solo per prove locali: in sviluppo è automatico, altrimenti serve DATI_SU_FILE=1.
  if (process.env.NODE_ENV !== "production" || process.env.DATI_SU_FILE === "1") return file();
  throw new NonConfigurato();
}
