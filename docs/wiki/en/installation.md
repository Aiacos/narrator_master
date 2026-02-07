# Installation Guide

This guide will walk you through installing Narrator Master on Foundry VTT.

## System Requirements

### Required Software

- **Foundry VTT** version 13 or higher
- **Modern browser**: Chrome (recommended), Firefox, or Edge
- **HTTPS connection** for microphone access in production
  - Note: `localhost` works without HTTPS during development

### OpenAI Account

> **IMPORTANT**: Narrator Master requires a **paid OpenAI account** with at least **$5 in credit**.
>
> The free plan (3 requests per minute, GPT-3.5 only) is **not sufficient** for transcription and image generation features.

Required models:
- `gpt-4o-transcribe-diarize` - Audio transcription with speaker identification
- `gpt-4o-mini` - Suggestion generation and context analysis
- `gpt-image-1` - Image and infographic generation

### How to Get an OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Go to **Billing** > **Add payment method**
4. Add a payment method and load at least $5
5. Go to **API Keys** > **Create new secret key**
6. Copy the key (starts with `sk-...`)
7. **Keep the key secure** - it will not be visible again

## Installation Methods

### Method 1: Manifest URL (Recommended)

The easiest way to install the module:

1. Open Foundry VTT
2. Go to the **Add-on Modules** tab in the setup screen
3. Click **Install Module**
4. In the "Manifest URL" field, paste:
   ```
   https://github.com/narrator-master/narrator-master/releases/latest/download/module.json
   ```
5. Click **Install**
6. Wait for the download to complete

### Method 2: Manual Installation

If you prefer to install manually:

1. Download the latest release from [GitHub Releases](https://github.com/narrator-master/narrator-master/releases)
2. Extract the `narrator-master.zip` file
3. Copy the `narrator-master` folder to your Foundry VTT modules directory:

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

### Method 3: Symlink (For Developers)

For developers or those who want to modify the code:

**Linux/macOS:**
```bash
ln -s /full/path/to/narrator-master ~/.local/share/FoundryVTT/Data/modules/narrator-master
```

**Windows (Administrator Command Prompt):**
```cmd
mklink /D "%localappdata%\FoundryVTT\Data\modules\narrator-master" "C:\path\to\narrator-master"
```

## Module Activation

After installation:

1. **Launch** Foundry VTT
2. **Open** or create a game world
3. Go to **Game Settings** (gear icon)
4. Click **Manage Modules**
5. Find **Narrator Master** in the list
6. **Check the box** to activate it
7. Click **Save Module Settings**
8. The world will reload with the module active

## Installation Verification

To verify that installation was successful:

1. As GM, look for the **Narrator Master** control group in the left sidebar
2. An icon should appear to open the DM panel
3. If you don't see the icon, verify:
   - You are logged in as GM (not as a player)
   - The module is active in "Manage Modules"
   - The browser console (F12) for any errors

## Module Updates

### Automatic Update

1. Go to **Add-on Modules** in the setup screen
2. Click **Update All** or find Narrator Master and click **Update**

### Manual Update

1. Download the new version from GitHub
2. Replace the existing folder with the new one
3. Restart Foundry VTT

## Installation Troubleshooting

### Module doesn't appear in the list

- Verify that the `narrator-master` folder contains `module.json`
- Check that the path is correct
- Completely restart Foundry VTT

### Error during URL installation

- Verify internet connection
- Try manual installation
- Check that the manifest URL is correct

### Module activates but doesn't work

- Open the browser console (F12) and look for errors
- Verify you have Foundry VTT v13 or higher
- Make sure you are GM in the game world

## Next Steps

After installation, proceed with [Configuration](configuration.md) to set up the API key and module preferences.
