# Cucina Riserva — Gestione Magazzino Ristoranti

Applicazione web reale (Next.js) con database, autenticazione e gestione
magazzino. Ogni ristorante ha il proprio account e i propri dati, salvati
in modo permanente.

## Cosa contiene questo progetto
- **Frontend**: pagine di benvenuto, login, registrazione e dashboard (React / Next.js)
- **Backend**: API per registrazione, login, gestione articoli (`/pages/api`)
- **Database**: schema Prisma pronto per SQLite (sviluppo) o PostgreSQL (produzione)
- **Autenticazione**: password cifrate (bcrypt) + sessione sicura via cookie

---

## 1. Avvio in locale (sul tuo computer)

Requisiti: [Node.js](https://nodejs.org) versione 18 o superiore installato.

```bash
# 1. Entra nella cartella del progetto
cd cucina-riserva-app

# 2. Installa le dipendenze
npm install

# 3. Crea il file delle variabili d'ambiente
cp .env.example .env
# apri .env e sostituisci JWT_SECRET con una stringa lunga e casuale

# 4. Crea il database locale (SQLite) e le tabelle
npx prisma migrate dev --name init

# 5. Avvia il sito
npm run dev
```

Apri **http://localhost:3000** — troverai la schermata di benvenuto,
poi potrai registrare un account reale e usare il magazzino.
I dati restano salvati anche se chiudi e riapri il browser.

---

## 2. Pubblicare online (perché i ristoratori possano usarlo davvero)

Il modo più semplice è **Vercel** (gratuito per iniziare) + un database
Postgres gestito (**Supabase** o **Neon**, entrambi hanno un piano gratuito).

### Passaggi:

1. **Crea un database online**
   - Vai su [supabase.com](https://supabase.com) o [neon.tech](https://neon.tech), crea un progetto gratuito
   - Copia la stringa di connessione (URL che inizia con `postgresql://...`)

2. **Aggiorna lo schema per Postgres**
   - Apri `prisma/schema.prisma`
   - Cambia `provider = "sqlite"` in `provider = "postgresql"`

3. **Metti il codice su GitHub**
   - Crea un repository su [github.com](https://github.com) e carica questa cartella

4. **Collega il progetto a Vercel**
   - Vai su [vercel.com](https://vercel.com), collega il tuo account GitHub
   - Importa il repository, e nelle **Environment Variables** inserisci:
     - `DATABASE_URL` → la stringa di Supabase/Neon
     - `JWT_SECRET` → una stringa lunga e casuale
   - Premi **Deploy**

5. **Applica le tabelle al database online** (una sola volta, dal tuo computer):
   ```bash
   # con DATABASE_URL puntato al database online nel file .env
   npx prisma migrate deploy
   ```

Dopo questi passaggi il sito sarà online su un indirizzo tipo
`cucina-riserva.vercel.app`, utilizzabile da qualunque dispositivo,
con dati salvati in modo permanente e sicuro.

---

## 3. Nuove funzioni: Barcode e Ricette

- **Scansione con la fotocamera**: dalla pagina Magazzino, il pulsante "📷 Scansiona"
  apre la fotocamera del dispositivo per registrare un carico/consumo senza
  digitare nulla. Per collegare un codice a un articolo, apri "+ Nuovo articolo"
  e usa il pulsante 📷 accanto al campo codice a barre.
- **Ricette**: nella pagina "Ricette" puoi creare un prodotto di menu
  (es. "Piadina Kebab") e collegarlo agli ingredienti del magazzino con le
  quantità usate per porzione. Premendo "Vendi 1" (o scansionando il codice
  del prodotto), tutti gli ingredienti collegati si scalano automaticamente,
  senza che il personale debba modificare ogni articolo a mano.
- Nota: la scansione richiede l'accesso alla fotocamera del browser (chiede
  il permesso al primo utilizzo) e funziona meglio su una connessione HTTPS
  (in produzione, es. su Vercel, è automatica; in locale su `localhost` funziona
  comunque senza configurazioni aggiuntive).

## 4. Prossimi passi consigliati

- Collegare un dominio personalizzato (es. `cucinariserva.app`) da Vercel
- Aggiungere un sistema di pagamento per gli abbonamenti mensili (es. Stripe)
- Aggiungere le sezioni Fornitori, Ricette e Report (attualmente solo nella
  barra di navigazione, non ancora funzionanti)
- Valutare un audit di sicurezza prima di gestire dati e pagamenti reali di clienti

---

## Struttura del progetto

```
cucina-riserva-app/
├── pages/
│   ├── index.js          → schermata di benvenuto
│   ├── login.js           → accesso
│   ├── register.js        → registrazione
│   ├── dashboard.js       → magazzino (pagina principale)
│   └── api/
│       ├── auth/           → registrazione, login, logout, sessione
│       └── inventory/      → lettura/aggiunta/modifica articoli
├── prisma/schema.prisma   → struttura del database
├── lib/                   → connessione database + autenticazione
├── components/Logo.js
└── styles/globals.css     → stile grafico dell'app
```

## 5. Accesso staff (PIN limitato)

Dalla pagina **Abbonamento**, il titolare può impostare un PIN (4-6 cifre).
Il personale accede da `/staff-login` con l'email del ristorante e quel PIN,
senza password. Con l'accesso staff si può registrare carichi, consumi e
vendite, ma non gestire fornitori, ricette, articoli eliminati o l'abbonamento.

## 6. Attivare i pagamenti (Stripe)

1. Crea un account su [stripe.com](https://stripe.com)
2. In modalità test, crea 3 prodotti ricorrenti (Essenziale, Riserva, Tenuta)
   con i prezzi mensili — copia il "Price ID" di ciascuno
3. Compila nel file `.env`:
   - `STRIPE_SECRET_KEY` (dalla dashboard Stripe, sezione Sviluppatori → Chiavi API)
   - `STRIPE_PRICE_ESSENZIALE`, `STRIPE_PRICE_RISERVA`, `STRIPE_PRICE_TENUTA`
   - `NEXT_PUBLIC_BASE_URL` (in locale: `http://localhost:3000`)
4. Per i webhook in locale, installa la [Stripe CLI](https://stripe.com/docs/stripe-cli)
   ed esegui `stripe listen --forward-to localhost:3000/api/stripe/webhook`,
   poi copia il segreto mostrato in `STRIPE_WEBHOOK_SECRET`
5. Senza queste chiavi, la pagina Abbonamento resta visibile ma il pulsante
   di pagamento mostra un errore chiaro invece di bloccare il sito

## 7. Attivare le notifiche email

1. Crea un account gratuito su [resend.com](https://resend.com)
2. Copia la chiave API in `RESEND_API_KEY` nel file `.env`
3. Imposta `NOTIFY_FROM_EMAIL` con un indirizzo del tuo dominio verificato su Resend
4. Da quel momento, ogni volta che un articolo scende alla soglia minima
   (manualmente o tramite una vendita automatica) il titolare riceve un'email
