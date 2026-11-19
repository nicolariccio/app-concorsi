import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

// Una lettura minima, una volta al giorno (Vercel Cron): tiene "sveglio" il database gratuito.
// Se CRON_SECRET è impostato, Vercel lo manda in "Authorization" e qui si controlla.
export async function GET(req: Request) {
  const segreto = process.env.CRON_SECRET;
  if (segreto && req.headers.get("authorization") !== `Bearer ${segreto}`)
    return NextResponse.json({ messaggio: "Non autorizzato" }, { status: 401 });
  try {
    await store().cerca("locale", "id", "1", 1);
    return NextResponse.json({ ok: true });
  } catch {
    console.error("[cron] il database non risponde");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
