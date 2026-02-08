/**
 * Speaker Label Service Module for Narrator Master
 * Manages custom speaker labels and persists them across sessions
 * @module speaker-labels
 */

import { MODULE_ID } from './settings.js';

/**
 * Setting key for speaker label mappings
 * @constant {string}
 */
const SPEAKER_MAPPINGS_KEY = 'speakerMappings';

/**
 * Represents a mapping of original speaker IDs to custom labels
 * @typedef {Object.<string, string>} SpeakerMappings
 */

/**
 * SpeakerLabelService - Manages speaker label mappings and persistence
 * Allows DMs to assign custom names to identified speakers and persist across sessions
 */
export class SpeakerLabelService {
    /**
     * Creates a new SpeakerLabelService instance
     */
    constructor() {
        /**
         * In-memory cache of speaker mappings
         * @type {SpeakerMappings}
         * @private
         */
        this._mappings = new Map();

        /**
         * Whether the service has been initialized
         * @type {boolean}
         * @private
         */
        this._initialized = false;
    }

    /**
     * Initializes the service and loads persisted mappings
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this._initialized) {
            return;
        }

        await this._loadMappings();
        this._initialized = true;
    }

    /**
     * Checks if the service is initialized
     * @returns {boolean} True if initialized
     */
    isInitialized() {
        return this._initialized;
    }

    /**
     * Sets a custom label for a speaker
     * @param {string} originalSpeaker - The original speaker ID (e.g., 'Speaker 1')
     * @param {string} customLabel - The custom label to assign
     * @returns {Promise<void>}
     * @throws {Error} If parameters are invalid
     */
    async setLabel(originalSpeaker, customLabel) {
        // Validate inputs
        if (!originalSpeaker || typeof originalSpeaker !== 'string') {
            throw new Error(game.i18n.localize('NARRATOR.Errors.InvalidSpeaker'));
        }

        if (!customLabel || typeof customLabel !== 'string') {
            throw new Error(game.i18n.localize('NARRATOR.Errors.InvalidLabel'));
        }

        // Trim whitespace
        const speaker = originalSpeaker.trim();
        const label = customLabel.trim();

        if (!speaker || !label) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.EmptyLabel'));
        }

        // Update in-memory cache
        this._mappings.set(speaker, label);

        // Persist to settings
        await this._saveMappings();
    }

    /**
     * Gets the custom label for a speaker
     * @param {string} originalSpeaker - The original speaker ID
     * @returns {string|null} The custom label, or null if not found
     */
    getLabel(originalSpeaker) {
        if (!originalSpeaker || typeof originalSpeaker !== 'string') {
            return null;
        }

        const speaker = originalSpeaker.trim();
        return this._mappings.get(speaker) || null;
    }

    /**
     * Gets all speaker label mappings
     * @returns {Object.<string, string>} Map of original speakers to custom labels
     */
    getAllMappings() {
        const mappings = {};
        for (const [speaker, label] of this._mappings.entries()) {
            mappings[speaker] = label;
        }
        return mappings;
    }

    /**
     * Clears the mapping for a specific speaker
     * @param {string} originalSpeaker - The speaker ID to clear
     * @returns {Promise<boolean>} True if a mapping was cleared
     */
    async clearMapping(originalSpeaker) {
        if (!originalSpeaker || typeof originalSpeaker !== 'string') {
            return false;
        }

        const speaker = originalSpeaker.trim();
        const existed = this._mappings.has(speaker);

        if (existed) {
            this._mappings.delete(speaker);
            await this._saveMappings();
        }

        return existed;
    }

    /**
     * Clears all speaker mappings
     * @returns {Promise<void>}
     */
    async clearAllMappings() {
        this._mappings.clear();
        await this._saveMappings();
    }

    /**
     * Applies custom labels to transcript segments
     * @param {Array<Object>} segments - Array of transcript segments with speaker fields
     * @returns {Array<Object>} New array with custom labels applied
     */
    applyLabelsToSegments(segments) {
        if (!Array.isArray(segments)) {
            return [];
        }

        return segments.map((segment) => {
            // Create a shallow copy to avoid mutating original
            const updatedSegment = { ...segment };

            // Apply custom label if available
            if (segment.speaker) {
                const customLabel = this.getLabel(segment.speaker);
                if (customLabel) {
                    updatedSegment.speaker = customLabel;
                }
            }

            return updatedSegment;
        });
    }

    /**
     * Gets a list of all unique speakers that have been encountered
     * @returns {string[]} Array of speaker IDs (both original and custom)
     */
    getKnownSpeakers() {
        return Array.from(this._mappings.keys());
    }

    /**
     * Checks if a speaker has a custom label
     * @param {string} originalSpeaker - The speaker ID to check
     * @returns {boolean} True if a custom label exists
     */
    hasLabel(originalSpeaker) {
        if (!originalSpeaker || typeof originalSpeaker !== 'string') {
            return false;
        }

        return this._mappings.has(originalSpeaker.trim());
    }

    /**
     * Loads speaker mappings from Foundry settings
     * @returns {Promise<void>}
     * @private
     */
    async _loadMappings() {
        try {
            // Check if the setting exists
            const settingExists = game.settings.settings.has(
                `${MODULE_ID}.${SPEAKER_MAPPINGS_KEY}`
            );

            if (!settingExists) {
                // Register the setting if it doesn't exist
                game.settings.register(MODULE_ID, SPEAKER_MAPPINGS_KEY, {
                    name: 'Speaker Mappings',
                    hint: 'Internal storage for speaker label mappings',
                    scope: 'world',
                    config: false,
                    type: Object,
                    default: {}
                });
            }

            const mappings = game.settings.get(MODULE_ID, SPEAKER_MAPPINGS_KEY) || {};

            // Load into in-memory cache
            this._mappings.clear();
            for (const [speaker, label] of Object.entries(mappings)) {
                this._mappings.set(speaker, label);
            }
        } catch (error) {
            console.warn(`${MODULE_ID} | Failed to load speaker mappings:`, error);
            this._mappings.clear();
        }
    }

    /**
     * Saves speaker mappings to Foundry settings
     * @returns {Promise<void>}
     * @private
     */
    async _saveMappings() {
        try {
            const mappings = this.getAllMappings();
            await game.settings.set(MODULE_ID, SPEAKER_MAPPINGS_KEY, mappings);
        } catch (error) {
            console.error(`${MODULE_ID} | Failed to save speaker mappings:`, error);
            throw new Error(game.i18n.localize('NARRATOR.Errors.SaveMappingsFailed'));
        }
    }

    /**
     * Exports speaker mappings as a JSON string
     * @returns {string} JSON representation of mappings
     */
    exportMappings() {
        const mappings = this.getAllMappings();
        return JSON.stringify(mappings, null, 2);
    }

    /**
     * Imports speaker mappings from a JSON string
     * @param {string} jsonString - JSON representation of mappings
     * @returns {Promise<boolean>} True if import was successful
     */
    async importMappings(jsonString) {
        try {
            const mappings = JSON.parse(jsonString);

            if (typeof mappings !== 'object' || mappings === null) {
                throw new Error('Invalid mappings format');
            }

            // Clear existing mappings
            this._mappings.clear();

            // Import new mappings
            for (const [speaker, label] of Object.entries(mappings)) {
                if (typeof speaker === 'string' && typeof label === 'string') {
                    this._mappings.set(speaker.trim(), label.trim());
                }
            }

            // Save to settings
            await this._saveMappings();
            return true;
        } catch (error) {
            console.error(`${MODULE_ID} | Failed to import speaker mappings:`, error);
            return false;
        }
    }
}
