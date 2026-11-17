import { getLocale } from "@/lib/dati";

export const dynamic = "force-dynamic";
export const metadata = { title: "Informativa privacy · Maravilla" };

export default async function Privacy() {
  const l = await getLocale();
  return (
    <article className="space-y-5 text-salvia">
      <h1 className="text-5xl font-semibold leading-none text-panna">Informativa privacy</h1>
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold text-oro">Chi tratta i dati</h2>
        <p>
          {l.nome}
          {l.indirizzo && `, ${l.indirizzo}`}.{l.telefono && ` Telefono: ${l.telefono}.`} Per qualsiasi richiesta sui tuoi dati rivolgiti a noi di persona o al telefono.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold text-oro">Quali dati e perché</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><b className="text-panna">Prenotazioni:</b> nome, telefono, data, ora, numero di persone ed eventuali note. Servono a gestire e confermare il tavolo.</li>
          <li><b className="text-panna">Carta fedeltà:</b> nome, telefono e numero di timbri. Servono a tenere il conto dei timbri e del premio. Li raccogliamo solo con il tuo consenso.</li>
        </ul>
        <p>Non usiamo questi dati per altri scopi e non li vendiamo. Non usiamo cookie di pubblicità: solo quello che ricorda la tua carta fedeltà su questo telefono.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold text-oro">Dove sono e per quanto</h2>
        <p>I dati sono su un database in Unione Europea, accessibile solo al personale del locale. Li conserviamo finché servono allo scopo: le prenotazioni finché sono in programma e per la gestione del locale, la carta fino a quando non ne chiedi la cancellazione.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold text-oro">I tuoi diritti</h2>
        <p>Puoi chiedere di vedere, correggere o cancellare i tuoi dati, e ritirare il consenso alla carta fedeltà in qualsiasi momento: la carta viene eliminata insieme ai tuoi dati.</p>
      </section>
    </article>
  );
}
