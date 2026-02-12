# Changelog

Tutte le modifiche importanti a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Integrazione con Discord per cattura audio alternativa
- Ottimizzazioni per tier API a pagamento
- Adattamenti UI per tablet/mobile
- Funzionalità rivolte ai giocatori

## [1.2.0] - 2026-02-12

### Added

#### Chapter-Aware System
- **ChapterTracker** - Tracciamento posizione nell'avventura basato su journal e scena attiva
  - Rilevamento automatico capitolo dalla scena Foundry VTT attiva
  - Navigazione manuale tra capitoli/sottocapitoli
  - Auto-selezione del journal più grande come avventura principale
  - Metodi `getCurrentChapter()`, `getSubchapters()`, `updateFromScene()`

- **CompendiumParser** - Lettura e indicizzazione contenuti dai Compendi Foundry VTT
  - Parsing journal compendiums e rules compendiums
  - Ricerca contenuti per keyword
  - Integrazione con contesto AI per grounding

- **Silence Detection & Recovery** - Rilevamento silenzi con navigazione capitoli
  - Timer 30s per rilevamento assenza trascrizione
  - UI di recovery con sottocapitoli cliccabili
  - Opzioni di ripresa generate dall'AI basate sul contesto del capitolo
  - Integrazione completa panel → controller → ChapterTracker

- **Chapter Navigation UI** - Interfaccia navigazione capitoli nel pannello DM
  - Sezione capitolo corrente con path gerarchico
  - Lista sottocapitoli cliccabili per ripresa narrativa
  - Normalizzazione dati ChapterTracker → template Handlebars

#### Architecture Improvements
- **OpenAIServiceBase** - Classe base condivisa per tutti i servizi API
  - Gestione errori, API key, configuration checks centralizzati
  - `TranscriptionService`, `AIAssistant`, `ImageGenerator` estendono la base
  - Eliminazione duplicazione codice tra servizi

- **Logger** - Utility di logging centralizzata
  - Livelli debug/info/warn/error con context parameter
  - Debug mode attivabile da settings
  - Sostituzione completa di tutti i `console.*` diretti

- **CacheManager** - Gestione cache centralizzata per contenuti journal

- **ErrorNotificationHelper** - Gestione errori e notifiche UI centralizzata

#### Localization
- **7 lingue supportate** - en, it, de, es, fr, ja, pt
  - Template per traduttori (`template.json`)
  - Script di verifica traduzioni (`verify-translations.js`)
  - Chiavi i18n per Recovery, Silence, Chapter, Grounding, Rules

### Changed
- **AI System Prompt** - Riscritto per essere focalizzato sul DM e grounded nei journal
  - Anti-hallucination: suggerimenti basati solo su contenuti journal/compendi
  - Context chapter-aware per suggerimenti più pertinenti
  - Recovery options generate dal contesto del capitolo corrente

- **Transcription Cycles** - Stop/restart periodico ogni 15s per WebM validi
  - Circuit breaker dopo 5 errori consecutivi
  - Throttling notifiche errore

- **ESLint Config** - Aggiunta jQuery/$ ai globals per compatibilità Foundry VTT

### Fixed
- Fix loop errori trascrizione (header WebM incompleto)
- Fix parametro `response_format` per gpt-image-1
- Fix `showSilenceRecovery()` signature mismatch con panel
- Fix callback `onSubchapterClick` non collegato
- Fix mismatch proprietà template (title vs name)
- Fix `== null` → `=== null || === undefined` (eqeqeq)
- Rimozione import orfani dopo migrazione Logger

## [1.0.0] - 2026-02-06

### Added

#### Core Features
- **Cattura Audio Browser** - Sistema di registrazione audio tramite microfono del browser utilizzando Web Audio API e MediaRecorder
  - Supporto formato WebM/Opus per qualità ottimale
  - Controlli start/stop/pause/resume
  - Indicatore livello audio in tempo reale
  - Gestione permessi microfono con messaggi di errore localizzati

- **Trascrizione in Tempo Reale** - Integrazione con OpenAI Whisper per trascrizione audio
  - Modello `gpt-4o-transcribe-diarize` per identificazione speaker
  - Supporto diarizzazione speaker (distinzione tra giocatori e DM)
  - Trascrizione in lingua italiana
  - Gestione automatica file audio >30 secondi tramite chunking
  - Limite 25MB per file gestito automaticamente

- **Parsing Journal Avventura** - Sistema di lettura e indicizzazione contenuti Foundry VTT
  - Accesso Journal via API Foundry VTT v13+
  - Parsing pagine testo con rimozione HTML
  - Caching contenuti per prestazioni ottimizzate
  - Indicizzazione keyword per ricerca rapida

- **Assistente AI Contestuale** - Generazione suggerimenti tramite OpenAI GPT
  - Modello `gpt-4o-mini` per suggerimenti cost-effective
  - Analisi contesto conversazione in tempo reale
  - Suggerimenti per cosa dire/fare basati sul contenuto adventure
  - Storico conversazione per continuità contestuale

- **Rilevamento Fuori Traccia** - Sistema di identificazione deviazioni dalla trama
  - Tre livelli di sensibilità configurabili (bassa/media/alta)
  - Warning evidenziato in rosso nel pannello
  - Badge indicatore stato off-track

- **Narrativa Adattiva** - Generazione contenuti per rientro in trama
  - Ponti narrativi per guidare i giocatori verso la storia
  - Improvvisazione fedele all'avventura originale
  - Suggerimenti per reindirizzare diplomaticamente i giocatori

- **Generazione Immagini** - Integrazione OpenAI per creazione infografiche
  - Modello `gpt-image-1` (supporto a lungo termine)
  - Caching URL immagini con gestione scadenza 60 minuti
  - Download automatico in base64 per preservare immagini
  - Generazione infografiche e illustrazioni scene
  - Supporto multiple dimensioni e stili

#### User Interface
- **Pannello DM** - Interfaccia Application Foundry VTT
  - Estensione classe Application per integrazione nativa
  - Template Handlebars per rendering dinamico
  - Tab navigation per trascrizione/suggerimenti/immagini
  - Controlli registrazione con feedback visivo
  - Galleria immagini con lightbox
  - Posizione pannello persistente

- **Pulsante Sidebar** - Integrazione controlli scene Foundry VTT
  - Pulsante toggle pannello in sidebar
  - Quick-start registrazione
  - Accesso rapido impostazioni

- **Styling CSS** - Design coerente con Foundry VTT
  - Custom properties per theming
  - Warning off-track in rosso (#e74c3c)
  - Animazioni per feedback utente
  - Design responsive
  - Scrollbar personalizzate

#### Configuration
- **Sistema Impostazioni** - Gestione configurazione modulo
  - Storage sicuro chiave API OpenAI via game.settings
  - Selezione Journal avventura
  - Auto-start registrazione
  - Lingua trascrizione
  - Etichette speaker
  - Sensibilità rilevamento off-track

#### Localization
- **Localizzazione Italiana Completa** - Tutte le stringhe UI in italiano
  - Impostazioni modulo
  - Pannello DM
  - Messaggi errore
  - Notifiche
  - Tooltip
  - Etichette accessibilità

#### Documentation
- **README.md** - Documentazione principale
  - Guida installazione (manifest, manuale, symlink)
  - Configurazione API key e Journal
  - Istruzioni utilizzo pannello
  - Stima costi per sessione (~$1.31/3h)
  - Troubleshooting problemi comuni

### Technical Details

#### Architecture
- Design OOP con classi separate per ogni responsabilità
- Pattern ES6 modules per import/export
- Event emitter per comunicazione componenti
- Dependency injection per testabilità

#### Services
- `AudioCapture` - Gestione stream audio browser
- `TranscriptionService` - Integrazione OpenAI Whisper
- `AIAssistant` - Generazione suggerimenti GPT
- `ImageGenerator` - Creazione immagini DALL-E/gpt-image-1
- `JournalParser` - Parsing contenuti Journal
- `NarratorPanel` - UI Application Foundry
- `SettingsManager` - Gestione configurazione

#### Requirements
- Foundry VTT v13+
- Account OpenAI API con crediti ($5 minimo)
- Browser moderno con supporto microfono
- HTTPS in produzione (localhost OK per sviluppo)

### Security
- Chiave API mai esposta in file o console
- Storage sicuro via Foundry settings API
- Nessun dato sensibile in localStorage
- Permessi microfono richiesti esplicitamente

### Known Limitations
- Richiede account OpenAI a pagamento (tier gratuito insufficiente)
- URL immagini generate scadono dopo 60 minuti (gestito con caching)
- Intercettazione WebRTC da Foundry VTT non supportata (fallback microfono locale)
- Solo interfaccia italiana (multilingua pianificato)

---

[unreleased]: https://github.com/Aiacos/narrator_master/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/Aiacos/narrator_master/compare/v1.0.0...v1.2.0
[1.0.0]: https://github.com/Aiacos/narrator_master/releases/tag/v1.0.0
