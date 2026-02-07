# Usage Guide

This comprehensive guide will teach you how to use all the features of Narrator Master during your game sessions.

## The DM Panel

The DM panel is the main interface of Narrator Master. It is visible **only to the Game Master**.

### Opening the Panel

1. Look for the **Narrator Master** control group in the left sidebar
2. Click on the **Open/Close DM Panel** button
3. The panel will appear as a floating window

### Panel Features

- **Draggable**: Click on the title bar to move it
- **Resizable**: Drag the edges to change size
- **Minimizable**: Click the "-" icon to minimize it
- **Persistent**: Position is saved between sessions

### Panel Tabs

The panel is organized into three tabs:

| Tab | Content |
|-----|---------|
| **Transcription** | Transcribed text from audio with speaker identification |
| **Suggestions** | AI advice based on session context |
| **Images** | Gallery of generated images |

## Audio Recording

Audio recording is the heart of the module. It captures voice from the session and transcribes it in real time.

### Starting Recording

1. Make sure the microphone is connected
2. Click the **Start Recording** button (microphone icon)
3. If prompted, **allow microphone access** in the browser
4. The audio level indicator will show activity

### During Recording

While recording:

- The **level indicator** shows audio intensity
- The status shows "**Recording**"
- Audio is processed in chunks of about 30 seconds
- Transcription appears automatically in the respective tab

### Recording Controls

| Button | Function |
|--------|----------|
| **Start** | Begin recording |
| **Pause** | Temporarily suspend (audio is not lost) |
| **Resume** | Continue after a pause |
| **Stop** | End recording and process the last chunk |

### Tips for Good Recording

- **Microphone position**: Closer = better quality
- **Quiet environment**: Reduce background noise
- **One speaker at a time**: Improves diarization
- **Consistent volume**: Avoid peaks that saturate audio

## Transcription

Transcription converts audio to text using OpenAI Whisper with diarization support.

### Viewing Transcription

1. Go to the **Transcription** tab
2. Text appears as it is processed
3. Each segment shows:
   - **Speaker label** (if enabled)
   - **Transcribed text**
   - **Timestamp** of the segment

### Speaker Identification

The diarization system automatically identifies speakers:

- **Speaker 1**, **Speaker 2**, etc. for different speakers
- Useful for distinguishing players and DM
- Accuracy improves with distinct voices

### Managing Transcription

| Action | How to |
|--------|--------|
| **Copy** | Click "Copy to Clipboard" |
| **Clear** | Click "Clear Transcription" |
| **Scroll** | Use the scrollbar to go back |

## AI Suggestions

Suggestions are AI-generated advice based on the conversation and the adventure Journal.

### How They Work

1. The AI analyzes the recent transcription
2. Compares with Journal content
3. Generates contextual suggestions
4. Detects any deviations from the plot

### Types of Suggestions

| Type | Description |
|------|-------------|
| **Narration** | Descriptions to read to players |
| **Dialogue** | Lines for NPCs |
| **Action** | What to do or make happen |
| **Reference** | Relevant Journal passages |

### Confidence Level

Each suggestion has a confidence indicator:

- **High**: Very relevant suggestion
- **Medium**: Likely useful suggestion
- **Low**: Speculative suggestion

### Using Suggestions

1. Read the proposed suggestion
2. Adapt it to your narration style
3. You're not required to follow it - it's just a help!

## Off-Track Detection

One of the most useful features: the module warns you when players stray from the plot.

### How It's Signaled

When a deviation is detected:

1. A **red banner** appears with "WARNING: Off-Track!"
2. The Suggestions tab shows a **warning badge**
3. A **Narrative Bridge** is proposed

### The Narrative Bridge

The narrative bridge is a special suggestion that helps you:

- Bring players back to the main plot
- Do it naturally and not forced
- Maintain consistency with the adventure

### Detection Sensitivity

You can adjust the sensitivity in settings:

| Sensitivity | When to use |
|-------------|-------------|
| **Low** | Sandbox sessions, free improvisation |
| **Medium** | Adventures with plot but flexible |
| **High** | Linear adventures, official modules |

## Image Generation

Narrator Master can create images and infographics on demand using OpenAI.

### Generating an Image

1. Go to the **Images** tab
2. Click **Generate Image**
3. Choose between:
   - **Automatic**: Based on current context
   - **Custom**: Enter a description
4. Wait 10-30 seconds for generation

### Managing Images

| Action | How to |
|--------|--------|
| **Enlarge** | Click on the image |
| **Download** | Click the download icon |
| **Delete** | Click the trash icon |
| **Clear all** | Click "Clear Images" |

### Notes on Images

- Images are **cached locally** automatically
- Original URLs expire after 60 minutes
- Each image costs about **$0.04-0.08**

## Journal Integration

The adventure Journal provides context to the AI for generating relevant suggestions.

### Selecting a Journal

1. Use the **Select Journal** dropdown in the panel
2. Or configure the default Journal in settings
3. The module will automatically analyze all text pages

### Recommended Journal Structure

For optimal results, organize the Journal like this:

```
Adventure Journal
├── Introduction and Premise
├── Chapter 1 - [Title]
├── Chapter 2 - [Title]
├── Main NPCs
├── Important Locations
└── Secrets and Revelations
```

### What to Include

- **Main plot**: Objectives and expected developments
- **Descriptions**: Environments, key scenes
- **Dialogues**: Important NPC lines
- **Secrets**: Information to reveal gradually
- **Alternatives**: Possible story developments

### Updating the Journal

If you modify the Journal during the session:

1. Re-select the Journal from the dropdown
2. The module will re-analyze the content
3. New content will be available to the AI

## Typical Session Workflow

### Before the Session

1. [ ] Prepare the adventure Journal
2. [ ] Verify that the API key is configured
3. [ ] Test the microphone
4. [ ] Open the DM panel

### During the Session

1. **Start recording** when the game begins
2. **Monitor transcription** to verify audio
3. **Consult suggestions** when you need inspiration
4. **Pause** during breaks (food, bathroom, etc.)
5. **Generate images** for epic moments
6. **Watch for warnings** about off-track

### After the Session

1. **Stop recording**
2. **Copy transcription** if you want to keep it
3. **Save images** you like
4. **Update the Journal** with new developments

## Troubleshooting

### The microphone doesn't work

1. Check **browser settings** (padlock icon)
2. Try with a **different browser** (Chrome recommended)
3. Check that **no other app** is using the microphone
4. Verify that it's **HTTPS** (except localhost)

### Transcription doesn't appear

1. Check the **API key** in settings
2. Verify you have **OpenAI credits**
3. Look at the **browser console** (F12) for errors
4. Try to **speak louder/clearer**

### Suggestions are not relevant

1. **Select a Journal** that's more detailed
2. Verify that the Journal contains **text** (not just images)
3. Adjust the **sensitivity** of detection
4. The system improves with more **audio context**

### "Rate limit exceeded"

1. **Wait** a few minutes
2. Consider **upgrading** the OpenAI plan
3. Reduce the **frequency** of image generation

### The panel doesn't open

1. Verify you are **GM** in the world
2. Check that the module is **activated**
3. **Reload** the page (F5)
4. Check for **errors** in the console (F12)

### Common Error Messages

| Error | Solution |
|-------|----------|
| "API key not configured" | Add the key in settings |
| "Network error" | Verify internet connection |
| "Microphone permission denied" | Allow microphone in browser |
| "File too large" | Audio should be chunked automatically |
| "Request limit" | Wait and try again |

## Shortcuts and Tricks

### Productivity

- **Keep the panel always open** in a corner of the screen
- **Use pause** instead of stopping during interruptions
- **Prepare descriptions** in the Journal before the session
- **Copy suggestions** you like for future use

### Cost Savings

- **Record only important parts** of the session
- **Generate few targeted images**
- **Use concise Journals** to reduce tokens

### Better Quality

- **Speak clearly** near the microphone
- **One speaker at a time** improves diarization
- **Detailed Journals** = better suggestions

## Frequently Asked Questions

### How much does it cost to use the module?

A typical 3-hour session costs about $1.31. See [Estimated Costs](index.md#estimated-costs).

### Can I use the free OpenAI plan?

No, the free plan does not include the necessary models. At least $5 in credits is required.

### Can players see the panel?

No, the panel is visible only to the GM.

### Is the transcription saved?

Only in the current session. Copy it if you want to keep it.

### Does it work with Discord/other audio systems?

Narrator Master only captures the browser microphone audio. If you use Discord, other players' audio will not be captured (unless it passes through your speakers and your microphone picks it up).

### Can I use it offline?

No, it requires an internet connection for OpenAI APIs.

---

Have more questions? Consult the [wiki index](index.md) or open a [discussion on GitHub](https://github.com/narrator-master/narrator-master/discussions).
