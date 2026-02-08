/**
 * AI Assistant Module for Narrator Master
 * Handles contextual suggestions and off-track detection using OpenAI GPT
 * @module ai-assistant
 */

import { MODULE_ID, SETTINGS } from './settings.js';
import { SceneDetector } from './scene-detector.js';

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
 */

/**
 * AIAssistant - Handles AI-powered suggestions and off-track detection for the DM
 * Uses OpenAI GPT-4o-mini for cost-effective real-time assistance
 */
export class AIAssistant {
    /**
     * Creates a new AIAssistant instance
     * @param {string} apiKey - The OpenAI API key
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.model='gpt-4o-mini'] - The model to use for suggestions
     * @param {string} [options.sensitivity='medium'] - Off-track detection sensitivity
     */
    constructor(apiKey, options = {}) {
        /**
         * OpenAI API key
         * @type {string}
         * @private
         */
        this._apiKey = apiKey || '';

        /**
         * Base URL for OpenAI API
         * @type {string}
         * @private
         */
        this._baseUrl = 'https://api.openai.com/v1';

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
    }

    /**
     * Updates the API key
     * @param {string} apiKey - The new API key
     */
    setApiKey(apiKey) {
        this._apiKey = apiKey || '';
    }

    /**
     * Checks if the API key is configured
     * @returns {boolean} True if API key is set
     */
    isConfigured() {
        return this._apiKey && this._apiKey.trim().length > 0;
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
     * Analyzes the current game context and generates suggestions
     * @param {string} transcription - Recent transcribed conversation
     * @param {Object} [options={}] - Analysis options
     * @param {boolean} [options.includeSuggestions=true] - Generate suggestions
     * @param {boolean} [options.checkOffTrack=true] - Check if off-track
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

        console.log(`${MODULE_ID} | Analyzing context, transcription length: ${transcription.length}`);

        // Detect languages in transcription
        const detectedLanguages = this._detectLanguagesInTranscription(transcription);

        try {
            // Build the analysis prompt
            const messages = this._buildAnalysisMessages(transcription, includeSuggestions, checkOffTrack, detectedLanguages);

            // Make API request
            const response = await this._makeApiRequest(messages);

            // Parse the response
            const analysis = this._parseAnalysisResponse(response);

            // Detect scene transitions if scene detector is available
            const sceneInfo = this._detectSceneInfo(transcription);

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
                throw this._handleApiError(error);
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
                throw this._handleApiError(error);
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
                throw this._handleApiError(error);
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
                throw this._handleApiError(error);
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
                throw this._handleApiError(error);
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
     * Builds the system prompt for the AI assistant
     * @returns {string} The system prompt
     * @private
     */
    _buildSystemPrompt() {
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

        return `Sei un assistente per Dungeon Master esperto in giochi di ruolo fantasy.
Il tuo compito è aiutare il DM durante le sessioni di gioco fornendo:
1. Suggerimenti contestuali basati sulla conversazione dei giocatori
2. Riferimenti alle parti rilevanti dell'avventura
3. Rilevamento di quando i giocatori escono dal tema dell'avventura
4. Suggerimenti per riportare delicatamente i giocatori nella storia

Rispondi nella stessa lingua della trascrizione (${responseLang}).
${sensitivityGuide[this._sensitivity]}

Quando i giocatori sono fuori tema, suggerisci modi creativi per riportarli nella storia senza forzarli.`;
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
     * Creates a user-friendly error for network failures
     * @param {Error} networkError - The original network error
     * @returns {Object} Error object with status and message
     * @private
     */
    _createNetworkError(networkError) {
        const isTimeout = networkError.name === 'AbortError' ||
            networkError.message?.includes('timeout');

        if (isTimeout) {
            return {
                message: game.i18n.localize('NARRATOR.Errors.Timeout'),
                code: 'timeout',
                status: 0,
                isNetworkError: true
            };
        }

        return {
            message: game.i18n.localize('NARRATOR.Errors.NetworkError'),
            code: 'network_error',
            status: 0,
            isNetworkError: true
        };
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
                summary: this._validateString(parsed.summary || '', 2000, 'summary')
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
                summary: sanitizedSummary
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
     * Handles API errors and returns user-friendly error messages
     * @param {Object} error - The API error
     * @returns {Error} A user-friendly error
     * @private
     */
    _handleApiError(error) {
        let message;

        // Handle network errors first
        if (error.isNetworkError || error.status === 0) {
            message = error.message || game.i18n.localize('NARRATOR.Errors.NetworkError');
            const err = new Error(message);
            err.isNetworkError = true;
            return err;
        }

        switch (error.status) {
            case 401:
                message = game.i18n.localize('NARRATOR.Errors.InvalidApiKey');
                break;
            case 429:
                message = game.i18n.localize('NARRATOR.Errors.RateLimited');
                break;
            case 400:
                message = game.i18n.format('NARRATOR.Errors.BadRequest', {
                    details: error.message
                });
                break;
            case 500:
            case 502:
            case 503:
                message = game.i18n.localize('NARRATOR.Errors.ServerError');
                break;
            case 504:
                message = game.i18n.localize('NARRATOR.Errors.Timeout');
                break;
            default:
                message = game.i18n.format('NARRATOR.Errors.AIAssistantFailed', {
                    status: error.status,
                    message: error.message
                });
        }

        return new Error(message);
    }

    /**
     * Shows a user notification for AI assistant errors
     * @param {Error} error - The error to display
     */
    static notifyError(error) {
        if (typeof ui !== 'undefined' && ui.notifications) {
            ui.notifications.error(error.message);
        }
    }

    /**
     * Clears the conversation history
     */
    clearHistory() {
        this._conversationHistory = [];
    }

    /**
     * Gets the conversation history
     * @param {number} [limit] - Maximum entries to return
     * @returns {Array<{role: string, content: string}>} The history
     */
    getHistory(limit) {
        if (limit && limit > 0) {
            return this._conversationHistory.slice(-limit);
        }
        return [...this._conversationHistory];
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
            configured: this.isConfigured(),
            model: this._model,
            sensitivity: this._sensitivity,
            primaryLanguage: this._primaryLanguage,
            hasContext: Boolean(this._adventureContext),
            contextLength: this._adventureContext.length,
            historySize: this._conversationHistory.length,
            suggestionsGenerated: this._sessionState.suggestionsCount,
            lastOffTrackCheck: this._sessionState.lastOffTrackCheck
        };
    }
}
