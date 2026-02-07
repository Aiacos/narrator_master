# Narrator Master

**An AI-powered Dungeon Master assistant for Foundry VTT**

Narrator Master is a Foundry VTT module that helps Dungeon Masters run their sessions more effectively. It captures audio from players, transcribes conversations in real-time with speaker identification, analyzes your adventure journal, and provides contextual suggestions - all powered by OpenAI's AI models.

![Foundry VTT v13+](https://img.shields.io/badge/Foundry%20VTT-v13%2B-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-orange)
![Languages](https://img.shields.io/badge/languages-7-success)

## Features

- **Real-time Audio Transcription** - Capture audio from browser microphone with automatic transcription via OpenAI Whisper
- **Speaker Diarization** - Identify and label individual speakers (players vs DM) in transcriptions
- **Adventure Journal Integration** - Parse and index your Foundry VTT Journal entries to provide context-aware assistance
- **Contextual AI Suggestions** - Get relevant suggestions for what to say or do based on the current conversation
- **Off-Track Detection** - Receive red-highlighted warnings when players deviate from the planned adventure
- **Adaptive Storytelling** - Generate narrative bridges to guide players back on track while staying faithful to the adventure
- **Image Generation** - Create infographics and scene illustrations on demand via OpenAI's image generation
- **Multilingual Support** - Full localization in 7 languages: English, German, French, Spanish, Portuguese, Italian, and Japanese

## Requirements

### System Requirements

- **Foundry VTT** version 13 or higher
- A modern web browser with microphone support (Chrome, Firefox, Edge)
- HTTPS connection (required for microphone access in production)
  - Note: `localhost` works for development without HTTPS

### OpenAI API Account

> **IMPORTANT**: This module requires a **paid OpenAI API account** with a minimum **$5 credit purchase**.
>
> The free tier (3 RPM, GPT-3.5 only) is **insufficient** for the transcription and image generation features.

You'll need access to these OpenAI models:
- `gpt-4o-transcribe-diarize` - For audio transcription with speaker identification
- `gpt-4o-mini` - For generating DM suggestions and analyzing context
- `gpt-image-1` - For generating images and infographics

## Installation

### Method 1: Direct Download (Recommended)

1. Open Foundry VTT and navigate to **Add-on Modules** tab in the setup screen
2. Click **Install Module**
3. Paste this manifest URL in the "Manifest URL" field:
   ```
   https://github.com/narrator-master/narrator-master/releases/latest/download/module.json
   ```
4. Click **Install**

### Method 2: Manual Installation

1. Download the latest release from the [Releases page](https://github.com/narrator-master/narrator-master/releases)
2. Extract the `narrator-master.zip` file
3. Copy the `narrator-master` folder to your Foundry VTT modules directory:
   - **Linux**: `~/.local/share/FoundryVTT/Data/modules/`
   - **Windows**: `%localappdata%/FoundryVTT/Data/modules/`
   - **macOS**: `~/Library/Application Support/FoundryVTT/Data/modules/`

### Method 3: Development (Symlink)

For active development, create a symlink from your project directory:

```bash
# Linux/macOS
ln -s /path/to/narrator-master ~/.local/share/FoundryVTT/Data/modules/narrator-master

# Windows (Administrator Command Prompt)
mklink /D "%localappdata%\FoundryVTT\Data\modules\narrator-master" "C:\path\to\narrator-master"
```

## Configuration

### 1. Enable the Module

1. Launch a game world in Foundry VTT
2. Go to **Game Settings** > **Manage Modules**
3. Check **Narrator Master** to enable it
4. Click **Save Module Settings**

### 2. Configure OpenAI API Key

1. Go to **Game Settings** > **Configure Settings** > **Module Settings**
2. Find the **Narrator Master** section
3. Enter your OpenAI API key in the **Chiave API OpenAI** field
4. Click **Save Changes**

> **Security Note**: Your API key is stored securely via Foundry VTT's settings system and is never exposed to players or stored in plain text files.

### 3. Select Adventure Journal

1. In the module settings, use the **Journal dell'Avventura** dropdown
2. Select the Journal entry that contains your adventure content
3. The module will parse and index the Journal pages for AI context

### Other Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Avvio Automatico Registrazione** | Start recording when the panel opens | Off |
| **Lingua Trascrizione** | Language for transcription | Italian |
| **Mostra Etichette Parlanti** | Display speaker labels in transcription | On |
| **Sensibilità Deviazione** | How sensitive off-track detection should be (low/medium/high) | Medium |
| **Posizione Pannello** | Remember panel position between sessions | On |

## Usage

### Opening the DM Panel

1. Look for the **Narrator Master** control group in the left sidebar
2. Click the **Attiva/Disattiva Pannello** button to open the DM panel
3. The panel can be moved, resized, and minimized like any Foundry application

### Recording a Session

1. Make sure your microphone is connected and allowed in the browser
2. Click **Avvia Registrazione** to start capturing audio
3. Speak naturally - the module will transcribe in real-time
4. Click **Ferma Registrazione** when finished
5. Use **Pausa** / **Riprendi** to temporarily stop recording without losing progress

### Viewing Transcriptions

The **Trascrizione** tab shows:
- Real-time transcription of captured audio
- Speaker labels (when diarization detects different speakers)
- Timestamps for each segment

### Getting AI Suggestions

The **Suggerimenti** tab displays:
- Context-aware suggestions based on current conversation
- Relevant passages from your adventure Journal
- Narrative guidance when players go off-track

### Off-Track Warnings

When players deviate from the planned adventure:
- A **red warning banner** appears in the panel
- The off-track badge shows on the Suggestions tab
- **Ponte Narrativo** suggestions help guide players back to the story

### Generating Images

In the **Immagini** tab:
1. Click **Genera Immagine**
2. Enter a description or select an automatic prompt based on context
3. Wait for the image to generate (typically 10-30 seconds)
4. Click any image to view in full size

> **Note**: Generated image URLs expire after 60 minutes. Images are automatically cached locally.

## Cost Estimates

Based on OpenAI pricing (as of 2024-2026):

| Operation | Model | Cost | Notes |
|-----------|-------|------|-------|
| Transcription | gpt-4o-transcribe-diarize | $0.006/minute | Speaker identification included |
| Suggestions | gpt-4o-mini | $0.15-$0.60/1M tokens | Input/output tokens |
| Images | gpt-image-1 | ~$0.04-$0.08/image | 1024x1024 standard quality |

**Typical 3-hour session estimate:**
- Transcription: 180 min × $0.006 = **$1.08**
- Suggestions: ~50K tokens = **$0.03**
- Images: 5 images × $0.04 = **$0.20**
- **Total: ~$1.31 per session**

## Troubleshooting

### Microphone Not Working

**Symptom**: Recording button doesn't work or no audio is captured

**Solutions**:
1. Check browser microphone permissions (look for camera/mic icon in address bar)
2. Ensure HTTPS is enabled (required for microphone access)
3. Try a different browser (Chrome recommended)
4. Check if another application is using the microphone

### API Key Errors

**Symptom**: "Chiave API non valida" or "Errore di autenticazione"

**Solutions**:
1. Verify your API key is correct (starts with `sk-`)
2. Check that you have credits in your OpenAI account
3. Ensure your API key has access to the required models
4. Check if the key has any IP restrictions

### Transcription Not Appearing

**Symptom**: Recording works but no text appears

**Solutions**:
1. Verify API key has Whisper access
2. Check browser console for errors (F12 > Console)
3. Ensure audio file is under 25MB (auto-chunking should handle this)
4. Try speaking more clearly/closer to microphone

### Journal Not Loading

**Symptom**: Journal dropdown is empty or content not available to AI

**Solutions**:
1. Ensure Journal contains text pages (not just images)
2. Check that you have GM/owner permissions on the Journal
3. Try re-selecting the Journal after editing it
4. Look for parsing errors in browser console

### Performance Issues

**Symptom**: Foundry VTT becomes slow with module enabled

**Solutions**:
1. Close the panel when not actively using it
2. Reduce transcription frequency in settings
3. Clear image cache if it grows too large
4. Disable auto-start recording feature

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Chiave API non configurata` | No API key entered | Add your OpenAI API key in settings |
| `Errore di rete` | Connection issue | Check internet connection |
| `Limite di rate superato` | Too many API requests | Wait a moment, consider upgrading OpenAI plan |
| `File troppo grande` | Audio exceeds 25MB | Module should auto-chunk; report if persists |
| `Permesso microfono negato` | Browser blocked microphone | Allow microphone in browser settings |

## Architecture

The module is built with a clean OOP architecture:

```
./
├── module.json           # Module manifest
├── scripts/
│   ├── main.js          # Entry point & NarratorMaster controller
│   ├── settings.js      # Module settings registration
│   ├── audio-capture.js # Browser microphone recording
│   ├── transcription.js # OpenAI Whisper integration
│   ├── ai-assistant.js  # GPT-4o-mini suggestions
│   ├── image-generator.js# DALL-E/GPT-image generation
│   ├── journal-parser.js# Journal content extraction
│   └── ui-panel.js      # Foundry Application panel
├── styles/
│   └── narrator-master.css
├── templates/
│   └── panel.hbs        # Handlebars UI template
└── lang/
    └── it.json          # Italian localization
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the existing code style
4. Test thoroughly in Foundry VTT
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/narrator-master/narrator-master.git

# Create symlink to Foundry modules
ln -s $(pwd)/narrator-master ~/.local/share/FoundryVTT/Data/modules/narrator-master

# Make changes and refresh Foundry VTT (F5) to test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Foundry VTT](https://foundryvtt.com/) for the amazing virtual tabletop platform
- [OpenAI](https://openai.com/) for the powerful AI APIs
- The TTRPG community for inspiration and feedback

## Support

- **Issues**: [GitHub Issues](https://github.com/narrator-master/narrator-master/issues)
- **Discussions**: [GitHub Discussions](https://github.com/narrator-master/narrator-master/discussions)

---

Made with love for Dungeon Masters everywhere
