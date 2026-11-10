# App concorsi

L'app legge i bandi di concorso pubblico al posto del candidato e, per ogni bando
compatibile, dice se può partecipare (Puoi / Non puoi / Da verificare), con il
riferimento all'articolo del bando. Primo segmento: tecnici e ingegneri.
Documento completo: [docs/progetto.md](docs/progetto.md).

## Stack

- Web app: Next.js (React) PWA + Tailwind, hosting su Vercel
- Backend: Supabase (Postgres, Auth con magic link, Storage) in regione UE
- Worker raccolta bandi: Python, schedulato con GitHub Actions
- AI: API di Claude (Haiku per l'estrazione, Sonnet per i casi dubbi), prompt caching e Batch API
- Email: Resend o Postmark · Pagamenti (fase 3): Stripe · Errori: Sentry

## Struttura (prevista)

- `worker/` – raccolta da inPA ed estrazione dei requisiti
- `supabase/migrations/` – schema del database
- `web/` – app Next.js
- `tests/bandi/` – set di prova di bandi annotati a mano

## Comandi

Da completare quando ogni parte esiste (avvio, test, deploy).

## Regole

- Codice e commenti in italiano; nomi di tabelle e campi come in `docs/progetto.md`.
- Ogni funzione del confronto requisiti-profilo ha i suoi test.
- Nessun dato personale nei log; all'AI solo i campi minimi, mai nome o email.
- Ogni modifica al database passa da una migrazione in `supabase/migrations/`.
- Un dato assente nel bando resta vuoto, mai inventato.
- Lavora una fase alla volta, seguendo la roadmap del documento.
