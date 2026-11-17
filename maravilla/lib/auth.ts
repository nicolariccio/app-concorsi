import "server-only";
import { cookies, headers } from "next/headers";
import { creaSessione, DURATA_SESSIONE_S, origineAmmessa, passwordCorretta, sessioneValida } from "./sessione";

const NOME_COOKIE = "maravilla_admin";

/** L'admin funziona solo se password e segreto sono impostati: altrimenti nessuno entra. */
function configurato(): { password: string; segreto: string } | null {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const segreto = process.env.SESSION_SECRET ?? "";
  if (password.length < 8 || segreto.length < 16) return null;
  return { password, segreto };
}

export function adminConfigurato(): boolean {
  return configurato() !== null;
}

export async function isAdmin(): Promise<boolean> {
  const c = configurato();
  if (!c) return false;
  return sessioneValida((await cookies()).get(NOME_COOKIE)?.value, c.segreto);
}

export async function accedi(password: string): Promise<boolean> {
  const c = configurato();
  if (!c || !passwordCorretta(password, c.password)) return false;
  (await cookies()).set(NOME_COOKIE, creaSessione(c.segreto), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURATA_SESSIONE_S,
  });
  return true;
}

export async function esci() {
  (await cookies()).delete(NOME_COOKIE);
}

export async function origineOk(): Promise<boolean> {
  const h = await headers();
  return origineAmmessa(h.get("origin"), h.get("host"));
}
