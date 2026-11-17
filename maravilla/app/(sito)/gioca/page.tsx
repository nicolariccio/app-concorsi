import { Gioco } from "./gioco";

export const metadata = { title: "Gioca · Maravilla", description: "Prendi le cotolette, evita le bombe." };

export default function Gioca() {
  return (
    <div className="space-y-3">
      <h1 className="sr-only">Cotolette dal cielo</h1>
      <Gioco />
    </div>
  );
}
