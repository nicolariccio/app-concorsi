import { getMenuPubblico } from "@/lib/dati";
import { MenuNavigabile } from "./menu-navigabile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu · Maravilla" };

export default async function Menu() {
  const gruppi = await getMenuPubblico();
  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-semibold leading-none">Il menu</h1>
      {gruppi.length === 0 ? <p className="text-salvia">Il menu sarà online a breve.</p> : <MenuNavigabile gruppi={gruppi} />}
    </div>
  );
}
