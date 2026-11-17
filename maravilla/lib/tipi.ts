export type Locale = {
  nome: string;
  claim: string;
  indirizzo: string;
  telefono: string;
  instagram: string;
  note: string;
  coperti_max: number | null;
  foto_home: string;
  fedelta_timbri: number | null;
  fedelta_premio: string;
  fedelta_regola: string;
};

export type Orario = {
  giorno: number; // 0 = lunedì … 6 = domenica
  chiuso: boolean;
  apertura: string; // HH:MM
  chiusura: string; // HH:MM, può essere dopo la mezzanotte
};

export type Gruppo = "food" | "drink";

export type Categoria = { id: string; nome: string; gruppo: Gruppo; ordine: number };

export type Piatto = {
  id: string;
  categoria_id: string;
  nome: string;
  descrizione: string;
  prezzo_cent: number | null;
  allergeni: string[];
  esaurito: boolean;
  visibile: boolean;
  foto: string;
  ordine: number;
};

export type Evento = {
  id: string;
  tipo: "evento" | "offerta";
  titolo: string;
  quando: string;
  descrizione: string;
  attivo: boolean;
  ordine: number;
};

export type Stato = "in_attesa" | "confermata" | "annullata";

export type PrenotazioneRiga = {
  id: string;
  creata_il: string;
  nome: string;
  telefono: string;
  data: string;
  ora: string;
  persone: number;
  note: string;
  stato: Stato;
  codice?: string | null;
};

export type CartaFedelta = {
  id: string;
  codice: string;
  nome: string;
  telefono: string;
  consenso_il: string;
  timbri: number;
  premi: number;
  ultimo_timbro: string | null;
  creata_il: string;
};
