# CLAUDE.md - AI Assistant Context for Narrator Master

This document provides context for AI assistants working on the Narrator Master Foundry VTT module.

## Project Overview

**Narrator Master** is a Foundry VTT module that assists Dungeon Masters during tabletop RPG sessions by:
- Capturing and transcribing player audio with speaker diarization
- Analyzing conversations against the adventure journal
- Providing contextual suggestions and detecting when players go off-track
- Generating relevant images/infographics for story events

**Target**: Foundry VTT v13+
**Language**: Italian (primary), with localization support
**External API**: OpenAI (Whisper, GPT-4o-mini, gpt-image-1)

## TODO Tracking

**IMPORTANT**: A `TODO.md` file tracks all known issues, bugs, and improvements organized by priority (Critical → High → Medium → Low). Before starting any work session:

1. **Read `TODO.md`** to understand current known issues
2. **Check if your changes resolve any TODO item** — if so, move it to the "Completati" section with date and commit hash
3. **Check if your changes introduce new issues** — if so, add them to TODO.md with the appropriate priority
4. **After completing a feature or fix**, re-verify that no TODO items have been accidentally regressed

When running audits or code reviews, cross-reference findings against TODO.md to avoid duplicate entries.

## Architecture

```
./
├── module.json              # Foundry VTT manifest
├── TODO.md                  # Known issues tracker (read before every session)
├── scripts/
│   ├── main.js             # Entry point, NarratorMaster controller, Hooks
│   ├── settings.js         # Settings registration, SettingsManager class
│   ├── audio-capture.js    # AudioCapture class, MediaRecorder, Web Audio API
│   ├── transcription.js    # TranscriptionService class, OpenAI Whisper
│   ├── journal-parser.js   # JournalParser class, Foundry Journal API
│   ├── ai-assistant.js     # AIAssistant class, OpenAI GPT chat
│   ├── image-generator.js  # ImageGenerator class, OpenAI image generation
│   ├── speaker-labels.js   # SpeakerLabelService, persistent speaker mappings
│   └── ui-panel.js         # NarratorPanel Application class
├── styles/
│   └── narrator-master.css # All styling, including off-track warnings (red)
├── templates/
│   └── panel.hbs           # Handlebars template for DM panel (3 tabs)
├── lang/
│   ├── it.json             # Italian localization (primary, most complete)
│   ├── en.json             # English localization
│   ├── de.json             # German localization
│   ├── es.json             # Spanish localization
│   ├── fr.json             # French localization
│   ├── ja.json             # Japanese localization
│   ├── pt.json             # Portuguese localization
│   └── template.json       # Template for translators
└── docs/                   # User documentation (wiki)
```

## Key Components

### NarratorMaster (main.js)
The central controller that orchestrates all components:
- Initializes all services on Foundry 'ready' hook (GM-only)
- Wires audio capture → transcription → AI analysis → UI updates
- Handles API key propagation to all services
- Stored globally as `window.narratorMaster` for debugging

### Service Classes
All services follow consistent OOP patterns:

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| `SettingsManager` | Access module settings | `getApiKey()`, `validateConfiguration()` |
| `AudioCapture` | Record browser audio | `start()`, `stop()`, `pause()`, `resume()` |
| `TranscriptionService` | Whisper API integration | `transcribe(audioBlob)`, `setMultiLanguageMode()` |
| `JournalParser` | Extract journal content | `parseAllJournals()`, `getAllContentForAI()`, `clearAllCache()` |
| `AIAssistant` | Generate suggestions | `analyzeContext()`, `detectOffTrack()`, `generateNarrativeBridge()` |
| `ImageGenerator` | Create images | `generateInfographic()`, `saveToGallery()`, `loadGallery()` |
| `SpeakerLabelService` | Speaker name mappings | `applyLabelsToSegments()`, `setLabel()`, `importMappings()` |
| `NarratorPanel` | DM panel UI | `render()`, `updateContent()`, `addTranscriptSegments()` |

### Common Service Patterns

```javascript
// All API services follow this pattern:
class ServiceName {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1';
        // ... options
    }

    setApiKey(newApiKey) {
        this.apiKey = newApiKey;
    }

    isConfigured() {
        return this.apiKey && this.apiKey.trim().length > 0;
    }

    // All API calls use _handleApiError for consistent error handling
    _handleApiError(response, operation) {
        // Returns localized error message
    }

    _createNetworkError() {
        // Creates network error with isNetworkError flag
    }

    static notifyError(error) {
        // Static method for external error notification
    }
}
```

## Foundry VTT Patterns

### Hook Registration (main.js)
```javascript
// Settings and templates during 'init'
Hooks.once('init', async function() {
    registerSettings();
    await loadTemplates([`modules/${MODULE_ID}/templates/panel.hbs`]);
});

// Instance creation during 'ready' (GM-only)
Hooks.once('ready', async function() {
    if (game.user.isGM) {
        window.narratorMaster = new NarratorMaster();
        await window.narratorMaster.initialize();
    }
});

// Sidebar controls via getSceneControlButtons
Hooks.on('getSceneControlButtons', (controls) => {
    // Add narrator-master control group
});
```

### Settings API (settings.js)
```javascript
// Register settings with game.settings.register()
game.settings.register(MODULE_ID, 'settingKey', {
    name: 'LOCALIZATION.Key',      // i18n key
    hint: 'LOCALIZATION.HintKey',
    scope: 'world',                 // 'world' = GM-only, 'client' = per-user
    config: true,                   // Show in settings UI
    type: String,                   // String, Boolean, Number, Object
    default: '',
    onChange: value => { /* callback */ }
});

// Access settings via game.settings.get/set()
const value = game.settings.get(MODULE_ID, 'settingKey');
await game.settings.set(MODULE_ID, 'settingKey', newValue);
```

### Application Class (ui-panel.js)
```javascript
class NarratorPanel extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'narrator-master-panel',
            title: game.i18n.localize('NARRATOR.PanelTitle'),
            template: 'modules/narrator-master/templates/panel.hbs',
            classes: ['narrator-master'],
            width: 400,
            height: 600,
            resizable: true
        });
    }

    getData() {
        return { /* template context */ };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.button').click(this._onClick.bind(this));
    }
}
```

### Journal Access (journal-parser.js)
```javascript
// Get journal by ID
const journal = game.journal.get(journalId);

// Iterate pages (v10+ API)
for (const page of journal.pages) {
    if (page.type === 'text') {
        const content = page.text.content; // HTML content
    }
}
```

## Localization

All user-facing strings use Foundry's i18n system:

```javascript
// In JavaScript
game.i18n.localize('NARRATOR.Panel.Title');

// In Handlebars
{{localize 'NARRATOR.Panel.Title'}}
```

Keys are organized in `lang/*.json` (primary: `it.json`, reference: `en.json`):
- `NARRATOR.Settings.*` - Settings labels and hints
- `NARRATOR.Panel.*` - Panel UI elements
- `NARRATOR.Errors.*` - Error messages
- `NARRATOR.Notifications.*` - Toast notifications
- `NARRATOR.OffTrack.*` - Off-track detection messages
- `NARRATOR.SpeakerLabels.*` - Speaker label UI strings
- `NARRATOR.Suggestions.*` - Suggestion type/confidence labels
- `NARRATOR.Recording.*` - Recording state labels
- `NARRATOR.Images.*` - Image gallery strings

**IMPORTANT**: When adding/modifying i18n keys, update ALL language files (`it.json`, `en.json`, and ideally `de.json`, `es.json`, `fr.json`, `ja.json`, `pt.json`). Run `node verify-translations.js` to check for missing keys across languages.

## External APIs

### OpenAI API
- **Base URL**: `https://api.openai.com/v1`
- **Auth**: Bearer token (user-provided API key)
- **Minimum requirement**: Paid API account ($5 credit minimum)

**Endpoints used**:
| Endpoint | Model | Purpose |
|----------|-------|---------|
| `/audio/transcriptions` | `gpt-4o-transcribe-diarize` | Audio transcription with speaker labels |
| `/chat/completions` | `gpt-4o-mini` | Suggestions and analysis |
| `/images/generations` | `gpt-image-1` | Infographics and illustrations |

**Important notes**:
- Image URLs expire after 60 minutes - download/cache immediately
- Audio files max 25MB - use chunking for longer recordings
- Use `gpt-image-1` not `dall-e-3` (deprecated May 2026)

## Build & Release

### Build the package

```bash
bash build.sh      # Linux/macOS
build.bat           # Windows
```

The build script auto-detects module ID, version, and GitHub URL from `module.json`. It creates a clean ZIP in `releases/{id}-v{version}.zip` with the download URL already set in the packaged module.json.

### Publish a new release

1. **Update `module.json`** - change these two fields:
   - `"version"`: bump to the new version (e.g. `"X.Y.Z"`)
   - `"download"`: update to match: `https://github.com/Aiacos/narrator_master/releases/download/vX.Y.Z/narrator-master-vX.Y.Z.zip`

2. **Build the package**:
   ```bash
   bash build.sh
   ```

3. **Commit and push**:
   ```bash
   git add module.json
   git commit -m "Bump version to X.Y.Z"
   git push
   ```

4. **Create GitHub release** (uploads both module.json manifest AND ZIP):
   ```bash
   gh release create vX.Y.Z releases/narrator-master-vX.Y.Z.zip module.json --title "vX.Y.Z - Description" --latest
   ```

> **Why `module.json` is uploaded separately**: Foundry VTT downloads the standalone `module.json` first (via the manifest URL) to discover the module version and its download URL. The ZIP also contains a `module.json` but that's only used after installation.

### Foundry VTT Manifest URL

```
https://github.com/Aiacos/narrator_master/releases/latest/download/module.json
```

## Common Tasks

### Adding a New Setting
1. Add key to `SETTINGS` constant in `settings.js`
2. Register in `registerSettings()` function
3. Add getter method to `SettingsManager` class
4. Add localization strings to ALL `lang/*.json` files (at minimum `it.json` and `en.json`)
5. Update `TODO.md` if the change resolves a known issue

### Adding a New Service
1. Create `scripts/new-service.js` following existing patterns
2. Import in `main.js`
3. Instantiate in `NarratorMaster._initializeServices()`
4. Wire up handlers as needed

### Modifying the UI Panel
1. Update template in `templates/panel.hbs`
2. Add data to `getData()` in `ui-panel.js`
3. Add event handlers in `activateListeners()`
4. Add styling in `styles/narrator-master.css`
5. Add localization keys to ALL `lang/*.json` files (at minimum `it.json` and `en.json`)

### Adding Error Handling
Use the centralized `ErrorNotificationHelper` class:
```javascript
ErrorNotificationHelper.error(error, 'Context');
ErrorNotificationHelper.warn(message, 'Context');
ErrorNotificationHelper.handleApiError(error, 'Operation Name');
```

## Gotchas & Pitfalls

### Audio Capture
- **HTTPS required** for microphone access in production (localhost works for dev)
- Browser permission is one-time but may need re-granting
- MediaRecorder requires specific MIME types (`audio/webm;codecs=opus`)
- Always call `destroy()` to release media streams

### Foundry VTT
- `game.user.isGM` check required for DM-only features
- `game.journal` not available during 'init' hook - use 'ready'
- Settings with `scope: 'world'` are GM-only
- Never use deprecated `journal.content` - use `journal.pages`

### OpenAI API
- Rate limiting varies by account tier - implement exponential backoff
- Transcription requires `FormData` with proper file naming
- Images return URLs that expire - always download to base64
- gpt-4o-transcribe-diarize requires `response_format: 'diarized_json'`

### Localization
- All strings MUST use i18n keys - no hardcoded text
- Test with Italian locale to catch missing translations
- Handlebars uses `{{localize 'KEY'}}` not `{{i18n 'KEY'}}`

## Testing

### Syntax Check
```bash
find scripts -name '*.js' -exec node --check {} \;
```

### JSON Validation
```bash
python3 -c 'import json; json.load(open("module.json")); json.load(open("lang/it.json")); json.load(open("lang/en.json")); print("OK")'
```

### Translation Key Verification
```bash
node verify-translations.js
```
Checks that all language files have the same keys as `it.json` (the primary/most complete translation).

### Manual Testing in Foundry
1. Symlink module: `ln -s $(pwd)/narrator-master ~/.local/share/FoundryVTT/Data/modules/`
2. Enable in Game Settings > Manage Modules
3. Check browser console for errors
4. Verify panel opens, recording works, AI features function

## Code Style

- **ES6 Modules**: Use `import`/`export`
- **JSDoc**: Document all classes and public methods
- **Private methods**: Prefix with `_` (e.g., `_handleApiError`)
- **Constants**: UPPER_SNAKE_CASE
- **Classes**: PascalCase
- **Functions/methods**: camelCase
- **No console.log in production**: Use `console.warn`/`console.error` for important messages only

## File Modification Guidelines

When modifying files:
1. **Read `TODO.md` first** to understand known issues and avoid regressions
2. Maintain existing code style and patterns
3. Update JSDoc comments for any changed functionality
4. Add/update localization strings in ALL `lang/*.json` files (minimum `it.json` + `en.json`)
5. Test both with and without API key configured
6. Verify GM-only features don't appear for players
7. **Update `TODO.md`** if your changes resolve or introduce issues

## Dependencies

**Runtime**: None (pure ES6 modules)
**Development**: Optional Jest for testing
**External**: OpenAI API (paid account required)
