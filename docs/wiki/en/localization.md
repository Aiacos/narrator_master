# Localization - Narrator Master

Narrator Master supports multiple languages to make the module accessible to the international Foundry VTT community.

## Supported Languages

Narrator Master is currently available in the following languages:

| Code | Language | File | Status |
|------|----------|------|--------|
| `it` | Italiano | `lang/it.json` | ✅ Complete |
| `en` | English | `lang/en.json` | ✅ Complete |
| `de` | Deutsch | `lang/de.json` | ✅ Complete |
| `es` | Español | `lang/es.json` | ✅ Complete |
| `fr` | Français | `lang/fr.json` | ✅ Complete |
| `ja` | 日本語 | `lang/ja.json` | ✅ Complete |
| `pt` | Português | `lang/pt.json` | ✅ Complete |

> **Note**: Italian (`it`) is the original language of the module. All other languages have been translated to ensure an optimal user experience.

## Localization File Structure

### Key Organization

All localization files follow the same hierarchical structure organized by category:

```json
{
    "NARRATOR": {
        "Settings": { ... },
        "Panel": { ... },
        "Errors": { ... },
        "Notifications": { ... },
        "OffTrack": { ... },
        "Suggestions": { ... },
        "Recording": { ... },
        "Journal": { ... },
        "Images": { ... },
        "Tooltips": { ... },
        "Accessibility": { ... }
    }
}
```

### Localization Categories

| Category | Purpose | Example |
|----------|---------|---------|
| `Settings` | Setting names and descriptions | `ApiKeyName`, `ApiKeyHint` |
| `Panel` | User interface elements | `StartRecording`, `GenerateImage` |
| `Errors` | Error messages | `NoApiKey`, `TranscriptionFailed` |
| `Notifications` | Toast notifications | `RecordingStarted`, `ImageGenerated` |
| `OffTrack` | Off-track detection | `Warning`, `Severe`, `Minor` |
| `Suggestions` | AI suggestion types | `TypeNarration`, `TypeDialogue` |
| `Recording` | Recording states | `StateRecording`, `StatePaused` |
| `Journal` | Journal management | `NoJournalFound`, `PageCount` |
| `Images` | Image generation | `Generating`, `ClickToEnlarge` |
| `Tooltips` | Tooltip hints | `ToggleRecording`, `CopyText` |
| `Accessibility` | Accessibility labels | `RecordButton`, `AudioLevel` |

## How to Contribute Translations

### 1. Prepare the Translation File

If you want to add a new language, start from the template file:

```bash
cp lang/template.json lang/LANGUAGE_CODE.json
```

Replace `LANGUAGE_CODE` with the appropriate ISO 639-1 code (e.g., `ko` for Korean, `ru` for Russian).

### 2. Translate the Strings

Open the file and translate all empty strings `""` into your language:

```json
{
    "NARRATOR": {
        "PanelTitle": "Narrator Master - DM Assistant",
        "Settings": {
            "ApiKeyName": "OpenAI API Key",
            ...
        }
    }
}
```

**Translation guidelines**:

- Maintain the **same professional and friendly tone** as the original
- Preserve **placeholders** like `{count}`, `{size}`, `{status}`, etc.
- Keep **HTML tags** if present (e.g., `<strong>`, `<em>`)
- Do not translate **product names** (OpenAI, Foundry VTT, Whisper, GPT)
- Use the **typographic conventions** of the target language

### 3. Test the Translation

Validate JSON syntax:

```bash
python3 -c 'import json; json.load(open("lang/LANGUAGE_CODE.json")); print("OK")'
```

### 4. Register the Language in module.json

Add your language to the `languages` array in `module.json`:

```json
{
  "lang": "LANGUAGE_CODE",
  "name": "Native Name",
  "path": "lang/LANGUAGE_CODE.json"
}
```

### 5. Test in Foundry VTT

1. Launch Foundry VTT
2. Go to **Configuration** > **Setup** > **Language**
3. Select your language
4. Reload Foundry VTT
5. Enable Narrator Master and verify that all strings are translated

### 6. Submit a Pull Request

When you are satisfied with the translation:

```bash
git add lang/LANGUAGE_CODE.json module.json
git commit -m "Add LANGUAGE translation"
git push origin your-branch-name
```

Open a Pull Request on GitHub with:
- **Title**: `Localization: Add [LANGUAGE] translation`
- **Description**: Brief description of the translation and tests performed

## Translation Conventions

### Placeholders and Variables

Some messages contain **dynamic placeholders** that are replaced at runtime:

| Placeholder | Meaning | Example |
|-------------|---------|---------|
| `{count}` | Generic number | `"{count} journals loaded"` |
| `{size}` | File size | `"File too large ({size}MB)"` |
| `{status}` | Status code | `"Error {status}"` |
| `{message}` | Error message | `"Error: {message}"` |
| `{error}` | Error name | `"Microphone error: {error}"` |
| `{id}` | Identifier | `"Journal not found: {id}"` |
| `{details}` | Additional details | `"Invalid request: {details}"` |

**IMPORTANT**: Never modify the placeholders. They must remain identical in all languages.

### Error Messages

Error messages should be:

- **Clear and informative** - Explain what went wrong
- **Action-oriented** - Suggest how to resolve the problem
- **Professional but accessible** - Avoid technical jargon when possible

Example:
```json
"NoApiKey": "OpenAI API key not configured. Go to module settings to add it."
```

### User Interface Messages

UI text should be:

- **Concise** - Short and direct
- **Imperative** - Use imperative verbs for buttons and actions
- **Consistent** - Always use the same terminology

Example:
```json
"StartRecording": "Start Recording",
"StopRecording": "Stop Recording"
```

### Notifications and Toasts

Notifications should be:

- **Brief** - Maximum 1-2 sentences
- **Positive** - Confirm the action's success
- **Informative** - Communicate what happened

Example:
```json
"RecordingStarted": "Recording started",
"ImageGenerated": "Image generated successfully"
```

## Translation Template

The `lang/template.json` file contains the **complete structure** with all empty fields:

```json
{
    "NARRATOR": {
        "PanelTitle": "",
        "Settings": {
            "ApiKeyName": "",
            "ApiKeyHint": "",
            ...
        }
    }
}
```

Use this file as a base for new translations to ensure no keys are missing.

## Localization Testing

### Automated Tests

**JSON Validation**:
```bash
python3 -c 'import json; json.load(open("lang/LANGUAGE_CODE.json")); print("OK")'
```

**Key Completeness** (compare with template):
```bash
python3 -c '
import json
template = json.load(open("lang/template.json"))
translation = json.load(open("lang/LANGUAGE_CODE.json"))

def check_keys(t, tr, path=""):
    for key in t:
        if isinstance(t[key], dict):
            check_keys(t[key], tr.get(key, {}), path + "." + key)
        elif key not in tr or not tr[key]:
            print(f"Missing or empty: {path}.{key}")

check_keys(template["NARRATOR"], translation.get("NARRATOR", {}), "NARRATOR")
'
```

### Manual Testing in Foundry VTT

1. **Select the language**:
   - Configuration > Setup > Language
   - Choose your language
   - Restart Foundry VTT

2. **Verify the interface**:
   - Open the Narrator Master panel
   - Check all labels and buttons
   - Verify tooltips

3. **Test error messages**:
   - Try to start recording without an API key
   - Verify error messages

4. **Check notifications**:
   - Perform various actions (recording, image generation)
   - Verify that toast notifications are translated

5. **Test dynamic messages**:
   - Verify that placeholders `{count}`, `{size}`, etc. are replaced correctly
   - Check grammar and agreement with dynamic values

## Translation Maintenance

### When to Update Translations

Translations should be updated when:

- **New features are added** to the module
- **Existing messages are modified** for clarity
- **Errors are corrected** in translations

### How to Identify Missing Strings

If a string is not translated, Foundry VTT displays the **localization key** instead of text:

```
NARRATOR.Errors.NewError
```

This indicates that the translation for that key is missing.

### Update Process

1. Check `lang/template.json` for new keys
2. Add the new keys to your language file
3. Translate the new strings
4. Validate JSON syntax
5. Test in Foundry VTT
6. Submit a Pull Request

## Useful Resources

### ISO 639-1 Language Codes

Use standard codes to identify languages:

| Code | Language |
|------|----------|
| `en` | English |
| `it` | Italiano |
| `de` | Deutsch |
| `es` | Español |
| `fr` | Français |
| `ja` | 日本語 |
| `pt` | Português |
| `ko` | 한국어 |
| `ru` | Русский |
| `zh` | 中文 |

### Recommended Tools

- **JSON Editor**: [Visual Studio Code](https://code.visualstudio.com/) with JSON extension
- **JSON Validators**: [JSONLint](https://jsonlint.com/)
- **Git Management**: [GitHub Desktop](https://desktop.github.com/) or command line

### Useful Links

- [Foundry VTT - Localization Guide](https://foundryvtt.com/article/localization/)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [Narrator Master - GitHub Repository](https://github.com/Aiacos/narrator_master)

## Frequently Asked Questions

### Can I translate only some strings?

No, all keys in the localization file must be translated to ensure a complete user experience. Use `template.json` as a reference.

### What do I do if a string is too long in my language?

Try to keep it concise. If necessary, use commonly accepted abbreviations in your language. The interface is designed to be flexible.

### How do I handle special characters?

JSON supports Unicode. Use native characters from your language (e.g., à, é, ñ, ü, 中, 日). Make sure the file is saved with **UTF-8** encoding.

### Can I modify an existing translation?

Yes! If you notice errors or possible improvements in existing translations, you are welcome to propose changes via Pull Request.

### How are plurals handled?

Currently, Narrator Master uses simple strings. For languages with complex plural rules, use the most common or neutral form.

## Contributing to the Community

Translations are a valuable contribution to the Foundry VTT community. Each translation helps make Narrator Master accessible to more players around the world.

**Thank you for your contribution!**

---

## Contact and Support

If you have questions about localization or need help:

- Open an [Issue on GitHub](https://github.com/Aiacos/narrator_master/issues)
- Participate in [Discussions](https://github.com/Aiacos/narrator_master/discussions)
- Check the [Main Documentation](index.md)

---

Narrator Master - Made with love for Dungeon Masters around the world 🌍
