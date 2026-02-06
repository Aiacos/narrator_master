/**
 * Settings Module for Narrator Master
 * Handles module configuration including API key and journal selection
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
    SELECTED_JOURNAL: 'selectedJournal',
    AUTO_START_RECORDING: 'autoStartRecording',
    TRANSCRIPTION_LANGUAGE: 'transcriptionLanguage',
    PANEL_POSITION: 'panelPosition',
    SHOW_SPEAKER_LABELS: 'showSpeakerLabels',
    OFF_TRACK_SENSITIVITY: 'offTrackSensitivity'
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
            // Notify the module instance of API key change
            if (window.narratorMaster) {
                window.narratorMaster.updateApiKey(value);
            }
        }
    });

    // Selected Journal - The adventure journal to use for context
    game.settings.register(MODULE_ID, SETTINGS.SELECTED_JOURNAL, {
        name: 'NARRATOR.Settings.JournalName',
        hint: 'NARRATOR.Settings.JournalHint',
        scope: 'world',
        config: true,
        type: String,
        default: '',
        onChange: value => {
            // Notify the module instance of journal change
            if (window.narratorMaster) {
                window.narratorMaster.updateSelectedJournal(value);
            }
        }
    });

    // Auto-start recording when panel opens
    game.settings.register(MODULE_ID, SETTINGS.AUTO_START_RECORDING, {
        name: 'NARRATOR.Settings.AutoStartName',
        hint: 'NARRATOR.Settings.AutoStartHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
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
            'it': 'Italiano',
            'en': 'English',
            'de': 'Deutsch',
            'fr': 'Francais',
            'es': 'Espanol'
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

    // Show speaker labels in transcription
    game.settings.register(MODULE_ID, SETTINGS.SHOW_SPEAKER_LABELS, {
        name: 'NARRATOR.Settings.SpeakerLabelsName',
        hint: 'NARRATOR.Settings.SpeakerLabelsHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
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
     * Gets the selected journal ID
     * @returns {string} The journal ID or empty string
     */
    getSelectedJournal() {
        return game.settings.get(MODULE_ID, SETTINGS.SELECTED_JOURNAL) || '';
    }

    /**
     * Sets the selected journal ID
     * @param {string} journalId - The journal ID to store
     * @returns {Promise<void>}
     */
    async setSelectedJournal(journalId) {
        await game.settings.set(MODULE_ID, SETTINGS.SELECTED_JOURNAL, journalId);
    }

    /**
     * Gets the auto-start recording setting
     * @returns {boolean} Whether to auto-start recording
     */
    getAutoStartRecording() {
        return game.settings.get(MODULE_ID, SETTINGS.AUTO_START_RECORDING);
    }

    /**
     * Gets the transcription language
     * @returns {string} The language code (e.g., 'it', 'en')
     */
    getTranscriptionLanguage() {
        return game.settings.get(MODULE_ID, SETTINGS.TRANSCRIPTION_LANGUAGE) || 'it';
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
     * Gets whether to show speaker labels
     * @returns {boolean} Whether to show speaker labels
     */
    getShowSpeakerLabels() {
        return game.settings.get(MODULE_ID, SETTINGS.SHOW_SPEAKER_LABELS);
    }

    /**
     * Gets the off-track detection sensitivity
     * @returns {string} The sensitivity level ('low', 'medium', 'high')
     */
    getOffTrackSensitivity() {
        return game.settings.get(MODULE_ID, SETTINGS.OFF_TRACK_SENSITIVITY) || 'medium';
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
     * Checks if a journal is selected
     * @returns {boolean} True if a journal is selected
     */
    isJournalSelected() {
        const journalId = this.getSelectedJournal();
        return journalId && journalId.trim().length > 0;
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

        if (!this.isJournalSelected()) {
            errors.push(game.i18n.localize('NARRATOR.Errors.NoJournal'));
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
            selectedJournal: this.getSelectedJournal(),
            autoStartRecording: this.getAutoStartRecording(),
            transcriptionLanguage: this.getTranscriptionLanguage(),
            panelPosition: this.getPanelPosition(),
            showSpeakerLabels: this.getShowSpeakerLabels(),
            offTrackSensitivity: this.getOffTrackSensitivity()
        };
    }
}
