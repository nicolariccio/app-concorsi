import { menu } from "@/lib/menu";

export const metadata = { title: "Menu · Maravilla" };

export default function Menu() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">Menu</h1>
      <p className="rounded-xl border border-fiamma/40 bg-fiamma/10 p-3 text-sm text-fiamma">
        Menu di esempio: piatti e prezzi sono segnaposto.
      </p>
      {menu.map((s) => (
        <section key={s.titolo} className="space-y-3">
          <h2 className="text-xl font-bold text-fiamma">{s.titolo}</h2>
          {s.voci.map((v) => (
            <article key={v.nome} className="scheda flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{v.nome}</h3>
                <p className="text-sm text-zinc-400">{v.descrizione}</p>
                {v.allergeni.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">Allergeni: {v.allergeni.join(", ")}</p>
                )}
              </div>
              <p className="font-bold">€{v.prezzo}</p>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
