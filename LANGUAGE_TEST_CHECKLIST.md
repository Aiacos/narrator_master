# Language Switching Test - Quick Checklist

Use this quick reference to verify language switching in Foundry VTT.

## Setup
- [ ] Foundry VTT v13+ running
- [ ] Narrator Master module enabled
- [ ] Logged in as GM
- [ ] Test world loaded

## For Each Language: EN, IT, DE, FR, ES, PT, JA

### 1. Language Switch
- [ ] Change Foundry language setting to target language
- [ ] Reload Foundry VTT
- [ ] Foundry core UI displays in selected language

### 2. Panel UI (Open Narrator Master panel)
- [ ] Panel title correct
- [ ] Recording buttons ("Start", "Stop", "Pause", "Resume")
- [ ] Recording state text
- [ ] Section headers ("Suggestions", "Transcription")
- [ ] Audio level indicator label
- [ ] All button labels
- [ ] Empty state messages

### 3. Settings (Module Settings → Narrator Master)
- [ ] "OpenAI API Key" - name and hint
- [ ] "Selected Journal" - name and hint
- [ ] "Auto-Generate Images" - name and hint
- [ ] All settings display correctly

### 4. Error Messages (Trigger errors)
- [ ] No API key error (try recording without key)
- [ ] No journal error (try AI features without journal)
- [ ] Error messages clear and actionable

### 5. Notifications (Trigger actions)
- [ ] Recording started notification
- [ ] Recording stopped notification
- [ ] Text copied notification
- [ ] All notifications in correct language

### 6. Tooltips (Hover over elements)
- [ ] Recording button tooltip
- [ ] Generate image button tooltip
- [ ] Copy text button tooltip
- [ ] All tooltips correct

### 7. Check for Issues
- [ ] No missing translations (no "NARRATOR.Key" shown)
- [ ] No text overflow or truncation
- [ ] Special characters display correctly
- [ ] No JavaScript console errors
- [ ] Placeholders like {count} work correctly

## Language Test Progress

| Language | Status | Issues | Notes |
|----------|--------|--------|-------|
| English (en) | ☐ | | |
| Italiano (it) | ☐ | | |
| Deutsch (de) | ☐ | | |
| Français (fr) | ☐ | | |
| Español (es) | ☐ | | |
| Português (pt) | ☐ | | |
| 日本語 (ja) | ☐ | | |

## Quick Verification Commands

### Verify all language files exist
```bash
ls -1 lang/*.json | grep -E "(en|it|de|fr|es|pt|ja).json"
# Should show 7 files
```

### Validate JSON syntax
```bash
for f in lang/{en,it,de,fr,es,pt,ja}.json; do
  python3 -c "import json; json.load(open('$f'))" && echo "✓ $f OK"
done
```

### Check module.json registration
```bash
python3 -c 'import json; langs=[l["lang"] for l in json.load(open("module.json"))["languages"]]; print("✓ All registered" if set(langs)=={"en","it","de","fr","es","pt","ja"} else f"Missing: {set([\"en\",\"it\",\"de\",\"fr\",\"es\",\"pt\",\"ja\"])-set(langs)}")'
```

## Sign-Off

- [ ] All 7 languages tested and verified
- [ ] No missing translation keys
- [ ] No console errors
- [ ] UI displays correctly in all languages
- [ ] Ready for production

**Tested by**: ________________
**Date**: ________________
**Foundry Version**: ________________
**Module Version**: ________________
