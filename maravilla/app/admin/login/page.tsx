import { redirect } from "next/navigation";
import { adminConfigurato, isAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function Login() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="space-y-6 pt-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Maravilla" width={72} height={72} className="rounded-full" />
      <h1 className="text-4xl font-semibold">Gestione</h1>
      {adminConfigurato() ? (
        <LoginForm />
      ) : (
        <p className="scheda text-salvia">Accesso non configurato: mancano ADMIN_PASSWORD e SESSION_SECRET.</p>
      )}
    </div>
  );
}
