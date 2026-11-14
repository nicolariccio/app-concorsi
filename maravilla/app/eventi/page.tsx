import Link from "next/link";
import { eventi } from "@/lib/eventi";

export const metadata = { title: "Eventi · Maravilla" };

export default function Eventi() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Eventi e offerte</h1>
      {eventi.map((e) => (
        <article key={e.id} className="scheda space-y-2">
          <h2 className="text-lg font-bold">{e.titolo}</h2>
          <p className="text-sm font-medium text-fiamma">{e.quando}</p>
          <p className="text-zinc-400">{e.descrizione}</p>
          <Link href="/prenota" className="bottone mt-2">Prenota</Link>
        </article>
      ))}
    </div>
  );
}
