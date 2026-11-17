# Mettere online Maravilla

Servono circa 15 minuti e due account gratuiti: Supabase (database) e Vercel (sito).

## 1. Database (Supabase)

1. Vai su supabase.com, crea un progetto e scegli la regione UE (Frankfurt o Paris).
2. Apri **SQL Editor**, incolla il contenuto di `supabase/migrations/0001_prenotazioni.sql` ed esegui.
3. Ripeti con `supabase/migrations/0002_gestione.sql`.
4. In **Project Settings → API** copia due valori:
   - **Project URL** → sarà `SUPABASE_URL`
   - **service_role key** (quella segreta, non la "anon") → sarà `SUPABASE_SERVICE_ROLE_KEY`

## 2. Sito (Vercel)

1. Vai su vercel.com e importa il repository GitHub `app-concorsi`.
2. Come **Root Directory** scegli `maravilla`.
3. Prima di fare Deploy, aggiungi le variabili d'ambiente (Environment Variables):

| Nome | Valore |
|---|---|
| `SUPABASE_URL` | il Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | la service_role key |
| `ADMIN_PASSWORD` | la password del gestore, almeno 8 caratteri |
| `SESSION_SECRET` | una stringa casuale lunga (vedi sotto) |

Per generare `SESSION_SECRET`, da un terminale: `openssl rand -hex 32`.

4. Premi **Deploy**.

## 3. Primo uso

1. Apri `https://<il-tuo-sito>/admin` ed entra con `ADMIN_PASSWORD`.
2. Compila in ordine: **Orari**, **Info**, **Menu**, **Eventi**.
3. Finché gli orari non sono impostati, le prenotazioni online restano spente.

## Sicurezza

- La `service_role key` e `ADMIN_PASSWORD` non vanno mai messe nel codice né condivise in chat.
- Cambiare `SESSION_SECRET` disconnette subito tutti gli accessi all'admin.
- Le prenotazioni contengono nomi e telefoni dei clienti: l'accesso è solo dall'admin.
