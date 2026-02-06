# Guida alla Configurazione

Questa guida spiega come configurare Narrator Master per ottenere il massimo dalle sue funzionalita.

## Configurazione Iniziale

Dopo aver installato e attivato il modulo, segui questi passaggi per la configurazione iniziale.

### Passo 1: Apri le Impostazioni

1. Nel tuo mondo di gioco, clicca sull'icona **ingranaggio** (Game Settings)
2. Seleziona **Configure Settings**
3. Vai alla scheda **Module Settings**
4. Trova la sezione **Narrator Master**

### Passo 2: Configura la Chiave API OpenAI

La chiave API e **obbligatoria** per il funzionamento del modulo.

1. Nel campo **Chiave API OpenAI**, incolla la tua chiave API
2. La chiave deve iniziare con `sk-...`
3. Clicca **Save Changes**

> **Sicurezza**: La chiave viene memorizzata in modo sicuro tramite il sistema di impostazioni di Foundry VTT. Non e mai visibile ai giocatori ne salvata in file di testo.

### Passo 3: Seleziona il Journal dell'Avventura

Per abilitare i suggerimenti contestuali:

1. Trova l'impostazione **Journal dell'Avventura**
2. Seleziona dal menu a tendina il Journal che contiene i dettagli della tua avventura
3. Il modulo analizzera automaticamente le pagine di testo del Journal

> **Consiglio**: Organizza il Journal dell'avventura in pagine logiche (es. "Capitolo 1", "NPG Importanti", "Luoghi"). Il modulo indicizzera tutto il contenuto testuale.

## Panoramica delle Impostazioni

### Chiave API OpenAI

| Proprieta | Valore |
|-----------|--------|
| Nome tecnico | `openaiApiKey` |
| Tipo | Stringa |
| Ambito | World (solo GM) |
| Obbligatorio | Si |

**Descrizione**: La tua chiave API personale di OpenAI. Senza questa chiave, nessuna funzionalita AI sara disponibile.

**Come ottenerla**:
1. Vai su [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Clicca "Create new secret key"
3. Copia la chiave generata

### Journal dell'Avventura

| Proprieta | Valore |
|-----------|--------|
| Nome tecnico | `selectedJournal` |
| Tipo | Stringa (ID Journal) |
| Ambito | World |
| Obbligatorio | No (ma consigliato) |

**Descrizione**: Il Journal che contiene i dettagli della tua avventura. Il modulo legge tutte le pagine di testo per fornire contesto all'AI.

**Cosa include**:
- Trama e obiettivi
- Descrizioni dei luoghi
- Informazioni sui PNG
- Segreti e rivelazioni

### Avvio Automatico Registrazione

| Proprieta | Valore |
|-----------|--------|
| Nome tecnico | `autoStart` |
| Tipo | Booleano |
| Default | Disattivato |
| Ambito | World |

**Descrizione**: Se attivato, la registrazione audio inizia automaticamente quando apri il pannello DM. Utile se usi sempre la trascrizione.

### Lingua Trascrizione

| Proprieta | Valore |
|-----------|--------|
| Nome tecnico | `transcriptionLanguage` |
| Tipo | Stringa |
| Default | Italiano (it) |
| Ambito | World |

**Descrizione**: La lingua in cui viene eseguita la trascrizione. Il modulo e ottimizzato per l'italiano, ma Whisper supporta molte lingue.

### Mostra Etichette Parlanti

| Proprieta | Valore |
|-----------|--------|
| Nome tecnico | `showSpeakerLabels` |
| Tipo | Booleano |
| Default | Attivato |
| Ambito | World |

**Descrizione**: Mostra i nomi degli speaker (es. "Speaker 1", "Speaker 2") nella trascrizione quando viene rilevata la diarizzazione.

### Sensibilita Rilevamento Fuori Tema

| Proprieta | Valore |
|-----------|--------|
| Nome tecnico | `offTrackSensitivity` |
| Tipo | Scelta |
| Opzioni | Bassa, Media, Alta |
| Default | Media |
| Ambito | World |

**Descrizione**: Controlla quanto rigorosamente il sistema rileva le deviazioni dalla trama.

| Livello | Comportamento |
|---------|---------------|
| **Bassa** | Rileva solo deviazioni significative |
| **Media** | Bilanciato - rileva la maggior parte delle deviazioni |
| **Alta** | Rileva anche piccole variazioni dalla trama |

**Consiglio**: Inizia con "Media" e regola in base alle tue esigenze. "Bassa" e ideale per sessioni sandbox; "Alta" per avventure lineari.

### Posizione Pannello

| Proprieta | Valore |
|-----------|--------|
| Nome tecnico | `panelPosition` |
| Tipo | Oggetto (posizione) |
| Default | Posizione predefinita |
| Ambito | Client |

**Descrizione**: Memorizza la posizione del pannello DM tra le sessioni. Viene aggiornata automaticamente quando sposti il pannello.

## Configurazione Avanzata

### Permessi del Browser

Per la registrazione audio, il browser richiede permessi specifici:

1. **Prima registrazione**: Il browser chiede l'accesso al microfono
2. **Clicca "Consenti"** per autorizzare
3. Il permesso viene memorizzato per il sito

**Se hai negato il permesso**:
1. Clicca sull'icona del lucchetto/info nella barra degli indirizzi
2. Trova "Microfono" nelle impostazioni del sito
3. Cambia da "Blocca" a "Consenti"
4. Ricarica la pagina

### Requisiti HTTPS

L'accesso al microfono richiede HTTPS in produzione:

| Ambiente | Requisito |
|----------|-----------|
| `localhost` | HTTP funziona |
| LAN locale | HTTPS necessario |
| Internet | HTTPS obbligatorio |

Se usi Foundry VTT su rete locale o internet, configura HTTPS o usa un servizio come The Forge che lo include.

### Ottimizzazione Costi

Per ridurre i costi API:

1. **Registra solo quando necessario** - Metti in pausa durante le pause
2. **Seleziona Journal concisi** - Meno testo = meno token
3. **Genera poche immagini** - Ogni immagine costa ~$0.04-0.08
4. **Usa sensibilita bassa** - Meno analisi = meno costi

## Verifica della Configurazione

Per verificare che tutto sia configurato correttamente:

1. **Apri il pannello DM** cliccando sull'icona nella barra laterale
2. **Verifica che non appaia** il messaggio "Chiave API non configurata"
3. **Seleziona un Journal** dal menu a tendina nel pannello
4. **Prova la registrazione** cliccando "Avvia Registrazione"
5. **Parla brevemente** e verifica che appaia la trascrizione

### Checklist Configurazione

- [ ] Chiave API OpenAI inserita
- [ ] Account OpenAI con crediti sufficienti
- [ ] Journal dell'avventura selezionato
- [ ] Permesso microfono concesso
- [ ] Pannello DM si apre correttamente
- [ ] Registrazione funziona

## Errori Comuni di Configurazione

### "Chiave API non valida"

- Verifica che la chiave inizi con `sk-`
- Controlla di non aver copiato spazi extra
- Verifica che la chiave sia attiva su OpenAI

### "Errore di autenticazione"

- Il tuo account OpenAI potrebbe non avere crediti
- La chiave potrebbe essere stata revocata
- Genera una nuova chiave su platform.openai.com

### "Journal non trovato"

- Il Journal potrebbe essere stato eliminato
- Riseleziona il Journal dalle impostazioni
- Verifica di avere permessi sul Journal

### "Permesso microfono negato"

- Controlla le impostazioni del sito nel browser
- Prova con un browser diverso
- Verifica che nessun'altra app usi il microfono

## Prossimi Passi

Dopo aver configurato il modulo, consulta la guida all'[Utilizzo](usage.md) per imparare a usare tutte le funzionalita.
