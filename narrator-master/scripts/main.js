/**
 * Narrator Master - Main Entry Point
 * Foundry VTT module for DM assistance with AI-powered transcription and suggestions
 * @module main
 */

import { MODULE_ID, registerSettings, SettingsManager } from './settings.js';

/**
 * NarratorMaster - Main controller class that orchestrates all module components
 * This class will be extended in phase-6-integration to wire all services together
 */
class NarratorMaster {
    /**
     * Creates a new NarratorMaster instance
     */
    constructor() {
        /**
         * Settings manager instance
         * @type {SettingsManager}
         */
        this.settings = new SettingsManager();

        /**
         * Module initialization state
         * @type {boolean}
         */
        this._initialized = false;

        /**
         * Reference to the UI panel (will be set in phase-5)
         * @type {Application|null}
         */
        this.panel = null;

        /**
         * Audio capture service (will be set in phase-4)
         * @type {Object|null}
         */
        this.audioCapture = null;

        /**
         * Transcription service (will be set in phase-3)
         * @type {Object|null}
         */
        this.transcriptionService = null;

        /**
         * AI assistant service (will be set in phase-3)
         * @type {Object|null}
         */
        this.aiAssistant = null;

        /**
         * Image generator service (will be set in phase-3)
         * @type {Object|null}
         */
        this.imageGenerator = null;

        /**
         * Journal parser service (will be set in phase-2)
         * @type {Object|null}
         */
        this.journalParser = null;
    }

    /**
     * Initializes the module and all its components
     * Called from the 'ready' hook only for GM users
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this._initialized) {
            console.warn(`${MODULE_ID} | Module already initialized`);
            return;
        }

        console.log(`${MODULE_ID} | Initializing NarratorMaster controller`);

        try {
            // Validate configuration
            const validation = this.settings.validateConfiguration();
            if (!validation.valid) {
                console.warn(`${MODULE_ID} | Configuration incomplete:`, validation.errors);
                // Don't block initialization - show warning to user
                this._showConfigurationWarning(validation.errors);
            }

            // Mark as initialized
            this._initialized = true;
            console.log(`${MODULE_ID} | NarratorMaster initialized successfully`);

        } catch (error) {
            console.error(`${MODULE_ID} | Failed to initialize NarratorMaster:`, error);
            this._showErrorNotification(error.message);
        }
    }

    /**
     * Updates the API key and reinitializes dependent services
     * Called when the API key setting changes
     * @param {string} newApiKey - The new API key
     */
    updateApiKey(newApiKey) {
        console.log(`${MODULE_ID} | API key updated`);

        // Services will be updated here in phase-6-integration
        // For now, just log the change
        if (newApiKey && newApiKey.trim().length > 0) {
            console.log(`${MODULE_ID} | API key configured`);
        } else {
            console.warn(`${MODULE_ID} | API key cleared`);
        }
    }

    /**
     * Updates the selected journal and reloads journal content
     * Called when the selected journal setting changes
     * @param {string} journalId - The new journal ID
     */
    updateSelectedJournal(journalId) {
        console.log(`${MODULE_ID} | Selected journal updated:`, journalId);

        // Journal parser will be updated here in phase-6-integration
        if (journalId && journalId.trim().length > 0) {
            console.log(`${MODULE_ID} | Journal selected`);
        } else {
            console.warn(`${MODULE_ID} | No journal selected`);
        }
    }

    /**
     * Shows a configuration warning to the user
     * @param {string[]} errors - Array of configuration error messages
     * @private
     */
    _showConfigurationWarning(errors) {
        const message = game.i18n.localize('NARRATOR.Warnings.ConfigIncomplete');
        ui.notifications.warn(`${message}: ${errors.join(', ')}`);
    }

    /**
     * Shows an error notification to the user
     * @param {string} message - The error message
     * @private
     */
    _showErrorNotification(message) {
        const prefix = game.i18n.localize('NARRATOR.Errors.InitFailed');
        ui.notifications.error(`${prefix}: ${message}`);
    }

    /**
     * Opens the DM panel
     * Will be implemented in phase-5
     */
    openPanel() {
        if (this.panel) {
            this.panel.render(true);
        } else {
            console.warn(`${MODULE_ID} | Panel not yet initialized`);
        }
    }

    /**
     * Closes the DM panel
     * Will be implemented in phase-5
     */
    closePanel() {
        if (this.panel) {
            this.panel.close();
        }
    }

    /**
     * Toggles the DM panel open/closed state
     */
    togglePanel() {
        if (this.panel?.rendered) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    /**
     * Checks if the module is fully initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this._initialized;
    }

    /**
     * Gets the current module status
     * @returns {Object} Status object with component states
     */
    getStatus() {
        return {
            initialized: this._initialized,
            apiKeyConfigured: this.settings.isApiKeyConfigured(),
            journalSelected: this.settings.isJournalSelected(),
            panelOpen: this.panel?.rendered ?? false
        };
    }
}

/**
 * Module initialization hook
 * Called early in the Foundry VTT loading process
 * Used for registering settings and loading templates
 */
Hooks.once('init', async function() {
    console.log(`${MODULE_ID} | Initializing module`);

    // Register module settings
    registerSettings();

    // Load Handlebars templates
    await loadTemplates([
        `modules/${MODULE_ID}/templates/panel.hbs`
    ]);

    console.log(`${MODULE_ID} | Module initialized`);
});

/**
 * Module ready hook
 * Called when the game is fully ready
 * Used for creating module instances and GM-only features
 */
Hooks.once('ready', async function() {
    console.log(`${MODULE_ID} | Module ready`);

    // Only initialize for GM users - this is a DM-only tool
    if (game.user.isGM) {
        console.log(`${MODULE_ID} | User is GM, initializing NarratorMaster`);

        // Create and store global instance for debugging and external access
        window.narratorMaster = new NarratorMaster();
        await window.narratorMaster.initialize();
    } else {
        console.log(`${MODULE_ID} | User is not GM, skipping initialization`);
    }
});

// Export for external use and testing
export { NarratorMaster, MODULE_ID };
