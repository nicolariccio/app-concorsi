-- Chiusure straordinarie per data e limite di coperti per fascia oraria.
create table if not exists chiusure (
  id uuid primary key default gen_random_uuid(),
  dal date not null,
  al date not null check (al >= dal),
  motivo text not null default ''
);

-- Coperti massimi per fascia oraria; vuoto = nessun limite.
alter table locale add column if not exists coperti_max int check (coperti_max is null or coperti_max > 0);

alter table chiusure enable row level security;
