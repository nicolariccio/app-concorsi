-- Menu di PROVA per vedere il sito con dei contenuti. Non è una migrazione: si esegue a mano
-- nello SQL Editor di Supabase. Nomi, prezzi e allergeni sono segnaposto da sostituire dall'admin
-- prima di aprire al pubblico. Si esegue solo se non esiste ancora nessuna categoria.
do $$
begin
  if exists (select 1 from categorie_menu) then
    raise notice 'Il menu ha già delle categorie: non aggiungo nulla.';
    return;
  end if;

  insert into categorie_menu (nome, ordine) values ('Cotolette', 10), ('Panini', 20), ('Drink', 30);

  insert into piatti (categoria_id, nome, descrizione, prezzo_cent, allergeni, ordine)
  select c.id, p.nome, p.descrizione, p.prezzo, p.allergeni, p.ordine
  from categorie_menu c
  join (values
    ('Cotolette', 'Cotoletta classica (prova)',    'Panatura croccante e limone',          900,  '{glutine,uova}'::text[],        10),
    ('Cotolette', 'Cotoletta alla milanese (prova)', 'Con osso, burro chiarificato',       1400, '{glutine,uova,latte}'::text[],  20),
    ('Cotolette', 'Cotoletta di pollo (prova)',    'Petto di pollo panato',                 1000, '{glutine,uova}'::text[],        30),
    ('Panini',    'Panino con cotoletta (prova)',  'Cotoletta, insalata e salsa della casa', 800, '{glutine,uova}'::text[],        10),
    ('Panini',    'Panino vegetariano (prova)',    'Verdure grigliate e formaggio',          700, '{glutine,latte}'::text[],       20),
    ('Drink',     'Spritz (prova)',                'Il classico dell''aperitivo',            600, '{solfiti}'::text[],             10),
    ('Drink',     'Cocktail della casa (prova)',   'Chiedi al bancone',                      800, '{}'::text[],                    20),
    ('Drink',     'Birra alla spina (prova)',      'Piccola 0,2 l',                          400, '{glutine}'::text[],             30)
  ) as p(cat, nome, descrizione, prezzo, allergeni, ordine) on p.cat = c.nome;
end
$$;
