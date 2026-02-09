# Configuration Guide

This guide explains how to configure Narrator Master to get the most out of its features.

## Initial Setup

After installing and activating the module, follow these steps for initial setup.

### Step 1: Open Settings

1. In your game world, click on the **gear icon** (Game Settings)
2. Select **Configure Settings**
3. Go to the **Module Settings** tab
4. Find the **Narrator Master** section

### Step 2: Configure OpenAI API Key

The API key is **mandatory** for the module to function.

1. In the **OpenAI API Key** field, paste your API key
2. The key must start with `sk-...`
3. Click **Save Changes**

> **Security**: The key is stored securely through Foundry VTT's settings system. It is never visible to players nor saved in text files.

### Step 3: Select the Adventure Journal

To enable contextual suggestions:

1. Find the **Adventure Journal** setting
2. Select from the dropdown menu the Journal containing your adventure details
3. The module will automatically analyze the Journal's text pages

> **Tip**: Organize your adventure Journal into logical pages (e.g., "Chapter 1", "Important NPCs", "Locations"). The module will index all text content. For a complete guide on how to structure your Journal, consult the **[Journal Structure Guide](journal-guide.md)**.

## Settings Overview

### OpenAI API Key

| Property | Value |
|----------|-------|
| Technical name | `openaiApiKey` |
| Type | String |
| Scope | World (GM only) |
| Required | Yes |

**Description**: Your personal OpenAI API key. Without this key, no AI features will be available.

**How to obtain it**:
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the generated key

### Adventure Journal

| Property | Value |
|----------|-------|
| Technical name | `selectedJournal` |
| Type | String (Journal ID) |
| Scope | World |
| Required | No (but recommended) |

**Description**: The Journal containing your adventure details. The module reads all text pages to provide context to the AI.

**What it includes**:
- Plot and objectives
- Location descriptions
- NPC information
- Secrets and revelations

### Auto-Start Recording

| Property | Value |
|----------|-------|
| Technical name | `autoStart` |
| Type | Boolean |
| Default | Disabled |
| Scope | World |

**Description**: If enabled, audio recording starts automatically when you open the DM panel. Useful if you always use transcription.

### Transcription Language

| Property | Value |
|----------|-------|
| Technical name | `transcriptionLanguage` |
| Type | String |
| Default | Italian (it) |
| Scope | World |

**Description**: The language in which transcription is performed. The module is optimized for Italian, but Whisper supports many languages.

### Show Speaker Labels

| Property | Value |
|----------|-------|
| Technical name | `showSpeakerLabels` |
| Type | Boolean |
| Default | Enabled |
| Scope | World |

**Description**: Shows speaker names (e.g., "Speaker 1", "Speaker 2") in transcription when diarization is detected.

### Off-Track Detection Sensitivity

| Property | Value |
|----------|-------|
| Technical name | `offTrackSensitivity` |
| Type | Choice |
| Options | Low, Medium, High |
| Default | Medium |
| Scope | World |

**Description**: Controls how strictly the system detects deviations from the plot.

| Level | Behavior |
|-------|----------|
| **Low** | Detects only significant deviations |
| **Medium** | Balanced - detects most deviations |
| **High** | Detects even small variations from the plot |

**Tip**: Start with "Medium" and adjust based on your needs. "Low" is ideal for sandbox sessions; "High" for linear adventures.

### Panel Position

| Property | Value |
|----------|-------|
| Technical name | `panelPosition` |
| Type | Object (position) |
| Default | Default position |
| Scope | Client |

**Description**: Stores the DM panel position between sessions. It is automatically updated when you move the panel.

## Advanced Configuration

### Browser Permissions

For audio recording, the browser requires specific permissions:

1. **First recording**: The browser asks for microphone access
2. **Click "Allow"** to authorize
3. The permission is stored for the site

**If you denied permission**:
1. Click on the lock/info icon in the address bar
2. Find "Microphone" in site settings
3. Change from "Block" to "Allow"
4. Reload the page

### HTTPS Requirements

Microphone access requires HTTPS in production:

| Environment | Requirement |
|-------------|-------------|
| `localhost` | HTTP works |
| Local LAN | HTTPS required |
| Internet | HTTPS mandatory |

If you use Foundry VTT on a local network or internet, configure HTTPS or use a service like The Forge that includes it.

### Cost Optimization

To reduce API costs:

1. **Record only when necessary** - Pause during breaks
2. **Select concise Journals** - Less text = fewer tokens
3. **Generate few images** - Each image costs ~$0.04-0.08
4. **Use low sensitivity** - Less analysis = lower costs

## Configuration Verification

To verify that everything is configured correctly:

1. **Open the DM panel** by clicking the icon in the sidebar
2. **Verify that** the "API key not configured" message does not appear
3. **Select a Journal** from the dropdown menu in the panel
4. **Test recording** by clicking "Start Recording"
5. **Speak briefly** and verify that the transcription appears

### Configuration Checklist

- [ ] OpenAI API key entered
- [ ] OpenAI account with sufficient credits
- [ ] Adventure Journal selected
- [ ] Microphone permission granted
- [ ] DM panel opens correctly
- [ ] Recording works

## Common Configuration Errors

### "Invalid API key"

- Verify that the key starts with `sk-`
- Check that you haven't copied extra spaces
- Verify that the key is active on OpenAI

### "Authentication error"

- Your OpenAI account may not have credits
- The key may have been revoked
- Generate a new key on platform.openai.com

### "Journal not found"

- The Journal may have been deleted
- Reselect the Journal from settings
- Verify that you have permissions on the Journal

### "Microphone permission denied"

- Check the site settings in your browser
- Try with a different browser
- Verify that no other app is using the microphone

## Next Steps

After configuring the module, consult the [Usage](usage.md) guide to learn how to use all the features.
