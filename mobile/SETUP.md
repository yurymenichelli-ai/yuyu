# Setup — Appunti Vocali

Guida per portare l'app da questo codice a qualcosa che funziona davvero sul
tuo iPhone. Vanno fatti alcuni passaggi manuali che richiedono i tuoi account
personali (Picovoice, Apple) e non possono essere automatizzati da qui.

## 1. Backend

```bash
cd backend
cp .env.example .env
# apri .env e imposta:
#   JWT_SECRET       una stringa lunga e casuale
#   OPENAI_API_KEY   la tua chiave da https://platform.openai.com/api-keys
npm install
npx prisma migrate dev --name init
npm run dev
```

Il backend parte su `http://localhost:3000`. Per usarlo dal telefono, questo
indirizzo deve essere raggiungibile dall'iPhone:

- **Test in rete locale**: assicurati che telefono e computer siano sulla
  stessa Wi-Fi, poi in `mobile/src/config.ts` imposta `API_BASE_URL` con l'IP
  locale del computer, es. `http://192.168.1.10:3000`.
- **Uso reale quotidiano** (l'app deve funzionare sempre, anche fuori casa):
  il backend va distribuito su un server sempre acceso (una piccola VPS, un
  Raspberry Pi con IP raggiungibile, o un servizio come Railway/Render). Il
  codice non cambia, cambia solo dove giri `npm run start` e l'URL in
  `config.ts`.

## 2. Parola chiave "appunta" (Picovoice)

1. Crea un account gratuito su https://console.picovoice.ai/
2. Nella sezione **Porcupine**, crea una nuova parola chiave personalizzata:
   - Testo: `appunta`
   - Lingua: Italiano
   - Piattaforma: iOS
3. Scarica il file generato (`.ppn`) e rinominalo `appunta_ios.ppn`
4. Scarica anche il modello linguistico italiano `porcupine_params_it.pv`
   (disponibile nella stessa pagina della Console, o nel repo
   [Porcupine su GitHub](https://github.com/Picovoice/porcupine) sotto
   `lib/common/`)
5. Copia entrambi i file in `mobile/assets/porcupine/`, sovrascrivendo i
   placeholder vuoti. Cancella `PLACEHOLDER_REPLACE_ME.txt`.
6. Dalla Console, copia la tua **AccessKey** (in alto a destra).

Senza questi file reali l'ascolto vocale non si attiva: l'app mostrerà un
avviso ma continuerà a funzionare normalmente per tutto il resto (login,
registrazione manuale degli appunti, ecc).

## 3. Build per iPhone (serve il tuo Mac)

Il modulo Porcupine contiene codice nativo, quindi non funziona dentro
l'app "Expo Go" scaricata dall'App Store: serve generare una build di
sviluppo con Xcode.

Dal tuo Mac, con Xcode installato e il telefono collegato via cavo (o sulla
stessa rete per wireless debugging):

```bash
cd mobile
npm install
npx expo prebuild --platform ios
npx expo run:ios --device
```

La prima volta Xcode ti chiederà di selezionare il tuo team di sviluppo
(il tuo account Apple Developer) per firmare l'app: seleziona il tuo team,
Xcode farà il resto e installerà l'app sul telefono collegato.

Nelle esecuzioni successive, dopo aver modificato solo codice JavaScript
(non i moduli nativi), puoi semplicemente lanciare `npx expo start
--dev-client` e ricaricare l'app già installata, senza ricompilare da Xcode
ogni volta.

### Alternativa: build nel cloud con EAS (senza aprire Xcode)

```bash
npm install -g eas-cli
eas login
eas device:create        # registra il tuo iPhone (segui il link che ti dà)
eas build --profile development --platform ios
```

Al termine, EAS ti dà un link/QR code per installare l'app direttamente sul
telefono.

## 4. Nell'app

1. Registrati/accedi con la tua email.
2. Vai in **Impostazioni** (icona ⚙️ in alto), incolla la tua AccessKey
   Picovoice, attiva "Ascolto attivo" e riavvia l'app.
3. Concedi il permesso del microfono quando richiesto.
4. Prova dicendo ad alta voce: *"appunta, comprare il latte"* — dopo una
   breve pausa l'appunto trascritto comparirà nella lista.

## Limiti da tenere presenti

- iOS interrompe l'ascolto in background se **forzi la chiusura dell'app**
  dallo switcher (swipe verso l'alto). L'app deve restare in background,
  non chiusa del tutto.
- L'ascolto continuo consuma batteria più di un uso normale del telefono.
- Se non dici nulla per troppo tempo dopo "appunta", o parli per più di 30
  secondi, la registrazione si interrompe automaticamente (soglie
  configurabili in `mobile/src/config.ts`).
