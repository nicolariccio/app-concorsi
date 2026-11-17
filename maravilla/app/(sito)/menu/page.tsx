import { getLocale, getMenuPubblico } from "@/lib/dati";
import { OrdinaACasa } from "../ordina-a-casa";
import { MenuNavigabile } from "./menu-navigabile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu · Maravilla" };

export default async function Menu() {
  const [gruppi, locale] = await Promise.all([getMenuPubblico(), getLocale()]);
  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-semibold leading-none">Il menu</h1>
      {gruppi.length === 0 ? <p className="text-salvia">Il menu sarà online a breve.</p> : <MenuNavigabile gruppi={gruppi} />}
      <div className="pt-6"><OrdinaACasa locale={locale} titolo={false} /></div>
    </div>
  );
}
