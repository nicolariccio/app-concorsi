import { getLocale, prenotazioniTra } from "@/lib/dati";
import { oggiRoma } from "@/lib/datetime";
import { origineSito } from "@/lib/sito";
import { richiediAdmin } from "./guard";
import { PrenotazioniAdmin } from "./prenotazioni-admin";

export const dynamic = "force-dynamic";

export default async function Prenotazioni() {
  await richiediAdmin();
  const oggi = oggiRoma();
  let righe, locale;
  try {
    [righe, locale] = await Promise.all([prenotazioniTra(oggi, "9999-12-31"), getLocale()]);
  } catch {
    return <p className="text-salvia">Non riesco a leggere le prenotazioni in questo momento. Riprova tra poco.</p>;
  }
  righe = righe.filter((p) => p.stato !== "annullata");
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-semibold">Prenotazioni</h1>
      <PrenotazioniAdmin righe={righe} oggi={oggi} nomeLocale={locale.nome} origine={await origineSito()} />
    </section>
  );
}
