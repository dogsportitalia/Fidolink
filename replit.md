# FidoLink - Medagliette QR per Cani

## Panoramica
FidoLink è un'applicazione web full-stack per gestire medagliette QR intelligenti per cani. Quando un cane viene trovato, chi lo scansiona può vedere le informazioni di contatto del proprietario e inviare una notifica automatica.

## Stack Tecnologico
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL con Drizzle ORM
- **Email**: Resend (integrazione Replit)
- **Auth**: JWT con cookie httpOnly

## Struttura del Progetto

```
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Componenti UI riutilizzabili
│   │   ├── pages/        # Pagine dell'applicazione
│   │   ├── lib/          # Utility e configurazioni
│   │   └── hooks/        # Custom React hooks
├── server/               # Backend Express
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database layer
│   ├── utils.ts          # Utility (hash, token, generatori)
│   ├── email.ts          # Servizio email Resend
│   └── db.ts             # Connessione database
├── shared/               # Codice condiviso
│   └── schema.ts         # Schema Drizzle + tipi TypeScript
└── migrations/           # Migrazioni database (auto-generate)
```

## Flusso dell'Applicazione

### 1. Generazione Medagliette (Admin)
- L'admin accede al pannello con password
- Genera batch di medagliette (N alla volta)
- Ogni medaglietta ha:
  - `publicId`: 8 caratteri alfanumerici (visibile nel QR)
  - `claimCode`: formato DS-XXXX-XXXX (segreto per la registrazione)
- Il claimCode viene hashato con bcrypt prima di essere salvato
- Esporta CSV con publicId e claimCode in chiaro

### 2. Registrazione Utente
- L'utente crea un account con email e password
- Password hashata con bcrypt (12 rounds)
- JWT in cookie httpOnly per autenticazione

### 3. Claim della Medaglietta
- L'utente inserisce il claimCode dalla confezione
- Il sistema verifica il codice contro gli hash nel database
- La medaglietta viene associata all'utente
- **Scadenza**: viene impostata automaticamente a 2 anni dalla registrazione (`expiresAt`)

### 4. Configurazione Profilo Cane
- Nome, foto, razza, sesso, taglia
- Contatti: telefono, WhatsApp, email (con toggle privacy)
- Note mediche essenziali
- Istruzioni per chi trova il cane
- Toggle notifiche scansione

### 5. Scansione Pubblica
- Qualcuno scansiona il QR: `/t/{publicId}`
- Vede solo le informazioni pubbliche autorizzate
- Può chiamare, WhatsApp, o email
- Viene loggato un evento di scansione
- **Rilevamento GPS**: Il sistema chiede il permesso per rilevare la posizione GPS di chi scansiona
  - Se l'utente accetta, le coordinate vengono salvate nell'evento di scansione
  - Viene creato un link temporaneo protetto (`/location/:token`) valido per 30 giorni
  - L'email di notifica contiene un link "Apri la posizione (disponibile per 30 giorni)"
  - Se l'utente rifiuta o il GPS non è disponibile, la scansione procede senza dati di localizzazione

### 6. Notifiche
- Email al merchant (MERCHANT_EMAIL) ad ogni scansione
- Email al proprietario se ha attivato le notifiche
- **Posizione GPS**: Se disponibile, l'email include un link protetto alla pagina di posizione (scade dopo 30 giorni)
- Rate limiting: max 10 scansioni/ora per IP+tag

## API Endpoints

### Auth
- `POST /api/auth/signup` - Registrazione
- `POST /api/auth/login` - Accesso
- `POST /api/auth/logout` - Disconnessione
- `GET /api/me` - Utente corrente

### Tags
- `GET /api/tags` - Lista medagliette utente (auth)
- `POST /api/tags/claim` - Registra medaglietta (auth)
- `GET /api/tags/:publicId/public` - Info pubblica
- `POST /api/tags/:publicId/scan` - Log scansione
- `PUT /api/tags/:tagId/profile` - Aggiorna profilo (auth)

### Admin
- `POST /api/admin/batch` - Genera batch medagliette
- `GET /api/admin/scans` - Lista scansioni
- `GET /api/admin/tags/search` - Cerca medagliette per codice o email
- `POST /api/admin/tags/:tagId/extend` - Estende scadenza di 2 anni
- `GET /api/admin/profile/:publicId` - Visualizza dettagli profilo medaglietta (controllo contenuti, senza notifiche)

### Location Links
- `GET /api/location/:token` - Ottiene coordinate GPS (scade dopo 30 giorni)

## Variabili d'Ambiente

```
DATABASE_URL        # Connessione PostgreSQL (auto)
SESSION_SECRET      # Segreto per JWT e hash
MERCHANT_EMAIL      # Email per notifiche scansioni
ADMIN_PASSWORD      # Password pannello admin (default: admin123)
```

## Sicurezza

- ClaimCode hashato con bcrypt (non salvato in chiaro)
- Password hashate con bcrypt 12 rounds
- JWT in cookie httpOnly con scadenza 7 giorni
- IP hashato per privacy nei log scansioni
- Rate limiting sulle scansioni
- PublicId non prevedibile (8 char alfanumerici casuali)

## Comandi

```bash
npm run dev         # Avvia in development
npm run db:push     # Sincronizza schema database
npm run build       # Build produzione
```

## Note di Sviluppo

- L'applicazione usa un tema caldo arancione/ambra
- Supporto dark mode completo
- Design mobile-first responsive
- Lingua: Italiano
