import { getOrari } from "@/lib/dati";
import { richiediAdmin } from "../guard";
import { OrariForm } from "./orari-form";

export const dynamic = "force-dynamic";

export default async function Orari() {
  await richiediAdmin();
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-semibold">Orari</h1>
      <p className="text-salvia">Le prenotazioni online usano questi orari. Se chiudi dopo mezzanotte, scrivi l&apos;ora vera (es. 01:00).</p>
      <OrariForm iniziali={await getOrari()} />
    </section>
  );
}
