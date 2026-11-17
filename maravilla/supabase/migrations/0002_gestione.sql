-- Contenuti modificabili dall'admin: info del locale, orari, menu, eventi e offerte.
-- Nessun dato di esempio: finché il gestore non inserisce qualcosa, le pagine pubbliche non mostrano nulla.
-- Accesso solo dal server (service role): RLS attiva e nessuna policy pubblica.

create table if not exists locale (
  id int primary key default 1 check (id = 1), -- una sola riga
  nome text not null,
  claim text not null default '',
  indirizzo text not null default '',
  telefono text not null default '',
  instagram text not null default '',
  note text not null default ''
);

create table if not exists orari (
  giorno smallint primary key check (giorno between 0 and 6), -- 0 = lunedì … 6 = domenica
  chiuso boolean not null default false,
  apertura text not null default '00:00' check (apertura ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  chiusura text not null default '00:00' check (chiusura ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') -- può essere dopo la mezzanotte
);

create table if not exists categorie_menu (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(nome) between 1 and 60),
  ordine int not null default 0
);

create table if not exists piatti (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorie_menu(id) on delete cascade,
  nome text not null check (length(nome) between 1 and 80),
  descrizione text not null default '',
  prezzo_cent int check (prezzo_cent is null or prezzo_cent >= 0), -- centesimi; vuoto = prezzo non indicato
  allergeni text[] not null default '{}',
  esaurito boolean not null default false,
  visibile boolean not null default true,
  ordine int not null default 0
);
create index if not exists piatti_categoria_idx on piatti (categoria_id, ordine);

create table if not exists eventi (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('evento', 'offerta')),
  titolo text not null check (length(titolo) between 1 and 80),
  quando text not null default '',
  descrizione text not null default '',
  attivo boolean not null default true,
  ordine int not null default 0
);

alter table locale enable row level security;
alter table orari enable row level security;
alter table categorie_menu enable row level security;
alter table piatti enable row level security;
alter table eventi enable row level security;
