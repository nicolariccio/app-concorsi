import { getLocale, getOrari } from "@/lib/dati";
import { oggiRoma } from "@/lib/datetime";
import { MAX_PERSONE } from "@/lib/prenotazione";
import { PrenotaForm } from "./prenota-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prenota un tavolo · Maravilla" };

export default async function Prenota() {
  const [orari, locale] = await Promise.all([getOrari(), getLocale()]);
  if (orari.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-5xl font-semibold leading-none">Prenota un tavolo</h1>
        <p className="text-salvia">Le prenotazioni online non sono ancora attive.</p>
        {locale.telefono && (
          <a href={`tel:${locale.telefono.replace(/\s/g, "")}`} className="bottone">Chiama {locale.telefono}</a>
        )}
      </div>
    );
  }
  return <PrenotaForm orari={orari} oggi={oggiRoma()} maxPersone={MAX_PERSONE} />;
}
