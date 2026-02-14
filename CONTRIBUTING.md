# Contributing to Narrator Master

Thank you for your interest in contributing to Narrator Master! We welcome contributions from the community, whether it's translations, bug fixes, new features, or documentation improvements.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Translating to a New Language](#translating-to-a-new-language)
  - [Improving Existing Translations](#improving-existing-translations)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Contributing Code](#contributing-code)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style Guidelines](#code-style-guidelines)
- [Automated Testing](#automated-testing)
- [Testing Your Changes](#testing-your-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)

## Code of Conduct

This project follows a simple code of conduct:
- Be respectful and welcoming to all contributors
- Focus on constructive feedback
- Help create a positive environment for the TTRPG community

## How Can I Contribute?

### Translating to a New Language

We especially welcome localization contributions! Narrator Master currently supports Italian and English, with community contributions for German, French, Spanish, Portuguese, and Japanese.

**To add a new language:**

1. **Check if your language is already in progress**
   - Look in the `lang/` directory to see if a file exists for your language code
   - Check open Pull Requests to avoid duplicate work

2. **Copy the template file**
   ```bash
   cd lang/
   cp template.json xx.json  # Replace 'xx' with your language code (e.g., 'de' for German)
   ```

3. **Translate all strings**
   - Open your new `xx.json` file in a text editor
   - Translate each value while keeping the keys unchanged
   - Preserve any placeholders like `{count}`, `{name}`, etc.
   - Keep formatting characters like newlines (`\n`) intact

4. **Language codes to use:**
   | Language | Code | File Name |
   |----------|------|-----------|
   | German | de | `de.json` |
   | French | fr | `fr.json` |
   | Spanish | es | `es.json` |
   | Portuguese | pt | `pt.json` |
   | Japanese | ja | `ja.json` |
   | Chinese (Simplified) | zh-cn | `zh-cn.json` |
   | Russian | ru | `ru.json` |
   | Polish | pl | `pl.json` |
   | Korean | ko | `ko.json` |

5. **Update module.json**
   - Add your language to the `languages` array in `module.json`:
   ```json
   {
     "lang": "xx",
     "name": "Your Language Name",
     "path": "lang/xx.json",
     "flags": {}
   }
   ```

6. **Test your translation**
   - Follow the [Development Setup](#development-setup) instructions
   - Enable the module in Foundry VTT
   - Change Foundry's language to your new language
   - Verify all UI elements display correctly
   - Check for text overflow or truncation issues

7. **Submit your translation**
   - Create a Pull Request with your changes
   - Include screenshots showing the translated UI
   - Mention any translation choices or cultural adaptations you made

**Translation Guidelines:**

- **Tone**: Keep the tone helpful and professional, appropriate for DMs during game sessions
- **Technical Terms**: Preserve technical terms like "API", "OpenAI", "Whisper", "Journal" when appropriate for your language
- **Length**: Try to keep translations reasonably close in length to the original to avoid UI layout issues
- **Context**: If a string is unclear, check `templates/panel.hbs` or the JavaScript files to see where it's used
- **Placeholders**: Never translate text inside curly braces like `{count}` or `{name}` - these are replaced dynamically

**Example translation (Italian → German):**
```json
"StartRecording": "Avvia Registrazione"  // Italian
"StartRecording": "Aufnahme starten"     // German
```

### Improving Existing Translations

Found a better translation or a mistake? We welcome improvements!

1. Fork the repository
2. Edit the appropriate `lang/xx.json` file
3. Explain your changes in the Pull Request description
4. If possible, provide context for why the new translation is better

### Reporting Bugs

Before creating a bug report:
- Check the [existing issues](https://github.com/Aiacos/narrator_master/issues) to avoid duplicates
- Test with the latest version of the module
- Verify the issue persists with only Narrator Master enabled (disable other modules)

**When reporting a bug, include:**
- Foundry VTT version
- Narrator Master version
- Browser and operating system
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser console errors (F12 → Console tab)
- Screenshots if applicable

### Suggesting Features

We welcome feature suggestions! Please:
- Check [existing feature requests](https://github.com/Aiacos/narrator_master/issues?q=is%3Aissue+label%3Aenhancement) first
- Open a GitHub Issue with the "enhancement" label
- Describe the use case and how it would improve DM sessions
- Consider whether it fits within the module's scope

### Contributing Code

**Good first contributions:**
- Fixing typos or improving documentation
- Adding translations (see above)
- Fixing bugs with clear reproduction steps
- Improving error messages or UI clarity

**Before starting major work:**
- Open an issue to discuss your approach
- Get feedback from maintainers
- Ensure it aligns with the project's goals

## Development Setup

### Prerequisites

- Foundry VTT v13 or higher installed
- Modern web browser (Chrome recommended for testing)
- Git installed
- OpenAI API key (for testing AI features)

### Setup Steps

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/narrator_master.git
   cd narrator_master
   ```

2. **Create a symlink to your Foundry modules directory**
   ```bash
   # Linux/macOS
   ln -s "$(pwd)" ~/.local/share/FoundryVTT/Data/modules/narrator-master

   # Windows (Administrator Command Prompt)
   mklink /D "%localappdata%\FoundryVTT\Data\modules\narrator-master" "C:\path\to\narrator_master"
   ```

3. **Enable the module in Foundry VTT**
   - Launch Foundry VTT
   - Create or open a game world
   - Go to **Game Settings** > **Manage Modules**
   - Check **Narrator Master**
   - Click **Save Module Settings**

4. **Configure your API key**
   - Go to **Game Settings** > **Configure Settings** > **Module Settings**
   - Find **Narrator Master**
   - Enter your OpenAI API key

5. **Make your changes**
   - Edit files in your local repository
   - Refresh Foundry VTT (F5) to reload the module

6. **Test thoroughly**
   - Test all affected functionality
   - Check browser console for errors (F12 → Console)
   - Test with both GM and player accounts if applicable

## Project Structure

```
./
├── module.json              # Foundry VTT module manifest
├── LICENSE                  # MIT License
├── README.md                # User documentation
├── CONTRIBUTING.md          # This file
├── scripts/
│   ├── main.js             # Entry point, NarratorMaster controller
│   ├── settings.js         # Module settings registration
│   ├── audio-capture.js    # Browser audio recording (MediaRecorder API)
│   ├── transcription.js    # OpenAI Whisper API integration
│   ├── journal-parser.js   # Foundry Journal content extraction
│   ├── ai-assistant.js     # OpenAI GPT-4o-mini integration
│   ├── image-generator.js  # OpenAI image generation
│   └── ui-panel.js         # Foundry Application UI class
├── styles/
│   └── narrator-master.css # All module styling
├── templates/
│   └── panel.hbs           # Handlebars template for DM panel
└── lang/
    ├── template.json       # Template for new translations
    ├── en.json             # English localization
    ├── it.json             # Italian localization (original)
    ├── de.json             # German localization
    ├── fr.json             # French localization
    ├── es.json             # Spanish localization
    ├── pt.json             # Portuguese localization
    └── ja.json             # Japanese localization
```

### Key Files for Contributors

| File | Purpose | When to Modify |
|------|---------|----------------|
| `lang/*.json` | UI text translations | Adding/improving localizations |
| `module.json` | Module manifest | Adding languages, updating version |
| `README.md` | User documentation | Improving installation/usage docs |
| `scripts/*.js` | Module functionality | Bug fixes, new features |
| `styles/narrator-master.css` | UI styling | Visual improvements |
| `templates/panel.hbs` | UI structure | Changing panel layout |

## Code Style Guidelines

### JavaScript

- **ES6 Modules**: Use `import`/`export` syntax
- **Classes**: PascalCase (e.g., `AudioCapture`, `TranscriptionService`)
- **Functions/Methods**: camelCase (e.g., `startRecording`, `analyzeContext`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MODULE_ID`, `API_BASE_URL`)
- **Private Methods**: Prefix with underscore (e.g., `_handleApiError`)
- **JSDoc**: Document all classes and public methods

**Example:**
```javascript
/**
 * Handles audio transcription via OpenAI Whisper API
 */
class TranscriptionService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Transcribe an audio blob
     * @param {Blob} audioBlob - The audio data to transcribe
     * @returns {Promise<Object>} Transcription result with speaker labels
     */
    async transcribe(audioBlob) {
        // Implementation
    }

    /**
     * Internal error handler
     * @private
     */
    _handleApiError(response) {
        // Implementation
    }
}
```

### Foundry VTT Patterns

- Use `game.i18n.localize()` for all user-facing strings
- Access settings via `game.settings.get/set()`
- Check `game.user.isGM` for GM-only features
- Extend `Application` class for UI panels
- Use Foundry's notification system: `ui.notifications.error/warn/info()`

### File Organization

- One class per file
- File names match class names in kebab-case (e.g., `AudioCapture` → `audio-capture.js`)
- Group related functionality together
- Keep functions focused and single-purpose

### No Console Pollution

- **Never use** `console.log()` in production code
- Use `console.warn()` for important warnings
- Use `console.error()` for errors
- Remove debug statements before committing

### Error Handling

- Use try-catch for async operations
- Provide helpful error messages
- Use centralized error notification helper when available
- Always localize error messages

## Automated Testing

Narrator Master uses a comprehensive test suite to ensure code quality and prevent regressions. Before submitting changes, run the automated tests to verify your code meets project standards.

### Running Tests

**Run all tests:**
```bash
npm test
```

This executes the custom test runner (`tests/run-tests.js`) which includes:
- Unit tests for all service classes
- Browser API mocking (MediaRecorder, AudioContext, etc.)
- Foundry VTT API simulation
- OpenAI API integration tests

**Run tests in watch mode:**
```bash
npm run test:watch
```

Automatically re-runs tests when files change. Useful during active development.

**Run tests with coverage report:**
```bash
npm run test:coverage
```

Generates a detailed coverage report showing which lines/branches are tested. The report is saved to `coverage/` directory and displayed in the terminal.

### Code Quality Checks

**Linting (ESLint):**
```bash
npm run lint              # Check for linting errors
npm run lint:fix          # Automatically fix linting issues
```

ESLint enforces code style, catches common errors, and ensures consistent patterns. Configuration is in `package.json` under `eslintConfig`.

**Formatting (Prettier):**
```bash
npm run format            # Format all JS files
npm run format:check      # Check if files are formatted correctly
```

Prettier ensures consistent code formatting (indentation, quotes, line length, etc.). Configuration is in `package.json` under `prettier`.

**Full validation:**
```bash
npm run validate
```

Runs linting, format checking, and tests in sequence. **Run this before committing** to ensure your changes pass all quality gates.

### Test Coverage

Current test coverage includes:
- ✓ AudioCapture (50 tests) - Browser audio recording, MediaRecorder API, permission handling
- ✓ AIAssistant (61 tests) - OpenAI GPT integration, suggestions, off-track detection
- ✓ ImageGenerator (54 tests) - Image generation, caching, gallery management
- ✓ UI Panel (47 tests) - Foundry Application UI, event handlers, state management
- ✓ SessionAnalytics (36 tests) - Session tracking, statistics, export
- ✓ SceneDetector (40 tests) - Scene break detection, narrative analysis
- ✓ RulesReferenceService (21 tests) - Rules lookup, Q&A management

See `COVERAGE-REPORT.md` for detailed coverage metrics and test suite documentation.

### Writing Tests

When adding new features or fixing bugs, include tests:

**Test file naming:**
- Place tests in `tests/` directory
- Name test files `*.test.js` (e.g., `audio-capture.test.js`)

**Test structure:**
```javascript
import { TestRunner } from './test-helper.js';

const runner = new TestRunner('YourFeatureName');

// Test initialization
runner.test('should initialize with default options', () => {
    const instance = new YourClass();
    runner.assert(instance !== null, 'Instance should be created');
});

// Test functionality
runner.test('should handle errors gracefully', () => {
    const instance = new YourClass();
    // ... test code ...
});

// Run all tests
runner.run();
```

**Test best practices:**
- Test both success and error cases
- Mock external APIs (OpenAI, Foundry VTT, browser APIs)
- Use descriptive test names
- Keep tests focused and isolated
- Verify error messages are localized

### Continuous Integration

All pull requests automatically run:
- ✓ ESLint validation
- ✓ Prettier formatting check
- ✓ Full test suite

PRs cannot be merged until all checks pass. Fix any failures before requesting review.

## Testing Your Changes

### Manual Testing Checklist

For **localization changes**:
- [ ] All UI text displays correctly in the new language
- [ ] No text is cut off or overflows containers
- [ ] Placeholders like `{count}` are replaced correctly
- [ ] Error messages appear properly localized
- [ ] Settings panel shows translated labels and hints
- [ ] Test with both short and long text strings

For **code changes**:
- [ ] Module loads without errors in browser console
- [ ] Changed functionality works as expected
- [ ] No regressions in existing features
- [ ] Works for both GM and player perspectives (if applicable)
- [ ] Error cases are handled gracefully
- [ ] UI updates correctly

### Testing in Foundry VTT

1. **Enable detailed logging**
   - Open browser console (F12)
   - Watch for errors or warnings

2. **Test the full workflow**
   - Open the DM panel
   - Start a recording
   - Generate suggestions
   - Create an image
   - Test error cases (no API key, network errors, etc.)

3. **Test with minimal configuration**
   - Disable other modules
   - Use a fresh world
   - Verify it works standalone

### Validation Tools

**Syntax check:**
```bash
find scripts -name '*.js' -exec node --check {} \;
```

**JSON validation:**
```bash
python3 -c 'import json, sys; json.load(sys.stdin)' < lang/xx.json && echo "Valid JSON"
```

**Check for missing translations:**
```bash
# Compare your translation file with the template
diff <(jq -S 'keys' lang/template.json) <(jq -S 'keys' lang/xx.json)
```

## Submitting a Pull Request

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-contribution
   # OR for translations:
   git checkout -b localization/german
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Test thoroughly
   - Update documentation if needed

3. **Commit with clear messages**
   ```bash
   git add .
   git commit -m "Add German localization"
   # OR
   git commit -m "Fix audio capture on Firefox"
   ```

   **Good commit messages:**
   - "Add French localization (fr.json)"
   - "Fix microphone permission error on Safari"
   - "Improve error handling in TranscriptionService"
   - "Update README with troubleshooting for Windows users"

   **Bad commit messages:**
   - "Fixed stuff"
   - "Update"
   - "WIP"

4. **Push to your fork**
   ```bash
   git push origin feature/my-contribution
   ```

### Creating the Pull Request

1. Go to [GitHub](https://github.com/Aiacos/narrator_master) and click **New Pull Request**
2. Select your branch
3. Fill out the PR template:

   **For translations:**
   ```markdown
   ## Description
   Added German (de) localization for all UI strings.

   ## Type of Change
   - [x] Localization/Translation
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation

   ## Testing
   - [x] Tested in Foundry VTT v13
   - [x] All UI elements display correctly
   - [x] No text overflow issues
   - [x] Screenshots attached

   ## Screenshots
   [Attach screenshots of the translated UI]

   ## Translation Notes
   - Used formal "Sie" form for consistency with German TTRPG conventions
   - Kept "Journal" untranslated as it's a Foundry VTT technical term
   ```

   **For code changes:**
   ```markdown
   ## Description
   Fixed audio capture failing on Firefox due to MIME type incompatibility.

   ## Type of Change
   - [ ] Localization/Translation
   - [x] Bug fix
   - [ ] New feature
   - [ ] Documentation

   ## Testing
   - [x] Tested on Firefox 122
   - [x] Tested on Chrome 122
   - [x] No console errors
   - [x] Audio recording works correctly

   ## Changes Made
   - Added MIME type fallback in audio-capture.js
   - Improved error message when no compatible format available
   ```

4. **Wait for review**
   - Maintainers will review your PR
   - Be responsive to feedback
   - Make requested changes if needed

5. **Celebrate!** 🎉
   - Once merged, your contribution is part of Narrator Master
   - You'll be credited in the commit history

### PR Guidelines

- Keep PRs focused on a single change
- Don't bundle unrelated changes together
- Respond to review comments promptly
- Be open to feedback and suggestions
- Update your PR if requirements change

## Questions?

- **General questions**: [GitHub Discussions](https://github.com/Aiacos/narrator_master/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/Aiacos/narrator_master/issues)
- **Translation help**: Tag your issue with "localization"

## Recognition

All contributors will be recognized in:
- Git commit history
- GitHub contributors page
- Future changelog updates

Thank you for helping make Narrator Master better for the global TTRPG community! 🎲
