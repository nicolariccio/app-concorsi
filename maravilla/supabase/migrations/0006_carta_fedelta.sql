-- Carta fedeltà a timbri. La carta si apre con un codice segreto nel link; il telefono è solo un recapito.
-- La funzione è attiva solo se il gestore imposta numero di timbri e premio in Info.
alter table locale add column if not exists fedelta_timbri int check (fedelta_timbri is null or fedelta_timbri between 1 and 30);
alter table locale add column if not exists fedelta_premio text not null default '';
alter table locale add column if not exists fedelta_regola text not null default '';

create table if not exists carte_fedelta (
  id uuid primary key default gen_random_uuid(),
  codice text not null unique check (codice ~ '^[a-z2-9]{16}$'),
  nome text not null check (length(nome) between 2 and 60),
  telefono text not null unique check (telefono ~ '^[0-9]{8,15}$'), -- solo cifre, con prefisso del paese
  consenso_il timestamptz not null default now(),
  timbri int not null default 0 check (timbri >= 0),
  premi int not null default 0 check (premi >= 0),
  ultimo_timbro timestamptz,
  creata_il timestamptz not null default now()
);

alter table carte_fedelta enable row level security;
