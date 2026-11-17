create table if not exists prenotazioni (
  id uuid primary key default gen_random_uuid(),
  creata_il timestamptz not null default now(),
  nome text not null,
  telefono text not null,
  data date not null,
  ora text not null,
  persone int not null check (persone between 1 and 20),
  note text not null default '',
  stato text not null default 'in_attesa' check (stato in ('in_attesa', 'confermata', 'annullata'))
);

-- Accesso solo dal server (service role): nessuna policy pubblica.
alter table prenotazioni enable row level security;
