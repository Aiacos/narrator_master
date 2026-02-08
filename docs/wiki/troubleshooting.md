# Guida alla Risoluzione dei Problemi

Questa guida completa documenta tutti gli errori che potresti incontrare usando Narrator Master, con spiegazioni dettagliate delle cause e soluzioni passo-passo.

## Riferimento Rapido Errori

Usa questa tabella per trovare rapidamente la soluzione al tuo errore:

| Messaggio di Errore | Vai alla Sezione |
|---------------------|------------------|
| `Narrator Master non è ancora inizializzato` | [NotInitialized](#notinitialized) |
| `Inizializzazione Narrator Master fallita` | [InitFailed](#initfailed) |
| `Chiave API OpenAI non configurata` | [NoApiKey](#noapikey) |
| `Chiave API non valida` | [InvalidApiKey](#invalidapikey) |
| `Configurazione incompleta` | [ConfigIncomplete](#configincomplete) |
| `Il tuo browser non supporta la cattura audio` | [MicrophoneNotSupported](#microphonenotsupported) |
| `Permesso microfono negato` | [MicrophonePermissionDenied](#microphonepermissiondenied) |
| `Nessun microfono trovato` | [MicrophoneNotFound](#microphonenotfound) |
| `Il microfono è in uso da un'altra applicazione` | [MicrophoneInUse](#microphoneinuse) |
| `Il microfono non soddisfa i requisiti` | [MicrophoneConstraints](#microphoneconstraints) |
| `Errore di sicurezza: la cattura audio richiede HTTPS` | [MicrophoneSecurityError](#microphonesecurityerror) |
| `Errore microfono: {error}` | [MicrophoneGeneric](#microphonegeneric) |
| `Audio non valido` | [InvalidAudio](#invalidaudio) |
| `Registrazione fallita` | [RecordingFailed](#recordingfailed) |
| `Impossibile inizializzare il registratore` | [RecorderInitFailed](#recorderinitfailed) |
| `File audio troppo grande` | [FileTooLarge](#filetoolarge) |
| `Trascrizione fallita` | [TranscriptionFailed](#transcriptionfailed) |
| `Nessuna trascrizione disponibile` | [NoTranscription](#notranscription) |
| `Assistente AI fallito` | [AIAssistantFailed](#aiassistantfailed) |
| `Generazione immagine fallita` | [ImageGenerationFailed](#imagegenerationfailed) |
| `Nessun prompt fornito` | [NoPrompt](#noprompt) |
| `Nessuna descrizione fornita` | [NoDescription](#nodescription) |
| `Il contenuto viola le policy di OpenAI` | [ContentPolicy](#contentpolicy) |
| `Contenuto troppo lungo` | [ContentTooLong](#contenttoolong) |
| `Contenuto non valido` | [InvalidContent](#invalidcontent) |
| `Nessun contesto disponibile per generare un'immagine` | [NoContextForImage](#nocontextforimage) |
| `Errore di connessione` | [NetworkError](#networkerror) |
| `Limite di richieste raggiunto` | [RateLimited](#ratelimited) |
| `La richiesta ha impiegato troppo tempo` | [Timeout](#timeout) |
| `Errore del server OpenAI` | [ServerError](#servererror) |
| `Richiesta non valida` | [BadRequest](#badrequest) |
| `Servizio temporaneamente non disponibile` | [ServiceUnavailable](#serviceunavailable) |
| `Si è verificato un errore imprevisto` | [UnexpectedError](#unexpectederror) |
| `ID Journal non valido` | [InvalidJournalId](#invalidjournalid) |
| `Journal non trovato` | [JournalNotFound](#journalnotfound) |
| `Il Journal selezionato è vuoto` | [JournalEmpty](#journalempty) |
| `ID parlante non valido` | [InvalidSpeaker](#invalidspeaker) |
| `Etichetta parlante non valida` | [InvalidLabel](#invalidlabel) |
| `L'etichetta non può essere vuota` | [EmptyLabel](#emptylabel) |
| `Impossibile salvare le mappature dei parlanti` | [SaveMappingsFailed](#savemappingsfailed) |
| `Impossibile copiare negli appunti` | [CopyFailed](#copyfailed) |
| `Esportazione trascrizione fallita` | [ExportFailed](#exportfailed) |
| `Nessun contesto avventura impostato` | [NoContext (Off-Track)](#nocontext-off-track) |
| `Impossibile analizzare la risposta` | [ParseError (Off-Track)](#parseerror-off-track) |

---

## Indice

- [Errori di Configurazione e Inizializzazione](#errori-di-configurazione-e-inizializzazione)
- [Errori di Microfono e Cattura Audio](#errori-di-microfono-e-cattura-audio)
- [Errori di Trascrizione](#errori-di-trascrizione)
- [Errori di Assistente AI e Generazione Immagini](#errori-di-assistente-ai-e-generazione-immagini)
- [Errori di Rete e API](#errori-di-rete-e-api)
- [Errori di Journal](#errori-di-journal)
- [Errori di Etichette Parlanti](#errori-di-etichette-parlanti)
- [Errori Generali](#errori-generali)
- [Avvisi e Notifiche](#avvisi-e-notifiche)

---

## Errori di Configurazione e Inizializzazione

### NotInitialized

**Messaggio**: `Narrator Master non è ancora inizializzato. Attendi il caricamento completo.`

**Causa**: Il modulo sta ancora caricando i suoi componenti interni.

**Soluzioni**:
1. Attendi 2-5 secondi dopo il caricamento di Foundry VTT
2. Verifica che il modulo sia abilitato in **Gestisci Moduli**
3. Ricarica la pagina (F5) se il problema persiste oltre 10 secondi
4. Controlla la console del browser (F12) per errori JavaScript

**Prevenzione**:
- Non tentare di usare il pannello immediatamente dopo il caricamento della pagina
- Aspetta che appaia la notifica "Narrator Master pronto"

---

### InitFailed

**Messaggio**: `Inizializzazione Narrator Master fallita`

**Causa**: Un errore critico ha impedito il caricamento del modulo.

**Soluzioni**:
1. Apri la console del browser (F12 > Console) per vedere l'errore specifico
2. Disabilita altri moduli per identificare conflitti:
   - Vai in **Gestisci Moduli**
   - Disabilita tutti i moduli tranne Narrator Master
   - Ricarica e verifica se funziona
3. Verifica l'integrità dell'installazione:
   ```bash
   # Reinstalla il modulo
   ```
4. Controlla i log di Foundry VTT per errori di caricamento file
5. Assicurati di avere Foundry VTT v13 o superiore

**Prevenzione**:
- Mantieni aggiornato Foundry VTT
- Non modificare manualmente i file del modulo
- Usa sempre la versione stabile del modulo

---

### NoApiKey

**Messaggio**: `Chiave API OpenAI non configurata. Vai nelle impostazioni del modulo per aggiungerla.`

**Causa**: Nessuna chiave API OpenAI è stata configurata nelle impostazioni.

**Soluzioni**:
1. Vai in **Impostazioni di Gioco** > **Configura Impostazioni** > **Impostazioni Moduli**
2. Trova la sezione **Narrator Master**
3. Incolla la tua chiave API OpenAI nel campo **Chiave API OpenAI**
4. Clicca **Salva Modifiche**
5. Se non hai una chiave API:
   - Vai su [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Crea un nuovo account o accedi
   - Genera una nuova chiave API
   - **Importante**: Acquista almeno $5 di crediti (il tier gratuito non è sufficiente)

**Prevenzione**:
- Salva la chiave API in un posto sicuro
- Controlla regolarmente il saldo del tuo account OpenAI
- Configura limiti di spesa in OpenAI per evitare sorprese

---

### InvalidApiKey

**Messaggio**: `Chiave API non valida. Verifica la tua chiave API OpenAI nelle impostazioni.`

**Causa**: La chiave API fornita non è corretta o non è più valida.

**Soluzioni**:
1. Verifica che la chiave API:
   - Inizi con `sk-`
   - Non contenga spazi o caratteri extra
   - Sia stata copiata completamente
2. Testa la chiave su [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Controlla se la chiave è stata revocata:
   - Accedi al tuo account OpenAI
   - Vai in API Keys
   - Verifica lo stato della chiave
4. Se necessario, genera una nuova chiave API
5. Assicurati che la chiave abbia accesso ai modelli richiesti:
   - `gpt-4o-transcribe-diarize`
   - `gpt-4o-mini`
   - `gpt-image-1`

**Prevenzione**:
- Usa una chiave dedicata per Narrator Master
- Imposta restrizioni IP se possibile
- Monitora l'uso della chiave nel dashboard OpenAI
- Non condividere mai la chiave API

---

### ConfigIncomplete

**Messaggio**: `Configurazione incompleta`

**Causa**: Alcune impostazioni necessarie non sono state configurate.

**Soluzioni**:
1. Verifica tutte le impostazioni obbligatorie:
   - **Chiave API OpenAI**: Deve essere presente e valida
   - **Journal dell'Avventura**: Seleziona un Journal (opzionale ma consigliato)
2. Clicca **Configura Impostazioni** nel pannello
3. Completa tutti i campi richiesti
4. Salva e ricarica il pannello

**Prevenzione**:
- Completa la configurazione iniziale prima di usare il modulo
- Usa il wizard di configurazione se disponibile

---

## Errori di Microfono e Cattura Audio

### MicrophoneNotSupported

**Messaggio**: `Il tuo browser non supporta la cattura audio del microfono.`

**Causa**: Il browser non supporta l'API MediaStream necessaria per la registrazione audio.

**Soluzioni**:
1. Usa un browser moderno supportato:
   - **Chrome** 74+ (consigliato)
   - **Firefox** 66+
   - **Edge** 79+
   - **Safari** 14.1+ (supporto limitato)
2. Aggiorna il browser all'ultima versione
3. Evita browser obsoleti come Internet Explorer

**Prevenzione**:
- Mantieni il browser sempre aggiornato
- Usa Chrome per la massima compatibilità

---

### MicrophonePermissionDenied

**Messaggio**: `Permesso microfono negato. Consenti l'accesso al microfono nelle impostazioni del browser.`

**Causa**: L'utente ha negato il permesso di accesso al microfono, o il browser ha bloccato l'accesso.

**Soluzioni**:

**Chrome/Edge**:
1. Clicca sull'icona del lucchetto/microfono nella barra degli indirizzi
2. Seleziona **Consenti** per il microfono
3. Ricarica la pagina (F5)
4. Se non appare, vai in **Impostazioni** > **Privacy e sicurezza** > **Impostazioni sito** > **Microfono**
5. Rimuovi il blocco per il sito di Foundry VTT
6. Aggiungi il sito alla lista di quelli consentiti

**Firefox**:
1. Clicca sull'icona del microfono nella barra degli indirizzi
2. Rimuovi il blocco per il microfono
3. Ricarica la pagina
4. Quando richiesto, clicca **Consenti**

**Safari**:
1. Vai in **Safari** > **Preferenze** > **Siti Web** > **Microfono**
2. Trova il sito di Foundry VTT
3. Cambia da "Nega" a "Consenti"
4. Ricarica la pagina

**Prevenzione**:
- Clicca sempre **Consenti** quando richiesto al primo avvio
- Non bloccare permanentemente il microfono per il sito

---

### MicrophoneNotFound

**Messaggio**: `Nessun microfono trovato. Collega un microfono e riprova.`

**Causa**: Il sistema non rileva alcun dispositivo di input audio.

**Soluzioni**:
1. Verifica che il microfono sia collegato fisicamente
2. Controlla le impostazioni audio del sistema operativo:
   - **Windows**: Impostazioni > Sistema > Audio > Dispositivi di input
   - **macOS**: Preferenze di Sistema > Suono > Input
   - **Linux**: Impostazioni > Audio > Input
3. Assicurati che il microfono sia abilitato e non mutato
4. Prova un altro microfono o dispositivo
5. Riavvia il browser dopo aver collegato il microfono
6. Se usi un microfono USB, prova un'altra porta USB

**Prevenzione**:
- Collega il microfono prima di avviare Foundry VTT
- Usa microfoni di qualità con driver aggiornati
- Testa il microfono in altre applicazioni prima di usare Narrator Master

---

### MicrophoneInUse

**Messaggio**: `Il microfono è in uso da un'altra applicazione. Chiudi le altre app che usano il microfono.`

**Causa**: Un'altra applicazione sta usando il microfono in modalità esclusiva.

**Soluzioni**:
1. Chiudi altre applicazioni che potrebbero usare il microfono:
   - Zoom, Teams, Discord, Skype
   - Altri browser o schede del browser
   - Software di registrazione audio
   - OBS, Streamlabs, altri software di streaming
2. Controlla le app in background:
   - **Windows**: Task Manager > Cerca app con icona microfono
   - **macOS**: Monitor Attività > Filtra per "Audio"
   - **Linux**: `lsof /dev/snd/*` per vedere chi usa l'audio
3. Riavvia il browser
4. In caso estremo, riavvia il computer

**Prevenzione**:
- Chiudi app di videoconferenza prima di usare Narrator Master
- Usa schede separate del browser per Foundry VTT
- Non aprire più istanze di Foundry VTT contemporaneamente

---

### MicrophoneConstraints

**Messaggio**: `Il microfono non soddisfa i requisiti richiesti.`

**Causa**: Il microfono non supporta le impostazioni audio richieste (es. sample rate, canali).

**Soluzioni**:
1. Controlla le specifiche del microfono:
   - Sample rate minimo: 8000 Hz (consigliato 44100 Hz o 48000 Hz)
   - Canali: mono o stereo
2. Prova un microfono diverso
3. Aggiorna i driver del microfono:
   - **Windows**: Gestione dispositivi > Controller audio > Aggiorna driver
   - **macOS**: Di solito non necessario
   - **Linux**: Installa `pulseaudio` o `pipewire` aggiornati
4. Usa il microfono integrato del laptop come test

**Prevenzione**:
- Usa microfoni standard da almeno 16 kHz
- Evita microfoni molto vecchi o economici
- Testa il microfono in altre applicazioni prima

---

### MicrophoneSecurityError

**Messaggio**: `Errore di sicurezza: la cattura audio richiede HTTPS in produzione.`

**Causa**: Stai accedendo a Foundry VTT via HTTP invece di HTTPS, e il browser blocca l'accesso al microfono.

**Soluzioni**:

**Soluzione immediata (solo sviluppo locale)**:
- Se usi `localhost`, dovrebbe funzionare anche con HTTP
- Verifica che l'URL sia esattamente `http://localhost:30000` (non l'IP)

**Soluzione permanente (produzione)**:
1. Configura HTTPS per Foundry VTT:
   - Ottieni un certificato SSL (Let's Encrypt è gratuito)
   - Configura il server web (Apache/Nginx) con SSL
   - O usa il reverse proxy di Foundry VTT con certificato
2. Oppure usa un tunnel sicuro:
   - **Ngrok**: `ngrok http 30000` (crea un URL HTTPS temporaneo)
   - **Cloudflare Tunnel**: Configurazione più permanente
3. Segui la [guida ufficiale di Foundry VTT su SSL](https://foundryvtt.com/article/nginx/)

**Prevenzione**:
- Configura sempre HTTPS per server pubblici
- Usa `localhost` solo per test in locale
- Non condividere mai URL HTTP pubblici

---

### MicrophoneGeneric

**Messaggio**: `Errore microfono: {error}`

**Causa**: Un errore generico non categorizzato si è verificato durante l'accesso al microfono.

**Soluzioni**:
1. Leggi il messaggio di errore specifico (il testo dopo "Errore microfono:")
2. Cerca l'errore nella documentazione del browser
3. Soluzioni comuni:
   - Riavvia il browser
   - Riavvia il computer
   - Controlla gli aggiornamenti del sistema operativo
   - Verifica i permessi dell'app del browser nelle impostazioni di sicurezza del sistema
4. Prova in una finestra di navigazione in incognito
5. Disabilita estensioni del browser che potrebbero interferire (adblocker, privacy tools)

**Prevenzione**:
- Mantieni aggiornati browser e sistema operativo
- Usa profili browser dedicati per Foundry VTT

---

### InvalidAudio

**Messaggio**: `Audio non valido. Assicurati che la registrazione contenga dati audio.`

**Causa**: Il file audio registrato è vuoto o corrotto.

**Soluzioni**:
1. Verifica che il microfono funzioni:
   - Apri le impostazioni audio del sistema
   - Parla nel microfono e verifica che le barre si muovano
2. Controlla il livello audio nel pannello Narrator Master durante la registrazione:
   - Deve mostrare "Livello audio normale" o "Livello audio alto"
   - Se mostra sempre "Livello audio basso", alza il volume del microfono
3. Registra per almeno 3-5 secondi prima di fermare
4. Verifica che non ci sia il mute del microfono:
   - Nel sistema operativo
   - Nel pannello di controllo audio
   - Sul microfono stesso (se ha un pulsante mute)
5. Prova a parlare più forte o avvicinarti al microfono

**Prevenzione**:
- Testa sempre il microfono prima della sessione
- Registra almeno 5 secondi di audio
- Parla chiaramente durante la registrazione
- Controlla l'indicatore di livello audio nel pannello

---

### RecordingFailed

**Messaggio**: `Registrazione fallita. Riprova.`

**Causa**: La registrazione audio non è riuscita a completarsi correttamente.

**Soluzioni**:
1. Riavvia il browser completamente
2. Verifica la memoria disponibile:
   - La registrazione richiede RAM per bufferizzare l'audio
   - Chiudi schede e app non necessarie
3. Controlla lo spazio su disco (per cache temporanee)
4. Se il problema persiste:
   - Disabilita altre estensioni del browser
   - Prova con un browser diverso
   - Verifica i log della console (F12)
5. Assicurati che il codec audio sia supportato:
   - Il browser deve supportare `audio/webm;codecs=opus`
   - Tutti i browser moderni lo supportano

**Prevenzione**:
- Registra in sessioni più brevi (max 30-60 minuti)
- Chiudi app non necessarie per liberare RAM
- Usa un browser aggiornato

---

### RecorderInitFailed

**Messaggio**: `Impossibile inizializzare il registratore: {error}`

**Causa**: Il MediaRecorder non è riuscito a inizializzarsi con le impostazioni richieste.

**Soluzioni**:
1. Controlla il messaggio di errore specifico
2. Verifica il supporto del codec:
   - Apri la console (F12)
   - Esegui: `MediaRecorder.isTypeSupported('audio/webm;codecs=opus')`
   - Dovrebbe restituire `true`
3. Se il codec non è supportato:
   - Aggiorna il browser all'ultima versione
   - Prova un browser diverso (Chrome consigliato)
4. Disabilita accelerazione hardware:
   - **Chrome**: chrome://settings > Sistema > Disattiva "Usa accelerazione hardware quando disponibile"
   - Riavvia il browser
5. Controlla driver audio aggiornati

**Prevenzione**:
- Usa sempre Chrome o Firefox aggiornati
- Testa la funzionalità prima di sessioni importanti

---

### FileTooLarge

**Messaggio**: `File audio troppo grande ({size}MB). Il limite massimo è 25MB.`

**Causa**: Il chunk di audio registrato supera il limite di 25MB imposto da OpenAI.

**Soluzioni**:
1. Registra in sessioni più brevi:
   - Ferma la registrazione ogni 20-30 minuti
   - Fai pause per elaborare i chunk
2. Il modulo dovrebbe già chunking automatico, se vedi questo errore:
   - Controlla che il chunking sia abilitato
   - Verifica che la dimensione del chunk sia configurata correttamente
3. Se il problema persiste, potrebbe esserci un bug:
   - Ferma e riavvia la registrazione
   - Ricarica il pannello
   - Segnala il problema agli sviluppatori

**Prevenzione**:
- Non registrare continuamente per ore
- Fai pause ogni 30 minuti
- Ferma la registrazione durante le pause della sessione

---

## Errori di Trascrizione

### TranscriptionFailed

**Messaggio**: `Trascrizione fallita (Errore {status}): {message}`

**Causa**: OpenAI Whisper ha rifiutato o non è riuscito a elaborare l'audio.

**Soluzioni**:

**Errore 400 (Bad Request)**:
1. L'audio potrebbe essere corrotto
2. Il formato audio non è supportato
3. Riprova la registrazione con un nuovo chunk

**Errore 401 (Unauthorized)**:
1. Chiave API non valida o scaduta
2. Verifica la chiave nelle impostazioni
3. Rigenera la chiave su OpenAI

**Errore 413 (Payload Too Large)**:
1. Il file audio è troppo grande (max 25MB)
2. Ferma la registrazione prima
3. Il modulo dovrebbe prevenire questo con il chunking

**Errore 429 (Rate Limited)**:
1. Troppo richieste in poco tempo
2. Attendi 1-2 minuti
3. Riduci la frequenza delle registrazioni

**Errore 500/503 (Server Error)**:
1. OpenAI sta avendo problemi
2. Controlla [status.openai.com](https://status.openai.com)
3. Attendi e riprova dopo qualche minuto

**Prevenzione**:
- Non inviare troppe richieste simultanee
- Mantieni chunk audio sotto 20MB
- Controlla il saldo OpenAI prima delle sessioni

---

### NoTranscription

**Messaggio**: `Nessuna trascrizione disponibile per l'analisi.`

**Causa**: L'AI Assistant non può analizzare il contesto perché non c'è trascrizione.

**Soluzioni**:
1. Avvia una registrazione prima di chiedere suggerimenti
2. Attendi che almeno un chunk venga trascritto (circa 30 secondi)
3. Verifica che la trascrizione appaia nella scheda **Trascrizione**
4. Se la scheda è vuota:
   - Controlla gli errori di trascrizione precedenti
   - Verifica la chiave API
   - Prova a registrare nuovamente

**Prevenzione**:
- Avvia sempre la registrazione prima di usare l'AI Assistant
- Lascia accumulare almeno 30 secondi di trascrizione

---

## Errori di Assistente AI e Generazione Immagini

### AIAssistantFailed

**Messaggio**: `Assistente AI fallito (Errore {status}): {message}`

**Causa**: L'API di OpenAI GPT ha rifiutato o non è riuscita a generare suggerimenti.

**Soluzioni**:

**Errore 400 (Bad Request)**:
1. Il prompt potrebbe essere malformato
2. Il contesto potrebbe essere troppo lungo
3. Riduci la lunghezza della trascrizione o del Journal

**Errore 401 (Unauthorized)**:
1. Chiave API non valida
2. Verifica e aggiorna la chiave

**Errore 429 (Rate Limited)**:
1. Troppe richieste
2. Attendi qualche minuto
3. L'AI Assistant fa richieste automatiche - riduci la frequenza delle registrazioni

**Errore 500/503 (Server Error)**:
1. Problemi temporanei di OpenAI
2. Controlla [status.openai.com](https://status.openai.com)
3. Riprova dopo qualche minuto

**Prevenzione**:
- Non sovraccaricare con trascrizioni lunghissime
- Mantieni i Journal concisi e ben strutturati
- Monitora il rate limit del tuo account OpenAI

---

### ImageGenerationFailed

**Messaggio**: `Generazione immagine fallita (Errore {status}): {message}`

**Causa**: L'API di generazione immagini OpenAI ha fallito.

**Soluzioni**:

**Errore 400 (Bad Request)**:
1. Il prompt potrebbe violare le policy
2. Descrizione troppo lunga o complessa
3. Semplifica la descrizione

**Errore 401 (Unauthorized)**:
1. Chiave API non valida
2. Verifica la chiave

**Errore 429 (Rate Limited)**:
1. Troppe richieste di immagini
2. Attendi qualche minuto
3. Limita il numero di immagini generate per sessione

**Errore 500/503 (Server Error)**:
1. OpenAI ha problemi temporanei
2. Riprova dopo qualche minuto

**Prevenzione**:
- Genera immagini con moderazione (max 5-10 per sessione)
- Usa descrizioni chiare e concise
- Verifica il saldo del tuo account OpenAI

---

### NoPrompt

**Messaggio**: `Nessun prompt fornito per la generazione dell'immagine.`

**Causa**: È stata richiesta una generazione di immagine senza fornire una descrizione.

**Soluzioni**:
1. Clicca **Genera Immagine** nel pannello
2. Quando richiesto, inserisci una descrizione
3. Sii specifico: "Un drago rosso che vola su un castello in fiamme"
4. Oppure usa la generazione automatica basata sul contesto

**Prevenzione**:
- Fornisci sempre una descrizione quando generi immagini manualmente
- Usa la funzione automatica se non hai idee specifiche

---

### NoDescription

**Messaggio**: `Nessuna descrizione fornita per l'infografica.`

**Causa**: Simile a NoPrompt, ma specifico per le infografiche.

**Soluzioni**:
1. Fornisci una descrizione del tipo di infografica desiderata
2. Esempi:
   - "Mappa di una foresta incantata con un fiume"
   - "Diagramma della gerarchia di una gilda di ladri"
   - "Schema di un dungeon a tre livelli"

**Prevenzione**:
- Pianifica le infografiche di cui hai bisogno
- Salva descrizioni di infografiche riutilizzabili

---

### ContentPolicy

**Messaggio**: `Il contenuto viola le policy di OpenAI. Prova con una descrizione diversa.`

**Causa**: La descrizione dell'immagine viola le Content Policy di OpenAI (violenza esplicita, contenuti per adulti, ecc.).

**Soluzioni**:
1. Modifica la descrizione per renderla meno esplicita:
   - ❌ "Un omicidio brutale e sanguinoso"
   - ✅ "Una scena di combattimento fantasy"
2. Evita riferimenti a:
   - Violenza grafica dettagliata
   - Contenuti sessuali
   - Personaggi famosi reali
   - Marchi registrati
3. Usa linguaggio fantasy/RPG generico

**Prevenzione**:
- Mantieni le descrizioni in stile fantasy classico
- Evita dettagli espliciti
- Consulta le [Content Policy di OpenAI](https://openai.com/policies/usage-policies)

---

### ContentTooLong

**Messaggio**: `Contenuto troppo lungo. Il limite massimo è {maxLength} caratteri.`

**Causa**: Il prompt dell'immagine o il contesto supera la lunghezza massima consentita.

**Soluzioni**:
1. Riduci la lunghezza della descrizione
2. Focalizzati sugli elementi essenziali
3. Dividi descrizioni complesse in più immagini separate
4. Per il contesto dell'AI Assistant:
   - Riduci la lunghezza del Journal
   - Pulisci vecchie trascrizioni

**Prevenzione**:
- Usa descrizioni concise (100-200 caratteri)
- Mantieni i Journal focalizzati sull'avventura corrente

---

### InvalidContent

**Messaggio**: `Contenuto non valido. Il contenuto contiene caratteri o formattazione non consentiti.`

**Causa**: Il contenuto contiene caratteri speciali, HTML, o formattazione non supportata.

**Soluzioni**:
1. Rimuovi caratteri speciali dal prompt:
   - Emoji
   - Simboli Unicode non standard
   - Tag HTML
2. Usa solo testo semplice
3. Se il problema è nel Journal:
   - Modifica le pagine del Journal
   - Rimuovi formattazione complessa
   - Usa testo semplice

**Prevenzione**:
- Scrivi descrizioni in testo semplice
- Evita copia-incolla da documenti formattati

---

### NoContextForImage

**Messaggio**: `Nessun contesto disponibile per generare un'immagine. Registra prima dell'audio.`

**Causa**: Hai richiesto una generazione automatica di immagine, ma non c'è trascrizione o contesto disponibile.

**Soluzioni**:
1. Avvia una registrazione
2. Accumula almeno 1-2 minuti di trascrizione
3. Riprova la generazione automatica
4. Oppure usa la modalità manuale e fornisci una descrizione esplicita

**Prevenzione**:
- Registra audio prima di usare la generazione automatica
- Usa descrizioni manuali se non hai contesto

---

## Errori di Rete e API

### NetworkError

**Messaggio**: `Errore di connessione. Verifica la tua connessione Internet e riprova.`

**Causa**: Impossibile raggiungere i server OpenAI a causa di problemi di rete.

**Soluzioni**:
1. Verifica la connessione Internet:
   - Apri un sito web esterno per testare
   - Verifica che il Wi-Fi o Ethernet siano connessi
2. Controlla il firewall:
   - Assicurati che il browser possa accedere a `api.openai.com`
   - Configura eccezioni se necessario
3. Controlla proxy o VPN:
   - Disattiva temporaneamente VPN
   - Verifica impostazioni proxy del browser
4. Se sei dietro un firewall aziendale:
   - Contatta l'IT per whitelistare `api.openai.com`
5. Prova a:
   - Cambiare rete (usa hotspot mobile per testare)
   - Usare DNS pubblici (8.8.8.8, 1.1.1.1)
   - Riavviare il router

**Prevenzione**:
- Usa una connessione Internet stabile
- Evita reti pubbliche instabili
- Whitelist OpenAI nel firewall se applicabile

---

### RateLimited

**Messaggio**: `Limite di richieste raggiunto. Attendi qualche momento prima di riprovare.`

**Causa**: Hai superato il rate limit del tuo account OpenAI (richieste per minuto/giorno).

**Soluzioni**:
1. **Immediato**: Attendi 1-5 minuti prima di riprovare
2. **Rate limit tier**:
   - Tier 1 (nuovo): 500 RPM, 200K TPD
   - Tier 2 ($50 spesi): 5K RPM, 2M TPD
   - Controlla il tuo tier su [platform.openai.com/account/limits](https://platform.openai.com/account/limits)
3. **Riduci la frequenza**:
   - Registra in chunk più lunghi (es. 60 secondi invece di 30)
   - Non generare troppe immagini contemporaneamente
   - Limita le richieste AI Assistant
4. **Upgrade tier**:
   - Spendi $50+ per passare al Tier 2
   - Contatta OpenAI per tier più alti se necessario

**Prevenzione**:
- Monitora l'uso nel dashboard OpenAI
- Configura alert per rate limit
- Pianifica sessioni con pause per evitare spike di richieste
- Considera tier superiori per sessioni intensive

---

### Timeout

**Messaggio**: `La richiesta ha impiegato troppo tempo. Riprova più tardi.`

**Causa**: La richiesta a OpenAI non ha ricevuto risposta entro il timeout (solitamente 30-60 secondi).

**Soluzioni**:
1. Controlla la connessione Internet (latenza alta?)
2. Verifica lo stato di OpenAI su [status.openai.com](https://status.openai.com)
3. Riprova dopo 1-2 minuti
4. Se persiste:
   - Riduci la dimensione dei chunk audio
   - Riduci la lunghezza del Journal
   - Semplifica le descrizioni delle immagini
5. Per trascrizioni:
   - Registra chunk più corti (15-20 secondi invece di 30)

**Prevenzione**:
- Usa una connessione Internet veloce e stabile
- Non inviare file audio troppo grandi
- Mantieni Journal e prompt concisi

---

### ServerError

**Messaggio**: `Errore del server OpenAI. Riprova più tardi.`

**Causa**: OpenAI sta riscontrando problemi tecnici sul loro lato (errori 500, 502, 503).

**Soluzioni**:
1. Controlla [status.openai.com](https://status.openai.com) per incident noti
2. Attendi 5-10 minuti
3. Riprova l'operazione
4. Se il problema persiste oltre 30 minuti:
   - Segnala su Twitter [@OpenAIDevs](https://twitter.com/OpenAIDevs)
   - Controlla community forum OpenAI
5. Non è un problema del tuo modulo - è temporaneo

**Prevenzione**:
- Nessuna, sono problemi esterni
- Pianifica sessioni con buffer di tempo per eventuali downtime
- Tieni backup delle trascrizioni localmente

---

### BadRequest

**Messaggio**: `Richiesta non valida: {details}`

**Causa**: La richiesta a OpenAI è malformata o contiene parametri non validi.

**Soluzioni**:
1. Leggi i dettagli specifici dell'errore
2. Problemi comuni:
   - Parametri non supportati dal modello
   - JSON malformato (bug del modulo)
   - Valori fuori range
3. Se vedi questo errore:
   - Annota i dettagli esatti
   - Apri un issue su GitHub del modulo
   - Include il messaggio di errore completo
4. Workaround temporaneo:
   - Riavvia il pannello
   - Prova con dati più semplici (es. descrizioni brevi)

**Prevenzione**:
- Mantieni il modulo aggiornato (i bug vengono corretti)
- Segnala errori ricorrenti

---

### ServiceUnavailable

**Messaggio**: `Servizio temporaneamente non disponibile. Riprova tra qualche minuto.`

**Causa**: I servizi OpenAI sono temporaneamente offline o in manutenzione.

**Soluzioni**:
1. Attendi 5-10 minuti
2. Controlla [status.openai.com](https://status.openai.com)
3. Durante downtime:
   - Puoi comunque registrare (l'audio viene bufferizzato)
   - La trascrizione avverrà appena il servizio torna online
4. Se il downtime è prolungato:
   - Esporta le trascrizioni in sospeso
   - Considera di rimandare le generazioni di immagini
   - Usa appunti manuali temporaneamente

**Prevenzione**:
- Nessuna, dipende da OpenAI
- Pianifica sessioni critiche con piano B (appunti manuali)

---

### UnexpectedError

**Messaggio**: `Si è verificato un errore imprevisto: {message}`

**Causa**: Un errore non previsto dal modulo.

**Soluzioni**:
1. Leggi il messaggio di errore specifico
2. Apri la console del browser (F12) e cerca errori JavaScript
3. Copia tutto il messaggio di errore e lo stack trace
4. Prova questi passi:
   - Ricarica la pagina (F5)
   - Riavvia il browser
   - Disabilita altri moduli per testare conflitti
   - Prova in finestra in incognito
5. Se persiste:
   - Apri un issue su GitHub
   - Includi: messaggio errore, passi per riprodurre, versione Foundry, versione modulo

**Prevenzione**:
- Mantieni aggiornati Foundry VTT e il modulo
- Segnala bug tempestivamente

---

## Errori di Journal

### InvalidJournalId

**Messaggio**: `ID Journal non valido.`

**Causa**: L'ID del Journal selezionato non è valido o non esiste più.

**Soluzioni**:
1. Vai nelle impostazioni del modulo
2. Apri il menu **Journal dell'Avventura**
3. Seleziona un Journal valido dalla lista
4. Salva le impostazioni
5. Se la lista è vuota:
   - Crea un nuovo Journal entry in Foundry VTT
   - Aggiungi alcune pagine di testo con contenuto
   - Torna nelle impostazioni e selezionalo

**Prevenzione**:
- Non eliminare Journal entries mentre sono in uso
- Deseleziona il Journal prima di eliminarlo

---

### JournalNotFound

**Messaggio**: `Journal non trovato: {id}`

**Causa**: Il Journal selezionato è stato eliminato o non è accessibile.

**Soluzioni**:
1. Controlla se il Journal esiste ancora:
   - Apri la sidebar **Journal Entries**
   - Cerca il Journal per nome
2. Se è stato eliminato:
   - Seleziona un Journal diverso nelle impostazioni
   - O creane uno nuovo
3. Se esiste ma non viene trovato:
   - Verifica i permessi (devi essere GM)
   - Ricarica Foundry VTT
   - Controlla la console per errori

**Prevenzione**:
- Fai backup regolari dei Journal importanti
- Non eliminare Journal durante le sessioni attive

---

### JournalEmpty

**Messaggio**: `Il Journal selezionato è vuoto.`

**Causa**: Il Journal selezionato non ha pagine o tutte le pagine sono vuote.

**Soluzioni**:
1. Apri il Journal in Foundry VTT
2. Aggiungi almeno una pagina di tipo **Testo**
3. Scrivi contenuto rilevante per l'avventura:
   - Trama principale
   - PNG e location
   - Eventi previsti
4. Salva il Journal
5. Il modulo caricherà automaticamente il nuovo contenuto

**Prevenzione**:
- Prepara sempre il Journal prima delle sessioni
- Mantieni il Journal aggiornato con la progressione della campagna

---

## Errori di Etichette Parlanti

### InvalidSpeaker

**Messaggio**: `ID parlante non valido`

**Causa**: Hai tentato di modificare un parlante che non esiste nella trascrizione.

**Soluzioni**:
1. Ricarica il pannello
2. Verifica che la trascrizione contenga identificazioni di parlanti
3. Se il problema persiste:
   - Cancella la trascrizione
   - Riavvia una nuova registrazione
   - Il sistema di diarizzazione ricreerà i parlanti

**Prevenzione**:
- Non modificare manualmente i dati dei parlanti al di fuori del UI

---

### InvalidLabel

**Messaggio**: `Etichetta parlante non valida`

**Causa**: L'etichetta fornita per il parlante contiene caratteri non consentiti.

**Soluzioni**:
1. Usa solo caratteri alfanumerici e spazi
2. Evita:
   - Caratteri speciali: `<>{}[]|`
   - Emoji
   - HTML
3. Esempi validi:
   - "Marco" ✅
   - "Giocatore 1" ✅
   - "DM" ✅
   - "Marco <3" ❌
   - "Giocatore #1" ❌

**Prevenzione**:
- Usa nomi semplici per i parlanti
- Solo lettere, numeri e spazi

---

### EmptyLabel

**Messaggio**: `L'etichetta non può essere vuota`

**Causa**: Hai tentato di assegnare un nome vuoto a un parlante.

**Soluzioni**:
1. Inserisci un nome valido nel campo
2. Oppure clicca **Ripristina Nome** per tornare all'etichetta predefinita (es. "Parlante 1")

**Prevenzione**:
- Fornisci sempre un nome quando assegni etichette

---

### SaveMappingsFailed

**Messaggio**: `Impossibile salvare le mappature dei parlanti`

**Causa**: Il sistema non è riuscito a salvare le associazioni nome-parlante.

**Soluzioni**:
1. Verifica i permessi del browser per il local storage
2. Controlla lo spazio disponibile:
   - Apri la console (F12)
   - Vai in **Application** > **Local Storage**
   - Controlla se ci sono errori di quota
3. Pulisci dati vecchi:
   - Cancella local storage di Foundry VTT
   - Riconfigura le impostazioni
4. Se il problema persiste:
   - Prova un browser diverso
   - Segnala il bug

**Prevenzione**:
- Pulisci periodicamente la cache del browser
- Non assegnare etichette a centinaia di parlanti

---

## Errori Generali

### CopyFailed

**Messaggio**: `Impossibile copiare negli appunti.`

**Causa**: Il browser ha bloccato l'accesso alla Clipboard API.

**Soluzioni**:
1. Concedi i permessi per gli appunti:
   - Clicca l'icona nella barra degli indirizzi
   - Consenti l'accesso agli appunti
2. Metodo manuale:
   - Seleziona tutto il testo (Ctrl+A / Cmd+A)
   - Copia manualmente (Ctrl+C / Cmd+C)
3. Browser specifici:
   - **Firefox**: Potrebbe richiedere conferma esplicita
   - **Safari**: Vai in Preferenze > Siti Web > Appunti
4. Se il problema persiste:
   - Esporta la trascrizione come file di testo invece
   - Usa **Esporta Trascrizione**

**Prevenzione**:
- Consenti accesso appunti al primo prompt
- Usa il pulsante Esporta per backup permanenti

---

### ExportFailed

**Messaggio**: `Esportazione trascrizione fallita. Riprova.`

**Causa**: Il browser non è riuscito a scaricare il file di trascrizione.

**Soluzioni**:
1. Controlla i permessi di download del browser
2. Verifica che i popup non siano bloccati
3. Controlla lo spazio su disco
4. Prova manualmente:
   - Copia la trascrizione
   - Incolla in un editor di testo
   - Salva manualmente
5. Se il browser blocca download:
   - Vai in Impostazioni > Download
   - Controlla blocchi automatici
   - Aggiungi eccezione per il sito

**Prevenzione**:
- Consenti download dal sito di Foundry VTT
- Verifica spazio su disco regolarmente

---

## Avvisi e Notifiche

### NoContext (Off-Track)

**Messaggio**: `Nessun contesto avventura impostato per il rilevamento fuori tema.`

**Causa**: Non hai selezionato un Journal dell'avventura, quindi il sistema non può rilevare deviazioni.

**Soluzioni**:
1. Vai nelle impostazioni del modulo
2. Seleziona un Journal nel menu **Journal dell'Avventura**
3. Assicurati che il Journal contenga la trama dell'avventura
4. Il rilevamento fuori tema funzionerà dalla prossima analisi

**Nota**:
- Il rilevamento fuori tema è opzionale
- Puoi usare il modulo senza Journal (solo per trascrizione)

---

### ParseError (Off-Track)

**Messaggio**: `Impossibile analizzare la risposta del rilevamento fuori tema.`

**Causa**: L'AI ha restituito una risposta in formato non valido.

**Soluzioni**:
1. Questo è generalmente temporaneo
2. Riprova dopo il prossimo chunk di trascrizione
3. Se persiste:
   - Controlla la console per errori
   - Verifica che il modello GPT sia disponibile
   - Potrebbe essere un problema temporaneo di OpenAI
4. Il sistema continuerà comunque a trascrivere

**Prevenzione**:
- Nessuna, è un problema temporaneo dell'API
- Il modulo riproverà automaticamente

---

### PlayersOffTrack

**Notifica**: `Attenzione: I giocatori si stanno allontanando dalla trama!`

**Significato**: Il sistema ha rilevato che la conversazione si sta allontanando dalla trama dell'avventura.

**Azioni da intraprendere**:
1. **Non è un errore!** È una feature per avvisarti
2. Controlla il pannello per il **Ponte Narrativo** suggerito
3. Decidi se:
   - Riportare i giocatori in carreggiata usando il suggerimento
   - Lasciare che esplorino liberamente
   - Adattare la trama alla loro direzione
4. Il badge rosso scomparirà quando i giocatori torneranno in tema

**Regolare la sensibilità**:
- **Bassa**: Solo grandi deviazioni
- **Media**: Bilanciato (default)
- **Alta**: Anche piccole variazioni

**Nota**: È uno strumento, non un obbligo - sei sempre tu il DM!

---

## Verifiche Preventive

### Prima di Ogni Sessione

- [ ] Verifica saldo OpenAI (almeno $2-3)
- [ ] Testa il microfono in altre app
- [ ] Controlla la connessione Internet
- [ ] Apri Narrator Master e verifica "Modulo pronto"
- [ ] Seleziona il Journal dell'avventura corrente
- [ ] Fai una registrazione di test di 10 secondi

### Durante la Sessione

- [ ] Monitora l'indicatore livello audio
- [ ] Controlla che le trascrizioni appaiano
- [ ] Fai pause ogni 30-45 minuti per elaborare
- [ ] Esporta le trascrizioni periodicamente (backup)

### Dopo la Sessione

- [ ] Esporta la trascrizione finale
- [ ] Salva eventuali immagini generate importanti
- [ ] Controlla il consumo OpenAI per la sessione
- [ ] Aggiorna il Journal con eventi della sessione

---

## Risorse Aggiuntive

- **GitHub**: [Segnala bug e richiedi feature](https://github.com/Aiacos/narrator_master/issues)
- **OpenAI Status**: [status.openai.com](https://status.openai.com)
- **OpenAI Limits**: [platform.openai.com/account/limits](https://platform.openai.com/account/limits)
- **Foundry VTT**: [foundryvtt.com/kb](https://foundryvtt.com/kb)

---

## Contatti e Supporto

Se incontri un problema non documentato qui:

1. Controlla la console del browser (F12) per errori
2. Cerca nel [GitHub Issues](https://github.com/Aiacos/narrator_master/issues)
3. Apri un nuovo issue includendo:
   - Versione Foundry VTT
   - Versione Narrator Master
   - Messaggio di errore completo
   - Passi per riprodurre il problema
   - Screenshot/log della console

**Nota**: Non includere mai la tua chiave API nelle segnalazioni!
