/**
 * AI Assistant Module for Narrator Master
 * Handles contextual suggestions and off-track detection using OpenAI GPT
 * @module ai-assistant
 */

import { MODULE_ID, SETTINGS } from './settings.js';
import { SceneDetector } from './scene-detector.js';
import { OpenAIServiceBase } from './openai-service-base.js';

/**
 * Default model for cost-effective suggestions
 * @constant {string}
 */
const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Maximum context tokens to avoid excessive API costs
 * @constant {number}
 */
const MAX_CONTEXT_TOKENS = 8000;

/**
 * Represents a contextual suggestion for the DM
 * @typedef {Object} Suggestion
 * @property {string} type - Type of suggestion ('narration', 'dialogue', 'action', 'reference')
 * @property {string} content - The suggestion text
 * @property {string} [pageReference] - Reference to journal page if applicable
 * @property {number} confidence - Confidence score 0-1
 */

/**
 * Represents the result of off-track detection
 * @typedef {Object} OffTrackResult
 * @property {boolean} isOffTrack - Whether players are off-track
 * @property {number} severity - Severity level 0-1 (0 = on track, 1 = completely off)
 * @property {string} reason - Explanation of why they're off-track
 * @property {string} [narrativeBridge] - Suggested content to bring them back
 */

/**
 * Represents a detected rules question
 * @typedef {Object} RulesQuestion
 * @property {string} text - The question text or matched phrase
 * @property {number} confidence - Confidence score 0-1
 * @property {string} type - Question type ('mechanic', 'action', 'spell', 'condition', 'general', etc.)
 * @property {string} [extractedTopic] - Extracted topic from the question
 * @property {string[]} detectedTerms - Array of detected D&D mechanic terms
 */

/**
 * Represents the context analysis result
 * @typedef {Object} ContextAnalysis
 * @property {Suggestion[]} suggestions - Array of contextual suggestions
 * @property {OffTrackResult} offTrackStatus - Off-track detection result
 * @property {string[]} relevantPages - IDs of relevant journal pages
 * @property {string} summary - Brief summary of current situation
 * @property {Object} sceneInfo - Scene detection information
 * @property {string} sceneInfo.type - The current scene type (exploration, combat, social, rest, unknown)
 * @property {boolean} sceneInfo.isTransition - Whether a scene transition was detected
 * @property {number} sceneInfo.timestamp - Timestamp of the analysis
 * @property {RulesQuestion[]} rulesQuestions - Array of detected rules questions
 */

/**
 * AIAssistant - Handles AI-powered suggestions and off-track detection for the DM
 * Uses OpenAI GPT-4o-mini for cost-effective real-time assistance
 */
export class AIAssistant extends OpenAIServiceBase {
    /**
     * Creates a new AIAssistant instance
     * @param {string} apiKey - The OpenAI API key
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.model='gpt-4o-mini'] - The model to use for suggestions
     * @param {string} [options.sensitivity='medium'] - Off-track detection sensitivity
     */
    constructor(apiKey, options = {}) {
        // Call parent constructor
        super(apiKey, options);

        /**
         * Model to use for chat completions
         * @type {string}
         * @private
         */
        this._model = options.model || DEFAULT_MODEL;

        /**
         * Off-track detection sensitivity (low, medium, high)
         * @type {string}
         * @private
         */
        this._sensitivity = options.sensitivity || 'medium';

        /**
         * Cached adventure context from journal
         * @type {string}
         * @private
         */
        this._adventureContext = '';

        /**
         * Recent conversation history for context
         * @type {Array<{role: string, content: string}>}
         * @private
         */
        this._conversationHistory = [];

        /**
         * Maximum conversation history entries to keep
         * @type {number}
         * @private
         */
        this._maxHistorySize = 20;

        /**
         * Current session state tracking
         * @type {Object}
         * @private
         */
        this._sessionState = {
            currentScene: null,
            lastOffTrackCheck: null,
            suggestionsCount: 0
        };

        /**
         * Primary/detected language for AI responses
         * @type {string}
         * @private
         */
        this._primaryLanguage = 'it'; // Default to Italian for backward compatibility

        /**
         * Scene detector instance for scene awareness
         * @type {SceneDetector|null}
         * @private
         */
        this._sceneDetector = options.sceneDetector || null;

        /**
         * Previous transcription text for scene comparison
         * @type {string}
         * @private
         */
        this._previousTranscription = '';

        /**
         * Current chapter/scene context for focused analysis
         * @type {Object|null}
         * @private
         */
        this._chapterContext = null;
    }

    /**
     * Sets the model to use for suggestions
     * @param {string} model - The model name
     */
    setModel(model) {
        this._model = model || DEFAULT_MODEL;
    }

    /**
     * Gets the current model
     * @returns {string} The model name
     */
    getModel() {
        return this._model;
    }

    /**
     * Sets the off-track detection sensitivity
     * @param {string} sensitivity - 'low', 'medium', or 'high'
     */
    setSensitivity(sensitivity) {
        if (['low', 'medium', 'high'].includes(sensitivity)) {
            this._sensitivity = sensitivity;
        }
    }

    /**
     * Gets the current sensitivity setting
     * @returns {string} The sensitivity level
     */
    getSensitivity() {
        return this._sensitivity;
    }

    /**
     * Sets the adventure context from parsed journal content
     * @param {string} context - The adventure content text
     */
    setAdventureContext(context) {
        this._adventureContext = context || '';
    }

    /**
     * Gets the current adventure context
     * @returns {string} The adventure context
     */
    getAdventureContext() {
        return this._adventureContext;
    }

    /**
     * Sets the primary language for AI responses
     * @param {string} language - The language code (e.g., 'it', 'en', 'de')
     */
    setPrimaryLanguage(language) {
        this._primaryLanguage = language || 'it';
    }

    /**
     * Gets the current primary language
     * @returns {string} The language code
     */
    getPrimaryLanguage() {
        return this._primaryLanguage;
    }

    /**
     * Sets the scene detector instance
     * @param {SceneDetector} sceneDetector - The scene detector instance
     */
    setSceneDetector(sceneDetector) {
        this._sceneDetector = sceneDetector;
    }

    /**
     * Gets the scene detector instance
     * @returns {SceneDetector|null} The scene detector instance
     */
    getSceneDetector() {
        return this._sceneDetector;
    }

    /**
     * Sets the current chapter/scene context for focused analysis
     * This provides the AI with specific information about the current chapter,
     * its subsections, and page references to improve suggestion relevance
     * @param {Object|null} chapterInfo - The chapter context information
     * @param {string} [chapterInfo.chapterName] - Name of the current chapter
     * @param {string[]} [chapterInfo.subsections] - Array of subsection names within the chapter
     * @param {Object[]} [chapterInfo.pageReferences] - Array of page reference objects
     * @param {string} [chapterInfo.pageReferences[].pageId] - The page ID
     * @param {string} [chapterInfo.pageReferences[].pageName] - The page name
     * @param {string} [chapterInfo.pageReferences[].journalName] - The parent journal name
     * @param {string} [chapterInfo.summary] - Brief summary of the chapter content
     */
    setChapterContext(chapterInfo) {
        if (chapterInfo === null || chapterInfo === undefined) {
            this._chapterContext = null;
            return;
        }

        // Validate and sanitize the chapter context
        this._chapterContext = {
            chapterName: this._validateString(chapterInfo.chapterName || '', 200, 'chapterContext.chapterName'),
            subsections: this._validateArray(chapterInfo.subsections || [], 50, 'chapterContext.subsections')
                .map(s => this._validateString(s, 200, 'chapterContext.subsection')),
            pageReferences: this._validateArray(chapterInfo.pageReferences || [], 50, 'chapterContext.pageReferences')
                .map(ref => ({
                    pageId: this._validateString(ref.pageId || '', 100, 'pageReference.pageId'),
                    pageName: this._validateString(ref.pageName || '', 200, 'pageReference.pageName'),
                    journalName: this._validateString(ref.journalName || '', 200, 'pageReference.journalName')
                })),
            summary: this._validateString(chapterInfo.summary || '', 2000, 'chapterContext.summary')
        };
    }

    /**
     * Gets the current chapter context
     * @returns {Object|null} The chapter context or null if not set
     */
    getChapterContext() {
        return this._chapterContext;
    }

    /**
     * Formats the chapter context for inclusion in AI prompts
     * @returns {string} Formatted chapter context string or empty string if not set
     * @private
     */
    _formatChapterContext() {
        if (!this._chapterContext) {
            return '';
        }

        const parts = [];

        if (this._chapterContext.chapterName) {
            parts.push(`CAPITOLO CORRENTE: ${this._chapterContext.chapterName}`);
        }

        if (this._chapterContext.subsections && this._chapterContext.subsections.length > 0) {
            parts.push(`SEZIONI: ${this._chapterContext.subsections.join(', ')}`);
        }

        if (this._chapterContext.pageReferences && this._chapterContext.pageReferences.length > 0) {
            const refs = this._chapterContext.pageReferences
                .filter(ref => ref.pageName)
                .map(ref => {
                    if (ref.journalName) {
                        return `"${ref.pageName}" (${ref.journalName})`;
                    }
                    return `"${ref.pageName}"`;
                });
            if (refs.length > 0) {
                parts.push(`PAGINE DI RIFERIMENTO: ${refs.join(', ')}`);
            }
        }

        if (this._chapterContext.summary) {
            parts.push(`RIEPILOGO: ${this._chapterContext.summary}`);
        }

        return parts.join('\n');
    }

    /**
     * Represents a chapter recovery option for silence scenarios
     * @typedef {Object} ChapterRecoveryOption
     * @property {string} id - Unique identifier for the option
     * @property {string} label - Display label for the option (subsection/page name)
     * @property {string} type - Type of option ('subsection', 'page', 'summary')
     * @property {string} [pageId] - Associated page ID if type is 'page'
     * @property {string} [journalName] - Parent journal name if type is 'page'
     * @property {string} description - Brief description or context for this option
     */

    /**
     * Generates clickable sub-chapter recovery options for silence scenarios
     * When players are silent or stuck, this method provides quick navigation options
     * based on the current chapter's structure (subsections and page references)
     * @param {Object} currentChapter - The current chapter context
     * @param {string} [currentChapter.chapterName] - Name of the current chapter
     * @param {string[]} [currentChapter.subsections] - Array of subsection names within the chapter
     * @param {Object[]} [currentChapter.pageReferences] - Array of page reference objects
     * @param {string} [currentChapter.pageReferences[].pageId] - The page ID
     * @param {string} [currentChapter.pageReferences[].pageName] - The page name
     * @param {string} [currentChapter.pageReferences[].journalName] - The parent journal name
     * @param {string} [currentChapter.summary] - Brief summary of the chapter content
     * @returns {ChapterRecoveryOption[]} Array of recovery options for UI display
     */
    generateChapterRecoveryOptions(currentChapter) {
        const options = [];

        // Return empty array if no chapter provided
        if (!currentChapter || typeof currentChapter !== 'object') {
            console.warn(`${MODULE_ID} | No chapter context provided for recovery options`);
            return options;
        }

        const chapterName = this._validateString(currentChapter.chapterName || '', 200, 'recovery.chapterName');

        // Add subsection options
        const subsections = this._validateArray(currentChapter.subsections || [], 50, 'recovery.subsections');
        for (let i = 0; i < subsections.length; i++) {
            const subsectionName = this._validateString(subsections[i] || '', 200, 'recovery.subsection');
            if (subsectionName) {
                options.push({
                    id: `subsection-${i}`,
                    label: subsectionName,
                    type: 'subsection',
                    description: chapterName
                        ? game.i18n.format('NARRATOR.Recovery.SubsectionOf', { chapter: chapterName })
                        : game.i18n.localize('NARRATOR.Recovery.Subsection')
                });
            }
        }

        // Add page reference options
        const pageReferences = this._validateArray(currentChapter.pageReferences || [], 50, 'recovery.pageReferences');
        for (let i = 0; i < pageReferences.length; i++) {
            const ref = pageReferences[i];
            if (!ref || typeof ref !== 'object') {
                continue;
            }

            const pageName = this._validateString(ref.pageName || '', 200, 'recovery.pageName');
            const pageId = this._validateString(ref.pageId || '', 100, 'recovery.pageId');
            const journalName = this._validateString(ref.journalName || '', 200, 'recovery.journalName');

            if (pageName) {
                options.push({
                    id: `page-${pageId || i}`,
                    label: pageName,
                    type: 'page',
                    pageId: pageId || undefined,
                    journalName: journalName || undefined,
                    description: journalName
                        ? game.i18n.format('NARRATOR.Recovery.PageIn', { journal: journalName })
                        : game.i18n.localize('NARRATOR.Recovery.Page')
                });
            }
        }

        // Add summary option if available and there are other options
        const summary = this._validateString(currentChapter.summary || '', 2000, 'recovery.summary');
        if (summary && options.length > 0) {
            options.unshift({
                id: 'summary',
                label: chapterName || game.i18n.localize('NARRATOR.Recovery.ChapterSummary'),
                type: 'summary',
                description: summary.length > 100 ? summary.substring(0, 100) + '...' : summary
            });
        }

        console.log(`${MODULE_ID} | Generated ${options.length} chapter recovery options`);

        return options;
    }

    /**
     * Analyzes the current game context and generates suggestions
     * @param {string} transcription - Recent transcribed conversation
     * @param {Object} [options={}] - Analysis options
     * @param {boolean} [options.includeSuggestions=true] - Generate suggestions
     * @param {boolean} [options.checkOffTrack=true] - Check if off-track
     * @param {boolean} [options.detectRules=true] - Detect rules questions
     * @returns {Promise<ContextAnalysis>} The analysis result
     */
    async analyzeContext(transcription, options = {}) {
        if (!this.isConfigured()) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
        }

        if (!transcription || typeof transcription !== 'string') {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoTranscription'));
        }

        const includeSuggestions = options.includeSuggestions !== false;
        const checkOffTrack = options.checkOffTrack !== false;
        const detectRules = options.detectRules !== false;

        console.log(`${MODULE_ID} | Analyzing context, transcription length: ${transcription.length}`);

        // Detect languages in transcription
        const detectedLanguages = this._detectLanguagesInTranscription(transcription);

        // Detect rules questions if enabled
        let rulesDetection = null;
        if (detectRules) {
            rulesDetection = this._detectRulesQuestions(transcription);
            if (rulesDetection.hasRulesQuestions) {
                console.log(`${MODULE_ID} | Detected ${rulesDetection.questions.length} rules question(s)`);
            }
        }

        try {
            // Build the analysis prompt
            const messages = this._buildAnalysisMessages(transcription, includeSuggestions, checkOffTrack, detectedLanguages);

            // Make API request
            const response = await this._makeApiRequest(messages);

            // Parse the response
            const analysis = this._parseAnalysisResponse(response);

            // Detect scene transitions if scene detector is available
            const sceneInfo = this._detectSceneInfo(transcription);

            // Add rules questions to analysis if detected
            analysis.rulesQuestions = rulesDetection?.questions || [];

            // Update conversation history
            this._addToHistory('user', transcription);
            this._addToHistory('assistant', JSON.stringify(analysis));

            this._sessionState.suggestionsCount++;

            console.log(`${MODULE_ID} | Analysis complete, ${analysis.suggestions.length} suggestions`);

            // Store current transcription for next comparison
            this._previousTranscription = transcription;

            // Add scene info to analysis result
            return {
                ...analysis,
                sceneInfo
            };

        } catch (error) {
            if (error.status) {
                throw this._handleApiError(error, 'AI Assistant');
            }
            throw error;
        }
    }

    /**
     * Detects if the players are off-track from the adventure
     * @param {string} transcription - Recent transcribed conversation
     * @returns {Promise<OffTrackResult>} The off-track detection result
     */
    async detectOffTrack(transcription) {
        if (!this.isConfigured()) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
        }

        if (!this._adventureContext) {
            console.warn(`${MODULE_ID} | No adventure context set, skipping off-track detection`);
            return {
                isOffTrack: false,
                severity: 0,
                reason: game.i18n.localize('NARRATOR.OffTrack.NoContext')
            };
        }

        console.log(`${MODULE_ID} | Checking off-track status`);

        // Detect languages in transcription
        const detectedLanguages = this._detectLanguagesInTranscription(transcription);

        try {
            const messages = this._buildOffTrackMessages(transcription, detectedLanguages);
            const response = await this._makeApiRequest(messages);
            const result = this._parseOffTrackResponse(response);

            this._sessionState.lastOffTrackCheck = new Date();

            return result;

        } catch (error) {
            if (error.status) {
                throw this._handleApiError(error, 'AI Assistant');
            }
            throw error;
        }
    }

    /**
     * Generates contextual suggestions for the DM
     * @param {string} transcription - Recent transcribed conversation
     * @param {Object} [options={}] - Generation options
     * @param {number} [options.maxSuggestions=3] - Maximum suggestions to generate
     * @param {string[]} [options.types] - Types of suggestions to include
     * @returns {Promise<Suggestion[]>} Array of suggestions
     */
    async generateSuggestions(transcription, options = {}) {
        if (!this.isConfigured()) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
        }

        const maxSuggestions = options.maxSuggestions || 3;

        console.log(`${MODULE_ID} | Generating suggestions`);

        // Detect languages in transcription
        const detectedLanguages = this._detectLanguagesInTranscription(transcription);

        try {
            const messages = this._buildSuggestionMessages(transcription, maxSuggestions, detectedLanguages);
            const response = await this._makeApiRequest(messages);
            const suggestions = this._parseSuggestionsResponse(response, maxSuggestions);

            return suggestions;

        } catch (error) {
            if (error.status) {
                throw this._handleApiError(error, 'AI Assistant');
            }
            throw error;
        }
    }

    /**
     * Generates a narrative bridge to guide players back on track
     * @param {string} currentSituation - Description of current off-track situation
     * @param {string} targetScene - The intended scene/situation to return to
     * @returns {Promise<string>} The narrative bridge text
     */
    async generateNarrativeBridge(currentSituation, targetScene) {
        if (!this.isConfigured()) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
        }

        console.log(`${MODULE_ID} | Generating narrative bridge`);

        try {
            const messages = this._buildNarrativeBridgeMessages(currentSituation, targetScene);
            const response = await this._makeApiRequest(messages);

            // Extract the narrative from response
            const content = response.choices?.[0]?.message?.content || '';
            return content.trim();

        } catch (error) {
            if (error.status) {
                throw this._handleApiError(error, 'AI Assistant');
            }
            throw error;
        }
    }

    /**
     * Generates dialogue options for a specific NPC
     * @param {string} npcName - The name of the NPC
     * @param {string} npcContext - NPC personality and backstory from journal
     * @param {string} transcription - Current conversation context
     * @param {Object} [options={}] - Generation options
     * @param {number} [options.maxOptions=3] - Maximum dialogue options to generate
     * @returns {Promise<string[]>} Array of dialogue strings
     */
    async generateNPCDialogue(npcName, npcContext, transcription, options = {}) {
        if (!this.isConfigured()) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
        }

        if (!npcName || typeof npcName !== 'string') {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NPCNotFound'));
        }

        const maxOptions = options.maxOptions || 3;

        console.log(`${MODULE_ID} | Generating NPC dialogue for ${npcName}`);

        // Detect languages in transcription
        const detectedLanguages = this._detectLanguagesInTranscription(transcription);

        try {
            const messages = this._buildNPCDialogueMessages(npcName, npcContext, transcription, maxOptions, detectedLanguages);
            const response = await this._makeApiRequest(messages);
            const dialogueOptions = this._parseNPCDialogueResponse(response, maxOptions);

            return dialogueOptions;

        } catch (error) {
            if (error.status) {
                throw this._handleApiError(error, 'AI Assistant');
            }
            throw error;
        }
    }

    /**
     * Detects which NPCs from a known list are mentioned in the transcription
     * @param {string} transcription - The transcription text to analyze
     * @param {Array<{name: string}>} npcList - Array of NPC objects with at least a name property
     * @returns {string[]} Array of NPC names mentioned in the transcription
     */
    detectNPCMentions(transcription, npcList) {
        if (!transcription || typeof transcription !== 'string') {
            console.warn(`${MODULE_ID} | Invalid transcription provided to detectNPCMentions`);
            return [];
        }

        if (!Array.isArray(npcList) || npcList.length === 0) {
            console.warn(`${MODULE_ID} | No NPCs provided to detectNPCMentions`);
            return [];
        }

        console.log(`${MODULE_ID} | Detecting NPC mentions in transcription (${npcList.length} NPCs to check)`);

        // Normalize transcription for case-insensitive matching
        const normalizedTranscription = transcription.toLowerCase();

        // Find NPCs mentioned in the transcription
        const mentionedNPCs = [];

        for (const npc of npcList) {
            if (!npc || !npc.name) {
                continue;
            }

            const npcName = npc.name.trim();
            if (!npcName) {
                continue;
            }

            // Check for exact name match (case-insensitive)
            // Use word boundaries to avoid partial matches (e.g., "Smith" shouldn't match "Blacksmith")
            const pattern = new RegExp(`\\b${this._escapeRegex(npcName)}\\b`, 'i');

            if (pattern.test(transcription)) {
                mentionedNPCs.push(npcName);
            }
        }

        console.log(`${MODULE_ID} | Found ${mentionedNPCs.length} NPC mentions: ${mentionedNPCs.join(', ')}`);

        return mentionedNPCs;
    }

    /**
     * Detects rules questions in a transcription
     * @param {string} transcription - The transcription text to analyze
     * @returns {Object} Detection result with hasRulesQuestions flag and question details
     * @property {boolean} hasRulesQuestions - Whether rules questions were detected
     * @property {Array<Object>} questions - Array of detected questions with details
     * @private
     */
    _detectRulesQuestions(transcription) {
        if (!transcription || typeof transcription !== 'string') {
            return {
                hasRulesQuestions: false,
                questions: []
            };
        }

        const normalizedText = transcription.toLowerCase();
        const questions = [];

        // Question patterns (both English and Italian)
        const questionPatterns = [
            // English patterns
            { regex: /(?:how does|how do|what is the rule for|what are the rules for)\s+([a-z\s]+?)(?:\s+work|\?|$)/gi, confidence: 0.9, type: 'mechanic' },
            { regex: /(?:can i|can you|am i able to|is it possible to)\s+([a-z\s]+?)(?:\?|$)/gi, confidence: 0.7, type: 'action' },
            { regex: /(?:what happens when|what happens if)\s+([a-z\s]+?)(?:\?|$)/gi, confidence: 0.8, type: 'mechanic' },

            // Italian patterns
            { regex: /(?:come funziona|come funzionano|qual è la regola per|quali sono le regole per)\s+([a-z\s]+?)(?:\?|$)/gi, confidence: 0.9, type: 'mechanic' },
            { regex: /(?:posso|possiamo|è possibile|si può)\s+([a-z\s]+?)(?:\?|$)/gi, confidence: 0.7, type: 'action' },
            { regex: /(?:cosa succede quando|cosa succede se|che succede se)\s+([a-z\s]+?)(?:\?|$)/gi, confidence: 0.8, type: 'mechanic' },
            { regex: /(?:quanto costa|quanti slot|quante azioni)\s+([a-z\s]+?)(?:\?|$)/gi, confidence: 0.8, type: 'spell' },
            { regex: /\b(?:regola|regole|meccanica|meccaniche|rule|rules|mechanic|mechanics)\b/gi, confidence: 0.6, type: 'general' }
        ];

        // Known D&D mechanic terms
        const mechanicTerms = {
            'grappling': 'combat',
            'lotta': 'combat',
            'opportunity attack': 'combat',
            'attacco di opportunità': 'combat',
            'advantage': 'combat',
            'vantaggio': 'combat',
            'disadvantage': 'combat',
            'svantaggio': 'combat',
            'concentration': 'spell',
            'concentrazione': 'spell',
            'spell slot': 'spell',
            'slot incantesimo': 'spell',
            'prone': 'condition',
            'prono': 'condition',
            'stunned': 'condition',
            'stordito': 'condition',
            'saving throw': 'ability',
            'tiro salvezza': 'ability',
            'short rest': 'rest',
            'riposo breve': 'rest',
            'long rest': 'rest',
            'riposo lungo': 'rest'
        };

        // Check for question patterns
        for (const pattern of questionPatterns) {
            const matches = normalizedText.matchAll(pattern.regex);
            for (const match of matches) {
                const extractedTopic = match[1] ? match[1].trim() : null;
                const detectedTerms = [];

                // Check if any mechanic terms are in the matched text
                let category = pattern.type;
                if (extractedTopic) {
                    for (const [term, termCategory] of Object.entries(mechanicTerms)) {
                        if (extractedTopic.includes(term) || normalizedText.includes(term)) {
                            detectedTerms.push(term);
                            category = termCategory;
                        }
                    }
                }

                // Only add if confidence threshold is met or mechanic terms detected
                if (pattern.confidence > 0.5 || detectedTerms.length > 0) {
                    questions.push({
                        text: match[0],
                        confidence: Math.min(pattern.confidence + (detectedTerms.length * 0.1), 1.0),
                        type: category,
                        extractedTopic,
                        detectedTerms
                    });
                }
            }
        }

        // Also check for mechanic terms even without explicit question patterns
        for (const [term, category] of Object.entries(mechanicTerms)) {
            if (normalizedText.includes(term) && this._hasQuestionWord(normalizedText)) {
                // Check if we already detected this
                const alreadyDetected = questions.some(q =>
                    q.extractedTopic && q.extractedTopic.includes(term)
                );

                if (!alreadyDetected) {
                    questions.push({
                        text: term,
                        confidence: 0.6,
                        type: category,
                        extractedTopic: term,
                        detectedTerms: [term]
                    });
                }
            }
        }

        return {
            hasRulesQuestions: questions.length > 0,
            questions
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
     * Builds the system prompt for the AI assistant
     * @param {Object} [options={}] - Options for customizing the prompt
     * @param {string} [options.chapterContext] - Current chapter/scene context from the adventure (overrides stored context)
     * @returns {string} The system prompt
     * @private
     */
    _buildSystemPrompt(options = {}) {
        // Use provided chapterContext or format from stored _chapterContext
        const chapterContext = options.chapterContext || this._formatChapterContext();

        const sensitivityGuide = {
            low: 'Sii tollerante con le deviazioni minori, segnala solo quando i giocatori si allontanano completamente dalla storia.',
            medium: 'Bilancia la tolleranza per l\'improvvisazione con l\'aderenza alla trama principale.',
            high: 'Monitora attentamente ogni deviazione dalla trama e segnala anche variazioni minori.'
        };

        // Map language codes to language names for instructions
        const languageNames = {
            'it': 'italiano',
            'en': 'inglese',
            'de': 'tedesco',
            'fr': 'francese',
            'es': 'spagnolo',
            'pt': 'portoghese',
            'pl': 'polacco',
            'ru': 'russo',
            'ja': 'giapponese',
            'ko': 'coreano',
            'zh': 'cinese',
            'ar': 'arabo',
            'nl': 'olandese',
            'sv': 'svedese',
            'da': 'danese',
            'no': 'norvegese',
            'fi': 'finlandese',
            'tr': 'turco',
            'cs': 'ceco',
            'hu': 'ungherese',
            'ro': 'rumeno'
        };

        const responseLang = languageNames[this._primaryLanguage] || languageNames['it'];

        // Build chapter context section if provided
        const chapterSection = chapterContext
            ? `\n\nCONTESTO CAPITOLO/SCENA CORRENTE:\n${chapterContext}`
            : '';

        return `Sei un assistente per Dungeon Master (GM) esperto in giochi di ruolo fantasy.
Il tuo UNICO scopo è aiutare il GM durante le sessioni di gioco.

## REGOLE FONDAMENTALI (ANTI-ALLUCINAZIONE)

1. **USA SOLO IL MATERIALE FORNITO**: Basa TUTTE le tue risposte esclusivamente sul contenuto del Journal/Compendium fornito nel contesto. NON inventare dettagli, PNG, luoghi, eventi o informazioni non presenti nel materiale.

2. **CITA SEMPRE LE FONTI**: Ogni suggerimento DEVE includere il riferimento alla pagina/sezione del Journal da cui proviene l'informazione (es. "[Fonte: Capitolo 2 - La Taverna]").

3. **AMMETTI QUANDO NON SAI**: Se un'informazione non è presente nel materiale fornito, rispondi esplicitamente: "Informazione non trovata nel materiale dell'avventura" oppure "Non presente nel Journal/Compendium".

4. **NON COMPLETARE CON SUPPOSIZIONI**: Se il materiale è incompleto o vago, NON colmare le lacune con contenuto inventato. Segnala invece cosa manca.

## IL TUO COMPITO

Aiuta il GM fornendo:
1. **Suggerimenti contestuali** basati sulla conversazione dei giocatori, con riferimento preciso al materiale
2. **Riferimenti diretti** alle parti rilevanti dell'avventura (cita pagina/sezione)
3. **Rilevamento off-track** quando i giocatori escono dal tema dell'avventura
4. **Ponti narrativi** per riportare delicatamente i giocatori nella storia (basati solo su elementi già presenti nel materiale)
${chapterSection}

## FORMATO RISPOSTE

- Rispondi nella stessa lingua della trascrizione (${responseLang})
- Includi SEMPRE il campo "pageReference" con la fonte nel materiale
- Se non trovi informazioni rilevanti, imposta confidence a 0 e indica "Non trovato nel materiale"

## SENSIBILITÀ OFF-TRACK

${sensitivityGuide[this._sensitivity]}

## IMPORTANTE

- NON sei un narratore che inventa storie
- SEI un assistente che recupera e organizza informazioni dal materiale esistente
- Quando i giocatori sono fuori tema, suggerisci modi per riportarli nella storia usando SOLO elementi già presenti nel materiale`;
    }

    /**
     * Detects languages present in transcription based on language labels
     * @param {string} transcription - The transcription text (may include language labels)
     * @returns {string[]} Array of detected language codes (e.g., ['it', 'en'])
     * @private
     */
    _detectLanguagesInTranscription(transcription) {
        // Match language labels in format "Speaker (lang): text"
        const languagePattern = /\(([a-z]{2,3})\):/gi;
        const matches = transcription.matchAll(languagePattern);

        const languages = new Set();
        for (const match of matches) {
            if (match[1]) {
                languages.add(match[1].toLowerCase());
            }
        }

        return Array.from(languages);
    }

    /**
     * Builds messages for context analysis
     * @param {string} transcription - The transcription to analyze
     * @param {boolean} includeSuggestions - Whether to include suggestions
     * @param {boolean} checkOffTrack - Whether to check off-track status
     * @param {string[]} [detectedLanguages=[]] - Detected languages in transcription
     * @returns {Array<{role: string, content: string}>} The messages array
     * @private
     */
    _buildAnalysisMessages(transcription, includeSuggestions, checkOffTrack, detectedLanguages = []) {
        const messages = [
            { role: 'system', content: this._buildSystemPrompt() }
        ];

        // Add adventure context if available
        if (this._adventureContext) {
            messages.push({
                role: 'system',
                content: `CONTESTO AVVENTURA:\n${this._truncateContext(this._adventureContext)}`
            });
        }

        // Add recent conversation history
        for (const entry of this._conversationHistory.slice(-5)) {
            messages.push(entry);
        }

        // Build the analysis request
        let requestContent = `Analizza questa trascrizione della sessione:\n\n"${transcription}"\n\n`;

        // Add multi-language context if detected
        if (detectedLanguages.length > 1) {
            requestContent += `NOTA: Questa trascrizione contiene più lingue (${detectedLanguages.join(', ')}). Le etichette di lingua sono indicate tra parentesi dopo il nome del parlante (es. "Speaker (en):"). Rispondi nella lingua primaria identificata o in una miscela appropriata delle lingue usate.\n\n`;
        } else if (detectedLanguages.length === 1) {
            // Update primary language based on detected language
            this._primaryLanguage = detectedLanguages[0];
        }

        if (includeSuggestions && checkOffTrack) {
            requestContent += `Rispondi in formato JSON con questa struttura:
{
  "suggestions": [{"type": "narration|dialogue|action|reference", "content": "...", "confidence": 0.0-1.0}],
  "offTrackStatus": {"isOffTrack": boolean, "severity": 0.0-1.0, "reason": "..."},
  "relevantPages": ["..."],
  "summary": "..."
}`;
        } else if (includeSuggestions) {
            requestContent += `Fornisci suggerimenti per il DM in formato JSON:
{
  "suggestions": [{"type": "narration|dialogue|action|reference", "content": "...", "confidence": 0.0-1.0}],
  "summary": "..."
}`;
        } else if (checkOffTrack) {
            requestContent += `Valuta se i giocatori sono fuori tema in formato JSON:
{
  "offTrackStatus": {"isOffTrack": boolean, "severity": 0.0-1.0, "reason": "..."},
  "summary": "..."
}`;
        }

        messages.push({ role: 'user', content: requestContent });

        return messages;
    }

    /**
     * Builds messages for off-track detection
     * @param {string} transcription - The transcription to analyze
     * @param {string[]} [detectedLanguages=[]] - Detected languages in transcription
     * @returns {Array<{role: string, content: string}>} The messages array
     * @private
     */
    _buildOffTrackMessages(transcription, detectedLanguages = []) {
        const messages = [
            { role: 'system', content: this._buildSystemPrompt() }
        ];

        if (this._adventureContext) {
            messages.push({
                role: 'system',
                content: `CONTESTO AVVENTURA:\n${this._truncateContext(this._adventureContext)}`
            });
        }

        let requestContent = `Analizza se i giocatori stanno seguendo la trama dell'avventura basandoti su questa trascrizione:

"${transcription}"

`;

        // Add multi-language context if detected
        if (detectedLanguages.length > 1) {
            requestContent += `NOTA: Questa trascrizione contiene più lingue (${detectedLanguages.join(', ')}). Le etichette di lingua sono indicate tra parentesi.\n\n`;
        } else if (detectedLanguages.length === 1) {
            // Update primary language based on detected language
            this._primaryLanguage = detectedLanguages[0];
        }

        requestContent += `Rispondi in formato JSON:
{
  "isOffTrack": boolean,
  "severity": 0.0-1.0,
  "reason": "spiegazione breve",
  "narrativeBridge": "suggerimento opzionale per riportarli in tema"
}`;

        messages.push({ role: 'user', content: requestContent });

        return messages;
    }

    /**
     * Builds messages for suggestion generation
     * @param {string} transcription - The transcription to analyze
     * @param {number} maxSuggestions - Maximum suggestions to generate
     * @param {string[]} [detectedLanguages=[]] - Detected languages in transcription
     * @returns {Array<{role: string, content: string}>} The messages array
     * @private
     */
    _buildSuggestionMessages(transcription, maxSuggestions, detectedLanguages = []) {
        const messages = [
            { role: 'system', content: this._buildSystemPrompt() }
        ];

        if (this._adventureContext) {
            messages.push({
                role: 'system',
                content: `CONTESTO AVVENTURA:\n${this._truncateContext(this._adventureContext)}`
            });
        }

        let requestContent = `Basandoti su questa trascrizione, genera fino a ${maxSuggestions} suggerimenti per il DM:

"${transcription}"

`;

        // Add multi-language context if detected
        if (detectedLanguages.length > 1) {
            requestContent += `NOTA: Questa trascrizione contiene più lingue (${detectedLanguages.join(', ')}). Le etichette di lingua sono indicate tra parentesi.\n\n`;
        } else if (detectedLanguages.length === 1) {
            // Update primary language based on detected language
            this._primaryLanguage = detectedLanguages[0];
        }

        requestContent += `Rispondi in formato JSON:
{
  "suggestions": [
    {
      "type": "narration|dialogue|action|reference",
      "content": "il suggerimento",
      "pageReference": "nome pagina se applicabile",
      "confidence": 0.0-1.0
    }
  ]
}`;

        messages.push({ role: 'user', content: requestContent });

        return messages;
    }

    /**
     * Builds messages for narrative bridge generation
     * @param {string} currentSituation - Current off-track situation
     * @param {string} targetScene - Target scene to return to
     * @returns {Array<{role: string, content: string}>} The messages array
     * @private
     */
    _buildNarrativeBridgeMessages(currentSituation, targetScene) {
        const messages = [
            { role: 'system', content: this._buildSystemPrompt() }
        ];

        if (this._adventureContext) {
            messages.push({
                role: 'system',
                content: `CONTESTO AVVENTURA:\n${this._truncateContext(this._adventureContext)}`
            });
        }

        messages.push({
            role: 'user',
            content: `I giocatori si sono allontanati dalla trama principale.

Situazione attuale: ${currentSituation}
Scena obiettivo: ${targetScene}

Scrivi una breve narrazione (2-3 frasi) che il DM può usare per riportare delicatamente i giocatori verso la scena obiettivo, mantenendo la continuità narrativa. Non forzare la transizione, ma crea un collegamento naturale.`
        });

        return messages;
    }

    /**
     * Builds messages for NPC dialogue generation
     * @param {string} npcName - The name of the NPC
     * @param {string} npcContext - NPC personality and backstory
     * @param {string} transcription - Current conversation context
     * @param {number} maxOptions - Maximum dialogue options to generate
     * @param {string[]} [detectedLanguages=[]] - Detected languages in transcription
     * @returns {Array<{role: string, content: string}>} The messages array
     * @private
     */
    _buildNPCDialogueMessages(npcName, npcContext, transcription, maxOptions, detectedLanguages = []) {
        const messages = [
            { role: 'system', content: this._buildSystemPrompt() }
        ];

        // Add NPC context as system message
        if (npcContext) {
            messages.push({
                role: 'system',
                content: `PROFILO NPC - ${npcName}:\n${this._truncateContext(npcContext)}`
            });
        }

        let requestContent = `Genera ${maxOptions} opzioni di dialogo per il personaggio "${npcName}" basandoti sul contesto della conversazione:

"${transcription}"

`;

        // Add multi-language context if detected
        if (detectedLanguages.length > 1) {
            requestContent += `NOTA: Questa trascrizione contiene più lingue (${detectedLanguages.join(', ')}). Le etichette di lingua sono indicate tra parentesi.\n\n`;
        } else if (detectedLanguages.length === 1) {
            // Update primary language based on detected language
            this._primaryLanguage = detectedLanguages[0];
        }

        requestContent += `Il personaggio deve rispondere in modo coerente con la sua personalità e il contesto.
Rispondi in formato JSON:
{
  "dialogueOptions": [
    "opzione dialogo 1",
    "opzione dialogo 2",
    "opzione dialogo 3"
  ]
}`;

        messages.push({ role: 'user', content: requestContent });

        return messages;
    }

    /**
     * Makes an API request to OpenAI Chat Completions
     * @param {Array<{role: string, content: string}>} messages - The messages to send
     * @returns {Promise<Object>} The API response
     * @private
     */
    async _makeApiRequest(messages) {
        let response;

        try {
            response = await fetch(`${this._baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this._apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this._model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });
        } catch (networkError) {
            // Handle network errors (no connection, timeout, etc.)
            console.error(`${MODULE_ID} | Network error during AI request:`, networkError);
            throw this._createNetworkError(networkError);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw {
                message: errorData.error?.message || 'API request failed',
                code: errorData.error?.code || 'unknown',
                status: response.status
            };
        }

        return await response.json();
    }

    /**
     * Parses the analysis response from the API
     * @param {Object} response - The API response
     * @returns {ContextAnalysis} The parsed analysis
     * @private
     */
    _parseAnalysisResponse(response) {
        const content = response.choices?.[0]?.message?.content || '{}';

        try {
            // Try to parse as JSON
            const parsed = JSON.parse(this._extractJson(content));

            // Validate and sanitize suggestions array
            const validatedSuggestions = this._validateArray(
                parsed.suggestions,
                10,
                'suggestions'
            ).map(s => ({
                type: s.type || 'narration',
                content: this._validateString(s.content || '', 5000, 'suggestion.content'),
                pageReference: s.pageReference ? this._validateString(s.pageReference, 200, 'suggestion.pageReference') : undefined,
                confidence: this._validateNumber(s.confidence, 0, 1, 'suggestion.confidence')
            }));

            // Validate and sanitize offTrackStatus
            const offTrackStatus = parsed.offTrackStatus ? {
                isOffTrack: Boolean(parsed.offTrackStatus.isOffTrack),
                severity: this._validateNumber(parsed.offTrackStatus.severity, 0, 1, 'offTrackStatus.severity'),
                reason: this._validateString(parsed.offTrackStatus.reason || '', 1000, 'offTrackStatus.reason'),
                narrativeBridge: parsed.offTrackStatus.narrativeBridge ?
                    this._validateString(parsed.offTrackStatus.narrativeBridge, 2000, 'offTrackStatus.narrativeBridge') :
                    undefined
            } : {
                isOffTrack: false,
                severity: 0,
                reason: ''
            };

            return {
                suggestions: validatedSuggestions,
                offTrackStatus: offTrackStatus,
                relevantPages: this._validateArray(parsed.relevantPages, 20, 'relevantPages'),
                summary: this._validateString(parsed.summary || '', 2000, 'summary'),
                rulesQuestions: [] // Will be populated by analyzeContext
            };

        } catch (error) {
            console.warn(`${MODULE_ID} | Failed to parse analysis response as JSON, using fallback`);

            // Apply validation even to fallback content
            const sanitizedContent = this._validateString(content, 5000, 'fallback.content');
            const sanitizedSummary = this._validateString(content, 200, 'fallback.summary');

            return {
                suggestions: [{
                    type: 'narration',
                    content: sanitizedContent,
                    confidence: 0.5
                }],
                offTrackStatus: {
                    isOffTrack: false,
                    severity: 0,
                    reason: ''
                },
                relevantPages: [],
                summary: sanitizedSummary,
                rulesQuestions: [] // Will be populated by analyzeContext
            };
        }
    }

    /**
     * Parses the off-track response from the API
     * @param {Object} response - The API response
     * @returns {OffTrackResult} The parsed result
     * @private
     */
    _parseOffTrackResponse(response) {
        const content = response.choices?.[0]?.message?.content || '{}';

        try {
            const parsed = JSON.parse(this._extractJson(content));

            return {
                isOffTrack: Boolean(parsed.isOffTrack),
                severity: this._validateNumber(parsed.severity, 0, 1, 'severity'),
                reason: this._validateString(parsed.reason || '', 1000, 'reason'),
                narrativeBridge: parsed.narrativeBridge ?
                    this._validateString(parsed.narrativeBridge, 2000, 'narrativeBridge') :
                    undefined
            };

        } catch (error) {
            console.warn(`${MODULE_ID} | Failed to parse off-track response, returning default`);
            return {
                isOffTrack: false,
                severity: 0,
                reason: game.i18n.localize('NARRATOR.OffTrack.ParseError')
            };
        }
    }

    /**
     * Parses the suggestions response from the API
     * @param {Object} response - The API response
     * @param {number} maxSuggestions - Maximum suggestions to return
     * @returns {Suggestion[]} Array of parsed suggestions
     * @private
     */
    _parseSuggestionsResponse(response, maxSuggestions) {
        const content = response.choices?.[0]?.message?.content || '{}';

        try {
            const parsed = JSON.parse(this._extractJson(content));

            // Validate and sanitize suggestions array (max 10 items)
            const validatedSuggestions = this._validateArray(
                parsed.suggestions,
                10,
                'suggestions'
            ).slice(0, maxSuggestions)
                .map(s => ({
                    type: s.type || 'narration',
                    content: this._validateString(s.content || '', 5000, 'suggestion.content'),
                    pageReference: s.pageReference ? this._validateString(s.pageReference, 200, 'suggestion.pageReference') : undefined,
                    confidence: this._validateNumber(s.confidence, 0, 1, 'suggestion.confidence')
                }));

            return validatedSuggestions;

        } catch (error) {
            console.warn(`${MODULE_ID} | Failed to parse suggestions response`);

            // Apply validation even to fallback content
            const sanitizedContent = this._validateString(content, 5000, 'fallback.content');

            return [{
                type: 'narration',
                content: sanitizedContent,
                confidence: 0.3
            }];
        }
    }

    /**
     * Parses the NPC dialogue response from the API
     * @param {Object} response - The API response
     * @param {number} maxOptions - Maximum dialogue options to return
     * @returns {string[]} Array of dialogue strings
     * @private
     */
    _parseNPCDialogueResponse(response, maxOptions) {
        const content = response.choices?.[0]?.message?.content || '{}';

        try {
            const parsed = JSON.parse(this._extractJson(content));

            // Validate and sanitize dialogue options array (max 5 items)
            const validatedOptions = this._validateArray(
                parsed.dialogueOptions,
                5,
                'dialogueOptions'
            ).slice(0, maxOptions)
                .map(option => this._validateString(option || '', 2000, 'dialogueOption'))
                .filter(option => option.length > 0); // Remove empty options

            return validatedOptions;

        } catch (error) {
            console.warn(`${MODULE_ID} | Failed to parse NPC dialogue response`);

            // Apply validation even to fallback content
            const sanitizedContent = this._validateString(content, 2000, 'fallback.dialogueOption');

            // Return as single option if we got some content
            if (sanitizedContent.length > 0) {
                return [sanitizedContent];
            }

            return [];
        }
    }

    /**
     * Extracts JSON from a string that might contain markdown code blocks
     * @param {string} content - The content to extract JSON from
     * @returns {string} The extracted JSON string
     * @private
     */
    _extractJson(content) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            return jsonMatch[1].trim();
        }

        // Try to find JSON object/array directly
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            return objectMatch[0];
        }

        return content;
    }

    /**
     * Escapes special regex characters in a string for safe use in RegExp
     * @param {string} str - The string to escape
     * @returns {string} The escaped string
     * @private
     */
    _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Truncates context to avoid exceeding token limits
     * @param {string} context - The context to truncate
     * @returns {string} Truncated context
     * @private
     */
    _truncateContext(context) {
        // Rough estimate: 1 token ~= 4 characters for Italian
        const maxChars = MAX_CONTEXT_TOKENS * 4;

        if (context.length <= maxChars) {
            return context;
        }

        return context.substring(0, maxChars) + '\n\n[... contenuto troncato ...]';
    }

    /**
     * Validates and sanitizes a string value, enforcing maximum length
     * @param {any} str - The value to validate
     * @param {number} maxLength - Maximum allowed length
     * @param {string} fieldName - Name of the field (for logging)
     * @returns {string} The validated and sanitized string
     * @private
     */
    _validateString(str, maxLength, fieldName) {
        // Handle null/undefined
        if (str == null) {
            return '';
        }

        // Convert to string if not already
        const stringValue = String(str);

        // Check for excessive length
        if (stringValue.length > maxLength) {
            console.warn(
                `${MODULE_ID} | ${fieldName} exceeds max length (${stringValue.length} > ${maxLength}), truncating`
            );
            return stringValue.substring(0, maxLength);
        }

        return stringValue;
    }

    /**
     * Validates and clamps a numeric value to a range
     * @param {any} num - The value to validate
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @param {string} fieldName - Name of the field (for logging)
     * @returns {number} The validated and clamped number
     * @private
     */
    _validateNumber(num, min, max, fieldName) {
        // Handle null/undefined
        if (num == null) {
            return min;
        }

        // Parse as float
        const numValue = parseFloat(num);

        // Handle NaN
        if (isNaN(numValue)) {
            console.warn(`${MODULE_ID} | ${fieldName} is not a valid number, using min value`);
            return min;
        }

        // Clamp to range
        if (numValue < min) {
            console.warn(`${MODULE_ID} | ${fieldName} below min (${numValue} < ${min}), clamping`);
            return min;
        }

        if (numValue > max) {
            console.warn(`${MODULE_ID} | ${fieldName} above max (${numValue} > ${max}), clamping`);
            return max;
        }

        return numValue;
    }

    /**
     * Validates and limits an array to maximum size
     * @param {any} arr - The value to validate
     * @param {number} maxItems - Maximum allowed items
     * @param {string} fieldName - Name of the field (for logging)
     * @returns {Array} The validated and limited array
     * @private
     */
    _validateArray(arr, maxItems, fieldName) {
        // Handle null/undefined
        if (arr == null) {
            return [];
        }

        // Ensure it's an array
        if (!Array.isArray(arr)) {
            console.warn(`${MODULE_ID} | ${fieldName} is not an array, converting to empty array`);
            return [];
        }

        // Check for excessive size
        if (arr.length > maxItems) {
            console.warn(
                `${MODULE_ID} | ${fieldName} exceeds max items (${arr.length} > ${maxItems}), truncating`
            );
            return arr.slice(0, maxItems);
        }

        return arr;
    }

    /**
     * Adds a message to conversation history
     * @param {string} role - The message role
     * @param {string} content - The message content
     * @private
     */
    _addToHistory(role, content) {
        this._conversationHistory.push({ role, content });

        // Trim history if exceeds max size
        if (this._conversationHistory.length > this._maxHistorySize) {
            this._conversationHistory = this._conversationHistory.slice(-this._maxHistorySize);
        }
    }

    /**
     * Detects scene information from transcription
     * @param {string} transcription - The transcription text
     * @returns {Object} Scene information object
     * @private
     */
    _detectSceneInfo(transcription) {
        const timestamp = Date.now();

        // If no scene detector is available, return default info
        if (!this._sceneDetector) {
            return {
                type: 'unknown',
                isTransition: false,
                timestamp
            };
        }

        // Detect scene transition
        const transition = this._sceneDetector.detectSceneTransition(
            transcription,
            this._previousTranscription
        );

        // Get current scene type
        const sceneType = transition.detected ? transition.sceneType : this._sceneDetector.getCurrentSceneType();

        // Update session state with current scene
        if (transition.detected) {
            this._sessionState.currentScene = {
                type: sceneType,
                timestamp,
                trigger: transition.trigger
            };
        }

        return {
            type: sceneType,
            isTransition: transition.detected,
            timestamp
        };
    }


    /**
     * Resets the session state
     */
    resetSession() {
        this._conversationHistory = [];
        this._sessionState = {
            currentScene: null,
            lastOffTrackCheck: null,
            suggestionsCount: 0
        };
    }

    /**
     * Gets service statistics
     * @returns {Object} Statistics about the service usage
     */
    getStats() {
        return {
            ...super.getStats(),
            model: this._model,
            sensitivity: this._sensitivity,
            primaryLanguage: this._primaryLanguage,
            hasContext: Boolean(this._adventureContext),
            contextLength: this._adventureContext.length,
            conversationHistorySize: this._conversationHistory.length,
            suggestionsGenerated: this._sessionState.suggestionsCount,
            lastOffTrackCheck: this._sessionState.lastOffTrackCheck
        };
    }
}
