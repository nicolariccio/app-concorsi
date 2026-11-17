-- Ogni prenotazione ha un codice segreto: serve al link con cui il cliente la modifica o la annulla.
-- Le prenotazioni già esistenti restano senza codice (nessun link).
alter table prenotazioni add column if not exists codice text;
create unique index if not exists prenotazioni_codice_key on prenotazioni (codice) where codice is not null;
alter table prenotazioni drop constraint if exists prenotazioni_codice_check;
alter table prenotazioni add constraint prenotazioni_codice_check check (codice is null or codice ~ '^[a-z2-9]{16}$');
