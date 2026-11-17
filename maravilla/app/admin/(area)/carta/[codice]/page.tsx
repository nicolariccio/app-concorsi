import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, trovaCartaPerCodice } from "@/lib/dati";
import { fedeltaAttiva, statoCarta } from "@/lib/fedelta";
import { richiediAdmin } from "../../guard";
import { AzioniCarta } from "../azioni-carta";

export const dynamic = "force-dynamic";

// Pagina che si apre quando il personale inquadra il QR del cliente. Mostra soltanto: il timbro si dà con il pulsante.
export default async function CartaScansionata({ params }: { params: Promise<{ codice: string }> }) {
  await richiediAdmin();
  const { codice } = await params;
  let carta, locale;
  try {
    [carta, locale] = await Promise.all([trovaCartaPerCodice(codice), getLocale()]);
  } catch {
    return <p className="text-salvia">Non riesco a leggere la carta in questo momento. Riprova tra poco.</p>;
  }
  if (!carta) notFound();
  if (!fedeltaAttiva(locale)) return <p className="text-salvia">La carta fedeltà non è attiva: impostala in Info.</p>;
  const target = locale.fedelta_timbri as number;
  const { pieni, premioPronto } = statoCarta(carta.timbri, target);

  return (
    <section className="space-y-5">
      <h1 className="text-4xl font-semibold">{carta.nome}</h1>
      <p className="font-display text-5xl font-bold">
        {pieni}<span className="text-salvia"> / {target}</span>
      </p>
      {premioPronto && <p className="rounded-xl border border-oro p-3 text-oro">Premio pronto: {locale.fedelta_premio}</p>}
      <AzioniCarta id={carta.id} timbri={carta.timbri} target={target} nome={carta.nome} />
      <p className="text-sm text-salvia">Premi già riscattati: {carta.premi}</p>
      <Link href="/admin/carta" className="bottone-piccolo">Tutte le carte</Link>
    </section>
  );
}
