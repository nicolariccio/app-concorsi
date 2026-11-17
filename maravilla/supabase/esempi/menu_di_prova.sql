-- Menu di PROVA con le sezioni Food e Drink. Non è una migrazione: si esegue a mano nello SQL Editor
-- di Supabase, DOPO la migrazione 0003_gruppi_menu.sql. Nomi, prezzi e allergeni sono segnaposto da
-- sostituire dall'admin prima di aprire al pubblico.
-- Se esiste già un vecchio menu di prova (piatti con "(prova)" nel nome) lo sostituisce; se invece il
-- menu contiene altro, non tocca niente.
do $$
begin
  delete from categorie_menu
  where id in (select categoria_id from piatti where nome like '%(prova)');

  if exists (select 1 from categorie_menu) then
    raise notice 'Il menu ha già delle categorie: non aggiungo nulla.';
    return;
  end if;

  insert into categorie_menu (nome, gruppo, ordine) values
    ('Antipasti',          'food',  10),
    ('Cotolette',          'food',  20),
    ('Panini',             'food',  30),
    ('Soft drink',         'drink', 10),
    ('Classici',           'drink', 20),
    ('Signature cocktails','drink', 30),
    ('Vini',               'drink', 40),
    ('Birre',              'drink', 50);

  insert into piatti (categoria_id, nome, descrizione, prezzo_cent, allergeni, ordine)
  select c.id, p.nome, p.descrizione, p.prezzo, p.allergeni, p.ordine
  from categorie_menu c
  join (values
    ('Antipasti',  'Mozzarella in carrozza (prova)', 'Pane, mozzarella, fritta',            600,  '{glutine,uova,latte}'::text[], 10),
    ('Antipasti',  'Patatine fritte (prova)',        'Con salsa a scelta',                   400,  '{}'::text[],                   20),
    ('Cotolette',  'Cotoletta classica (prova)',     'Panatura croccante e limone',          900,  '{glutine,uova}'::text[],       10),
    ('Cotolette',  'Cotoletta alla milanese (prova)','Con osso, burro chiarificato',         1400, '{glutine,uova,latte}'::text[], 20),
    ('Cotolette',  'Cotoletta di pollo (prova)',     'Petto di pollo panato',                1000, '{glutine,uova}'::text[],       30),
    ('Panini',     'Panino con cotoletta (prova)',   'Cotoletta, insalata e salsa della casa', 800, '{glutine,uova}'::text[],      10),
    ('Panini',     'Panino vegetariano (prova)',     'Verdure grigliate e formaggio',        700,  '{glutine,latte}'::text[],      20),
    ('Soft drink', 'Acqua (prova)',                  'Naturale o frizzante',                 200,  '{}'::text[],                   10),
    ('Soft drink', 'Cola (prova)',                   'Bottiglia 33 cl',                      300,  '{}'::text[],                   20),
    ('Soft drink', 'Succo di frutta (prova)',        'Gusti a scelta',                       300,  '{}'::text[],                   30),
    ('Classici',   'Spritz (prova)',                 'Il classico dell''aperitivo',          600,  '{solfiti}'::text[],            10),
    ('Classici',   'Negroni (prova)',                'Gin, vermut rosso, bitter',            800,  '{solfiti}'::text[],            20),
    ('Classici',   'Moscow Mule (prova)',            'Vodka, ginger beer, lime',             800,  '{}'::text[],                   30),
    ('Signature cocktails', 'Cocktail della casa (prova)', 'Chiedi al bancone',              900,  '{}'::text[],                   10),
    ('Signature cocktails', 'Cocktail del mese (prova)',   'Cambia ogni mese',               900,  '{}'::text[],                   20),
    ('Vini',       'Calice di bianco (prova)',       'Vino della casa',                      500,  '{solfiti}'::text[],            10),
    ('Vini',       'Calice di rosso (prova)',        'Vino della casa',                      500,  '{solfiti}'::text[],            20),
    ('Vini',       'Calice di bollicine (prova)',    'Spumante',                             600,  '{solfiti}'::text[],            30),
    ('Birre',      'Birra alla spina (prova)',       'Piccola 0,2 l',                        400,  '{glutine}'::text[],            10),
    ('Birre',      'Birra in bottiglia (prova)',     '33 cl',                                500,  '{glutine}'::text[],            20)
  ) as p(cat, nome, descrizione, prezzo, allergeni, ordine) on p.cat = c.nome;
end
$$;
