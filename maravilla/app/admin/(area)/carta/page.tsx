import { getLocale, listaCarte } from "@/lib/dati";
import { fedeltaAttiva } from "@/lib/fedelta";
import { origineSito } from "@/lib/sito";
import { richiediAdmin } from "../guard";
import { CarteAdmin } from "./carte-admin";

export const dynamic = "force-dynamic";
const LIMITE = 1000;

export default async function Carte() {
  await richiediAdmin();
  const locale = await getLocale();
  if (!fedeltaAttiva(locale)) {
    return (
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold">Carte fedeltà</h1>
        <p className="text-salvia">La carta fedeltà è spenta. Per attivarla imposta timbri e premio nella pagina Info.</p>
      </section>
    );
  }
  let carte;
  try {
    carte = await listaCarte();
  } catch {
    return <p className="text-salvia">Non riesco a leggere le carte in questo momento. Riprova tra poco.</p>;
  }
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-semibold">Carte fedeltà</h1>
      {carte.length >= LIMITE && <p className="errore">Mostro solo le prime {LIMITE} carte: usa la ricerca per nome o telefono.</p>}
      <CarteAdmin carte={carte.slice(0, LIMITE)} target={locale.fedelta_timbri as number} nomeLocale={locale.nome} origine={await origineSito()} />
    </section>
  );
}
