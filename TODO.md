# TODO - Narrator Master

Tracker dei problemi noti, organizzato per priorità. Aggiornare questo file quando un issue viene risolto (spostare in "Completati") o quando ne vengono trovati di nuovi.

Ultimo audit: 2026-02-07 (branch `autoclaude`, versione 1.0.2)

---

## CRITICI (bloccano funzionalità)

### 1. `SETTINGS.IMAGE_GALLERY` non definito — crash gallery
- **File**: `scripts/image-generator.js` righe 837, 850, 866
- **File**: `scripts/settings.js` righe 17-24
- **Problema**: `image-generator.js` usa `SETTINGS.IMAGE_GALLERY` per salvare/caricare la gallery via `game.settings`, ma questa chiave NON esiste nel `SETTINGS` constant in `settings.js` e la setting NON è registrata in `registerSettings()`. Il risultato è `game.settings.get('narrator-master', undefined)` → errore runtime.
- **Fix**: Aggiungere `IMAGE_GALLERY: 'imageGallery'` al `SETTINGS` constant e registrare la setting con tipo `Object`, default `[]`, scope `world`, config `false`.

---

## ALTI (degradano l'esperienza utente)

### 2. `en.json` mancante di 39 chiavi di localizzazione
- **File**: `lang/en.json` (162 righe) vs `lang/it.json` (204 righe)
- **Problema**: Gli utenti con client in inglese vedono chiavi raw (es. `NARRATOR.SpeakerLabels.Title`) al posto del testo tradotto.
- **Chiavi mancanti per sezione**:
  - `Settings`: `MultiLanguageModeName`, `MultiLanguageModeHint`, `SpeakerLabelsName`, `SpeakerLabelsHint`
  - `Panel`: `TranscriptTab`, `NoTranscript`, `ClearTranscript`, `ExportTranscript`
  - `Errors`: `ContentTooLong`, `InvalidContent`, `InvalidSpeaker`, `InvalidLabel`, `EmptyLabel`, `SaveMappingsFailed`, `ExportFailed`
  - `SpeakerLabels` (intera sezione, 19 chiavi): `Title`, `DefaultSpeaker`, `EditLabel`, `SaveLabel`, `CancelEdit`, `ResetLabels`, `ResetConfirm`, `ImportLabels`, `ExportLabels`, `NoMappings`, `MappingCount`, `LabelUpdated`, `LabelReset`, `AllLabelsReset`, `ImportSuccess`, `ExportSuccess`, `ImportError`, `InvalidImportFormat`, `EditTooltip`
  - `Notifications`: `TranscriptExported`
- **Fix**: Copiare le chiavi da `it.json` e tradurre in inglese.

### 3. `module.json` non registra 6 lingue esistenti
- **File**: `module.json` righe 22-33
- **File presenti**: `lang/de.json`, `lang/es.json`, `lang/fr.json`, `lang/ja.json`, `lang/pt.json`, `lang/template.json`
- **Problema**: Foundry non carica traduzioni non dichiarate nel manifest. Solo `en` e `it` sono registrate.
- **Fix**: Aggiungere le entry per de, es, fr, ja, pt nell'array `languages` di `module.json`. Non includere `template.json` (è per traduttori, non per Foundry).

---

## MEDI (sicurezza / correttezza)

### 4. `stripHtml()` usa `innerHTML` — potenziale XSS
- **File**: `scripts/journal-parser.js` righe 155-156
- **Problema**: `div.innerHTML = html` esegue handler inline (es. `<img onerror="...">`) se il journal contiene contenuto malevolo. Il branch `009` avrebbe dovuto fixare con `DOMParser`, ma il codice attuale usa ancora `innerHTML`.
- **Fix**: Sostituire con:
  ```javascript
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
  ```

### 5. Cache stale sui journal hooks
- **File**: `scripts/main.js` righe 369-373, metodo `_loadAllJournals()` righe 342-366
- **Problema**: I hooks `updateJournalEntry`/`createJournalEntry`/`deleteJournalEntry` chiamano `_loadAllJournals()` ma NON chiamano `journalParser.clearAllCache()` prima. Il parsing interno usa cache, quindi un journal modificato potrebbe restituire contenuto vecchio.
- **Fix**: Aggiungere `this.journalParser.clearAllCache()` come prima riga di `_loadAllJournals()`.

---

## BASSI (performance / qualità)

(Nessun issue aperto)

---

## NOTE ARCHITETTURALI (non sono bug)

### Tab count: 3 (evoluzione dal piano originale)
Il piano di refactoring v1.0.2 specificava 2 tab (Assistente + Immagini). L'implementazione attuale ha 3 tab (assistant, images, transcript) a seguito dei merge di speaker-labels e multi-language. Evoluzione intenzionale.

### Settings count: 6 (evoluzione dal piano originale)
Il piano specificava 4 settings. L'implementazione attuale ne ha 6, con l'aggiunta di `multiLanguageMode` e `speakerLabels` dai rispettivi branch. Coerente con le feature aggiunte.

### Trascrizione esposta nel pannello
Il piano originale diceva "la trascrizione è interna". I merge successivi hanno aggiunto il tab transcript con speaker labels e export. L'architettura corrente tratta la trascrizione come visibile all'utente con valore aggiunto (speaker labels, export).

---

## COMPLETATI

### 7. Migrazione da console.log a Logger utility (code quality)
- **Data risoluzione**: 2026-02-08
- **File interessati**: Tutti i file in `scripts/` (main.js, audio-capture.js, transcription.js, ai-assistant.js, image-generator.js, journal-parser.js, journal-utils.js, rules-reference.js, vocabulary-manager.js, settings.js)
- **Problema**: Uso diretto di `console.log`, `console.warn`, `console.error` in tutto il codebase, causando warning ESLint e mancanza di controllo centralizzato sul logging di produzione.
- **Soluzione implementata**:
  - Creato `scripts/logger.js` — utility centralizzata con metodi `debug()`, `info()`, `warn()`, `error()`
  - Aggiunto setting `debugMode` in `settings.js` per abilitare/disabilitare i messaggi di debug
  - Migrati ~80+ statement console.* a Logger calls in tutti i file del modulo
  - Logger usa `console.warn` per debug/info/warn e `console.error` per errori (conforme a ESLint no-console)
  - Debug messages sono soppressi di default e attivabili tramite UI settings
  - Aggiornato `CLAUDE.md` con linee guida per l'uso del Logger
- **Benefici**:
  - ESLint passa senza warning su console.* nel codice di produzione
  - Logging controllabile tramite settings (debug mode on/off)
  - Output consistente con prefisso MODULE_ID e context identifier
  - Facilita debugging senza inquinare la console in produzione
- **Commit principali**: 9a06cc3 (migrazione main.js), 76cea1f (documentazione CLAUDE.md)
- **Task**: 020-reduce-console-log-usage-in-production-code-per-es

### 6. `render(false)` ogni secondo durante la registrazione (performance)
- **Data risoluzione**: 2026-02-13
- **File interessati**: `scripts/ui-panel.js`
- **Problema**: `_durationTimer` chiamava `this.render(false)` ogni secondo, ricostruendo l'intero DOM del pannello (262 righe Handlebars) solo per aggiornare il timer di registrazione. Causava overhead computazionale e potenziale flickering della UI.
- **Soluzione implementata**:
  - Creato metodo `_updateDurationDisplay()` che aggiorna direttamente l'elemento DOM del timer senza re-render completo
  - Modificato `_startDurationTimer()` per chiamare `_updateDurationDisplay()` invece di `render(false)`
  - Aggiornato `addTranscriptSegments()` per usare metodo helper `_appendTranscriptSegment()` con manipolazione DOM diretta
  - Creato `setLoading()` che usa `_updateLoadingState()` per aggiornare solo lo stato di caricamento
  - Introdotto `renderDebounced()` per batch di aggiornamenti non critici con debounce di 150ms
  - Mantenuto `render()` esplicito per eventi critici (cambio tab, nuovi suggerimenti, nuove immagini)
- **Benefici**:
  - Eliminato re-render completo ogni secondo durante la registrazione (riduzione ~99% delle operazioni DOM)
  - Migliorata responsività dell'UI con aggiornamenti mirati invece di full re-render
  - Ridotto overhead CPU e consumo memoria durante sessioni di registrazione lunghe
  - Prevenuto flickering e stuttering durante l'aggiornamento del timer
  - Mantenuta reattività per eventi critici con render() esplicito
- **Commit principali**: 1d73c3e (timer DOM update), a96e5a2 (transcript append), 3c655a9 (loading state), db812ac (debounced render), 7772ea0 (verification)
- **Task**: 011-reduce-excessive-ui-panel-re-renders-with-debounci
