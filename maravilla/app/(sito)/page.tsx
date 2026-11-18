import Link from "next/link";
import { getEventi, getLocale, getOrari } from "@/lib/dati";
import { urlFoto } from "@/lib/fotoUrl";
import { linkMappa, righeOrari } from "@/lib/orariTesto";
import { urlIncorporamento } from "@/lib/instagram";
import { OrdinaACasa } from "./ordina-a-casa";
import { UltimoReel } from "./ultimo-reel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [locale, orari, eventi] = await Promise.all([getLocale(), getOrari(), getEventi()]);
  const prossimo = eventi.find((e) => e.attivo && e.tipo === "evento");
  const righe = righeOrari(orari);
  const fotoHome = urlFoto(locale.foto_home);
  const incorporamento = urlIncorporamento(locale.link_reel);

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        {locale.claim && (
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-oro">{locale.claim}</p>
        )}
        <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight">Cotoletta e cocktail</h1>
        {locale.note && <p className="text-lg text-salvia">{locale.note}</p>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/prenota" className="bottone">Prenota un tavolo</Link>
          <Link href="/menu" className="bottone-vuoto">Guarda il menu</Link>
        </div>
      </section>

      <OrdinaACasa locale={locale} />

      {fotoHome && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotoHome} alt={`${locale.nome}`} className="mx-auto aspect-[4/5] w-full max-w-sm rounded-b-2xl rounded-t-[999px] object-cover" />
      )}

      {prossimo && (
        <Link href="/eventi" className="scheda block">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-oro">Prossima serata</p>
          <p className="mt-1 font-display text-2xl font-bold">{prossimo.titolo}</p>
          {prossimo.quando && <p className="text-sm text-salvia">{prossimo.quando}</p>}
        </Link>
      )}

      {incorporamento && <UltimoReel incorporamento={incorporamento} link={locale.link_reel} profilo={locale.instagram} />}

      {(locale.indirizzo || righe.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-3xl font-semibold">Dove e quando</h2>
          {locale.indirizzo && (
            <a href={linkMappa(locale.nome, locale.indirizzo)} target="_blank" rel="noopener noreferrer" className="scheda block hover:border-linea">
              <p>{locale.indirizzo}</p>
              <p className="mt-1 text-sm text-oro">Indicazioni</p>
            </a>
          )}
          {righe.length > 0 && (
            <dl className="scheda divide-y divide-bordo">
              {righe.map((r) => (
                <div key={r.giorno} className="flex justify-between py-2 first:pt-0 last:pb-0">
                  <dt className={r.oggi ? "font-semibold text-oro" : "text-salvia"}>{r.giorno}</dt>
                  <dd className="tabular-nums">{r.testo}</dd>
                </div>
              ))}
            </dl>
          )}
          {(locale.telefono || locale.instagram) && (
            <p className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {locale.telefono && <a href={`tel:${locale.telefono.replace(/\s/g, "")}`} className="text-oro">Chiama {locale.telefono}</a>}
              {locale.instagram && <a href={locale.instagram} target="_blank" rel="noopener noreferrer" className="text-oro">Instagram</a>}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
