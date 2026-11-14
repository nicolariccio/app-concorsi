// MENU DI ESEMPIO: nomi e prezzi sono segnaposto, da sostituire con il menu vero.
export type Voce = { nome: string; descrizione: string; prezzo: number; allergeni: string[] };
export type Sezione = { titolo: string; voci: Voce[] };

export const menu: Sezione[] = [
  {
    titolo: "Cotolette",
    voci: [
      { nome: "Cotoletta classica", descrizione: "Panatura croccante, limone", prezzo: 9, allergeni: ["glutine", "uova"] },
      { nome: "Cotoletta alla milanese", descrizione: "Con osso, burro chiarificato", prezzo: 14, allergeni: ["glutine", "uova", "latte"] },
      { nome: "Panino con cotoletta", descrizione: "Cotoletta, insalata, salsa della casa", prezzo: 8, allergeni: ["glutine", "uova"] },
    ],
  },
  {
    titolo: "Drink",
    voci: [
      { nome: "Spritz", descrizione: "Il classico dell'aperitivo", prezzo: 6, allergeni: [] },
      { nome: "Cocktail della casa", descrizione: "Chiedi al bancone", prezzo: 8, allergeni: [] },
      { nome: "Birra alla spina", descrizione: "Piccola 0,2 l", prezzo: 4, allergeni: ["glutine"] },
    ],
  },
];
