// EVENTI DI ESEMPIO: da sostituire con quelli reali (poi dal pannello gestore).
export type Evento = { id: string; titolo: string; quando: string; descrizione: string };

export const eventi: Evento[] = [
  { id: "happy-hour", titolo: "Cotoletta + birra", quando: "Ogni giovedì dalle 21", descrizione: "Prezzo fisso: esempio di offerta." },
  { id: "dj-set", titolo: "DJ set", quando: "Sabato sera", descrizione: "Musica e cocktail fino a tardi: esempio." },
];
