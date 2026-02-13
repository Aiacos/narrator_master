# TODO - Narrator Master

Tracker dei problemi noti, organizzato per priorità. Aggiornare questo file quando un issue viene risolto (spostare in "Completati") o quando ne vengono trovati di nuovi.

Ultimo audit: 2026-02-13 (branch `autoclaude`, versione 1.3.0)

---

## CRITICI (bloccano funzionalità)

(Nessun issue aperto)

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

(Nessun issue aperto)

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

### 1. `SETTINGS.IMAGE_GALLERY` non definito — crash gallery (critico)
- **Data risoluzione**: 2026-02-13
- **File interessati**: `scripts/settings.js`, `scripts/image-generator.js`
- **Problema**: `image-generator.js` usava `SETTINGS.IMAGE_GALLERY` per salvare/caricare la gallery via `game.settings`, ma questa chiave NON esisteva nel `SETTINGS` constant in `settings.js` e la setting NON era registrata in `registerSettings()`. Il risultato era `game.settings.get('narrator-master', undefined)` → errore runtime.
- **Soluzione implementata**:
  - Aggiunto `IMAGE_GALLERY: 'imageGallery'` al `SETTINGS` constant in `scripts/settings.js`
  - Registrata la setting `imageGallery` in `registerSettings()` con tipo `Object`, default `[]`, scope `world`, config `false`
  - Seguita la pattern esistente per hidden Object settings (come SELECTED_JOURNALS)
- **Benefici**:
  - Gallery delle immagini funziona correttamente senza crash runtime
  - Persistenza corretta delle immagini generate tra le sessioni
  - Coerenza con le altre hidden settings del modulo
- **Commit principali**: b52925a (SETTINGS constant), cae675a (registerSettings)
- **Task**: 038-ricontrolla-il-progetto-ed-aggiorna-il-todo-con-tu

### 4. `stripHtml()` usa `innerHTML` — potenziale XSS (sicurezza)
- **Data risoluzione**: 2026-02-13
- **File interessati**: `scripts/journal-parser.js`
- **Problema**: `div.innerHTML = html` eseguiva handler inline (es. `<img onerror="...">`) se il journal conteneva contenuto malevolo. Vulnerabilità XSS potenziale se un journal entry conteneva script malevoli.
- **Soluzione implementata**:
  - Sostituito `innerHTML` con `DOMParser` nel metodo `stripHtml()`
  - Nuovo codice: `const doc = new DOMParser().parseFromString(html, 'text/html'); return doc.body.textContent || '';`
  - DOMParser parsa HTML senza eseguire script, prevenendo XSS
- **Benefici**:
  - Eliminata vulnerabilità XSS nel parsing dei journal
  - Contenuto malevolo nei journal non può più eseguire codice
  - Conformità alle best practice di sicurezza per parsing HTML
- **Commit principali**: 5e30a09 (DOMParser implementation)
- **Task**: 038-ricontrolla-il-progetto-ed-aggiorna-il-todo-con-tu

### 5. Cache stale sui journal hooks (correttezza)
- **Data risoluzione**: 2026-02-13
- **File interessati**: `scripts/main.js`
- **Problema**: I hooks `updateJournalEntry`/`createJournalEntry`/`deleteJournalEntry` chiamavano `_loadAllJournals()` ma NON chiamavano `journalParser.clearAllCache()` prima. Il parsing interno usava cache, quindi un journal modificato poteva restituire contenuto vecchio all'AI assistant.
- **Soluzione implementata**:
  - Aggiunto `this.journalParser.clearAllCache()` come prima riga nel metodo `_loadAllJournals()`
  - La cache viene invalidata prima di ogni reload dei journal
  - Garantisce che le modifiche ai journal siano immediatamente visibili all'AI
- **Benefici**:
  - Journal modificati restituiscono sempre contenuto aggiornato
  - AI assistant riceve il contesto corretto dopo modifiche ai journal
  - Eliminato bug di contenuto stale dopo edit/create/delete di journal
- **Commit principali**: 43a716f (clearAllCache call)
- **Task**: 038-ricontrolla-il-progetto-ed-aggiorna-il-todo-con-tu

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
