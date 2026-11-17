import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { percorsoSicuro } from "@/lib/fedelta";

export async function richiediAdmin() {
  if (await isAdmin()) return;
  const percorso = percorsoSicuro((await headers()).get("x-admin-path"));
  redirect(percorso === "/admin" || percorso === "/admin/login" ? "/admin/login" : `/admin/login?next=${encodeURIComponent(percorso)}`);
}
