# Guida all'Installazione

Questa guida ti accompagnera nell'installazione di Narrator Master su Foundry VTT.

## Requisiti di Sistema

### Software Necessario

- **Foundry VTT** versione 13 o superiore
- **Browser moderno**: Chrome (consigliato), Firefox, o Edge
- **Connessione HTTPS** per l'accesso al microfono in produzione
  - Nota: `localhost` funziona senza HTTPS durante lo sviluppo

### Account OpenAI

> **IMPORTANTE**: Narrator Master richiede un account **OpenAI a pagamento** con almeno **$5 di credito**.
>
> Il piano gratuito (3 richieste al minuto, solo GPT-3.5) **non e sufficiente** per le funzionalita di trascrizione e generazione immagini.

I modelli richiesti sono:
- `gpt-4o-transcribe-diarize` - Trascrizione audio con identificazione parlanti
- `gpt-4o-mini` - Generazione suggerimenti e analisi contesto
- `gpt-image-1` - Generazione immagini e infografiche

### Come Ottenere una Chiave API OpenAI

1. Vai su [platform.openai.com](https://platform.openai.com)
2. Crea un account o accedi
3. Vai su **Billing** > **Add payment method**
4. Aggiungi un metodo di pagamento e ricarica almeno $5
5. Vai su **API Keys** > **Create new secret key**
6. Copia la chiave (inizia con `sk-...`)
7. **Conserva la chiave in modo sicuro** - non sara piu visibile

## Metodi di Installazione

### Metodo 1: Manifest URL (Consigliato)

Il modo piu semplice per installare il modulo:

1. Apri Foundry VTT
2. Vai alla scheda **Add-on Modules** nella schermata di setup
3. Clicca **Install Module**
4. Nel campo "Manifest URL" incolla:
   ```
   https://github.com/narrator-master/narrator-master/releases/latest/download/module.json
   ```
5. Clicca **Install**
6. Attendi il completamento del download

### Metodo 2: Installazione Manuale

Se preferisci installare manualmente:

1. Scarica l'ultima release da [GitHub Releases](https://github.com/narrator-master/narrator-master/releases)
2. Estrai il file `narrator-master.zip`
3. Copia la cartella `narrator-master` nella directory dei moduli di Foundry VTT:

**Linux:**
```bash
cp -r narrator-master ~/.local/share/FoundryVTT/Data/modules/
```

**Windows:**
```
%localappdata%\FoundryVTT\Data\modules\
```

**macOS:**
```bash
cp -r narrator-master ~/Library/Application\ Support/FoundryVTT/Data/modules/
```

### Metodo 3: Symlink (Per Sviluppatori)

Per chi sviluppa o vuole modificare il codice:

**Linux/macOS:**
```bash
ln -s /percorso/completo/narrator-master ~/.local/share/FoundryVTT/Data/modules/narrator-master
```

**Windows (Prompt Amministratore):**
```cmd
mklink /D "%localappdata%\FoundryVTT\Data\modules\narrator-master" "C:\percorso\narrator-master"
```

## Attivazione del Modulo

Dopo l'installazione:

1. **Avvia** Foundry VTT
2. **Apri** o crea un mondo di gioco
3. Vai su **Game Settings** (icona ingranaggio)
4. Clicca **Manage Modules**
5. Trova **Narrator Master** nella lista
6. **Spunta la casella** per attivarlo
7. Clicca **Save Module Settings**
8. Il mondo si ricarichera con il modulo attivo

## Verifica dell'Installazione

Per verificare che l'installazione sia andata a buon fine:

1. Come GM, cerca il gruppo di controlli **Narrator Master** nella barra laterale sinistra
2. Dovrebbe apparire un'icona per aprire il pannello DM
3. Se non vedi l'icona, verifica:
   - Di essere loggato come GM (non come giocatore)
   - Che il modulo sia attivo in "Manage Modules"
   - La console del browser (F12) per eventuali errori

## Aggiornamento del Modulo

### Aggiornamento Automatico

1. Vai su **Add-on Modules** nella schermata di setup
2. Clicca **Update All** o trova Narrator Master e clicca **Update**

### Aggiornamento Manuale

1. Scarica la nuova versione da GitHub
2. Sostituisci la cartella esistente con quella nuova
3. Riavvia Foundry VTT

## Risoluzione Problemi di Installazione

### Il modulo non appare nella lista

- Verifica che la cartella `narrator-master` contenga `module.json`
- Controlla che il percorso sia corretto
- Riavvia completamente Foundry VTT

### Errore durante l'installazione via URL

- Verifica la connessione internet
- Prova a installare manualmente
- Controlla che l'URL del manifest sia corretto

### Il modulo si attiva ma non funziona

- Apri la console del browser (F12) e cerca errori
- Verifica di avere Foundry VTT v13 o superiore
- Assicurati di essere GM nel mondo di gioco

## Prossimi Passi

Dopo l'installazione, procedi con la [Configurazione](configuration.md) per impostare la chiave API e le preferenze del modulo.
