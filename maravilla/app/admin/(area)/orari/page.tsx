import { getChiusure, getOrari } from "@/lib/dati";
import { oggiRoma } from "@/lib/datetime";
import { richiediAdmin } from "../guard";
import { ChiusureAdmin } from "./chiusure-admin";
import { OrariForm } from "./orari-form";

export const dynamic = "force-dynamic";

export default async function Orari() {
  await richiediAdmin();
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-semibold">Orari</h1>
      <p className="text-salvia">Le prenotazioni online usano questi orari. Se chiudi dopo mezzanotte, scrivi l&apos;ora vera (es. 01:00).</p>
      <OrariForm iniziali={await getOrari()} />
      <h2 className="pt-6 text-3xl font-semibold text-oro">Chiusure straordinarie</h2>
      <p className="text-salvia">Ferie, serate private, feste: nei giorni indicati il sito non accetta prenotazioni.</p>
      <ChiusureAdmin chiusure={(await getChiusure()).filter((c) => c.al >= oggiRoma())} />
    </section>
  );
}
