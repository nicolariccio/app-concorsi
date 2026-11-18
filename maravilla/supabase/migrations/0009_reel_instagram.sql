-- Link dell'ultimo reel di Instagram, mostrato nella Home (caricato solo se il cliente preme "Guarda il reel").
alter table locale add column if not exists link_reel text not null default '';
