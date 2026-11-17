import { redirect } from "next/navigation";
import { adminConfigurato, isAdmin } from "@/lib/auth";
import { percorsoSicuro } from "@/lib/fedelta";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = percorsoSicuro((await searchParams).next);
  if (await isAdmin()) redirect(next);
  return (
    <div className="space-y-6 pt-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Maravilla" width={72} height={72} className="rounded-full" />
      <h1 className="text-4xl font-semibold">Gestione</h1>
      {adminConfigurato() ? (
        <LoginForm next={next} />
      ) : (
        <p className="scheda text-salvia">Accesso non configurato: mancano ADMIN_PASSWORD e SESSION_SECRET.</p>
      )}
    </div>
  );
}
