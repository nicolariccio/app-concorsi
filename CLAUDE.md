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

```bash
pip install -r worker/requirements.txt -r requirements-dev.txt
python worker/raccolta.py                 # raccolta bandi da inPA in dati/ (gitignored)
python worker/raccolta.py --max-pagine 1  # prova veloce
python -m pytest                          # test
```

API inPA usate dal worker (pubbliche, senza autenticazione):
- `POST https://portale.inpa.gov.it/concorsi-smart/api/concorso-public-area/search-better?page=N&size=50`
  con corpo `{"status":["OPEN"], ...}`: elenco dei bandi aperti, dal più recente
- `GET .../concorso-public-area/{id}`: dettaglio, con `allegati[].mediaId`
- `GET https://portale.inpa.gov.it/api/media/{mediaId}`: PDF dell'allegato

Avvio, test e deploy di web app e database: da completare quando esistono.

## Regole

- Codice e commenti in italiano; nomi di tabelle e campi come in `docs/progetto.md`.
- Ogni funzione del confronto requisiti-profilo ha i suoi test.
- Nessun dato personale nei log; all'AI solo i campi minimi, mai nome o email.
- Ogni modifica al database passa da una migrazione in `supabase/migrations/`.
- Un dato assente nel bando resta vuoto, mai inventato.
- Lavora una fase alla volta, seguendo la roadmap del documento.
