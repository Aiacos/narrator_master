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
    PANEL_POSITION: 'panelPosition',
    OFF_TRACK_SENSITIVITY: 'offTrackSensitivity',
    IMAGE_GALLERY: 'imageGallery'
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

    // Image gallery storage (not shown in config UI)
    game.settings.register(MODULE_ID, SETTINGS.IMAGE_GALLERY, {
        scope: 'world',
        config: false,
        type: Object,
        default: []
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
     * Gets the image gallery
     * @returns {Array} The image gallery array
     */
    getImageGallery() {
        return game.settings.get(MODULE_ID, SETTINGS.IMAGE_GALLERY) || [];
    }

    /**
     * Sets the image gallery
     * @param {Array} gallery - The image gallery array
     * @returns {Promise<void>}
     */
    async setImageGallery(gallery) {
        await game.settings.set(MODULE_ID, SETTINGS.IMAGE_GALLERY, gallery);
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
            panelPosition: this.getPanelPosition(),
            offTrackSensitivity: this.getOffTrackSensitivity(),
            imageGallery: this.getImageGallery()
        };
    }
}
