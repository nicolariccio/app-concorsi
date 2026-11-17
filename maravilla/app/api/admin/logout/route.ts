import { NextResponse } from "next/server";
import { esci, origineOk } from "@/lib/auth";

export async function POST() {
  if (!(await origineOk())) return NextResponse.json({ messaggio: "Richiesta non valida" }, { status: 403 });
  await esci();
  return NextResponse.json({ ok: true });
}
