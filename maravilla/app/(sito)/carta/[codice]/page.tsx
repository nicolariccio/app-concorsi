import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, trovaCartaPerCodice } from "@/lib/dati";
import { fedeltaAttiva, statoCarta } from "@/lib/fedelta";
import { qrSvg } from "@/lib/qr";
import { origineSito } from "@/lib/sito";

export const dynamic = "force-dynamic";
export const metadata = { title: "La tua carta · Maravilla", robots: { index: false } };

export default async function CartaCliente({ params }: { params: Promise<{ codice: string }> }) {
  const { codice } = await params;
  let carta, locale;
  try {
    [carta, locale] = await Promise.all([trovaCartaPerCodice(codice), getLocale()]);
  } catch {
    // Un errore del database non deve sembrare "carta inesistente".
    return (
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold">La tua carta</h1>
        <p className="text-salvia">In questo momento non riusciamo a leggere la carta. Riprova tra poco.</p>
      </div>
    );
  }
  if (!carta) notFound();
  if (!fedeltaAttiva(locale)) {
    return (
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold">La tua carta</h1>
        <p className="text-salvia">La carta fedeltà non è attiva al momento.</p>
      </div>
    );
  }

  const target = locale.fedelta_timbri as number;
  const { pieni, mancanti, premioPronto } = statoCarta(carta.timbri, target);
  const qr = await qrSvg(`${await origineSito()}/admin/carta/${carta.codice}`);

  return (
    <div className="space-y-6">
      <section aria-label="Timbri" className="space-y-5 rounded-3xl bg-panna p-5 text-notte">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" width={44} height={44} className="rounded-full" />
            <span className="font-display text-xl font-bold tracking-[0.14em]">MARAVILLA</span>
          </span>
          <span className="text-sm font-semibold">{carta.nome}</span>
        </div>
        <ul className="grid grid-cols-5 gap-2.5" aria-label={`${pieni} timbri su ${target}`}>
          {Array.from({ length: target }, (_, i) => (
            <li
              key={i}
              className={`flex aspect-square items-center justify-center rounded-full ${i < pieni ? "bg-notte text-panna" : "border-2 border-notte"}`}
            >
              {i < pieni && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </li>
          ))}
        </ul>
        <p className="font-display text-2xl font-bold leading-tight">
          {premioPronto ? `Premio pronto: ${locale.fedelta_premio}` : `${pieni} timbri su ${target}. Ne mancano ${mancanti} per: ${locale.fedelta_premio}.`}
        </p>
      </section>

      {locale.fedelta_regola && <p className="text-salvia">{locale.fedelta_regola}.</p>}

      <section aria-label="Codice per il bancone" className="flex items-center gap-4 rounded-2xl border border-bordo bg-carta p-4">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl [&>svg]:h-full [&>svg]:w-full" role="img" aria-label="Codice QR della tua carta" dangerouslySetInnerHTML={{ __html: qr }} />
        <div>
          <p className="font-display text-2xl font-bold leading-tight">Mostralo al bancone</p>
          <p className="text-sm text-salvia">Il personale lo inquadra e aggiunge il timbro.</p>
        </div>
      </section>

      <p className="text-sm text-salvia">
        Questa pagina è la tua carta: salvala tra i preferiti o aggiungila alla schermata Home. Non condividerne l&apos;indirizzo.{" "}
        <Link href="/privacy" className="underline">Informativa</Link>
      </p>
    </div>
  );
}
