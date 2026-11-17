import "server-only";
import { emailNuovaPrenotazione } from "./emailTesto";

type Pren = { nome: string; telefono: string; data: string; ora: string; persone: number; note: string };

/** Avvisa il gestore via email (Resend). Non fa mai fallire la prenotazione. */
export async function avvisaGestore(p: Pren, locale: string): Promise<void> {
  const chiave = process.env.RESEND_API_KEY;
  const a = process.env.NOTIFICA_EMAIL;
  if (!chiave || !a) return;
  const { subject, text } = emailNuovaPrenotazione(p, locale);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chiave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_MITTENTE || "Maravilla <onboarding@resend.dev>", to: [a], subject, text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("[avviso] email non inviata", res.status);
  } catch {
    console.error("[avviso] email non inviata"); // nessun dato personale nei log
  }
}
