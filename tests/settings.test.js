/**
 * Unit Tests for Settings Module
 * Tests settings registration and SettingsManager functionality
 * @module tests/settings
 */

import { setupMockGame, cleanupMocks, assert, TestRunner } from './test-helper.js';

// Note: We need to set up mocks before importing the module
let MODULE_ID, SETTINGS, registerSettings, SettingsManager;

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();

    // Dynamic import after mocks are set up
    const module = await import('../scripts/settings.js');
    MODULE_ID = module.MODULE_ID;
    SETTINGS = module.SETTINGS;
    registerSettings = module.registerSettings;
    SettingsManager = module.SettingsManager;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Run all Settings tests
 */
export async function runTests() {
    const runner = new TestRunner('Settings Tests');

    // Test: MODULE_ID is correctly defined
    runner.test('MODULE_ID is correctly defined', async () => {
        await setup();

        assert.equal(MODULE_ID, 'narrator-master', 'MODULE_ID should be narrator-master');

        teardown();
    });

    // Test: SETTINGS constants are defined
    runner.test('SETTINGS constants are all defined', async () => {
        await setup();

        assert.ok(SETTINGS.OPENAI_API_KEY, 'OPENAI_API_KEY should be defined');
        assert.ok(SETTINGS.SELECTED_JOURNAL, 'SELECTED_JOURNAL should be defined');
        assert.ok(SETTINGS.AUTO_START_RECORDING, 'AUTO_START_RECORDING should be defined');
        assert.ok(SETTINGS.TRANSCRIPTION_LANGUAGE, 'TRANSCRIPTION_LANGUAGE should be defined');
        assert.ok(SETTINGS.PANEL_POSITION, 'PANEL_POSITION should be defined');
        assert.ok(SETTINGS.SHOW_SPEAKER_LABELS, 'SHOW_SPEAKER_LABELS should be defined');
        assert.ok(SETTINGS.OFF_TRACK_SENSITIVITY, 'OFF_TRACK_SENSITIVITY should be defined');

        teardown();
    });

    // Test: SETTINGS constants have correct values
    runner.test('SETTINGS constants have expected values', async () => {
        await setup();

        assert.equal(SETTINGS.OPENAI_API_KEY, 'openaiApiKey', 'OPENAI_API_KEY value');
        assert.equal(SETTINGS.SELECTED_JOURNAL, 'selectedJournal', 'SELECTED_JOURNAL value');
        assert.equal(
            SETTINGS.AUTO_START_RECORDING,
            'autoStartRecording',
            'AUTO_START_RECORDING value'
        );
        assert.equal(
            SETTINGS.TRANSCRIPTION_LANGUAGE,
            'transcriptionLanguage',
            'TRANSCRIPTION_LANGUAGE value'
        );
        assert.equal(SETTINGS.PANEL_POSITION, 'panelPosition', 'PANEL_POSITION value');
        assert.equal(
            SETTINGS.SHOW_SPEAKER_LABELS,
            'showSpeakerLabels',
            'SHOW_SPEAKER_LABELS value'
        );
        assert.equal(
            SETTINGS.OFF_TRACK_SENSITIVITY,
            'offTrackSensitivity',
            'OFF_TRACK_SENSITIVITY value'
        );

        teardown();
    });

    // Test: registerSettings registers all settings
    runner.test('registerSettings registers all required settings', async () => {
        await setup();

        registerSettings();

        // Check that all settings were registered
        const registeredKeys = [
            SETTINGS.OPENAI_API_KEY,
            SETTINGS.SELECTED_JOURNAL,
            SETTINGS.AUTO_START_RECORDING,
            SETTINGS.TRANSCRIPTION_LANGUAGE,
            SETTINGS.PANEL_POSITION,
            SETTINGS.SHOW_SPEAKER_LABELS,
            SETTINGS.OFF_TRACK_SENSITIVITY
        ];

        for (const key of registeredKeys) {
            const config = game.settings.getRegistered(MODULE_ID, key);
            assert.ok(config, `Setting ${key} should be registered`);
        }

        teardown();
    });

    // Test: registerSettings sets correct default for API key
    runner.test('registerSettings sets empty string default for API key', async () => {
        await setup();

        registerSettings();

        const value = game.settings.get(MODULE_ID, SETTINGS.OPENAI_API_KEY);
        assert.equal(value, '', 'API key default should be empty string');

        teardown();
    });

    // Test: registerSettings sets correct default for language
    runner.test('registerSettings sets Italian as default language', async () => {
        await setup();

        registerSettings();

        const value = game.settings.get(MODULE_ID, SETTINGS.TRANSCRIPTION_LANGUAGE);
        assert.equal(value, 'it', 'Default language should be Italian');

        teardown();
    });

    // Test: registerSettings sets correct default for auto-start
    runner.test('registerSettings sets false default for auto-start recording', async () => {
        await setup();

        registerSettings();

        const value = game.settings.get(MODULE_ID, SETTINGS.AUTO_START_RECORDING);
        assert.equal(value, false, 'Auto-start should default to false');

        teardown();
    });

    // Test: registerSettings sets correct default for speaker labels
    runner.test('registerSettings sets true default for speaker labels', async () => {
        await setup();

        registerSettings();

        const value = game.settings.get(MODULE_ID, SETTINGS.SHOW_SPEAKER_LABELS);
        assert.equal(value, true, 'Show speaker labels should default to true');

        teardown();
    });

    // Test: registerSettings sets correct default for sensitivity
    runner.test('registerSettings sets medium default for off-track sensitivity', async () => {
        await setup();

        registerSettings();

        const value = game.settings.get(MODULE_ID, SETTINGS.OFF_TRACK_SENSITIVITY);
        assert.equal(value, 'medium', 'Sensitivity should default to medium');

        teardown();
    });

    // Test: registerSettings sets correct default for panel position
    runner.test('registerSettings sets correct default for panel position', async () => {
        await setup();

        registerSettings();

        const value = game.settings.get(MODULE_ID, SETTINGS.PANEL_POSITION);
        assert.deepEqual(
            value,
            { top: 100, left: 100 },
            'Panel position should have default coordinates'
        );

        teardown();
    });

    // Test: Settings have correct types registered
    runner.test('settings have correct types registered', async () => {
        await setup();

        registerSettings();

        const apiKeyConfig = game.settings.getRegistered(MODULE_ID, SETTINGS.OPENAI_API_KEY);
        assert.equal(apiKeyConfig.type, String, 'API key should be String type');

        const autoStartConfig = game.settings.getRegistered(
            MODULE_ID,
            SETTINGS.AUTO_START_RECORDING
        );
        assert.equal(autoStartConfig.type, Boolean, 'Auto-start should be Boolean type');

        const languageConfig = game.settings.getRegistered(
            MODULE_ID,
            SETTINGS.TRANSCRIPTION_LANGUAGE
        );
        assert.equal(languageConfig.type, String, 'Language should be String type');

        teardown();
    });

    // Test: Settings have correct scope
    runner.test('settings have correct scope (world vs client)', async () => {
        await setup();

        registerSettings();

        // World-scoped settings (GM only)
        const worldSettings = [
            SETTINGS.OPENAI_API_KEY,
            SETTINGS.SELECTED_JOURNAL,
            SETTINGS.AUTO_START_RECORDING,
            SETTINGS.TRANSCRIPTION_LANGUAGE,
            SETTINGS.SHOW_SPEAKER_LABELS,
            SETTINGS.OFF_TRACK_SENSITIVITY
        ];

        for (const key of worldSettings) {
            const config = game.settings.getRegistered(MODULE_ID, key);
            assert.equal(config.scope, 'world', `${key} should be world-scoped`);
        }

        // Client-scoped settings (per user)
        const panelConfig = game.settings.getRegistered(MODULE_ID, SETTINGS.PANEL_POSITION);
        assert.equal(panelConfig.scope, 'client', 'Panel position should be client-scoped');

        teardown();
    });

    // Test: Language setting has choices
    runner.test('language setting has language choices', async () => {
        await setup();

        registerSettings();

        const config = game.settings.getRegistered(MODULE_ID, SETTINGS.TRANSCRIPTION_LANGUAGE);
        assert.ok(config.choices, 'Language should have choices');
        assert.ok(config.choices.it, 'Should have Italian option');
        assert.ok(config.choices.en, 'Should have English option');
        assert.ok(config.choices.de, 'Should have German option');
        assert.ok(config.choices.fr, 'Should have French option');
        assert.ok(config.choices.es, 'Should have Spanish option');

        teardown();
    });

    // Test: Sensitivity setting has choices
    runner.test('sensitivity setting has choices', async () => {
        await setup();

        registerSettings();

        const config = game.settings.getRegistered(MODULE_ID, SETTINGS.OFF_TRACK_SENSITIVITY);
        assert.ok(config.choices, 'Sensitivity should have choices');
        assert.ok(config.choices.low, 'Should have low option');
        assert.ok(config.choices.medium, 'Should have medium option');
        assert.ok(config.choices.high, 'Should have high option');

        teardown();
    });

    // Test: SettingsManager constructor creates instance
    runner.test('SettingsManager constructor creates instance', async () => {
        await setup();

        registerSettings();
        const manager = new SettingsManager();

        assert.ok(manager, 'Should create SettingsManager instance');
        assert.ok(manager._cache instanceof Map, 'Should have cache Map');

        teardown();
    });

    // Test: SettingsManager.getApiKey returns API key
    runner.test('SettingsManager.getApiKey returns API key', async () => {
        await setup();

        registerSettings();
        await game.settings.set(MODULE_ID, SETTINGS.OPENAI_API_KEY, 'test-key-123');

        const manager = new SettingsManager();
        const apiKey = manager.getApiKey();

        assert.equal(apiKey, 'test-key-123', 'Should return stored API key');

        teardown();
    });

    // Test: SettingsManager.setApiKey updates API key
    runner.test('SettingsManager.setApiKey updates API key', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();
        await manager.setApiKey('new-api-key');

        const value = game.settings.get(MODULE_ID, SETTINGS.OPENAI_API_KEY);
        assert.equal(value, 'new-api-key', 'Should update API key');

        teardown();
    });

    // Test: SettingsManager.getSelectedJournal returns journal ID
    runner.test('SettingsManager.getSelectedJournal returns journal ID', async () => {
        await setup();

        registerSettings();
        await game.settings.set(MODULE_ID, SETTINGS.SELECTED_JOURNAL, 'journal-abc');

        const manager = new SettingsManager();
        const journalId = manager.getSelectedJournal();

        assert.equal(journalId, 'journal-abc', 'Should return stored journal ID');

        teardown();
    });

    // Test: SettingsManager.setSelectedJournal updates journal ID
    runner.test('SettingsManager.setSelectedJournal updates journal ID', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();
        await manager.setSelectedJournal('new-journal-id');

        const value = game.settings.get(MODULE_ID, SETTINGS.SELECTED_JOURNAL);
        assert.equal(value, 'new-journal-id', 'Should update journal ID');

        teardown();
    });

    // Test: SettingsManager.getAutoStartRecording returns boolean
    runner.test('SettingsManager.getAutoStartRecording returns boolean', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();
        const autoStart = manager.getAutoStartRecording();

        assert.equal(autoStart, false, 'Should return default false');

        teardown();
    });

    // Test: SettingsManager.getTranscriptionLanguage returns language code
    runner.test('SettingsManager.getTranscriptionLanguage returns language code', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();
        const language = manager.getTranscriptionLanguage();

        assert.equal(language, 'it', 'Should return default Italian');

        teardown();
    });

    // Test: SettingsManager.getPanelPosition returns position object
    runner.test('SettingsManager.getPanelPosition returns position object', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();
        const position = manager.getPanelPosition();

        assert.ok(position.top !== undefined, 'Should have top property');
        assert.ok(position.left !== undefined, 'Should have left property');

        teardown();
    });

    // Test: SettingsManager.setPanelPosition updates position
    runner.test('SettingsManager.setPanelPosition updates position', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();
        await manager.setPanelPosition({ top: 200, left: 300 });

        const position = game.settings.get(MODULE_ID, SETTINGS.PANEL_POSITION);
        assert.equal(position.top, 200, 'Top should be updated');
        assert.equal(position.left, 300, 'Left should be updated');

        teardown();
    });

    // Test: SettingsManager.getShowSpeakerLabels returns boolean
    runner.test('SettingsManager.getShowSpeakerLabels returns boolean', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();
        const showLabels = manager.getShowSpeakerLabels();

        assert.equal(showLabels, true, 'Should return default true');

        teardown();
    });

    // Test: SettingsManager.getOffTrackSensitivity returns sensitivity level
    runner.test('SettingsManager.getOffTrackSensitivity returns sensitivity level', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();
        const sensitivity = manager.getOffTrackSensitivity();

        assert.equal(sensitivity, 'medium', 'Should return default medium');

        teardown();
    });

    // Test: SettingsManager.isApiKeyConfigured returns correct boolean
    runner.test('SettingsManager.isApiKeyConfigured returns correct boolean', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();

        // No API key set
        assert.equal(manager.isApiKeyConfigured(), false, 'Should return false when empty');

        // With API key
        await game.settings.set(MODULE_ID, SETTINGS.OPENAI_API_KEY, 'valid-key');
        assert.equal(manager.isApiKeyConfigured(), true, 'Should return true with key');

        // With whitespace only
        await game.settings.set(MODULE_ID, SETTINGS.OPENAI_API_KEY, '   ');
        assert.equal(manager.isApiKeyConfigured(), false, 'Should return false for whitespace');

        teardown();
    });

    // Test: SettingsManager.isJournalSelected returns correct boolean
    runner.test('SettingsManager.isJournalSelected returns correct boolean', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();

        // No journal selected
        assert.equal(manager.isJournalSelected(), false, 'Should return false when empty');

        // With journal
        await game.settings.set(MODULE_ID, SETTINGS.SELECTED_JOURNAL, 'journal-id');
        assert.equal(manager.isJournalSelected(), true, 'Should return true with journal');

        teardown();
    });

    // Test: SettingsManager.validateConfiguration returns validation result
    runner.test('SettingsManager.validateConfiguration returns validation result', async () => {
        await setup();

        registerSettings();

        const manager = new SettingsManager();

        // Invalid - no API key or journal
        let result = manager.validateConfiguration();
        assert.equal(result.valid, false, 'Should be invalid without config');
        assert.ok(result.errors.length > 0, 'Should have errors');

        // Add API key
        await game.settings.set(MODULE_ID, SETTINGS.OPENAI_API_KEY, 'api-key');
        result = manager.validateConfiguration();
        assert.equal(result.valid, false, 'Should still be invalid without journal');

        // Add journal
        await game.settings.set(MODULE_ID, SETTINGS.SELECTED_JOURNAL, 'journal-id');
        result = manager.validateConfiguration();
        assert.equal(result.valid, true, 'Should be valid with both');
        assert.equal(result.errors.length, 0, 'Should have no errors');

        teardown();
    });

    // Test: SettingsManager.getAllSettings returns all settings
    runner.test('SettingsManager.getAllSettings returns all settings object', async () => {
        await setup();

        registerSettings();
        await game.settings.set(MODULE_ID, SETTINGS.OPENAI_API_KEY, 'test-key');
        await game.settings.set(MODULE_ID, SETTINGS.SELECTED_JOURNAL, 'test-journal');

        const manager = new SettingsManager();
        const all = manager.getAllSettings();

        assert.ok(Object.hasOwn(all, 'apiKey'), 'Should have apiKey');
        assert.ok(Object.hasOwn(all, 'selectedJournal'), 'Should have selectedJournal');
        assert.ok(Object.hasOwn(all, 'autoStartRecording'), 'Should have autoStartRecording');
        assert.ok(Object.hasOwn(all, 'transcriptionLanguage'), 'Should have transcriptionLanguage');
        assert.ok(Object.hasOwn(all, 'panelPosition'), 'Should have panelPosition');
        assert.ok(Object.hasOwn(all, 'showSpeakerLabels'), 'Should have showSpeakerLabels');
        assert.ok(Object.hasOwn(all, 'offTrackSensitivity'), 'Should have offTrackSensitivity');

        assert.equal(all.apiKey, 'test-key', 'API key should match');
        assert.equal(all.selectedJournal, 'test-journal', 'Journal should match');

        teardown();
    });

    // Test: Settings have localization keys
    runner.test('settings have localization keys for name and hint', async () => {
        await setup();

        registerSettings();

        const settingsToCheck = [
            SETTINGS.OPENAI_API_KEY,
            SETTINGS.SELECTED_JOURNAL,
            SETTINGS.AUTO_START_RECORDING,
            SETTINGS.TRANSCRIPTION_LANGUAGE,
            SETTINGS.SHOW_SPEAKER_LABELS,
            SETTINGS.OFF_TRACK_SENSITIVITY
        ];

        for (const key of settingsToCheck) {
            const config = game.settings.getRegistered(MODULE_ID, key);
            assert.ok(config.name, `${key} should have name`);
            assert.ok(config.hint, `${key} should have hint`);
            assert.ok(
                config.name.startsWith('NARRATOR.'),
                `${key} name should use NARRATOR namespace`
            );
            assert.ok(
                config.hint.startsWith('NARRATOR.'),
                `${key} hint should use NARRATOR namespace`
            );
        }

        teardown();
    });

    // Test: onChange handler for API key triggers callback
    runner.test('API key onChange handler is registered', async () => {
        await setup();

        registerSettings();

        const config = game.settings.getRegistered(MODULE_ID, SETTINGS.OPENAI_API_KEY);
        assert.ok(typeof config.onChange === 'function', 'Should have onChange handler');

        teardown();
    });

    // Test: onChange handler for selected journal triggers callback
    runner.test('Selected journal onChange handler is registered', async () => {
        await setup();

        registerSettings();

        const config = game.settings.getRegistered(MODULE_ID, SETTINGS.SELECTED_JOURNAL);
        assert.ok(typeof config.onChange === 'function', 'Should have onChange handler');

        teardown();
    });

    // Test: Panel position is not shown in config
    runner.test('Panel position setting is not shown in config UI', async () => {
        await setup();

        registerSettings();

        const config = game.settings.getRegistered(MODULE_ID, SETTINGS.PANEL_POSITION);
        assert.equal(config.config, false, 'Panel position should not be in config UI');

        teardown();
    });

    // Run all tests
    return runner.run();
}

// Export for direct execution
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('settings.test')) {
    runTests().then((results) => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
