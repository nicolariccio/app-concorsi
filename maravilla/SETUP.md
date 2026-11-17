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

## Avvisi email per le prenotazioni (facoltativo)

1. Crea un account gratuito su resend.com e, in **API Keys**, crea una chiave.
2. In Vercel aggiungi due variabili d'ambiente:
   - `RESEND_API_KEY`: la chiave appena creata
   - `NOTIFICA_EMAIL`: l'email dove vuoi ricevere gli avvisi. Con il mittente di prova di Resend può essere solo l'email con cui ti sei registrato.
3. Fai **Redeploy**. Da quel momento ogni nuova prenotazione manda una email al gestore.

Per usare un indirizzo tuo come mittente (es. `prenotazioni@tuodominio.it`) devi verificare il dominio su Resend e impostare `EMAIL_MITTENTE`.
Se l'email non parte, la prenotazione viene comunque salvata.

## Aggiornamenti del database

Ogni volta che arriva una nuova migrazione in `supabase/migrations/`, eseguila nello SQL Editor di Supabase **prima** di pubblicare il codice che la usa.

## Foto

La migrazione `0005_foto.sql` crea da sola il contenitore delle foto ("foto", pubblico) nello Storage di Supabase.
Dal pannello: la foto della Home si carica in **Info**, quella di ogni piatto in **Menu**.
Le foto vengono ridimensionate dal telefono prima dell'invio (lato lungo 1600 px, circa 100-300 KB). Una foto sostituita o tolta resta nello Storage: con il piano gratuito (1 GB) ci sono migliaia di foto di margine.
