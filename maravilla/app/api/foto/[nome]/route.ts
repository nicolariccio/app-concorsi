import { NextResponse } from "next/server";
import { leggiFotoLocale } from "@/lib/foto";
import { RE_FOTO } from "@/lib/fotoUrl";

// Solo prove locali: con Supabase le foto si leggono direttamente dal suo indirizzo pubblico.
export async function GET(_req: Request, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params;
  if (process.env.SUPABASE_URL || !RE_FOTO.test(nome)) return new NextResponse(null, { status: 404 });
  const dati = await leggiFotoLocale(nome);
  if (!dati) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(dati), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" } });
}
