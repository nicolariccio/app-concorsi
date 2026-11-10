# App concorsi – Documento di progetto

Nov 10, 2026 · @Nicola Riccio

## Visione e proposta di valore

L'app legge i bandi di concorso al posto del candidato e gli dice, per ciascuno, se può partecipare e cosa deve fare. Gli avvisi sui nuovi bandi esistono già ([ConcorsiPubblici.com](https://www.concorsipubblici.com/faq-premium), [Concorsando](https://www.concorsando.it/blog/concorsi-pubblici-online/aggiornamenti/), [ConcorsAI](https://apps.apple.com/it/app/id6748537133), l'app di inPA): la differenza è la verifica dei requisiti sul testo intero del bando, con il riferimento all'articolo.

- **Problema**: i filtri esistenti usano categorie generiche (regione, titolo di studio). Il candidato legge bandi da 30–40 pagine per scoprire che gli manca una classe di laurea o un'abilitazione.
- **Soluzione**: per ogni nuovo bando compatibile, una scheda con verdetto (Puoi partecipare / Non puoi / Da verificare), scadenza, prove, materie e cosa fare.
- **Promessa**: meno tempo a leggere bandi, nessuna scadenza persa, nessuna domanda inutile.

## Utenti target

Si parte dai profili tecnici: ingegneri, architetti, geometri, periti e informatici. Qui i requisiti di accesso sono complessi (classi di laurea, abilitazioni, albi), quindi la verifica vale di più, e il settore è quello che conosci meglio.

| Segmento | Perché | Quando |
| --- | --- | --- |
| Tecnici e ingegneri | Requisiti complessi, pochi strumenti dedicati, ordini professionali come canale | MVP |
| Sanitari (infermieri, OSS, tecnici sanitari) | Moltissimi bandi di ASL e aziende ospedaliere | Fase 4 |
| Amministrativi e contabili | Pubblico ampio, molta concorrenza | Fase 4 |
| Docenti | Reclutamento con regole proprie | Escluso per ora |

Utente tipo: Marco, 34 anni, ingegnere gestionale nel privato. Vuole un posto pubblico in Emilia-Romagna o Lombardia e non ha tempo di leggere i bandi.

## Funzionalità

L'MVP fa una sola cosa bene: dire a un tecnico a quali bandi nuovi può partecipare. Tutto il resto arriva dopo.

**MVP**

- Registrazione con email (link di accesso, senza password).
- Profilo guidato: titoli con classe di laurea, abilitazioni, albi, esperienza, zone e profili cercati. Dati sensibili facoltativi.
- Elenco dei bandi compatibili, ordinati per scadenza, ciascuno con il verdetto.
- Scheda del bando: verdetto, requisiti con riferimento all'articolo, conto alla rovescia, prove, materie, link al bando e a inPA.
- Email giornaliera o settimanale con i nuovi bandi compatibili.
- Salva o scarta un bando.

**Fase 3 (Premium)**

- Notifiche push e promemoria delle scadenze.
- Monitoraggio dopo la candidatura: rettifiche, diari delle prove, graduatorie.
- Piano di studio generato dalle materie d'esame.
- Abbonamenti e pagamenti.

**Fase 4 (crescita)**

- Quiz di esercitazione sulle materie del bando.
- Nuove nicchie, offerta per ordini professionali e scuole di formazione, app nativa.

**Fuori ambito**: l'invio della domanda. Resta su inPA con SPID o CIE, sotto la responsabilità del candidato.

## Architettura

Il flusso ha due metà: in alto la pipeline che trasforma ogni bando in dati, in basso il servizio agli utenti.

&#91;embedded content: architettura · dal bando su inPA alla scheda del candidato\]

L'unico passaggio costoso, l'estrazione con Claude, avviene una volta per bando; il confronto con i profili e le notifiche sono codice normale.

## Stack tecnologico

Uno stack con servizi gestiti e piani gratuiti iniziali, così una persona sola può costruirlo e mantenerlo con Claude Code.

| Livello | Scelta | Perché |
| --- | --- | --- |
| Interfaccia | Next.js (React) come web app installabile (PWA), Tailwind | Un solo codice per computer e telefono, notifiche push anche su iPhone |
| Database, login, file | Supabase (Postgres, Auth, Storage) in regione UE | Servizi pronti, dati in Europa |
| Raccolta bandi | Worker Python schedulato (GitHub Actions o cron di Supabase) | Semplice e gratuito all'inizio |
| AI | API di Claude: Haiku per l'estrazione, Sonnet per i casi dubbi | Costo per bando basso, qualità dove serve |
| Email | Resend o Postmark | Invio affidabile delle email periodiche |
| Pagamenti | Stripe con Stripe Tax | Abbonamenti e IVA gestiti |
| Hosting | Vercel | Deploy automatico da GitHub |
| Monitoraggio | Sentry, log del worker | Errori visibili subito |

## Modello dati

Otto tabelle bastano per l'MVP. Il cuore è la separazione tra il bando analizzato una volta (`requisiti_bando`) e il confronto con ogni profilo (`match`).

| Tabella | Campi principali | Note |
| --- | --- | --- |
| `bandi` | id, id\_inpa, url, ente, titolo, profilo, regione, provincia, posti, scadenza, data\_pubblicazione, percorso\_pdf, hash\_testo, stato\_analisi | Un record per bando; l'hash evita di rianalizzare lo stesso testo |
| `requisiti_bando` | bando\_id, tipo (titolo di studio, abilitazione, albo, età, esperienza, patente, altro), valori ammessi, obbligatorio, riferimento (articolo o pagina), testo\_originale, ambiguo | Output strutturato dell'AI |
| `dettagli_bando` | bando\_id, tassa, modalità di candidatura, prove, materie, date delle prove | Contenuto della scheda |
| `classi_laurea` | codice, nome, ordinamento, equiparazioni | Equiparazioni tra vecchio ordinamento, specialistiche e magistrali, dal decreto interministeriale del 9 luglio 2009 |
| `utenti` | id, email, piano, consensi, creato\_il | Gestita da Supabase Auth |
| `profili` | utente\_id, data\_nascita, titoli (classe e voto), abilitazioni, albi, anni di esperienza, patenti, regioni, profili cercati, dati facoltativi | Solo i dati utili al confronto |
| `match` | utente\_id, bando\_id, verdetto, motivi per requisito, stato (nuovo, salvato, scartato, candidato), notificato\_il | Ricalcolato quando cambia il profilo o il bando |
| `eventi_bando` | bando\_id, tipo (rettifica, diario prove, graduatoria), data, url | Fase 3 |

## Pipeline AI

L'AI legge ogni bando una sola volta; il confronto con i profili è codice normale. Così il costo cresce con il numero di bandi, non con il numero di utenti.

1. **Raccolta**: il worker prende da inPA solo i bandi nuovi, scarica testo e PDF, calcola l'hash.
2. **Estrazione**: Claude Haiku riceve il testo e restituisce un JSON con uno schema fisso: requisiti, dettagli, riferimento all'articolo per ciascun requisito. Un dato assente resta vuoto, mai inventato.
3. **Controllo qualità**: regole automatiche (scadenza futura, almeno un requisito sul titolo, riferimenti presenti). Se una regola fallisce, il bando passa a Claude Sonnet o in una coda di revisione manuale.
4. **Confronto**: regole e SQL confrontano requisiti e profili e assegnano il verdetto. Le classi di laurea passano dalla tabella delle equiparazioni.
5. **Casi dubbi**: solo i requisiti segnati come ambigui ("titolo equipollente", "esperienza attinente") vanno a Claude, con i dati minimi del profilo e risultato salvato in cache.
6. **Notifica**: email periodica con i nuovi match.

Per tenere bassi i costi: istruzioni e schema fissi con prompt caching, e Batch API per le estrazioni non urgenti, che costa la metà. Il costo reale per bando si misura in fase 1 su 100 bandi veri.

Prima del lancio serve un set di prova: 100 bandi con i requisiti annotati a mano. Ogni modifica ai prompt si verifica su quel set, come un test automatico.

## Privacy e aspetti legali

La regola guida è raccogliere il minimo: l'app chiede solo i dati che servono al confronto. Informativa e termini vanno fatti rivedere da un professionista prima del lancio.

- **Dati delicati**: niente domande su condanne penali o invalidità. Sono dati giudiziari e sanitari con tutele aggiuntive nel GDPR; quando un bando li richiede, la scheda dice "verifica tu questo requisito".
- **Dove stanno i dati**: Supabase in regione UE. Accordi sul trattamento (DPA) con Supabase, Anthropic, servizio email e Stripe.
- **Dati inviati all'AI**: per i casi dubbi solo i campi necessari, senza nome né email.
- **Diritti dell'utente**: esportazione e cancellazione dell'account direttamente dall'app.
- **Responsabilità**: avviso chiaro che il verdetto è informativo e la decisione sull'ammissione spetta all'ente.
- **Fonte dei bandi**: dati pubblici, ma richieste a ritmo moderato, link all'originale e verifica delle condizioni d'uso di inPA.
- **Fisco**: con gli abbonamenti serve una partita IVA; regime e IVA sui servizi digitali da valutare con un commercialista.

## Modello di business

Freemium: gli avvisi portano utenti gratis, la verifica approfondita si paga. I prezzi sono ipotesi da testare con la lista d'attesa.

| Piano | Prezzo (ipotesi) | Cosa include |
| --- | --- | --- |
| Gratis | 0 € | Profilo, email settimanale con i bandi compatibili, 3 schede di verifica al mese |
| Premium | da 4 a 8 € al mese, annuale scontato | Schede illimitate, avvisi giornalieri e push, monitoraggio dopo la candidatura, piano di studio |
| Partner | su preventivo | Ordini professionali, sindacati, scuole di formazione: accesso per i loro iscritti con il loro marchio |

Numeri da seguire: iscritti alla lista d'attesa, profili completati, utenti attivi dopo 30 giorni, conversione a Premium. I costi fissi iniziali sono bassi: la voce principale sono le chiamate all'API di Claude.

## Roadmap

Cinque fasi, ciascuna con un gate da superare prima di passare alla successiva. Durate e soglie sono proposte, pensate per un progetto seguito la sera e nel fine settimana.

&#91;embedded content: roadmap · 5 fasi e 4 gate\]

Se un gate non viene superato, si corregge la fase invece di andare avanti: per esempio, poche iscrizioni in fase 0 significano cambiare nicchia o messaggio prima di scrivere codice.

## Rischi e mitigazioni

Il rischio maggiore è un verdetto sbagliato: un "puoi partecipare" errato costa fiducia, uno "non puoi" errato fa perdere un'occasione.

| Rischio | Mitigazione |
| --- | --- |
| Verdetto errato | Riferimento all'articolo per ogni requisito, "da verificare" nei casi dubbi, set di prova su 100 bandi, pulsante "segnala errore" nella scheda |
| inPA cambia le API o il formato | Il worker avvisa quando trova zero bandi o errori; fonti di riserva (siti degli enti, Gazzetta) |
| Concorrenti con più utenti | Nicchia stretta, qualità della verifica, accordi con gli ordini professionali |
| Costi AI più alti del previsto | Analisi una volta per bando, Haiku e Batch API, limite di schede nel piano gratuito |
| Pochi utenti paganti | Validare prezzi in fase 0 e 2, canale partner come alternativa |
| Tempo limitato (progetto serale) | Fasi piccole con gate, niente app nativa finché non serve |

## Come usarlo con Claude Code

Esporta questo documento in Markdown, mettilo nel repository come `docs/progetto.md` e fai lavorare Claude Code una fase alla volta.

Nel file `CLAUDE.md` alla radice del progetto scrivi:

- cosa fa l'app, in tre righe, con il rimando a `docs/progetto.md`;
- lo stack e i comandi per avviare, testare e fare il deploy;
- le regole: codice e commenti in italiano o inglese (scegline uno), test per ogni funzione del confronto, nessun dato personale nei log, ogni modifica al database tramite migrazione.

Primi prompt, in ordine:

1. "Leggi docs/progetto.md. Trova l'endpoint pubblico di inPA che restituisce i bandi e scrivi worker/raccolta.py, che salva solo i bandi nuovi e mi avvisa se non ne trova."
2. "Definisci lo schema JSON dei requisiti e scrivi l'estrazione con l'API di Claude. Provala sui bandi in tests/bandi e mostrami gli errori."
3. "Crea lo schema Supabase con le migrazioni per le tabelle del modello dati."
4. "Scrivi il confronto requisiti-profilo con test per titoli equiparati, età, abilitazioni e casi dubbi."
5. "Crea la web app Next.js: accesso, profilo guidato, elenco bandi, scheda."
6. "Aggiungi l'email periodica con i nuovi bandi compatibili."

L'agente `verifica-bando.md` già pronto è un buon punto di partenza per le istruzioni dell'estrazione.

## Fonti

- [ConcorsiPubblici.com – FAQ Premium](https://www.concorsipubblici.com/faq-premium)
- [Concorsando – aggiornamenti e notifiche](https://www.concorsando.it/blog/concorsi-pubblici-online/aggiornamenti/)
- [ConcorsAI su App Store](https://apps.apple.com/it/app/id6748537133)
- [Concorsi\_inPa su GitHub](https://github.com/not-knope/Concorsi_inPa)
- [Funzione Pubblica – nota circolare sul portale inPA](https://www.funzionepubblica.gov.it/media/2ceaurku/dfp_nota_circolare_portale_inpa_1_7_2022.pdf)
