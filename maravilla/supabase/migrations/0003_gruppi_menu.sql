-- Il menu si naviga per gruppo (Food / Drink) e poi per categoria.
alter table categorie_menu
  add column if not exists gruppo text not null default 'food' check (gruppo in ('food', 'drink'));
