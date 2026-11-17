import { getLocale } from "@/lib/dati";
import { urlFoto } from "@/lib/fotoUrl";
import { richiediAdmin } from "../guard";
import { LocaleForm } from "./locale-form";

export const dynamic = "force-dynamic";

export default async function Info() {
  await richiediAdmin();
  const locale = await getLocale();
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-semibold">Info del locale</h1>
      <LocaleForm iniziale={locale} fotoHomeUrl={urlFoto(locale.foto_home)} />
    </section>
  );
}
