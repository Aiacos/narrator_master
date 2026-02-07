/**
 * Rules Reference Service Module for Narrator Master
 * Handles quick access to D&D 5e SRD rules and game mechanics
 * @module rules-reference
 */

import { MODULE_ID, SETTINGS } from './settings.js';

/**
 * Default search result limit
 * @constant {number}
 */
const DEFAULT_RESULT_LIMIT = 5;

/**
 * Maximum cache size for rules entries
 * @constant {number}
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Represents a rule or game mechanic entry
 * @typedef {Object} RuleEntry
 * @property {string} id - Unique identifier for the rule
 * @property {string} title - The rule title
 * @property {string} content - The rule content/description
 * @property {string} category - Category (e.g., 'combat', 'spells', 'conditions')
 * @property {string[]} tags - Searchable tags
 * @property {string} [source] - Source book reference
 */

/**
 * Represents a search result with relevance score
 * @typedef {Object} SearchResult
 * @property {RuleEntry} rule - The matching rule entry
 * @property {number} relevance - Relevance score 0-1
 * @property {string[]} matchedTerms - Terms that matched the query
 */

/**
 * RulesReferenceService - Provides quick access to game rules and mechanics
 * Integrates with D&D 5e SRD content for contextual rule lookup
 */
export class RulesReferenceService {
    /**
     * Creates a new RulesReferenceService instance
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.language='it'] - Language for rule descriptions
     * @param {number} [options.resultLimit=5] - Maximum search results to return
     */
    constructor(options = {}) {
        /**
         * Language for rule descriptions
         * @type {string}
         * @private
         */
        this._language = options.language || 'it';

        /**
         * Maximum search results to return
         * @type {number}
         * @private
         */
        this._resultLimit = options.resultLimit || DEFAULT_RESULT_LIMIT;

        /**
         * Cached rules database
         * @type {Map<string, RuleEntry>}
         * @private
         */
        this._rulesCache = new Map();

        /**
         * Search index for quick lookups
         * @type {Map<string, Set<string>>}
         * @private
         */
        this._searchIndex = new Map();

        /**
         * Recently accessed rules for quick access
         * @type {string[]}
         * @private
         */
        this._recentRules = [];

        /**
         * Maximum recent rules to track
         * @type {number}
         * @private
         */
        this._maxRecentSize = 10;

        /**
         * Whether the rules database has been loaded
         * @type {boolean}
         * @private
         */
        this._isLoaded = false;
    }

    /**
     * Checks if the service is configured and ready
     * @returns {boolean} True if rules database is loaded
     */
    isConfigured() {
        return this._isLoaded;
    }

    /**
     * Sets the language for rule descriptions
     * @param {string} language - Language code (e.g., 'it', 'en')
     */
    setLanguage(language) {
        this._language = language || 'it';
    }

    /**
     * Gets the current language setting
     * @returns {string} The language code
     */
    getLanguage() {
        return this._language;
    }

    /**
     * Sets the maximum number of search results
     * @param {number} limit - The result limit
     */
    setResultLimit(limit) {
        this._resultLimit = Math.max(1, limit || DEFAULT_RESULT_LIMIT);
    }

    /**
     * Gets the current result limit
     * @returns {number} The result limit
     */
    getResultLimit() {
        return this._resultLimit;
    }

    /**
     * Loads the rules database
     * @returns {Promise<void>}
     */
    async loadRules() {
        // TODO: Implementation
        this._isLoaded = true;
    }

    /**
     * Searches for rules matching the query
     * @param {string} query - The search query
     * @param {Object} [options={}] - Search options
     * @param {string[]} [options.categories] - Filter by categories
     * @param {number} [options.limit] - Override result limit
     * @returns {Promise<SearchResult[]>} Array of search results
     */
    async searchRules(query, options = {}) {
        // TODO: Implementation
        return [];
    }

    /**
     * Gets a specific rule by ID
     * @param {string} ruleId - The rule ID
     * @returns {Promise<RuleEntry|null>} The rule entry or null if not found
     */
    async getRuleById(ruleId) {
        // TODO: Implementation
        return null;
    }

    /**
     * Gets recently accessed rules
     * @returns {RuleEntry[]} Array of recent rule entries
     */
    getRecentRules() {
        // TODO: Implementation
        return [];
    }

    /**
     * Clears the rules cache and reloads
     * @returns {Promise<void>}
     */
    async reloadRules() {
        this._rulesCache.clear();
        this._searchIndex.clear();
        this._recentRules = [];
        this._isLoaded = false;
        await this.loadRules();
    }

    /**
     * Gets all available rule categories
     * @returns {string[]} Array of category names
     */
    getCategories() {
        // TODO: Implementation
        return [];
    }

    /**
     * Gets rules in a specific category
     * @param {string} category - The category name
     * @returns {RuleEntry[]} Array of rule entries in the category
     */
    getRulesByCategory(category) {
        // TODO: Implementation
        return [];
    }

    /**
     * Detects if text contains a rules question
     * @param {string} text - The text to analyze (transcription or query)
     * @returns {Object} Detection result with isRulesQuestion flag and details
     * @property {boolean} isRulesQuestion - Whether text contains a rules question
     * @property {number} confidence - Confidence score 0-1
     * @property {string[]} detectedTerms - Rules-related terms found
     * @property {string} questionType - Type of question ('mechanic', 'spell', 'condition', 'action', 'general')
     * @property {string} [extractedTopic] - The specific topic/mechanic being asked about
     */
    detectRulesQuestion(text) {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return {
                isRulesQuestion: false,
                confidence: 0,
                detectedTerms: [],
                questionType: 'general'
            };
        }

        const normalizedText = text.toLowerCase().trim();
        const detectedTerms = [];
        let confidence = 0;
        let questionType = 'general';
        let extractedTopic = null;

        // Check for explicit rules question patterns
        const questionPatterns = this._getQuestionPatterns();
        let patternMatchType = null;
        for (const pattern of questionPatterns) {
            if (pattern.regex.test(normalizedText)) {
                confidence = Math.max(confidence, pattern.confidence);
                patternMatchType = pattern.type;

                // Try to extract the topic being asked about
                const match = normalizedText.match(pattern.regex);
                if (match && match[1]) {
                    extractedTopic = match[1].trim();
                }

                detectedTerms.push(pattern.name);
            }
        }

        // Check for common D&D mechanics terms (more specific, takes priority)
        const mechanicTerms = this._getMechanicTerms();
        let hasSpecificMechanic = false;
        for (const [term, category] of Object.entries(mechanicTerms)) {
            if (normalizedText.includes(term)) {
                detectedTerms.push(term);
                confidence = Math.max(confidence, 0.6);
                questionType = category; // More specific category from mechanic term
                hasSpecificMechanic = true;

                if (!extractedTopic) {
                    extractedTopic = term;
                }
            }
        }

        // Use pattern type if no specific mechanic was found
        if (!hasSpecificMechanic && patternMatchType) {
            questionType = patternMatchType;
        }

        // Check for question words combined with rules context
        if (this._hasQuestionWord(normalizedText) && detectedTerms.length > 0) {
            confidence = Math.min(confidence + 0.2, 1.0);
        }

        return {
            isRulesQuestion: confidence > 0.3,
            confidence: Math.min(confidence, 1.0),
            detectedTerms,
            questionType,
            extractedTopic
        };
    }

    /**
     * Returns question patterns for rules detection
     * @returns {Array<{regex: RegExp, confidence: number, type: string, name: string}>}
     * @private
     */
    _getQuestionPatterns() {
        return [
            // English patterns
            {
                regex: /(?:how does|how do|what is the rule for|what are the rules for)\s+([a-z\s]+?)(?:\s+work|\?|$)/i,
                confidence: 0.9,
                type: 'mechanic',
                name: 'how_does_work'
            },
            {
                regex: /(?:can i|can you|am i able to|is it possible to)\s+([a-z\s]+?)(?:\?|$)/i,
                confidence: 0.7,
                type: 'action',
                name: 'can_i'
            },
            {
                regex: /(?:what happens when|what happens if)\s+([a-z\s]+?)(?:\?|$)/i,
                confidence: 0.8,
                type: 'mechanic',
                name: 'what_happens'
            },

            // Italian patterns
            {
                regex: /(?:come funziona|come funzionano|qual è la regola per|quali sono le regole per)\s+([a-z\s]+?)(?:\?|$)/i,
                confidence: 0.9,
                type: 'mechanic',
                name: 'come_funziona'
            },
            {
                regex: /(?:posso|possiamo|è possibile|si può)\s+([a-z\s]+?)(?:\?|$)/i,
                confidence: 0.7,
                type: 'action',
                name: 'posso'
            },
            {
                regex: /(?:cosa succede quando|cosa succede se|che succede se)\s+([a-z\s]+?)(?:\?|$)/i,
                confidence: 0.8,
                type: 'mechanic',
                name: 'cosa_succede'
            },
            {
                regex: /(?:quanto costa|quanti slot|quante azioni)\s+([a-z\s]+?)(?:\?|$)/i,
                confidence: 0.8,
                type: 'spell',
                name: 'quanto_costa'
            },

            // General rules keywords
            {
                regex: /\b(?:regola|regole|meccanica|meccaniche|rule|rules|mechanic|mechanics)\b/i,
                confidence: 0.6,
                type: 'general',
                name: 'rules_keyword'
            }
        ];
    }

    /**
     * Returns common D&D mechanic terms and their categories
     * @returns {Object<string, string>}
     * @private
     */
    _getMechanicTerms() {
        return {
            // Combat mechanics
            'grappling': 'combat',
            'lotta': 'combat',
            'opportunity attack': 'combat',
            'attacco di opportunità': 'combat',
            'advantage': 'combat',
            'vantaggio': 'combat',
            'disadvantage': 'combat',
            'svantaggio': 'combat',
            'critical hit': 'combat',
            'colpo critico': 'combat',
            'initiative': 'combat',
            'iniziativa': 'combat',
            'dodge': 'combat',
            'schivare': 'combat',
            'dash': 'combat',
            'scattare': 'combat',
            'disengage': 'combat',
            'disimpegno': 'combat',

            // Spell mechanics
            'concentration': 'spell',
            'concentrazione': 'spell',
            'spell slot': 'spell',
            'slot incantesimo': 'spell',
            'ritual': 'spell',
            'rituale': 'spell',
            'cantrip': 'spell',
            'trucchetto': 'spell',
            'casting time': 'spell',
            'tempo di lancio': 'spell',

            // Conditions
            'prone': 'condition',
            'prono': 'condition',
            'stunned': 'condition',
            'stordito': 'condition',
            'paralyzed': 'condition',
            'paralizzato': 'condition',
            'blinded': 'condition',
            'accecato': 'condition',
            'charmed': 'condition',
            'affascinato': 'condition',
            'frightened': 'condition',
            'spaventato': 'condition',
            'poisoned': 'condition',
            'avvelenato': 'condition',
            'restrained': 'condition',
            'trattenuto': 'condition',

            // Abilities and checks
            'saving throw': 'ability',
            'tiro salvezza': 'ability',
            'ability check': 'ability',
            'prova di caratteristica': 'ability',
            'skill check': 'ability',
            'prova di abilità': 'ability',

            // Movement
            'difficult terrain': 'movement',
            'terreno difficile': 'movement',
            'jump': 'movement',
            'saltare': 'movement',
            'climb': 'movement',
            'scalare': 'movement',
            'swimming': 'movement',
            'nuotare': 'movement',

            // Rest
            'short rest': 'rest',
            'riposo breve': 'rest',
            'long rest': 'rest',
            'riposo lungo': 'rest'
        };
    }

    /**
     * Checks if text contains a question word
     * @param {string} text - The normalized text
     * @returns {boolean}
     * @private
     */
    _hasQuestionWord(text) {
        const questionWords = [
            // English
            'how', 'what', 'when', 'where', 'why', 'who', 'can', 'does', 'do', 'is', 'are',
            // Italian
            'come', 'cosa', 'quando', 'dove', 'perché', 'chi', 'posso', 'può', 'puoi',
            'è', 'sono', 'qual', 'quale', 'quanti', 'quante', 'quanto'
        ];

        const words = text.split(/\s+/);
        return words.some(word => questionWords.includes(word));
    }

    /**
     * Extracts the primary topic from a rules question
     * @param {string} text - The text containing the question
     * @returns {string|null} The extracted topic or null
     */
    extractRulesTopic(text) {
        const detection = this.detectRulesQuestion(text);
        return detection.extractedTopic || null;
    }

    /**
     * Checks if a specific term is a known rules mechanic
     * @param {string} term - The term to check
     * @returns {boolean}
     */
    isKnownMechanic(term) {
        if (!term || typeof term !== 'string') {
            return false;
        }

        const normalizedTerm = term.toLowerCase().trim();
        const mechanicTerms = this._getMechanicTerms();

        return normalizedTerm in mechanicTerms;
    }
}
