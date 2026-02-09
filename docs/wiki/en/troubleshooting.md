# Troubleshooting Guide

This comprehensive guide documents all errors you might encounter while using Narrator Master, with detailed explanations of causes and step-by-step solutions.

## Quick Error Reference

Use this table to quickly find the solution to your error:

| Error Message | Go to Section |
|---------------|---------------|
| `Narrator Master is not yet initialized` | [NotInitialized](#notinitialized) |
| `Narrator Master initialization failed` | [InitFailed](#initfailed) |
| `OpenAI API key not configured` | [NoApiKey](#noapikey) |
| `Invalid API key` | [InvalidApiKey](#invalidapikey) |
| `Incomplete configuration` | [ConfigIncomplete](#configincomplete) |
| `Your browser does not support audio capture` | [MicrophoneNotSupported](#microphonenotsupported) |
| `Microphone permission denied` | [MicrophonePermissionDenied](#microphonepermissiondenied) |
| `No microphone found` | [MicrophoneNotFound](#microphonenotfound) |
| `Microphone is in use by another application` | [MicrophoneInUse](#microphoneinuse) |
| `Microphone does not meet requirements` | [MicrophoneConstraints](#microphoneconstraints) |
| `Security error: audio capture requires HTTPS` | [MicrophoneSecurityError](#microphonesecurityerror) |
| `Microphone error: {error}` | [MicrophoneGeneric](#microphonegeneric) |
| `Invalid audio` | [InvalidAudio](#invalidaudio) |
| `Recording failed` | [RecordingFailed](#recordingfailed) |
| `Failed to initialize recorder` | [RecorderInitFailed](#recorderinitfailed) |
| `Audio file too large` | [FileTooLarge](#filetoolarge) |
| `Transcription failed` | [TranscriptionFailed](#transcriptionfailed) |
| `No transcription available` | [NoTranscription](#notranscription) |
| `AI Assistant failed` | [AIAssistantFailed](#aiassistantfailed) |
| `Image generation failed` | [ImageGenerationFailed](#imagegenerationfailed) |
| `No prompt provided` | [NoPrompt](#noprompt) |
| `No description provided` | [NoDescription](#nodescription) |
| `Content violates OpenAI policies` | [ContentPolicy](#contentpolicy) |
| `Content too long` | [ContentTooLong](#contenttoolong) |
| `Invalid content` | [InvalidContent](#invalidcontent) |
| `No context available to generate an image` | [NoContextForImage](#nocontextforimage) |
| `Connection error` | [NetworkError](#networkerror) |
| `Request limit reached` | [RateLimited](#ratelimited) |
| `Request took too long` | [Timeout](#timeout) |
| `OpenAI server error` | [ServerError](#servererror) |
| `Invalid request` | [BadRequest](#badrequest) |
| `Service temporarily unavailable` | [ServiceUnavailable](#serviceunavailable) |
| `An unexpected error occurred` | [UnexpectedError](#unexpectederror) |
| `Invalid Journal ID` | [InvalidJournalId](#invalidjournalid) |
| `Journal not found` | [JournalNotFound](#journalnotfound) |
| `Selected Journal is empty` | [JournalEmpty](#journalempty) |
| `Invalid speaker ID` | [InvalidSpeaker](#invalidspeaker) |
| `Invalid speaker label` | [InvalidLabel](#invalidlabel) |
| `Label cannot be empty` | [EmptyLabel](#emptylabel) |
| `Failed to save speaker mappings` | [SaveMappingsFailed](#savemappingsfailed) |
| `Failed to copy to clipboard` | [CopyFailed](#copyfailed) |
| `Transcription export failed` | [ExportFailed](#exportfailed) |
| `No adventure context set` | [NoContext (Off-Track)](#nocontext-off-track) |
| `Failed to parse response` | [ParseError (Off-Track)](#parseerror-off-track) |

---

## Table of Contents

- [Configuration and Initialization Errors](#configuration-and-initialization-errors)
- [Microphone and Audio Capture Errors](#microphone-and-audio-capture-errors)
- [Transcription Errors](#transcription-errors)
- [AI Assistant and Image Generation Errors](#ai-assistant-and-image-generation-errors)
- [Network and API Errors](#network-and-api-errors)
- [Journal Errors](#journal-errors)
- [Speaker Label Errors](#speaker-label-errors)
- [General Errors](#general-errors)
- [Warnings and Notifications](#warnings-and-notifications)

---

## Configuration and Initialization Errors

### NotInitialized

**Message**: `Narrator Master is not yet initialized. Wait for complete loading.`

**Cause**: The module is still loading its internal components.

**Solutions**:
1. Wait 2-5 seconds after Foundry VTT loads
2. Verify that the module is enabled in **Manage Modules**
3. Reload the page (F5) if the problem persists beyond 10 seconds
4. Check the browser console (F12) for JavaScript errors

**Prevention**:
- Don't attempt to use the panel immediately after page load
- Wait for the "Narrator Master ready" notification to appear

---

### InitFailed

**Message**: `Narrator Master initialization failed`

**Cause**: A critical error prevented the module from loading.

**Solutions**:
1. Open the browser console (F12 > Console) to see the specific error
2. Disable other modules to identify conflicts:
   - Go to **Manage Modules**
   - Disable all modules except Narrator Master
   - Reload and check if it works
3. Verify installation integrity:
   ```bash
   # Reinstall the module
   ```
4. Check Foundry VTT logs for file loading errors
5. Ensure you have Foundry VTT v13 or higher

**Prevention**:
- Keep Foundry VTT updated
- Don't manually modify module files
- Always use the stable version of the module

---

### NoApiKey

**Message**: `OpenAI API key not configured. Go to module settings to add it.`

**Cause**: No OpenAI API key has been configured in settings.

**Solutions**:
1. Go to **Game Settings** > **Configure Settings** > **Module Settings**
2. Find the **Narrator Master** section
3. Paste your OpenAI API key in the **OpenAI API Key** field
4. Click **Save Changes**
5. If you don't have an API key:
   - Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Create a new account or sign in
   - Generate a new API key
   - **Important**: Purchase at least $5 in credits (free tier is not sufficient)

**Prevention**:
- Save the API key in a safe place
- Regularly check your OpenAI account balance
- Configure spending limits in OpenAI to avoid surprises

---

### InvalidApiKey

**Message**: `Invalid API key. Verify your OpenAI API key in settings.`

**Cause**: The provided API key is incorrect or no longer valid.

**Solutions**:
1. Verify that the API key:
   - Starts with `sk-`
   - Contains no spaces or extra characters
   - Was copied completely
2. Test the key on [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Check if the key was revoked:
   - Log in to your OpenAI account
   - Go to API Keys
   - Verify the key status
4. If necessary, generate a new API key
5. Ensure the key has access to the required models:
   - `gpt-4o-transcribe-diarize`
   - `gpt-4o-mini`
   - `gpt-image-1`

**Prevention**:
- Use a dedicated key for Narrator Master
- Set IP restrictions if possible
- Monitor key usage in the OpenAI dashboard
- Never share the API key

---

### ConfigIncomplete

**Message**: `Incomplete configuration`

**Cause**: Some necessary settings have not been configured.

**Solutions**:
1. Verify all required settings:
   - **OpenAI API Key**: Must be present and valid
   - **Adventure Journal**: Select a Journal (optional but recommended)
2. Click **Configure Settings** in the panel
3. Complete all required fields
4. Save and reload the panel

**Prevention**:
- Complete the initial configuration before using the module
- Use the configuration wizard if available

---

## Microphone and Audio Capture Errors

### MicrophoneNotSupported

**Message**: `Your browser does not support microphone audio capture.`

**Cause**: The browser does not support the MediaStream API required for audio recording.

**Solutions**:
1. Use a modern supported browser:
   - **Chrome** 74+ (recommended)
   - **Firefox** 66+
   - **Edge** 79+
   - **Safari** 14.1+ (limited support)
2. Update the browser to the latest version
3. Avoid obsolete browsers like Internet Explorer

**Prevention**:
- Keep the browser always updated
- Use Chrome for maximum compatibility

---

### MicrophonePermissionDenied

**Message**: `Microphone permission denied. Allow microphone access in browser settings.`

**Cause**: The user denied microphone access permission, or the browser blocked access.

**Solutions**:

**Chrome/Edge**:
1. Click on the padlock/microphone icon in the address bar
2. Select **Allow** for the microphone
3. Reload the page (F5)
4. If it doesn't appear, go to **Settings** > **Privacy and security** > **Site Settings** > **Microphone**
5. Remove the block for the Foundry VTT site
6. Add the site to the allowed list

**Firefox**:
1. Click on the microphone icon in the address bar
2. Remove the microphone block
3. Reload the page
4. When prompted, click **Allow**

**Safari**:
1. Go to **Safari** > **Preferences** > **Websites** > **Microphone**
2. Find the Foundry VTT site
3. Change from "Deny" to "Allow"
4. Reload the page

**Prevention**:
- Always click **Allow** when prompted on first launch
- Don't permanently block the microphone for the site

---

### MicrophoneNotFound

**Message**: `No microphone found. Connect a microphone and try again.`

**Cause**: The system does not detect any audio input device.

**Solutions**:
1. Verify that the microphone is physically connected
2. Check the operating system audio settings:
   - **Windows**: Settings > System > Sound > Input devices
   - **macOS**: System Preferences > Sound > Input
   - **Linux**: Settings > Audio > Input
3. Ensure the microphone is enabled and not muted
4. Try another microphone or device
5. Restart the browser after connecting the microphone
6. If using a USB microphone, try another USB port

**Prevention**:
- Connect the microphone before launching Foundry VTT
- Use quality microphones with updated drivers
- Test the microphone in other applications before using Narrator Master

---

### MicrophoneInUse

**Message**: `Microphone is in use by another application. Close other apps using the microphone.`

**Cause**: Another application is using the microphone in exclusive mode.

**Solutions**:
1. Close other applications that might be using the microphone:
   - Zoom, Teams, Discord, Skype
   - Other browsers or browser tabs
   - Audio recording software
   - OBS, Streamlabs, other streaming software
2. Check background apps:
   - **Windows**: Task Manager > Look for apps with microphone icon
   - **macOS**: Activity Monitor > Filter for "Audio"
   - **Linux**: `lsof /dev/snd/*` to see who's using audio
3. Restart the browser
4. As a last resort, restart the computer

**Prevention**:
- Close videoconferencing apps before using Narrator Master
- Use separate browser tabs for Foundry VTT
- Don't open multiple instances of Foundry VTT simultaneously

---

### MicrophoneConstraints

**Message**: `Microphone does not meet required constraints.`

**Cause**: The microphone does not support the required audio settings (e.g., sample rate, channels).

**Solutions**:
1. Check the microphone specifications:
   - Minimum sample rate: 8000 Hz (recommended 44100 Hz or 48000 Hz)
   - Channels: mono or stereo
2. Try a different microphone
3. Update microphone drivers:
   - **Windows**: Device Manager > Audio controllers > Update driver
   - **macOS**: Usually not necessary
   - **Linux**: Install updated `pulseaudio` or `pipewire`
4. Use the laptop's built-in microphone as a test

**Prevention**:
- Use standard microphones with at least 16 kHz
- Avoid very old or cheap microphones
- Test the microphone in other applications first

---

### MicrophoneSecurityError

**Message**: `Security error: audio capture requires HTTPS in production.`

**Cause**: You're accessing Foundry VTT via HTTP instead of HTTPS, and the browser blocks microphone access.

**Solutions**:

**Immediate solution (development only)**:
- If using `localhost`, it should work even with HTTP
- Verify that the URL is exactly `http://localhost:30000` (not the IP)

**Permanent solution (production)**:
1. Configure HTTPS for Foundry VTT:
   - Obtain an SSL certificate (Let's Encrypt is free)
   - Configure the web server (Apache/Nginx) with SSL
   - Or use Foundry VTT's reverse proxy with a certificate
2. Or use a secure tunnel:
   - **Ngrok**: `ngrok http 30000` (creates a temporary HTTPS URL)
   - **Cloudflare Tunnel**: More permanent configuration
3. Follow the [official Foundry VTT guide on SSL](https://foundryvtt.com/article/nginx/)

**Prevention**:
- Always configure HTTPS for public servers
- Use `localhost` only for local testing
- Never share public HTTP URLs

---

### MicrophoneGeneric

**Message**: `Microphone error: {error}`

**Cause**: A generic uncategorized error occurred while accessing the microphone.

**Solutions**:
1. Read the specific error message (the text after "Microphone error:")
2. Search for the error in the browser documentation
3. Common solutions:
   - Restart the browser
   - Restart the computer
   - Check for operating system updates
   - Verify browser app permissions in system security settings
4. Try in an incognito/private browsing window
5. Disable browser extensions that might interfere (adblockers, privacy tools)

**Prevention**:
- Keep browser and operating system updated
- Use dedicated browser profiles for Foundry VTT

---

### InvalidAudio

**Message**: `Invalid audio. Make sure the recording contains audio data.`

**Cause**: The recorded audio file is empty or corrupted.

**Solutions**:
1. Verify that the microphone works:
   - Open the system audio settings
   - Speak into the microphone and verify that the bars move
2. Check the audio level in the Narrator Master panel during recording:
   - Should show "Normal audio level" or "High audio level"
   - If it always shows "Low audio level", increase microphone volume
3. Record for at least 3-5 seconds before stopping
4. Verify that the microphone is not muted:
   - In the operating system
   - In the audio control panel
   - On the microphone itself (if it has a mute button)
5. Try speaking louder or moving closer to the microphone

**Prevention**:
- Always test the microphone before the session
- Record at least 5 seconds of audio
- Speak clearly during recording
- Monitor the audio level indicator in the panel

---

### RecordingFailed

**Message**: `Recording failed. Try again.`

**Cause**: Audio recording failed to complete correctly.

**Solutions**:
1. Restart the browser completely
2. Verify available memory:
   - Recording requires RAM to buffer audio
   - Close unnecessary tabs and apps
3. Check disk space (for temporary caches)
4. If the problem persists:
   - Disable other browser extensions
   - Try with a different browser
   - Check console logs (F12)
5. Ensure the audio codec is supported:
   - Browser must support `audio/webm;codecs=opus`
   - All modern browsers support this

**Prevention**:
- Record in shorter sessions (max 30-60 minutes)
- Close unnecessary apps to free RAM
- Use an updated browser

---

### RecorderInitFailed

**Message**: `Failed to initialize recorder: {error}`

**Cause**: The MediaRecorder failed to initialize with the required settings.

**Solutions**:
1. Check the specific error message
2. Verify codec support:
   - Open the console (F12)
   - Run: `MediaRecorder.isTypeSupported('audio/webm;codecs=opus')`
   - Should return `true`
3. If the codec is not supported:
   - Update the browser to the latest version
   - Try a different browser (Chrome recommended)
4. Disable hardware acceleration:
   - **Chrome**: chrome://settings > System > Turn off "Use hardware acceleration when available"
   - Restart the browser
5. Check for updated audio drivers

**Prevention**:
- Always use updated Chrome or Firefox
- Test functionality before important sessions

---

### FileTooLarge

**Message**: `Audio file too large ({size}MB). Maximum limit is 25MB.`

**Cause**: The recorded audio chunk exceeds the 25MB limit imposed by OpenAI.

**Solutions**:
1. Record in shorter sessions:
   - Stop recording every 20-30 minutes
   - Take breaks to process chunks
2. The module should already do automatic chunking, if you see this error:
   - Check that chunking is enabled
   - Verify that chunk size is configured correctly
3. If the problem persists, there might be a bug:
   - Stop and restart recording
   - Reload the panel
   - Report the issue to developers

**Prevention**:
- Don't record continuously for hours
- Take breaks every 30 minutes
- Stop recording during session breaks

---

## Transcription Errors

### TranscriptionFailed

**Message**: `Transcription failed (Error {status}): {message}`

**Cause**: OpenAI Whisper rejected or failed to process the audio.

**Solutions**:

**Error 400 (Bad Request)**:
1. The audio might be corrupted
2. Audio format is not supported
3. Retry recording with a new chunk

**Error 401 (Unauthorized)**:
1. Invalid or expired API key
2. Verify the key in settings
3. Regenerate the key on OpenAI

**Error 413 (Payload Too Large)**:
1. Audio file is too large (max 25MB)
2. Stop recording earlier
3. The module should prevent this with chunking

**Error 429 (Rate Limited)**:
1. Too many requests in a short time
2. Wait 1-2 minutes
3. Reduce recording frequency

**Error 500/503 (Server Error)**:
1. OpenAI is having issues
2. Check [status.openai.com](https://status.openai.com)
3. Wait and retry after a few minutes

**Prevention**:
- Don't send too many simultaneous requests
- Keep audio chunks under 20MB
- Check OpenAI balance before sessions

---

### NoTranscription

**Message**: `No transcription available for analysis.`

**Cause**: The AI Assistant cannot analyze context because there's no transcription.

**Solutions**:
1. Start recording before asking for suggestions
2. Wait for at least one chunk to be transcribed (about 30 seconds)
3. Verify that transcription appears in the **Transcription** tab
4. If the tab is empty:
   - Check for previous transcription errors
   - Verify the API key
   - Try recording again

**Prevention**:
- Always start recording before using the AI Assistant
- Let at least 30 seconds of transcription accumulate

---

## AI Assistant and Image Generation Errors

### AIAssistantFailed

**Message**: `AI Assistant failed (Error {status}): {message}`

**Cause**: The OpenAI GPT API rejected or failed to generate suggestions.

**Solutions**:

**Error 400 (Bad Request)**:
1. The prompt might be malformed
2. Context might be too long
3. Reduce transcription or Journal length

**Error 401 (Unauthorized)**:
1. Invalid API key
2. Verify and update the key

**Error 429 (Rate Limited)**:
1. Too many requests
2. Wait a few minutes
3. AI Assistant makes automatic requests - reduce recording frequency

**Error 500/503 (Server Error)**:
1. Temporary OpenAI issues
2. Check [status.openai.com](https://status.openai.com)
3. Retry after a few minutes

**Prevention**:
- Don't overload with very long transcriptions
- Keep Journals concise and well-structured
- Monitor your OpenAI account rate limit

---

### ImageGenerationFailed

**Message**: `Image generation failed (Error {status}): {message}`

**Cause**: The OpenAI image generation API failed.

**Solutions**:

**Error 400 (Bad Request)**:
1. The prompt might violate policies
2. Description too long or complex
3. Simplify the description

**Error 401 (Unauthorized)**:
1. Invalid API key
2. Verify the key

**Error 429 (Rate Limited)**:
1. Too many image requests
2. Wait a few minutes
3. Limit the number of images generated per session

**Error 500/503 (Server Error)**:
1. OpenAI has temporary issues
2. Retry after a few minutes

**Prevention**:
- Generate images in moderation (max 5-10 per session)
- Use clear and concise descriptions
- Verify your OpenAI account balance

---

### NoPrompt

**Message**: `No prompt provided for image generation.`

**Cause**: Image generation was requested without providing a description.

**Solutions**:
1. Click **Generate Image** in the panel
2. When prompted, enter a description
3. Be specific: "A red dragon flying over a burning castle"
4. Or use automatic generation based on context

**Prevention**:
- Always provide a description when generating images manually
- Use the automatic function if you don't have specific ideas

---

### NoDescription

**Message**: `No description provided for the infographic.`

**Cause**: Similar to NoPrompt, but specific to infographics.

**Solutions**:
1. Provide a description of the desired infographic type
2. Examples:
   - "Map of an enchanted forest with a river"
   - "Hierarchy diagram of a thieves' guild"
   - "Schema of a three-level dungeon"

**Prevention**:
- Plan the infographics you need
- Save descriptions of reusable infographics

---

### ContentPolicy

**Message**: `Content violates OpenAI policies. Try with a different description.`

**Cause**: The image description violates OpenAI Content Policy (explicit violence, adult content, etc.).

**Solutions**:
1. Modify the description to make it less explicit:
   - ❌ "A brutal and bloody murder"
   - ✅ "A fantasy combat scene"
2. Avoid references to:
   - Detailed graphic violence
   - Sexual content
   - Real famous people
   - Registered trademarks
3. Use generic fantasy/RPG language

**Prevention**:
- Keep descriptions in classic fantasy style
- Avoid explicit details
- Consult the [OpenAI Content Policy](https://openai.com/policies/usage-policies)

---

### ContentTooLong

**Message**: `Content too long. Maximum limit is {maxLength} characters.`

**Cause**: The image prompt or context exceeds the maximum allowed length.

**Solutions**:
1. Reduce description length
2. Focus on essential elements
3. Split complex descriptions into multiple separate images
4. For AI Assistant context:
   - Reduce Journal length
   - Clear old transcriptions

**Prevention**:
- Use concise descriptions (100-200 characters)
- Keep Journals focused on the current adventure

---

### InvalidContent

**Message**: `Invalid content. The content contains disallowed characters or formatting.`

**Cause**: The content contains special characters, HTML, or unsupported formatting.

**Solutions**:
1. Remove special characters from the prompt:
   - Emojis
   - Non-standard Unicode symbols
   - HTML tags
2. Use only plain text
3. If the problem is in the Journal:
   - Edit the Journal pages
   - Remove complex formatting
   - Use plain text

**Prevention**:
- Write descriptions in plain text
- Avoid copy-paste from formatted documents

---

### NoContextForImage

**Message**: `No context available to generate an image. Record some audio first.`

**Cause**: You requested automatic image generation, but there's no transcription or context available.

**Solutions**:
1. Start recording
2. Accumulate at least 1-2 minutes of transcription
3. Retry automatic generation
4. Or use manual mode and provide an explicit description

**Prevention**:
- Record audio before using automatic generation
- Use manual descriptions if you don't have context

---

## Network and API Errors

### NetworkError

**Message**: `Connection error. Check your Internet connection and try again.`

**Cause**: Unable to reach OpenAI servers due to network issues.

**Solutions**:
1. Verify Internet connection:
   - Open an external website to test
   - Verify that Wi-Fi or Ethernet is connected
2. Check firewall:
   - Ensure the browser can access `api.openai.com`
   - Configure exceptions if necessary
3. Check proxy or VPN:
   - Temporarily disable VPN
   - Verify browser proxy settings
4. If behind a corporate firewall:
   - Contact IT to whitelist `api.openai.com`
5. Try:
   - Switching networks (use mobile hotspot to test)
   - Using public DNS (8.8.8.8, 1.1.1.1)
   - Restarting the router

**Prevention**:
- Use a stable Internet connection
- Avoid unstable public networks
- Whitelist OpenAI in firewall if applicable

---

### RateLimited

**Message**: `Request limit reached. Wait a moment before trying again.`

**Cause**: You exceeded your OpenAI account rate limit (requests per minute/day).

**Solutions**:
1. **Immediate**: Wait 1-5 minutes before retrying
2. **Rate limit tier**:
   - Tier 1 (new): 500 RPM, 200K TPD
   - Tier 2 ($50 spent): 5K RPM, 2M TPD
   - Check your tier at [platform.openai.com/account/limits](https://platform.openai.com/account/limits)
3. **Reduce frequency**:
   - Record in longer chunks (e.g., 60 seconds instead of 30)
   - Don't generate too many images simultaneously
   - Limit AI Assistant requests
4. **Upgrade tier**:
   - Spend $50+ to move to Tier 2
   - Contact OpenAI for higher tiers if needed

**Prevention**:
- Monitor usage in the OpenAI dashboard
- Configure alerts for rate limits
- Plan sessions with breaks to avoid request spikes
- Consider higher tiers for intensive sessions

---

### Timeout

**Message**: `Request took too long. Try again later.`

**Cause**: The request to OpenAI didn't receive a response within the timeout (usually 30-60 seconds).

**Solutions**:
1. Check Internet connection (high latency?)
2. Verify OpenAI status at [status.openai.com](https://status.openai.com)
3. Retry after 1-2 minutes
4. If it persists:
   - Reduce audio chunk size
   - Reduce Journal length
   - Simplify image descriptions
5. For transcriptions:
   - Record shorter chunks (15-20 seconds instead of 30)

**Prevention**:
- Use a fast and stable Internet connection
- Don't send very large audio files
- Keep Journals and prompts concise

---

### ServerError

**Message**: `OpenAI server error. Try again later.`

**Cause**: OpenAI is experiencing technical issues on their end (errors 500, 502, 503).

**Solutions**:
1. Check [status.openai.com](https://status.openai.com) for known incidents
2. Wait 5-10 minutes
3. Retry the operation
4. If the problem persists beyond 30 minutes:
   - Report on Twitter [@OpenAIDevs](https://twitter.com/OpenAIDevs)
   - Check OpenAI community forums
5. This is not a module issue - it's temporary

**Prevention**:
- None, these are external issues
- Plan sessions with time buffer for potential downtime
- Keep local backups of transcriptions

---

### BadRequest

**Message**: `Invalid request: {details}`

**Cause**: The request to OpenAI is malformed or contains invalid parameters.

**Solutions**:
1. Read the specific error details
2. Common issues:
   - Parameters not supported by the model
   - Malformed JSON (module bug)
   - Values out of range
3. If you see this error:
   - Note the exact details
   - Open an issue on the module's GitHub
   - Include the complete error message
4. Temporary workaround:
   - Restart the panel
   - Try with simpler data (e.g., short descriptions)

**Prevention**:
- Keep the module updated (bugs get fixed)
- Report recurring errors

---

### ServiceUnavailable

**Message**: `Service temporarily unavailable. Try again in a few minutes.`

**Cause**: OpenAI services are temporarily offline or under maintenance.

**Solutions**:
1. Wait 5-10 minutes
2. Check [status.openai.com](https://status.openai.com)
3. During downtime:
   - You can still record (audio gets buffered)
   - Transcription will happen once the service is back online
4. If downtime is prolonged:
   - Export pending transcriptions
   - Consider postponing image generations
   - Use manual notes temporarily

**Prevention**:
- None, depends on OpenAI
- Plan critical sessions with a backup plan (manual notes)

---

### UnexpectedError

**Message**: `An unexpected error occurred: {message}`

**Cause**: An error not anticipated by the module.

**Solutions**:
1. Read the specific error message
2. Open the browser console (F12) and look for JavaScript errors
3. Copy the entire error message and stack trace
4. Try these steps:
   - Reload the page (F5)
   - Restart the browser
   - Disable other modules to test for conflicts
   - Try in incognito window
5. If it persists:
   - Open an issue on GitHub
   - Include: error message, steps to reproduce, Foundry version, module version

**Prevention**:
- Keep Foundry VTT and the module updated
- Report bugs promptly

---

## Journal Errors

### InvalidJournalId

**Message**: `Invalid Journal ID.`

**Cause**: The selected Journal ID is invalid or no longer exists.

**Solutions**:
1. Go to module settings
2. Open the **Adventure Journal** menu
3. Select a valid Journal from the list
4. Save settings
5. If the list is empty:
   - Create a new Journal entry in Foundry VTT
   - Add some text pages with content
   - Return to settings and select it

**Prevention**:
- Don't delete Journal entries while they're in use
- Deselect the Journal before deleting it

---

### JournalNotFound

**Message**: `Journal not found: {id}`

**Cause**: The selected Journal was deleted or is not accessible.

**Solutions**:
1. Check if the Journal still exists:
   - Open the **Journal Entries** sidebar
   - Search for the Journal by name
2. If it was deleted:
   - Select a different Journal in settings
   - Or create a new one
3. If it exists but isn't found:
   - Verify permissions (you must be GM)
   - Reload Foundry VTT
   - Check console for errors

**Prevention**:
- Make regular backups of important Journals
- Don't delete Journals during active sessions

---

### JournalEmpty

**Message**: `Selected Journal is empty.`

**Cause**: The selected Journal has no pages or all pages are empty.

**Solutions**:
1. Open the Journal in Foundry VTT
2. Add at least one page of type **Text**
3. Write relevant adventure content:
   - Main plot
   - NPCs and locations
   - Expected events
4. Save the Journal
5. The module will automatically load the new content

**Prevention**:
- Always prepare the Journal before sessions
- Keep the Journal updated with campaign progression

---

## Speaker Label Errors

### InvalidSpeaker

**Message**: `Invalid speaker ID`

**Cause**: You attempted to modify a speaker that doesn't exist in the transcription.

**Solutions**:
1. Reload the panel
2. Verify that the transcription contains speaker identifications
3. If the problem persists:
   - Clear the transcription
   - Start a new recording
   - The diarization system will recreate speakers

**Prevention**:
- Don't manually modify speaker data outside the UI

---

### InvalidLabel

**Message**: `Invalid speaker label`

**Cause**: The label provided for the speaker contains disallowed characters.

**Solutions**:
1. Use only alphanumeric characters and spaces
2. Avoid:
   - Special characters: `<>{}[]|`
   - Emojis
   - HTML
3. Valid examples:
   - "Marco" ✅
   - "Player 1" ✅
   - "GM" ✅
   - "Marco <3" ❌
   - "Player #1" ❌

**Prevention**:
- Use simple names for speakers
- Only letters, numbers, and spaces

---

### EmptyLabel

**Message**: `Label cannot be empty`

**Cause**: You attempted to assign an empty name to a speaker.

**Solutions**:
1. Enter a valid name in the field
2. Or click **Reset Name** to return to the default label (e.g., "Speaker 1")

**Prevention**:
- Always provide a name when assigning labels

---

### SaveMappingsFailed

**Message**: `Failed to save speaker mappings`

**Cause**: The system failed to save name-speaker associations.

**Solutions**:
1. Verify browser permissions for local storage
2. Check available space:
   - Open console (F12)
   - Go to **Application** > **Local Storage**
   - Check for quota errors
3. Clear old data:
   - Clear Foundry VTT local storage
   - Reconfigure settings
4. If the problem persists:
   - Try a different browser
   - Report the bug

**Prevention**:
- Periodically clear browser cache
- Don't assign labels to hundreds of speakers

---

## General Errors

### CopyFailed

**Message**: `Failed to copy to clipboard.`

**Cause**: The browser blocked access to the Clipboard API.

**Solutions**:
1. Grant clipboard permissions:
   - Click the icon in the address bar
   - Allow clipboard access
2. Manual method:
   - Select all text (Ctrl+A / Cmd+A)
   - Copy manually (Ctrl+C / Cmd+C)
3. Browser-specific:
   - **Firefox**: May require explicit confirmation
   - **Safari**: Go to Preferences > Websites > Clipboard
4. If the problem persists:
   - Export the transcription as a text file instead
   - Use **Export Transcription**

**Prevention**:
- Allow clipboard access at the first prompt
- Use the Export button for permanent backups

---

### ExportFailed

**Message**: `Transcription export failed. Try again.`

**Cause**: The browser failed to download the transcription file.

**Solutions**:
1. Check browser download permissions
2. Verify that popups are not blocked
3. Check disk space
4. Try manually:
   - Copy the transcription
   - Paste into a text editor
   - Save manually
5. If the browser blocks downloads:
   - Go to Settings > Downloads
   - Check for automatic blocks
   - Add exception for the site

**Prevention**:
- Allow downloads from the Foundry VTT site
- Check disk space regularly

---

## Warnings and Notifications

### NoContext (Off-Track)

**Message**: `No adventure context set for off-track detection.`

**Cause**: You haven't selected an adventure Journal, so the system can't detect deviations.

**Solutions**:
1. Go to module settings
2. Select a Journal in the **Adventure Journal** menu
3. Ensure the Journal contains the adventure plot
4. Off-track detection will work from the next analysis

**Note**:
- Off-track detection is optional
- You can use the module without a Journal (transcription only)

---

### ParseError (Off-Track)

**Message**: `Failed to parse off-track detection response.`

**Cause**: The AI returned a response in invalid format.

**Solutions**:
1. This is generally temporary
2. Retry after the next transcription chunk
3. If it persists:
   - Check console for errors
   - Verify that the GPT model is available
   - Might be a temporary OpenAI issue
4. The system will continue transcribing anyway

**Prevention**:
- None, it's a temporary API issue
- The module will retry automatically

---

### PlayersOffTrack

**Notification**: `Warning: Players are straying from the plot!`

**Meaning**: The system detected that the conversation is deviating from the adventure plot.

**Actions to take**:
1. **This is not an error!** It's a feature to alert you
2. Check the panel for the suggested **Narrative Bridge**
3. Decide whether to:
   - Bring players back on track using the suggestion
   - Let them explore freely
   - Adapt the plot to their direction
4. The red badge will disappear when players return on topic

**Adjusting sensitivity**:
- **Low**: Only major deviations
- **Medium**: Balanced (default)
- **High**: Even small variations

**Note**: It's a tool, not an obligation - you're always the GM!

---

## Preventive Checks

### Before Each Session

- [ ] Verify OpenAI balance (at least $2-3)
- [ ] Test microphone in other apps
- [ ] Check Internet connection
- [ ] Open Narrator Master and verify "Module ready"
- [ ] Select the current adventure Journal
- [ ] Do a 10-second test recording

### During the Session

- [ ] Monitor the audio level indicator
- [ ] Check that transcriptions appear
- [ ] Take breaks every 30-45 minutes to process
- [ ] Export transcriptions periodically (backup)

### After the Session

- [ ] Export the final transcription
- [ ] Save any important generated images
- [ ] Check OpenAI consumption for the session
- [ ] Update the Journal with session events

---

## Additional Resources

- **GitHub**: [Report bugs and request features](https://github.com/Aiacos/narrator_master/issues)
- **OpenAI Status**: [status.openai.com](https://status.openai.com)
- **OpenAI Limits**: [platform.openai.com/account/limits](https://platform.openai.com/account/limits)
- **Foundry VTT**: [foundryvtt.com/kb](https://foundryvtt.com/kb)

---

## Contact and Support

If you encounter an issue not documented here:

1. Check the browser console (F12) for errors
2. Search in [GitHub Issues](https://github.com/Aiacos/narrator_master/issues)
3. Open a new issue including:
   - Foundry VTT version
   - Narrator Master version
   - Complete error message
   - Steps to reproduce the problem
   - Console screenshots/logs

**Note**: Never include your API key in reports!
