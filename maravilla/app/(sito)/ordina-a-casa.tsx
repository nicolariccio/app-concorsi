import { consegneAttive } from "@/lib/consegna";
import type { Locale } from "@/lib/tipi";

/** Pulsanti verso Glovo e Deliveroo. Non compare se il gestore non ha inserito nessun link. */
export function OrdinaACasa({ locale, titolo = true }: { locale: Pick<Locale, "link_glovo" | "link_deliveroo">; titolo?: boolean }) {
  const piattaforme = consegneAttive(locale);
  if (piattaforme.length === 0) return null;
  return (
    <section className="space-y-3" aria-label="Ordina a casa">
      {titolo && <h2 className="text-3xl font-semibold">Ordina a casa</h2>}
      <p className="text-salvia">Preferisci mangiare a casa? Ordina da noi su {piattaforme.map((p) => p.nome).join(" o ")}.</p>
      <ul className={`grid gap-3 ${piattaforme.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {piattaforme.map((p) => (
          <li key={p.id}>
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ordina su ${p.nome} (si apre in una nuova scheda)`}
              className="flex min-h-[60px] items-center gap-4 rounded-2xl border-[1.5px] border-linea bg-carta px-4 py-3 transition hover:border-panna active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: p.colore, color: "#0E1F11" }} aria-hidden="true">
                {/* motorino */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="17" r="2.5" />
                  <circle cx="18" cy="17" r="2.5" />
                  <path d="M8.5 17h5l2-6h-4M15.5 11 14 7h-2.5M18 14.5V10" />
                </svg>
              </span>
              <span className="flex-1">
                <span className="block font-display text-2xl font-bold leading-tight">Ordina su {p.nome}</span>
                <span className="block text-sm text-salvia">Consegna a domicilio</span>
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-salvia">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
