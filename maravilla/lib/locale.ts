// Dati del locale. DA VERIFICARE con il titolare prima della pubblicazione.
export const locale = {
  nome: "Maravilla",
  claim: "La prima Cotoletteria Alcolica d'Italia",
  indirizzo: "Via Pietro Nenni 35, 80018 Mugnano di Napoli (NA)",
  instagram: "https://www.instagram.com/maravilla_food_drink",
  // Gli orari reali sono su Google: finché non vengono inseriti restano vuoti.
  orariTesto: null as string | null,
  // TODO: sostituire con gli orari veri. Sono fasce di prova per la prenotazione.
  fasceOrarie: ["19:30", "20:00", "20:30", "21:00", "21:30", "22:00"],
  maxPersone: 10,
};

export const linkMappa =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`${locale.nome} ${locale.indirizzo}`);
