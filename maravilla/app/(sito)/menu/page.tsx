import { nomiAllergeni } from "@/lib/allergeni";
import { getMenuPubblico } from "@/lib/dati";
import { formattaPrezzo } from "@/lib/prezzo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu · Maravilla" };

export default async function Menu() {
  const menu = await getMenuPubblico();
  return (
    <div className="space-y-8">
      <h1 className="text-5xl font-semibold leading-none">Il menu</h1>
      {menu.length === 0 && <p className="text-salvia">Il menu sarà online a breve.</p>}
      {menu.map((c) => (
        <section key={c.id} className="space-y-3">
          <h2 className="text-3xl font-semibold text-oro">{c.nome}</h2>
          <ul className="divide-y divide-bordo border-y border-bordo">
            {c.piatti.map((p) => (
              <li key={p.id} className={`flex items-start justify-between gap-4 py-4 ${p.esaurito ? "opacity-60" : ""}`}>
                <div>
                  <h3 className="font-display text-2xl font-bold leading-tight">
                    {p.nome}
                    {p.esaurito && <span className="ml-2 align-middle font-sans text-xs font-semibold uppercase tracking-wider text-oro">Esaurito</span>}
                  </h3>
                  {p.descrizione && <p className="text-salvia">{p.descrizione}</p>}
                  {p.allergeni.length > 0 && <p className="mt-1 text-xs text-oro">Allergeni: {nomiAllergeni(p.allergeni)}</p>}
                </div>
                {p.prezzo_cent != null && <p className="font-display text-2xl font-bold tabular-nums">{formattaPrezzo(p.prezzo_cent)}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
