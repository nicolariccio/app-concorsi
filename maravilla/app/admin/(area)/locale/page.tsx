import { getLocale } from "@/lib/dati";
import { richiediAdmin } from "../guard";
import { LocaleForm } from "./locale-form";

export const dynamic = "force-dynamic";

export default async function Info() {
  await richiediAdmin();
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-semibold">Info del locale</h1>
      <LocaleForm iniziale={await getLocale()} />
    </section>
  );
}
