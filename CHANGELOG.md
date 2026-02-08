# Changelog

Tutte le modifiche importanti a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **API Service Architecture** - Refactored API service classes to eliminate code duplication
  - Created `BaseApiService` base class with common functionality (error handling, API key management, configuration checks)
  - Refactored `TranscriptionService`, `AIAssistant`, and `ImageGenerator` to extend `BaseApiService`
  - Standardized error handling patterns across all API services
  - Improved code maintainability and consistency

### Planned
- Integrazione con Discord per cattura audio alternativa
- Supporto multilingua (oltre all'Italiano)
- Ottimizzazioni per tier API a pagamento
- Adattamenti UI per tablet/mobile
- Funzionalità rivolte ai giocatori

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

[unreleased]: https://github.com/narrator-master/narrator-master/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/narrator-master/narrator-master/releases/tag/v1.0.0
