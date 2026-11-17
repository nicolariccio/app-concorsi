import { getCategorie, getPiatti } from "@/lib/dati";
import { richiediAdmin } from "../guard";
import { MenuAdmin } from "./menu-admin";

export const dynamic = "force-dynamic";

export default async function Menu() {
  await richiediAdmin();
  const [categorie, piatti] = await Promise.all([getCategorie(), getPiatti()]);
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-semibold">Menu</h1>
      <p className="text-salvia">Crea le categorie (es. Cotolette, Drink) e aggiungi i piatti. Il prezzo si scrive con la virgola: 9,50.</p>
      <MenuAdmin categorie={categorie} piatti={piatti} />
    </section>
  );
}
