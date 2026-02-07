# Language Switching Test Guide - Narrator Master

This document provides a comprehensive testing checklist for verifying that all 7 supported languages display correctly in Foundry VTT.

## Test Overview

**Objective**: Verify that Narrator Master displays UI text in the correct language when Foundry VTT's language setting is changed.

**Languages to Test**: 7 languages
- English (en)
- Italiano (it)
- Deutsch (de)
- Français (fr)
- Español (es)
- Português (pt)
- 日本語 (ja)

**Test Type**: Manual verification in Foundry VTT environment

---

## Prerequisites

Before starting the tests, ensure:

- [ ] Foundry VTT v13+ is installed and running
- [ ] Narrator Master module is installed
- [ ] All language files exist in `lang/` directory (en.json, it.json, de.json, fr.json, es.json, pt.json, ja.json)
- [ ] `module.json` is updated with all 7 language entries
- [ ] You have a test world where you are the GM

---

## Test Setup

### 1. Initial Setup

1. Start Foundry VTT
2. Navigate to a test world
3. Enable the Narrator Master module if not already enabled
4. Verify you are logged in as the GM (required for Narrator Master features)

### 2. Access Language Settings

**Path**: Configuration → Setup → Core Settings → Language Preference

This is where you'll change languages during testing.

---

## Testing Procedure

For **each of the 7 languages**, complete the following test checklist:

### Language Selection

- [ ] Change Foundry VTT language to the target language
- [ ] Reload/restart Foundry VTT if required
- [ ] Verify Foundry's core UI appears in the selected language

### Panel UI Elements

Open the Narrator Master panel and verify the following sections:

#### Header
- [ ] Panel title displays correctly
- [ ] Close button has proper tooltip

#### Recording Controls
- [ ] "Start Recording" / "Stop Recording" button label
- [ ] "Pause" / "Resume" button label
- [ ] Recording state text ("Recording", "Paused", "Stopped")
- [ ] Audio level indicator label

#### Main Content Area
- [ ] "Suggestions" section header
- [ ] "Transcription" section header
- [ ] Suggestion type labels (Narration, Dialogue, NPC Action, etc.)
- [ ] Empty state messages ("No suggestions yet", "No transcription yet")

#### Action Buttons
- [ ] "Generate Image" button
- [ ] "Copy Text" button
- [ ] "Clear" button
- [ ] All button tooltips on hover

#### Off-Track Warning
- [ ] Warning message text (if triggered)
- [ ] Severity levels (Minor, Warning, Severe)
- [ ] "Generate Narrative Bridge" button

### Settings Menu

Navigate to Module Settings → Narrator Master:

- [ ] "OpenAI API Key" setting name and hint
- [ ] "Selected Journal" setting name and hint
- [ ] "Auto-Generate Images" setting name and hint
- [ ] All other setting labels and descriptions

### Error Messages

Trigger common errors to verify error message localization:

#### No API Key Error
**Trigger**: Try to start recording without API key configured
- [ ] Error notification displays in correct language
- [ ] Error message is clear and actionable

#### No Journal Selected Error
**Trigger**: Try to use AI features without a journal selected
- [ ] Error notification displays in correct language
- [ ] Error message guides user to select a journal

#### Network Error (optional)
**Trigger**: Disconnect network and try API call
- [ ] Network error message displays correctly
- [ ] Retry guidance is provided

### Notifications

Trigger various actions to verify notification messages:

- [ ] "Recording started" notification
- [ ] "Recording stopped" notification
- [ ] "Transcription complete" notification
- [ ] "Image generated successfully" notification
- [ ] "Text copied to clipboard" notification

### Tooltips

Hover over interactive elements to verify tooltips:

- [ ] Recording toggle button tooltip
- [ ] Pause/Resume button tooltip
- [ ] Generate image button tooltip
- [ ] Copy text button tooltip
- [ ] Clear button tooltip
- [ ] Audio level indicator tooltip

### Accessibility Labels

Use browser inspector to verify ARIA labels (for screen reader support):

- [ ] Recording button `aria-label`
- [ ] Audio level meter `aria-label`
- [ ] Suggestion items `aria-label`
- [ ] Action buttons `aria-label`

### Dynamic Content

Verify dynamic placeholder replacement works correctly:

- [ ] Journal page count message: "Page {count}" or equivalent
- [ ] File size error: "File too large ({size}MB)"
- [ ] HTTP error: "Error {status}"
- [ ] Generic error: "Error: {message}"

**Note**: Verify that placeholder syntax `{count}`, `{size}`, etc. is **NOT** translated.

---

## Language-Specific Checklist

Use this table to track testing progress for each language:

| Test Category | en | it | de | fr | es | pt | ja |
|--------------|----|----|----|----|----|----|---- |
| Panel UI | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Settings | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Error Messages | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Notifications | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Tooltips | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Dynamic Content | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| No Missing Keys | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## Identifying Issues

### Missing Translations

If a translation is missing, Foundry VTT will display the **localization key** instead of translated text.

**Example**: `NARRATOR.Settings.ApiKeyName` instead of "OpenAI API Key"

**Action**:
1. Note the missing key
2. Check if the key exists in the language file
3. Verify the JSON syntax is valid
4. Report the issue

### Incorrect Translations

Look for:
- **Grammatical errors**: Gender agreement, verb conjugation, etc.
- **Context issues**: Translation doesn't make sense in TTRPG context
- **Inconsistent terminology**: Different terms for same concept
- **Character encoding**: Special characters display incorrectly (ñ, ü, é, 中, etc.)

**Action**: Document the issue with the specific key and suggested correction

### UI Layout Issues

Some languages use longer or shorter words than others, which may affect UI layout:

- [ ] Text doesn't overflow containers
- [ ] Buttons remain readable
- [ ] Labels aren't truncated
- [ ] Multi-line text wraps correctly

**Action**: Take a screenshot and note the language and element affected

---

## Testing Scenarios

### Scenario 1: Complete Recording Workflow

**Language**: [Test in each language]

1. Open Narrator Master panel
2. Verify "Recording" section UI
3. Click "Start Recording"
4. Verify notification message
5. Verify recording state label
6. Click "Pause"
7. Verify pause state label
8. Click "Resume"
9. Verify resume notification
10. Click "Stop Recording"
11. Verify stop notification and transcription area

**Expected**: All UI elements and notifications display in the selected language

### Scenario 2: AI Suggestion Flow

**Language**: [Test in each language]

1. Have a transcription available
2. Verify "Suggestions" section header
3. Wait for AI analysis
4. Verify suggestion type labels
5. Verify suggestion content area
6. Click "Copy Text"
7. Verify copy notification

**Expected**: All suggestion-related UI displays correctly

### Scenario 3: Off-Track Detection

**Language**: [Test in each language]

1. Trigger off-track detection (simulated or real)
2. Verify warning message displays
3. Verify severity level text
4. Click "Generate Narrative Bridge"
5. Verify button state and notification

**Expected**: Warning messages and related UI in correct language

### Scenario 4: Error Handling

**Language**: [Test in each language]

1. Remove API key from settings
2. Try to start recording
3. Verify error notification
4. Add invalid API key
5. Try to use AI features
6. Verify authentication error

**Expected**: All error messages are clear, translated, and actionable

---

## Browser Console Check

While testing, keep the browser console open (F12) and watch for:

- [ ] No JavaScript errors related to localization
- [ ] No missing translation warnings
- [ ] No undefined i18n key errors
- [ ] Proper `game.i18n.localize()` calls

**Common Issues**:
```javascript
// Bad - will show in console
console.error("Missing translation: NARRATOR.Key")

// Bad - hardcoded string
"Recording started" // Should use i18n

// Good
game.i18n.localize('NARRATOR.Notifications.RecordingStarted')
```

---

## Automated Verification Scripts

### Check Language Files Exist

```bash
for lang in en it de fr es pt ja; do
  if [ -f "lang/$lang.json" ]; then
    echo "✓ $lang.json exists"
  else
    echo "✗ $lang.json MISSING"
  fi
done
```

### Verify module.json Language Entries

```bash
python3 -c '
import json
data = json.load(open("module.json"))
langs = [l["lang"] for l in data["languages"]]
expected = ["en", "it", "de", "fr", "es", "pt", "ja"]
missing = set(expected) - set(langs)
if missing:
    print("Missing languages:", missing)
else:
    print("✓ All 7 languages registered in module.json")
'
```

### Check for Translation Key Coverage

```bash
python3 -c '
import json
from pathlib import Path

template = json.load(open("lang/template.json"))
def count_keys(d, prefix=""):
    count = 0
    for k, v in d.items():
        if isinstance(v, dict):
            count += count_keys(v, prefix + k + ".")
        else:
            count += 1
    return count

expected_keys = count_keys(template)
print(f"Expected keys per language: {expected_keys}")

for lang_file in Path("lang").glob("*.json"):
    if lang_file.name != "template.json":
        data = json.load(open(lang_file))
        actual_keys = count_keys(data)
        status = "✓" if actual_keys == expected_keys else "✗"
        print(f"{status} {lang_file.name}: {actual_keys}/{expected_keys} keys")
'
```

---

## Test Results Documentation

### Test Report Template

```markdown
# Language Switching Test Results

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Foundry VTT Version**: [Version]
**Narrator Master Version**: [Version]

## Test Summary

| Language | Status | Issues Found | Notes |
|----------|--------|--------------|-------|
| English (en) | ✓ PASS | 0 | All translations correct |
| Italiano (it) | ✓ PASS | 0 | Original language, baseline |
| Deutsch (de) | ✓ PASS | 0 | All translations correct |
| Français (fr) | ✓ PASS | 0 | All translations correct |
| Español (es) | ✓ PASS | 0 | All translations correct |
| Português (pt) | ✓ PASS | 0 | All translations correct |
| 日本語 (ja) | ✓ PASS | 0 | All translations correct |

## Issues Found

[None] or [List of issues with details]

## Recommendations

[Any suggestions for improvements]

## Screenshots

[Attach screenshots showing UI in different languages]

## Approval

- [ ] All languages verified and functional
- [ ] No missing translation keys
- [ ] No layout/UI issues
- [ ] Error messages are clear and actionable
- [ ] Ready for production release

**Signed**: [Name] - [Date]
```

---

## Troubleshooting

### Issue: Language doesn't change

**Cause**: Browser cache or Foundry cache

**Solution**:
1. Hard reload the browser (Ctrl+Shift+R)
2. Clear Foundry cache: Configuration → Support → Clear User Data Cache
3. Restart Foundry VTT

### Issue: Some text still in wrong language

**Cause**: Hardcoded strings in JavaScript

**Solution**: Review JavaScript files for hardcoded strings and replace with `game.i18n.localize()` calls

### Issue: Special characters display incorrectly

**Cause**: Encoding issue

**Solution**:
1. Verify JSON files are saved as UTF-8
2. Check `<meta charset="UTF-8">` in HTML
3. Verify web server sends correct Content-Type header

### Issue: JSON parse error

**Cause**: Invalid JSON syntax

**Solution**: Validate JSON with `python3 -c 'import json; json.load(open("lang/XX.json"))'`

---

## Best Practices for Language Testing

1. **Test systematically**: Complete all checks for one language before moving to the next
2. **Document as you go**: Note issues immediately when found
3. **Use native speakers**: When possible, have native speakers review translations
4. **Test edge cases**: Long strings, special characters, plurals
5. **Check responsiveness**: Test on different screen sizes
6. **Verify accessibility**: Use screen readers to test ARIA labels
7. **Compare with original**: Italian is the baseline - compare structure and meaning

---

## Completion Criteria

Before marking the language switching test as complete, verify:

- [ ] All 7 languages tested systematically
- [ ] No missing translation keys in any language
- [ ] No JavaScript console errors related to localization
- [ ] All error messages are translated and clear
- [ ] UI layout works correctly in all languages
- [ ] Dynamic placeholders work correctly
- [ ] Tooltips display in correct language
- [ ] Settings menu fully translated
- [ ] Test results documented
- [ ] Issues logged (if any)
- [ ] Screenshots captured for documentation

---

## Additional Resources

- [Foundry VTT Localization Guide](https://foundryvtt.com/article/localization/)
- [Narrator Master - Localization Documentation](localization.md)
- [Language Files Directory](../../lang/)
- [module.json Configuration](../../module.json)

---

**Last Updated**: 2026-02-07
**Version**: 1.0.0
**Status**: Manual verification required before production release
