import { getEventi } from "@/lib/dati";
import { richiediAdmin } from "../guard";
import { EventiAdmin } from "./eventi-admin";

export const dynamic = "force-dynamic";

export default async function Eventi() {
  await richiediAdmin();
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-semibold">Eventi e offerte</h1>
      <EventiAdmin eventi={await getEventi()} />
    </section>
  );
}
