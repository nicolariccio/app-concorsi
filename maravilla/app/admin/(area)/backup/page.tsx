import { richiediAdmin } from "../guard";

export const dynamic = "force-dynamic";

export default async function Backup() {
  await richiediAdmin();
  return (
    <section className="space-y-5">
      <h1 className="text-4xl font-semibold">Copia dei dati</h1>
      <p className="text-salvia">
        Scarica una copia di tutto quello che c&apos;è nel database. Conviene farlo ogni tanto (per esempio una volta al mese) e tenere il file al sicuro.
      </p>
      <p className="rounded-xl border border-oro p-3 text-sm text-oro">
        I file contengono nomi e telefoni dei clienti: non condividerli e non lasciarli in luoghi aperti.
      </p>
      <ul className="space-y-3">
        <li className="scheda space-y-2">
          <p className="font-display text-2xl font-bold">Copia completa</p>
          <p className="text-sm text-salvia">Menu, orari, eventi, prenotazioni e carte, in un solo file. Serve per ripristinare i dati.</p>
          <a href="/api/admin/backup?formato=json" download className="bottone-piccolo">Scarica (.json)</a>
        </li>
        <li className="scheda space-y-2">
          <p className="font-display text-2xl font-bold">Prenotazioni per Excel</p>
          <p className="text-sm text-salvia">Tutte le prenotazioni, dalla più recente, in un foglio che si apre con Excel.</p>
          <a href="/api/admin/backup?formato=prenotazioni" download className="bottone-piccolo">Scarica (.csv)</a>
        </li>
        <li className="scheda space-y-2">
          <p className="font-display text-2xl font-bold">Carte fedeltà per Excel</p>
          <p className="text-sm text-salvia">Nome, telefono, timbri e premi di ogni carta.</p>
          <a href="/api/admin/backup?formato=carte" download className="bottone-piccolo">Scarica (.csv)</a>
        </li>
      </ul>
    </section>
  );
}
