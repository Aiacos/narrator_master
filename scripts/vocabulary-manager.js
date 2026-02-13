/**
 * Vocabulary Manager Module for Narrator Master
 * Manages custom vocabulary and fantasy terms for improved transcription accuracy
 * @module vocabulary-manager
 */

import { MODULE_ID as _MODULE_ID } from './settings.js';
import { DEFAULT_DND_TERMS } from './dnd-terms.js';
import { Logger } from './logger.js';

/**
 * Maximum prompt length for OpenAI Whisper API (224 characters recommended)
 * @constant {number}
 */
const MAX_PROMPT_LENGTH = 224;

/**
 * VocabularyManager - Manages custom vocabulary for transcription
 * Merges user-defined terms with pre-populated D&D terms
 */
export class VocabularyManager {
    /**
     * Creates a new VocabularyManager instance
     * @param {Object} settingsManager - The settings manager instance
     */
    constructor(settingsManager) {
        /**
         * Settings manager reference
         * @type {Object}
         * @private
         */
        this._settingsManager = settingsManager;

        /**
         * Cached custom vocabulary terms
         * @type {Object}
         * @private
         */
        this._customVocabulary = {};

        /**
         * Pre-populated D&D terms
         * @type {string[]}
         * @private
         */
        this._dndTerms = [...DEFAULT_DND_TERMS];
    }

    /**
     * Initializes the vocabulary manager by loading settings
     * @returns {Promise<void>}
     */
    async initialize() {
        await this._loadVocabulary();
    }

    /**
     * Loads vocabulary from settings
     * @private
     * @returns {Promise<void>}
     */
    async _loadVocabulary() {
        if (this._settingsManager) {
            this._customVocabulary = this._settingsManager.getCustomVocabulary() || {};
        }
    }

    /**
     * Saves vocabulary to settings
     * @private
     * @returns {Promise<void>}
     */
    async _saveVocabulary() {
        if (this._settingsManager) {
            await this._settingsManager.setCustomVocabulary(this._customVocabulary);
        }
    }

    /**
     * Gets all vocabulary terms (custom + D&D)
     * @returns {string[]} Array of all vocabulary terms
     */
    getVocabulary() {
        const customTerms = Object.keys(this._customVocabulary);
        const allTerms = [...this._dndTerms, ...customTerms];

        // Remove duplicates (case-insensitive)
        const uniqueTerms = [];
        const seenTerms = new Set();

        for (const term of allTerms) {
            const normalizedTerm = term.toLowerCase();
            if (!seenTerms.has(normalizedTerm)) {
                seenTerms.add(normalizedTerm);
                uniqueTerms.push(term);
            }
        }

        return uniqueTerms;
    }

    /**
     * Gets only custom vocabulary terms (excluding D&D terms)
     * @returns {string[]} Array of custom vocabulary terms
     */
    getCustomTerms() {
        return Object.keys(this._customVocabulary);
    }

    /**
     * Gets the D&D pre-populated terms
     * @returns {string[]} Array of D&D terms
     */
    getDndTerms() {
        return [...this._dndTerms];
    }

    /**
     * Adds a custom vocabulary term
     * @param {string} term - The term to add
     * @param {Object} [options={}] - Additional term options
     * @param {string} [options.context] - Context or pronunciation notes
     * @returns {Promise<boolean>} True if term was added, false if it already exists
     */
    async addTerm(term, options = {}) {
        if (!term || typeof term !== 'string') {
            throw new Error(game.i18n.localize('NARRATOR.Errors.InvalidVocabularyTerm'));
        }

        const trimmedTerm = term.trim();

        if (trimmedTerm.length === 0) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.EmptyVocabularyTerm'));
        }

        // Check if term already exists (case-insensitive)
        const normalizedTerm = trimmedTerm.toLowerCase();
        const existingCustomTerms = Object.keys(this._customVocabulary).map(t => t.toLowerCase());
        const existingDndTerms = this._dndTerms.map(t => t.toLowerCase());

        if (existingCustomTerms.includes(normalizedTerm) || existingDndTerms.includes(normalizedTerm)) {
            return false;
        }

        // Add the term with metadata
        this._customVocabulary[trimmedTerm] = {
            context: options.context || '',
            addedAt: new Date().toISOString()
        };

        await this._saveVocabulary();
        return true;
    }

    /**
     * Removes a custom vocabulary term
     * @param {string} term - The term to remove
     * @returns {Promise<boolean>} True if term was removed, false if it didn't exist
     */
    async removeTerm(term) {
        if (!term || typeof term !== 'string') {
            return false;
        }

        const trimmedTerm = term.trim();

        if (Object.hasOwn(this._customVocabulary, trimmedTerm)) {
            delete this._customVocabulary[trimmedTerm];
            await this._saveVocabulary();
            return true;
        }

        return false;
    }

    /**
     * Checks if a term exists in the vocabulary
     * @param {string} term - The term to check
     * @returns {boolean} True if the term exists
     */
    hasTerm(term) {
        if (!term || typeof term !== 'string') {
            return false;
        }

        const normalizedTerm = term.toLowerCase();
        const allTerms = this.getVocabulary().map(t => t.toLowerCase());

        return allTerms.includes(normalizedTerm);
    }

    /**
     * Clears all custom vocabulary terms
     * @returns {Promise<void>}
     */
    async clearCustomTerms() {
        this._customVocabulary = {};
        await this._saveVocabulary();
    }

    /**
     * Imports terms from an array
     * @param {string[]} terms - Array of terms to import
     * @param {boolean} [merge=true] - If true, merge with existing terms; if false, replace
     * @returns {Promise<Object>} Import result {added: number, skipped: number}
     */
    async importTerms(terms, merge = true) {
        if (!Array.isArray(terms)) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.InvalidTermsArray'));
        }

        if (!merge) {
            this._customVocabulary = {};
        }

        let added = 0;
        let skipped = 0;

        for (const term of terms) {
            if (typeof term === 'string' && term.trim().length > 0) {
                const wasAdded = await this.addTerm(term);
                if (wasAdded) {
                    added++;
                } else {
                    skipped++;
                }
            }
        }

        return { added, skipped };
    }

    /**
     * Imports proper nouns from a journal entry
     * @param {string} journalId - The journal entry ID
     * @returns {Promise<Object>} Import result {added: number, skipped: number}
     */
    async importFromJournal(journalId) {
        if (!journalId || typeof journalId !== 'string') {
            throw new Error(game.i18n.localize('NARRATOR.Errors.InvalidJournalId'));
        }

        // Dynamically import JournalParser to avoid circular dependencies
        const { JournalParser } = await import('./journal-parser.js');
        const parser = new JournalParser();

        // Parse the journal to ensure it's cached
        await parser.parseJournal(journalId);

        // Extract proper nouns from the journal
        const properNouns = parser.extractProperNouns(journalId);

        if (properNouns.length === 0) {
            return { added: 0, skipped: 0 };
        }

        // Import the extracted proper nouns using the existing importTerms method
        const result = await this.importTerms(properNouns, true);

        Logger.info(`Imported ${result.added} terms from journal (${result.skipped} skipped)`, 'VocabularyManager');

        return result;
    }

    /**
     * Builds a prompt string for Whisper API from vocabulary
     * @param {Object} [options={}] - Build options
     * @param {number} [options.maxLength=224] - Maximum prompt length
     * @param {string[]} [options.priorityTerms=[]] - Terms to prioritize in the prompt
     * @returns {string} The formatted prompt string
     */
    buildPromptString(options = {}) {
        const maxLength = options.maxLength || MAX_PROMPT_LENGTH;
        const priorityTerms = options.priorityTerms || [];

        // Get all vocabulary terms
        const allTerms = this.getVocabulary();

        // Prioritize terms: priority terms first, then custom, then D&D
        const customTerms = this.getCustomTerms();
        const sortedTerms = [
            ...priorityTerms.filter(t => allTerms.includes(t)),
            ...customTerms.filter(t => !priorityTerms.includes(t)),
            ...this._dndTerms.filter(t => !priorityTerms.includes(t) && !customTerms.includes(t))
        ];

        // Build prompt string within length limit
        let prompt = '';
        const separator = ', ';

        for (const term of sortedTerms) {
            const addition = prompt.length === 0 ? term : separator + term;

            if ((prompt + addition).length > maxLength) {
                break;
            }

            prompt += addition;
        }

        return prompt;
    }

    /**
     * Exports vocabulary to a JSON object
     * @returns {Object} Vocabulary data for export
     */
    exportVocabulary() {
        return {
            customTerms: { ...this._customVocabulary },
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Gets vocabulary statistics
     * @returns {Object} Statistics about vocabulary
     */
    getStatistics() {
        return {
            totalTerms: this.getVocabulary().length,
            customTerms: Object.keys(this._customVocabulary).length,
            dndTerms: this._dndTerms.length,
            promptLength: this.buildPromptString().length
        };
    }
}
