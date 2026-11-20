-- Limiti di coperti per giorno della settimana e per orario. Si sommano al limite generale (locale.coperti_max).
-- Una regola vale per i giorni indicati (vuoto = tutti) e per le fasce nell'intervallo di orario (vuoto = tutto il giorno).
-- Con più regole valide vince la più specifica; a parità, il limite più basso. Limite 0 = nessuna prenotazione online.
create table if not exists limiti_coperti (
  id uuid primary key default gen_random_uuid(),
  giorni smallint[] not null default '{}' check (giorni <@ array[0,1,2,3,4,5,6]::smallint[]), -- 0 = lunedì … 6 = domenica
  ora_da text check (ora_da ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ora_a text check (ora_a ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  max_coperti int not null check (max_coperti between 0 and 500),
  check ((ora_da is null) = (ora_a is null))
);

alter table limiti_coperti enable row level security;
