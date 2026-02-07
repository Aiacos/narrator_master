# Localizzazione - Narrator Master

Narrator Master supporta diverse lingue per rendere il modulo accessibile alla comunita internazionale di Foundry VTT.

## Lingue Supportate

Narrator Master e attualmente disponibile nelle seguenti lingue:

| Codice | Lingua | File | Stato |
|--------|--------|------|-------|
| `it` | Italiano | `lang/it.json` | ✅ Completo |
| `en` | English | `lang/en.json` | ✅ Completo |
| `de` | Deutsch | `lang/de.json` | ✅ Completo |
| `es` | Español | `lang/es.json` | ✅ Completo |
| `fr` | Français | `lang/fr.json` | ✅ Completo |
| `ja` | 日本語 | `lang/ja.json` | ✅ Completo |
| `pt` | Português | `lang/pt.json` | ✅ Completo |

> **Nota**: L'italiano (`it`) e la lingua originale del modulo. Tutte le altre lingue sono state tradotte per garantire un'esperienza utente ottimale.

## Struttura dei File di Localizzazione

### Organizzazione delle Chiavi

Tutti i file di localizzazione seguono la stessa struttura gerarchica organizzata per categoria:

```json
{
    "NARRATOR": {
        "Settings": { ... },
        "Panel": { ... },
        "Errors": { ... },
        "Notifications": { ... },
        "OffTrack": { ... },
        "Suggestions": { ... },
        "Recording": { ... },
        "Journal": { ... },
        "Images": { ... },
        "Tooltips": { ... },
        "Accessibility": { ... }
    }
}
```

### Categorie di Localizzazione

| Categoria | Scopo | Esempio |
|-----------|-------|---------|
| `Settings` | Nomi e descrizioni delle impostazioni | `ApiKeyName`, `ApiKeyHint` |
| `Panel` | Elementi dell'interfaccia utente | `StartRecording`, `GenerateImage` |
| `Errors` | Messaggi di errore | `NoApiKey`, `TranscriptionFailed` |
| `Notifications` | Toast e notifiche | `RecordingStarted`, `ImageGenerated` |
| `OffTrack` | Rilevamento fuori tema | `Warning`, `Severe`, `Minor` |
| `Suggestions` | Tipi di suggerimenti AI | `TypeNarration`, `TypeDialogue` |
| `Recording` | Stati della registrazione | `StateRecording`, `StatePaused` |
| `Journal` | Gestione journal | `NoJournalFound`, `PageCount` |
| `Images` | Generazione immagini | `Generating`, `ClickToEnlarge` |
| `Tooltips` | Suggerimenti tooltip | `ToggleRecording`, `CopyText` |
| `Accessibility` | Etichette accessibilita | `RecordButton`, `AudioLevel` |

## Come Contribuire Traduzioni

### 1. Prepara il File di Traduzione

Se vuoi aggiungere una nuova lingua, parti dal file template:

```bash
cp lang/template.json lang/CODICE_LINGUA.json
```

Sostituisci `CODICE_LINGUA` con il codice ISO 639-1 appropriato (es. `ko` per coreano, `ru` per russo).

### 2. Traduci le Stringhe

Apri il file e traduci tutte le stringhe vuote `""` nella tua lingua:

```json
{
    "NARRATOR": {
        "PanelTitle": "Narrator Master - Assistente DM",
        "Settings": {
            "ApiKeyName": "Chiave API OpenAI",
            ...
        }
    }
}
```

**Linee guida per la traduzione**:

- Mantieni lo **stesso tono professionale e amichevole** dell'originale
- Preserva i **placeholder** come `{count}`, `{size}`, `{status}`, ecc.
- Mantieni i **tag HTML** se presenti (es. `<strong>`, `<em>`)
- Non tradurre **nomi di prodotti** (OpenAI, Foundry VTT, Whisper, GPT)
- Usa le **convenzioni tipografiche** della lingua target

### 3. Testa la Traduzione

Valida la sintassi JSON:

```bash
python3 -c 'import json; json.load(open("lang/CODICE_LINGUA.json")); print("OK")'
```

### 4. Registra la Lingua in module.json

Aggiungi la tua lingua all'array `languages` in `module.json`:

```json
{
  "lang": "CODICE_LINGUA",
  "name": "Nome Nativo",
  "path": "lang/CODICE_LINGUA.json"
}
```

### 5. Testa in Foundry VTT

1. Avvia Foundry VTT
2. Vai in **Configuration** > **Setup** > **Language**
3. Seleziona la tua lingua
4. Ricarica Foundry VTT
5. Abilita Narrator Master e verifica che tutte le stringhe siano tradotte

### 6. Invia una Pull Request

Quando sei soddisfatto della traduzione:

```bash
git add lang/CODICE_LINGUA.json module.json
git commit -m "Add LINGUA translation"
git push origin nome-tuo-branch
```

Apri una Pull Request su GitHub con:
- **Titolo**: `Localization: Add [LINGUA] translation`
- **Descrizione**: Breve descrizione della traduzione e test effettuati

## Convenzioni di Traduzione

### Placeholder e Variabili

Alcuni messaggi contengono **placeholder dinamici** che vengono sostituiti a runtime:

| Placeholder | Significato | Esempio |
|-------------|-------------|---------|
| `{count}` | Numero generico | `"{count} journal caricati"` |
| `{size}` | Dimensione file | `"File troppo grande ({size}MB)"` |
| `{status}` | Codice di stato | `"Errore {status}"` |
| `{message}` | Messaggio di errore | `"Errore: {message}"` |
| `{error}` | Nome errore | `"Errore microfono: {error}"` |
| `{id}` | Identificatore | `"Journal non trovato: {id}"` |
| `{details}` | Dettagli aggiuntivi | `"Richiesta non valida: {details}"` |

**IMPORTANTE**: Non modificare mai i placeholder. Devono rimanere identici in tutte le lingue.

### Messaggi di Errore

I messaggi di errore devono essere:

- **Chiari e informativi** - Spiega cosa e andato storto
- **Orientati all'azione** - Suggerisci come risolvere il problema
- **Professionali ma accessibili** - Evita gergo tecnico quando possibile

Esempio:
```json
"NoApiKey": "Chiave API OpenAI non configurata. Vai nelle impostazioni del modulo per aggiungerla."
```

### Messaggi dell'Interfaccia Utente

I testi dell'UI devono essere:

- **Concisi** - Brevi e diretti
- **Imperativi** - Usa verbi all'imperativo per pulsanti e azioni
- **Consistenti** - Usa sempre la stessa terminologia

Esempio:
```json
"StartRecording": "Avvia Registrazione",
"StopRecording": "Ferma Registrazione"
```

### Notifiche e Toast

Le notifiche devono essere:

- **Brevi** - Massimo 1-2 frasi
- **Positive** - Conferma il successo dell'azione
- **Informative** - Comunica cosa e successo

Esempio:
```json
"RecordingStarted": "Registrazione avviata",
"ImageGenerated": "Immagine generata con successo"
```

## Template di Traduzione

Il file `lang/template.json` contiene la **struttura completa** con tutti i campi vuoti:

```json
{
    "NARRATOR": {
        "PanelTitle": "",
        "Settings": {
            "ApiKeyName": "",
            "ApiKeyHint": "",
            ...
        }
    }
}
```

Usa questo file come base per nuove traduzioni per garantire che non manchino chiavi.

## Test di Localizzazione

### Test Automatici

**Validazione JSON**:
```bash
python3 -c 'import json; json.load(open("lang/CODICE_LINGUA.json")); print("OK")'
```

**Completezza delle chiavi** (confronta con il template):
```bash
python3 -c '
import json
template = json.load(open("lang/template.json"))
translation = json.load(open("lang/CODICE_LINGUA.json"))

def check_keys(t, tr, path=""):
    for key in t:
        if isinstance(t[key], dict):
            check_keys(t[key], tr.get(key, {}), path + "." + key)
        elif key not in tr or not tr[key]:
            print(f"Missing or empty: {path}.{key}")

check_keys(template["NARRATOR"], translation.get("NARRATOR", {}), "NARRATOR")
'
```

### Test Manuali in Foundry VTT

1. **Seleziona la lingua**:
   - Configuration > Setup > Language
   - Scegli la tua lingua
   - Riavvia Foundry VTT

2. **Verifica l'interfaccia**:
   - Apri il pannello Narrator Master
   - Controlla tutte le etichette e i pulsanti
   - Verifica i tooltip

3. **Testa i messaggi di errore**:
   - Prova ad avviare la registrazione senza chiave API
   - Verifica i messaggi di errore

4. **Controlla le notifiche**:
   - Esegui varie azioni (registrazione, generazione immagini)
   - Verifica che le notifiche toast siano tradotte

5. **Testa i messaggi dinamici**:
   - Verifica che i placeholder `{count}`, `{size}`, ecc. siano sostituiti correttamente
   - Controlla la grammatica e concordanza con i valori dinamici

## Manutenzione delle Traduzioni

### Quando Aggiornare le Traduzioni

Le traduzioni devono essere aggiornate quando:

- Vengono **aggiunte nuove funzionalita** al modulo
- Vengono **modificati messaggi esistenti** per maggiore chiarezza
- Vengono **corretti errori** nelle traduzioni

### Come Individuare Stringhe Mancanti

Se una stringa non e tradotta, Foundry VTT mostra la **chiave di localizzazione** invece del testo:

```
NARRATOR.Errors.NewError
```

Questo indica che manca la traduzione per quella chiave.

### Processo di Aggiornamento

1. Controlla il `lang/template.json` per nuove chiavi
2. Aggiungi le nuove chiavi al tuo file di lingua
3. Traduci le nuove stringhe
4. Valida la sintassi JSON
5. Testa in Foundry VTT
6. Invia una Pull Request

## Risorse Utili

### Codici Lingua ISO 639-1

Usa i codici standard per identificare le lingue:

| Codice | Lingua |
|--------|--------|
| `en` | English |
| `it` | Italiano |
| `de` | Deutsch |
| `es` | Español |
| `fr` | Français |
| `ja` | 日本語 |
| `pt` | Português |
| `ko` | 한국어 |
| `ru` | Русский |
| `zh` | 中文 |

### Strumenti Consigliati

- **Editor JSON**: [Visual Studio Code](https://code.visualstudio.com/) con estensione JSON
- **Validatori JSON**: [JSONLint](https://jsonlint.com/)
- **Gestione Git**: [GitHub Desktop](https://desktop.github.com/) o riga di comando

### Link Utili

- [Foundry VTT - Localization Guide](https://foundryvtt.com/article/localization/)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [Narrator Master - GitHub Repository](https://github.com/Aiacos/narrator_master)

## Domande Frequenti

### Posso tradurre solo alcune stringhe?

No, tutte le chiavi nel file di localizzazione devono essere tradotte per garantire un'esperienza utente completa. Usa il `template.json` come riferimento.

### Cosa faccio se una stringa e troppo lunga nella mia lingua?

Cerca di mantenerla concisa. Se necessario, usa abbreviazioni comunemente accettate nella tua lingua. L'interfaccia e progettata per essere flessibile.

### Come gestisco caratteri speciali?

JSON supporta Unicode. Usa i caratteri nativi della tua lingua (es. à, é, ñ, ü, 中, 日). Assicurati che il file sia salvato con encoding **UTF-8**.

### Posso modificare una traduzione esistente?

Si! Se noti errori o miglioramenti possibili nelle traduzioni esistenti, sei il benvenuto a proporre modifiche tramite Pull Request.

### Come vengono gestiti i plurali?

Attualmente, Narrator Master usa stringhe semplici. Per lingue con regole di plurale complesse, usa la forma piu comune o neutrale.

## Contribuire alla Comunita

Le traduzioni sono un contributo prezioso alla comunita di Foundry VTT. Ogni traduzione aiuta a rendere Narrator Master accessibile a piu giocatori in tutto il mondo.

**Grazie per il tuo contributo!**

---

## Contatti e Supporto

Se hai domande sulla localizzazione o bisogno di aiuto:

- Apri una [Issue su GitHub](https://github.com/Aiacos/narrator_master/issues)
- Partecipa alle [Discussioni](https://github.com/Aiacos/narrator_master/discussions)
- Consulta la [Documentazione Principale](index.md)

---

Narrator Master - Fatto con amore per i Dungeon Master di tutto il mondo 🌍
