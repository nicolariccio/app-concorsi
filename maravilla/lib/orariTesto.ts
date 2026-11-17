import { giornoSettimana, NOMI_GIORNI, oggiRoma } from "./datetime";
import { testoOrario } from "./orari";
import type { Orario } from "./tipi";

export function righeOrari(orari: Orario[]) {
  return [...orari]
    .sort((a, b) => a.giorno - b.giorno)
    .map((o) => ({ giorno: NOMI_GIORNI[o.giorno], testo: testoOrario(o), oggi: o.giorno === giornoSettimana(oggiRoma()) }));
}

export function linkMappa(nome: string, indirizzo: string): string {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${nome} ${indirizzo}`);
}
