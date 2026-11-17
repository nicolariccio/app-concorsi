import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, trovaCartaPerCodice } from "@/lib/dati";
import { COOKIE_CARTA, fedeltaAttiva } from "@/lib/fedelta";
import { IscrizioneForm } from "./iscrizione-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carta fedeltà · Maravilla", robots: { index: false } };

export default async function Carta() {
  const locale = await getLocale();
  if (!fedeltaAttiva(locale)) {
    return (
      <div className="space-y-4">
        <h1 className="text-5xl font-semibold leading-none">Carta fedeltà</h1>
        <p className="text-salvia">La carta fedeltà non è ancora attiva.</p>
      </div>
    );
  }

  // Chi ha già una carta su questo telefono ci torna direttamente.
  const codice = (await cookies()).get(COOKIE_CARTA)?.value;
  let esiste = false;
  if (codice) {
    try {
      esiste = (await trovaCartaPerCodice(codice)) !== null;
    } catch {
      esiste = false; // se il database non risponde si mostra il modulo
    }
  }
  if (esiste) redirect(`/carta/${codice}`);

  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-semibold leading-none">Carta fedeltà</h1>
      <p className="text-lg text-salvia">
        {locale.fedelta_timbri} timbri e ottieni: <span className="font-semibold text-panna">{locale.fedelta_premio}</span>.
        {locale.fedelta_regola && ` ${locale.fedelta_regola}.`}
      </p>
      <IscrizioneForm />
      <p className="text-xs text-salvia">
        Nome e telefono servono solo per la carta fedeltà. Puoi chiedere di cancellarli in qualsiasi momento. <Link href="/privacy" className="underline">Informativa</Link>
      </p>
    </div>
  );
}
