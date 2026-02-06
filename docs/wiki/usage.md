# Guida all'Utilizzo

Questa guida completa ti insegnera a usare tutte le funzionalita di Narrator Master durante le tue sessioni di gioco.

## Il Pannello DM

Il pannello DM e l'interfaccia principale di Narrator Master. E visibile **solo al Game Master**.

### Aprire il Pannello

1. Cerca il gruppo di controlli **Narrator Master** nella barra laterale sinistra
2. Clicca sul pulsante **Apri/Chiudi Pannello DM**
3. Il pannello apparira come una finestra mobile

### Caratteristiche del Pannello

- **Trascinabile**: Clicca sulla barra del titolo per spostarlo
- **Ridimensionabile**: Trascina i bordi per cambiare dimensione
- **Minimizzabile**: Clicca sull'icona "-" per ridurlo
- **Persistente**: La posizione viene salvata tra le sessioni

### Le Schede del Pannello

Il pannello e organizzato in tre schede:

| Scheda | Contenuto |
|--------|-----------|
| **Trascrizione** | Testo trascritto dall'audio con identificazione parlanti |
| **Suggerimenti** | Consigli AI basati sul contesto della sessione |
| **Immagini** | Galleria delle immagini generate |

## Registrazione Audio

La registrazione audio e il cuore del modulo. Cattura la voce dalla sessione e la trascrive in tempo reale.

### Avviare la Registrazione

1. Assicurati che il microfono sia collegato
2. Clicca il pulsante **Avvia Registrazione** (icona microfono)
3. Se richiesto, **consenti l'accesso al microfono** nel browser
4. L'indicatore del livello audio mostrera l'attivita

### Durante la Registrazione

Mentre registri:

- L'**indicatore di livello** mostra l'intensita dell'audio
- Lo stato mostra "**In registrazione**"
- L'audio viene elaborato in chunk di circa 30 secondi
- La trascrizione appare automaticamente nella scheda omonima

### Controlli di Registrazione

| Pulsante | Funzione |
|----------|----------|
| **Avvia** | Inizia a registrare |
| **Pausa** | Sospende temporaneamente (l'audio non viene perso) |
| **Riprendi** | Continua dopo una pausa |
| **Ferma** | Termina la registrazione e processa l'ultimo chunk |

### Consigli per una Buona Registrazione

- **Posizione del microfono**: Piu vicino = migliore qualita
- **Ambiente silenzioso**: Riduci rumori di fondo
- **Un parlante alla volta**: Migliora la diarizzazione
- **Volume costante**: Evita picchi che saturano l'audio

## Trascrizione

La trascrizione converte l'audio in testo usando OpenAI Whisper con supporto per la diarizzazione.

### Visualizzare la Trascrizione

1. Vai alla scheda **Trascrizione**
2. Il testo appare man mano che viene elaborato
3. Ogni segmento mostra:
   - **Etichetta del parlante** (se abilitata)
   - **Testo trascritto**
   - **Timestamp** del segmento

### Identificazione dei Parlanti

Il sistema di diarizzazione identifica automaticamente i parlanti:

- **Speaker 1**, **Speaker 2**, ecc. per parlanti diversi
- Utile per distinguere giocatori e master
- La precisione migliora con voci distinte

### Gestione della Trascrizione

| Azione | Come fare |
|--------|-----------|
| **Copiare** | Clicca "Copia negli Appunti" |
| **Cancellare** | Clicca "Cancella Trascrizione" |
| **Scorrere** | Usa la barra di scorrimento per risalire |

## Suggerimenti AI

I suggerimenti sono consigli generati dall'AI basati sulla conversazione e sul Journal dell'avventura.

### Come Funzionano

1. L'AI analizza la trascrizione recente
2. Confronta con il contenuto del Journal
3. Genera suggerimenti contestuali
4. Rileva eventuali deviazioni dalla trama

### Tipi di Suggerimenti

| Tipo | Descrizione |
|------|-------------|
| **Narrazione** | Descrizioni da leggere ai giocatori |
| **Dialogo** | Battute per PNG |
| **Azione** | Cosa fare o far accadere |
| **Riferimento** | Passaggi rilevanti del Journal |

### Livello di Confidenza

Ogni suggerimento ha un indicatore di confidenza:

- **Alta**: Suggerimento molto pertinente
- **Media**: Suggerimento probabilmente utile
- **Bassa**: Suggerimento speculativo

### Usare i Suggerimenti

1. Leggi il suggerimento proposto
2. Adattalo al tuo stile di narrazione
3. Non sei obbligato a seguirlo - e solo un aiuto!

## Rilevamento Fuori Tema

Una delle funzionalita piu utili: il modulo ti avvisa quando i giocatori si allontanano dalla trama.

### Come Viene Segnalato

Quando viene rilevata una deviazione:

1. Appare un **banner rosso** con "ATTENZIONE: Fuori Tema!"
2. La scheda Suggerimenti mostra un **badge di avviso**
3. Viene proposto un **Ponte Narrativo**

### Il Ponte Narrativo

Il ponte narrativo e un suggerimento speciale che ti aiuta a:

- Riportare i giocatori sulla trama principale
- Farlo in modo naturale e non forzato
- Mantenere la coerenza con l'avventura

### Sensibilita del Rilevamento

Puoi regolare la sensibilita nelle impostazioni:

| Sensibilita | Quando usarla |
|-------------|---------------|
| **Bassa** | Sessioni sandbox, improvvisazione libera |
| **Media** | Avventure con trama ma flessibili |
| **Alta** | Avventure lineari, moduli ufficiali |

## Generazione Immagini

Narrator Master puo creare immagini e infografiche su richiesta usando OpenAI.

### Generare un'Immagine

1. Vai alla scheda **Immagini**
2. Clicca **Genera Immagine**
3. Scegli tra:
   - **Automatico**: Basato sul contesto attuale
   - **Personalizzato**: Inserisci una descrizione
4. Attendi 10-30 secondi per la generazione

### Gestire le Immagini

| Azione | Come fare |
|--------|-----------|
| **Ingrandire** | Clicca sull'immagine |
| **Scaricare** | Clicca l'icona download |
| **Eliminare** | Clicca l'icona cestino |
| **Cancellare tutto** | Clicca "Cancella Immagini" |

### Note sulle Immagini

- Le immagini vengono **cachate localmente** automaticamente
- Gli URL originali scadono dopo 60 minuti
- Ogni immagine costa circa **$0.04-0.08**

## Integrazione Journal

Il Journal dell'avventura fornisce il contesto all'AI per generare suggerimenti pertinenti.

### Selezionare un Journal

1. Usa il menu a tendina **Seleziona Journal** nel pannello
2. Oppure configura il Journal predefinito nelle impostazioni
3. Il modulo analizzera automaticamente tutte le pagine di testo

### Struttura Consigliata del Journal

Per risultati ottimali, organizza il Journal cosi:

```
Journal dell'Avventura
├── Introduzione e Premessa
├── Capitolo 1 - [Titolo]
├── Capitolo 2 - [Titolo]
├── PNG Principali
├── Luoghi Importanti
└── Segreti e Rivelazioni
```

### Cosa Includere

- **Trama principale**: Obiettivi e sviluppi previsti
- **Descrizioni**: Ambienti, scene chiave
- **Dialoghi**: Battute importanti dei PNG
- **Segreti**: Informazioni da rivelare gradualmente
- **Alternative**: Possibili sviluppi della storia

### Aggiornare il Journal

Se modifichi il Journal durante la sessione:

1. Ri-seleziona il Journal dal menu a tendina
2. Il modulo rianalizzera il contenuto
3. I nuovi contenuti saranno disponibili per l'AI

## Workflow di una Sessione Tipica

### Prima della Sessione

1. [ ] Prepara il Journal dell'avventura
2. [ ] Verifica che la chiave API sia configurata
3. [ ] Testa il microfono
4. [ ] Apri il pannello DM

### Durante la Sessione

1. **Avvia la registrazione** quando inizia il gioco
2. **Monitora la trascrizione** per verificare l'audio
3. **Consulta i suggerimenti** quando serve ispirazione
4. **Metti in pausa** durante le pause (cibo, bagno, ecc.)
5. **Genera immagini** per momenti epici
6. **Osserva gli avvisi** fuori tema

### Dopo la Sessione

1. **Ferma la registrazione**
2. **Copia la trascrizione** se vuoi conservarla
3. **Salva le immagini** che ti piacciono
4. **Aggiorna il Journal** con nuovi sviluppi

## Risoluzione Problemi

### Il microfono non funziona

1. Verifica le **impostazioni del browser** (icona lucchetto)
2. Prova con un **browser diverso** (Chrome consigliato)
3. Controlla che **nessun'altra app** usi il microfono
4. Verifica che sia **HTTPS** (tranne localhost)

### La trascrizione non appare

1. Controlla la **chiave API** nelle impostazioni
2. Verifica di avere **crediti OpenAI**
3. Guarda la **console browser** (F12) per errori
4. Prova a **parlare piu forte/chiaro**

### I suggerimenti non sono pertinenti

1. **Seleziona un Journal** piu dettagliato
2. Verifica che il Journal contenga **testo** (non solo immagini)
3. Regola la **sensibilita** del rilevamento
4. Il sistema migliora con piu **contesto audio**

### "Limite di rate superato"

1. **Attendi** qualche minuto
2. Considera di **upgradare** il piano OpenAI
3. Riduci la **frequenza** di generazione immagini

### Il pannello non si apre

1. Verifica di essere **GM** nel mondo
2. Controlla che il modulo sia **attivato**
3. **Ricarica** la pagina (F5)
4. Controlla **errori** nella console (F12)

### Messaggi di Errore Comuni

| Errore | Soluzione |
|--------|-----------|
| "Chiave API non configurata" | Aggiungi la chiave nelle impostazioni |
| "Errore di rete" | Verifica la connessione internet |
| "Permesso microfono negato" | Consenti il microfono nel browser |
| "File troppo grande" | L'audio dovrebbe essere chunked automaticamente |
| "Limite di richieste" | Attendi e riprova |

## Scorciatoie e Trucchi

### Produttivita

- **Tieni il pannello sempre aperto** in un angolo dello schermo
- **Usa la pausa** invece di fermare durante le interruzioni
- **Prepara descrizioni** nel Journal prima della sessione
- **Copia i suggerimenti** che ti piacciono per uso futuro

### Risparmio Costi

- **Registra solo le parti importanti** della sessione
- **Genera poche immagini** mirate
- **Usa Journal concisi** per ridurre i token

### Migliore Qualita

- **Parla chiaramente** vicino al microfono
- **Un parlante alla volta** migliora la diarizzazione
- **Journal dettagliati** = suggerimenti migliori

## Domande Frequenti

### Quanto costa usare il modulo?

Una sessione tipica di 3 ore costa circa $1.31. Vedi [Costi Stimati](index.md#costi-stimati).

### Posso usare il piano gratuito di OpenAI?

No, il piano gratuito non include i modelli necessari. Serve almeno $5 di crediti.

### I giocatori possono vedere il pannello?

No, il pannello e visibile solo al GM.

### La trascrizione viene salvata?

Solo nella sessione corrente. Copiala se vuoi conservarla.

### Funziona con Discord/altri sistemi audio?

Narrator Master cattura solo l'audio del microfono del browser. Se usi Discord, l'audio degli altri giocatori non sara catturato (a meno che non passi attraverso i tuoi speaker e il tuo microfono li riprenda).

### Posso usarlo offline?

No, richiede connessione a internet per le API OpenAI.

---

Hai altre domande? Consulta l'[indice della wiki](index.md) o apri una [discussione su GitHub](https://github.com/narrator-master/narrator-master/discussions).
