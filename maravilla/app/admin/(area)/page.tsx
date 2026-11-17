import { getPrenotazioni } from "@/lib/dati";
import { oggiRoma } from "@/lib/datetime";
import { richiediAdmin } from "./guard";
import { PrenotazioniAdmin } from "./prenotazioni-admin";

export const dynamic = "force-dynamic";

export default async function Prenotazioni() {
  await richiediAdmin();
  const oggi = oggiRoma();
  const righe = (await getPrenotazioni()).filter((p) => p.data >= oggi && p.stato !== "annullata");
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-semibold">Prenotazioni</h1>
      <PrenotazioniAdmin righe={righe} oggi={oggi} />
    </section>
  );
}
