import Link from "next/link";
import { riassuntoGiorno, type TrattoLimite } from "@/lib/coperti";
import { getLocale, getOrari, limitiCoperti } from "@/lib/dati";
import { GIORNI_BREVI, NOMI_GIORNI, giornoSettimana, oggiRoma } from "@/lib/datetime";
import { orarioDelGiorno } from "@/lib/orari";
import { addGiorni } from "@/lib/statistiche";
import { richiediAdmin } from "../guard";
import { CopertiAdmin } from "./coperti-admin";

export const dynamic = "force-dynamic";

export default async function Coperti() {
  await richiediAdmin();
  let regole, locale, orari;
  try {
    [regole, locale, orari] = await Promise.all([limitiCoperti(), getLocale(), getOrari()]);
  } catch {
    return <p className="text-salvia">Non riesco a leggere le regole in questo momento. Riprova tra poco.</p>;
  }

  // Per ogni giorno della settimana si usa la prossima data che cade in quel giorno: serve solo a sapere di che giorno si parla.
  const oggi = oggiRoma();
  const riassunto: { giorno: string; breve: string; tratti: TrattoLimite[] | null }[] = [];
  for (let g = 0; g < 7; g++) {
    let data = oggi;
    while (giornoSettimana(data) !== g) data = addGiorni(data, 1);
    const orario = orarioDelGiorno(orari, data);
    riassunto.push({
      giorno: NOMI_GIORNI[g],
      breve: GIORNI_BREVI[g],
      tratti: orario && !orario.chiuso ? riassuntoGiorno(regole, locale.coperti_max, orario, data) : null,
    });
  }

  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-semibold">Coperti</h1>
      <p className="text-salvia">
        Quante persone puoi accettare in una fascia oraria, diverse per giorno e per orario. Il sito non accetta prenotazioni oltre il limite.
      </p>
      <p className="text-sm text-salvia">
        Limite generale: <span className="font-semibold text-panna">{locale.coperti_max === null ? "nessuno" : `${locale.coperti_max} coperti`}</span>. Vale dove nessuna regola si applica; lo cambi in{" "}
        <Link href="/admin/locale" className="underline">Info</Link>.
      </p>
      <CopertiAdmin regole={regole} riassunto={riassunto} />
    </section>
  );
}
