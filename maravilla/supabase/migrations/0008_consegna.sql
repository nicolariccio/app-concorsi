-- Link alle pagine del locale su Glovo e Deliveroo, mostrati sul sito come "Ordina a casa".
alter table locale add column if not exists link_glovo text not null default '';
alter table locale add column if not exists link_deliveroo text not null default '';
