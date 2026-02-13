/**
 * Settings Module for Narrator Master
 * Handles module configuration for the interactive narrative assistant
 * @module settings
 */

/**
 * Module ID constant used across the module
 * @constant {string}
 */
export const MODULE_ID = 'narrator-master';

/**
 * Settings keys for easy reference
 * @constant {Object}
 */
export const SETTINGS = {
    OPENAI_API_KEY: 'openaiApiKey',
    TRANSCRIPTION_LANGUAGE: 'transcriptionLanguage',
    MULTI_LANGUAGE_MODE: 'multiLanguageMode',
    TRANSCRIPTION_BATCH_DURATION: 'transcriptionBatchDuration',
    PANEL_POSITION: 'panelPosition',
    OFF_TRACK_SENSITIVITY: 'offTrackSensitivity',
    SPEAKER_LABELS: 'speakerLabels',
    SELECTED_JOURNALS: 'selectedJournals',
    RULES_DETECTION: 'rulesDetection',
    RULES_SOURCE: 'rulesSource',
    DEBUG_MODE: 'debugMode',
    API_RETRY_ENABLED: 'apiRetryEnabled',
    API_RETRY_MAX_ATTEMPTS: 'apiRetryMaxAttempts',
    API_RETRY_BASE_DELAY: 'apiRetryBaseDelay',
    API_RETRY_MAX_DELAY: 'apiRetryMaxDelay',
    API_QUEUE_MAX_SIZE: 'apiQueueMaxSize'
};

/**
 * Registers all module settings with Foundry VTT
 * Should be called during the 'init' hook
 */
export function registerSettings() {
    // OpenAI API Key - Required for all AI features
    game.settings.register(MODULE_ID, SETTINGS.OPENAI_API_KEY, {
        name: 'NARRATOR.Settings.ApiKeyName',
        hint: 'NARRATOR.Settings.ApiKeyHint',
        scope: 'world',
        config: true,
        type: String,
        default: '',
        onChange: value => {
            if (window.narratorMaster) {
                window.narratorMaster.updateApiKey(value);
            }
        }
    });

    // Transcription language (default Italian)
    game.settings.register(MODULE_ID, SETTINGS.TRANSCRIPTION_LANGUAGE, {
        name: 'NARRATOR.Settings.LanguageName',
        hint: 'NARRATOR.Settings.LanguageHint',
        scope: 'world',
        config: true,
        type: String,
        default: 'it',
        choices: {
            'auto': 'Auto-detect',
            'it': 'Italiano',
            'en': 'English',
            'de': 'Deutsch',
            'fr': 'Francais',
            'es': 'Espanol'
        }
    });

    // Multi-language mode - Enable automatic language detection
    game.settings.register(MODULE_ID, SETTINGS.MULTI_LANGUAGE_MODE, {
        name: 'NARRATOR.Settings.MultiLanguageModeName',
        hint: 'NARRATOR.Settings.MultiLanguageModeHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
    });

    // Transcription batch duration - Time to accumulate audio before processing
    game.settings.register(MODULE_ID, SETTINGS.TRANSCRIPTION_BATCH_DURATION, {
        name: 'NARRATOR.Settings.TranscriptionBatchDurationName',
        hint: 'NARRATOR.Settings.TranscriptionBatchDurationHint',
        scope: 'world',
        config: true,
        type: Number,
        default: 10000,
        range: {
            min: 5000,
            max: 30000,
            step: 1000
        },
        onChange: value => {
            if (window.narratorMaster) {
                window.narratorMaster.restartTranscriptionCycles();
            }
        }
    });

    // Panel position settings (stored as JSON string)
    game.settings.register(MODULE_ID, SETTINGS.PANEL_POSITION, {
        name: 'NARRATOR.Settings.PanelPositionName',
        hint: 'NARRATOR.Settings.PanelPositionHint',
        scope: 'client',
        config: false,
        type: Object,
        default: { top: 100, left: 100 }
    });

    // Off-track detection sensitivity
    game.settings.register(MODULE_ID, SETTINGS.OFF_TRACK_SENSITIVITY, {
        name: 'NARRATOR.Settings.SensitivityName',
        hint: 'NARRATOR.Settings.SensitivityHint',
        scope: 'world',
        config: true,
        type: String,
        default: 'medium',
        choices: {
            'low': 'NARRATOR.Settings.SensitivityLow',
            'medium': 'NARRATOR.Settings.SensitivityMedium',
            'high': 'NARRATOR.Settings.SensitivityHigh'
        }
    });

    // Speaker labels for transcription
    game.settings.register(MODULE_ID, SETTINGS.SPEAKER_LABELS, {
        name: 'NARRATOR.Settings.SpeakerLabelsName',
        hint: 'NARRATOR.Settings.SpeakerLabelsHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });

    // Selected journals/folders for AI context (stored as array of IDs)
    game.settings.register(MODULE_ID, SETTINGS.SELECTED_JOURNALS, {
        name: 'NARRATOR.Settings.SelectedJournalsName',
        hint: 'NARRATOR.Settings.SelectedJournalsHint',
        scope: 'world',
        config: false,
        type: Object,
        default: []
    });

    // Rules detection - Automatically detect and answer rules questions
    game.settings.register(MODULE_ID, SETTINGS.RULES_DETECTION, {
        name: 'NARRATOR.Settings.RulesDetectionName',
        hint: 'NARRATOR.Settings.RulesDetectionHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });

    // Rules source - Which compendium to use for rules answers
    game.settings.register(MODULE_ID, SETTINGS.RULES_SOURCE, {
        name: 'NARRATOR.Settings.RulesSourceName',
        hint: 'NARRATOR.Settings.RulesSourceHint',
        scope: 'world',
        config: true,
        type: String,
        default: 'auto',
        choices: {
            'auto': 'NARRATOR.Settings.RulesSourceAuto',
            'dnd5e': 'NARRATOR.Settings.RulesSourceDnd5e'
        }
    });

    // Debug mode - Enable verbose logging for development and troubleshooting
    game.settings.register(MODULE_ID, SETTINGS.DEBUG_MODE, {
        name: 'NARRATOR.Settings.DebugModeName',
        hint: 'NARRATOR.Settings.DebugModeHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
    });

    // API Retry Enabled - Enable automatic retry with exponential backoff for failed API requests
    game.settings.register(MODULE_ID, SETTINGS.API_RETRY_ENABLED, {
        name: 'NARRATOR.Settings.ApiRetryEnabledName',
        hint: 'NARRATOR.Settings.ApiRetryEnabledHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });

    // API Retry Max Attempts - Maximum number of retry attempts for failed API requests
    game.settings.register(MODULE_ID, SETTINGS.API_RETRY_MAX_ATTEMPTS, {
        name: 'NARRATOR.Settings.ApiRetryMaxAttemptsName',
        hint: 'NARRATOR.Settings.ApiRetryMaxAttemptsHint',
        scope: 'world',
        config: true,
        type: Number,
        default: 3
    });

    // API Retry Base Delay - Base delay in milliseconds before first retry (will increase exponentially)
    game.settings.register(MODULE_ID, SETTINGS.API_RETRY_BASE_DELAY, {
        name: 'NARRATOR.Settings.ApiRetryBaseDelayName',
        hint: 'NARRATOR.Settings.ApiRetryBaseDelayHint',
        scope: 'world',
        config: true,
        type: Number,
        default: 1000
    });

    // API Retry Max Delay - Maximum delay in milliseconds between retries
    game.settings.register(MODULE_ID, SETTINGS.API_RETRY_MAX_DELAY, {
        name: 'NARRATOR.Settings.ApiRetryMaxDelayName',
        hint: 'NARRATOR.Settings.ApiRetryMaxDelayHint',
        scope: 'world',
        config: true,
        type: Number,
        default: 30000
    });

    // API Queue Max Size - Maximum number of requests that can be queued
    game.settings.register(MODULE_ID, SETTINGS.API_QUEUE_MAX_SIZE, {
        name: 'NARRATOR.Settings.ApiQueueMaxSizeName',
        hint: 'NARRATOR.Settings.ApiQueueMaxSizeHint',
        scope: 'world',
        config: true,
        type: Number,
        default: 10
    });
}

/**
 * Settings Manager class for accessing and managing module settings
 * Provides a clean OOP interface for settings operations
 */
export class SettingsManager {
    /**
     * Creates a new SettingsManager instance
     */
    constructor() {
        this._cache = new Map();
    }

    /**
     * Gets the OpenAI API key
     * @returns {string} The configured API key or empty string
     */
    getApiKey() {
        return game.settings.get(MODULE_ID, SETTINGS.OPENAI_API_KEY) || '';
    }

    /**
     * Sets the OpenAI API key
     * @param {string} apiKey - The API key to store
     * @returns {Promise<void>}
     */
    async setApiKey(apiKey) {
        await game.settings.set(MODULE_ID, SETTINGS.OPENAI_API_KEY, apiKey);
    }

    /**
     * Gets the transcription language
     * @returns {string} The language code (e.g., 'auto', 'it', 'en')
     */
    getTranscriptionLanguage() {
        return game.settings.get(MODULE_ID, SETTINGS.TRANSCRIPTION_LANGUAGE) || 'it';
    }

    /**
     * Gets the multi-language mode setting
     * @returns {boolean} True if multi-language mode is enabled
     */
    getMultiLanguageMode() {
        return game.settings.get(MODULE_ID, SETTINGS.MULTI_LANGUAGE_MODE) || false;
    }

    /**
     * Gets the transcription batch duration
     * @returns {number} The batch duration in milliseconds (default: 10000)
     */
    getTranscriptionBatchDuration() {
        return game.settings.get(MODULE_ID, SETTINGS.TRANSCRIPTION_BATCH_DURATION) || 10000;
    }

    /**
     * Gets the panel position
     * @returns {Object} The panel position {top, left}
     */
    getPanelPosition() {
        return game.settings.get(MODULE_ID, SETTINGS.PANEL_POSITION);
    }

    /**
     * Sets the panel position
     * @param {Object} position - The position {top, left}
     * @returns {Promise<void>}
     */
    async setPanelPosition(position) {
        await game.settings.set(MODULE_ID, SETTINGS.PANEL_POSITION, position);
    }

    /**
     * Gets the off-track detection sensitivity
     * @returns {string} The sensitivity level ('low', 'medium', 'high')
     */
    getOffTrackSensitivity() {
        return game.settings.get(MODULE_ID, SETTINGS.OFF_TRACK_SENSITIVITY) || 'medium';
    }

    /**
     * Gets the speaker labels setting
     * @returns {boolean} True if speaker labels are enabled
     */
    getSpeakerLabels() {
        return game.settings.get(MODULE_ID, SETTINGS.SPEAKER_LABELS) ?? true;
    }

    /**
     * Gets the selected journals/folders
     * @returns {Array<string>} Array of journal/folder IDs
     */
    getSelectedJournals() {
        return game.settings.get(MODULE_ID, SETTINGS.SELECTED_JOURNALS) || [];
    }

    /**
     * Sets the selected journals/folders
     * @param {Array<string>} journalIds - Array of journal/folder IDs
     * @returns {Promise<void>}
     */
    async setSelectedJournals(journalIds) {
        await game.settings.set(MODULE_ID, SETTINGS.SELECTED_JOURNALS, journalIds);
    }

    /**
     * Gets the rules detection setting
     * @returns {boolean} True if rules detection is enabled
     */
    getRulesDetection() {
        return game.settings.get(MODULE_ID, SETTINGS.RULES_DETECTION) ?? true;
    }

    /**
     * Gets the rules source setting
     * @returns {string} The rules source ('auto', 'dnd5e')
     */
    getRulesSource() {
        return game.settings.get(MODULE_ID, SETTINGS.RULES_SOURCE) || 'auto';
    }

    /**
     * Gets the debug mode setting
     * @returns {boolean} True if debug mode is enabled
     */
    getDebugMode() {
        return game.settings.get(MODULE_ID, SETTINGS.DEBUG_MODE) || false;
    }

    /**
     * Gets the API retry enabled setting
     * @returns {boolean} True if API retry is enabled
     */
    getApiRetryEnabled() {
        return game.settings.get(MODULE_ID, SETTINGS.API_RETRY_ENABLED) ?? true;
    }

    /**
     * Gets the API retry max attempts setting
     * @returns {number} Maximum number of retry attempts
     */
    getApiRetryMaxAttempts() {
        return game.settings.get(MODULE_ID, SETTINGS.API_RETRY_MAX_ATTEMPTS) || 3;
    }

    /**
     * Gets the API retry base delay setting
     * @returns {number} Base delay in milliseconds before first retry
     */
    getApiRetryBaseDelay() {
        return game.settings.get(MODULE_ID, SETTINGS.API_RETRY_BASE_DELAY) || 1000;
    }

    /**
     * Gets the API retry max delay setting
     * @returns {number} Maximum delay in milliseconds between retries
     */
    getApiRetryMaxDelay() {
        return game.settings.get(MODULE_ID, SETTINGS.API_RETRY_MAX_DELAY) || 30000;
    }

    /**
     * Gets the API queue max size setting
     * @returns {number} Maximum number of requests that can be queued
     */
    getApiQueueMaxSize() {
        return game.settings.get(MODULE_ID, SETTINGS.API_QUEUE_MAX_SIZE) || 10;
    }

    /**
     * Checks if the API key is configured
     * @returns {boolean} True if API key is set
     */
    isApiKeyConfigured() {
        const apiKey = this.getApiKey();
        return apiKey && apiKey.trim().length > 0;
    }

    /**
     * Validates the current configuration
     * @returns {Object} Validation result {valid: boolean, errors: string[]}
     */
    validateConfiguration() {
        const errors = [];

        if (!this.isApiKeyConfigured()) {
            errors.push(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Gets all settings as a configuration object
     * @returns {Object} All settings
     */
    getAllSettings() {
        return {
            apiKey: this.getApiKey(),
            transcriptionLanguage: this.getTranscriptionLanguage(),
            multiLanguageMode: this.getMultiLanguageMode(),
            transcriptionBatchDuration: this.getTranscriptionBatchDuration(),
            panelPosition: this.getPanelPosition(),
            offTrackSensitivity: this.getOffTrackSensitivity(),
            speakerLabels: this.getSpeakerLabels(),
            selectedJournals: this.getSelectedJournals(),
            rulesDetection: this.getRulesDetection(),
            rulesSource: this.getRulesSource(),
            debugMode: this.getDebugMode(),
            apiRetryEnabled: this.getApiRetryEnabled(),
            apiRetryMaxAttempts: this.getApiRetryMaxAttempts(),
            apiRetryBaseDelay: this.getApiRetryBaseDelay(),
            apiRetryMaxDelay: this.getApiRetryMaxDelay(),
            apiQueueMaxSize: this.getApiQueueMaxSize()
        };
    }
}
