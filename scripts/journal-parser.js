/**
 * Journal Parser Module for Narrator Master
 * Reads and indexes adventure content from Foundry VTT journals
 * @module journal-parser
 */

import { MODULE_ID } from './settings.js';

/**
 * Represents a parsed journal page with extracted content
 * @typedef {Object} ParsedPage
 * @property {string} id - The unique page identifier
 * @property {string} name - The page name/title
 * @property {string} text - The extracted plain text content (HTML stripped)
 * @property {number} order - The sort order of the page
 * @property {string} type - The original page type
 */

/**
 * Represents a parsed journal with all its content
 * @typedef {Object} ParsedJournal
 * @property {string} id - The journal identifier
 * @property {string} name - The journal name/title
 * @property {ParsedPage[]} pages - Array of parsed pages
 * @property {number} totalCharacters - Total character count across all pages
 * @property {Date} parsedAt - Timestamp when the journal was parsed
 */

/**
 * JournalParser - Handles reading and indexing adventure content from Foundry VTT journals
 * Provides content extraction, HTML stripping, and caching functionality
 */
export class JournalParser {
    /**
     * Creates a new JournalParser instance
     */
    constructor() {
        /**
         * Cache for parsed journal content to reduce re-parsing
         * @type {Map<string, ParsedJournal>}
         * @private
         */
        this._cachedContent = new Map();

        /**
         * Index of keywords to pages for quick lookup
         * @type {Map<string, Set<string>>}
         * @private
         */
        this._keywordIndex = new Map();
    }

    /**
     * Parses a journal by its ID and extracts all text content
     * @param {string} journalId - The ID of the journal to parse
     * @returns {Promise<ParsedJournal>} The parsed journal content
     * @throws {Error} If the journal is not found
     */
    async parseJournal(journalId) {
        if (!journalId || typeof journalId !== 'string') {
            throw new Error(game.i18n.localize('NARRATOR.Errors.InvalidJournalId'));
        }

        // Check cache first
        if (this._cachedContent.has(journalId)) {
            const cached = this._cachedContent.get(journalId);
            console.log(`${MODULE_ID} | Using cached journal content for: ${journalId}`);
            return cached;
        }

        // Access journal via Foundry VTT API
        const journal = game.journal.get(journalId);
        if (!journal) {
            throw new Error(game.i18n.format('NARRATOR.Errors.JournalNotFound', { id: journalId }));
        }

        console.log(`${MODULE_ID} | Parsing journal: ${journal.name}`);

        const pages = [];
        let totalCharacters = 0;

        // Iterate through journal pages (v10+ API)
        for (const page of journal.pages) {
            const parsedPage = this._parsePage(page);
            if (parsedPage) {
                pages.push(parsedPage);
                totalCharacters += parsedPage.text.length;
            }
        }

        // Sort pages by their sort order
        pages.sort((a, b) => a.order - b.order);

        // Create parsed journal object
        const parsedJournal = {
            id: journalId,
            name: journal.name,
            pages,
            totalCharacters,
            parsedAt: new Date()
        };

        // Cache the result
        this._cachedContent.set(journalId, parsedJournal);

        // Build keyword index for the journal
        this._buildKeywordIndex(journalId, pages);

        console.log(`${MODULE_ID} | Parsed ${pages.length} pages, ${totalCharacters} characters`);

        return parsedJournal;
    }

    /**
     * Parses a single journal page and extracts its content
     * @param {JournalEntryPage} page - The Foundry VTT page object
     * @returns {ParsedPage|null} The parsed page or null if not a text page
     * @private
     */
    _parsePage(page) {
        // Only process text pages
        if (page.type !== 'text') {
            return null;
        }

        // Extract text content from the page
        const rawContent = page.text?.content || '';
        const plainText = this.stripHtml(rawContent);

        // Skip empty pages
        if (!plainText.trim()) {
            return null;
        }

        return {
            id: page.id,
            name: page.name || game.i18n.localize('NARRATOR.Journal.UnnamedPage'),
            text: plainText,
            order: page.sort || 0,
            type: page.type
        };
    }

    /**
     * Strips HTML tags from content while preserving text
     * @param {string} html - The HTML content to strip
     * @returns {string} Plain text content
     */
    stripHtml(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Create a temporary DOM element to parse HTML
        const div = document.createElement('div');
        div.innerHTML = html;

        // Get text content, handling nested elements
        let text = div.textContent || div.innerText || '';

        // Normalize whitespace
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    }

    /**
     * Builds a keyword index for quick content lookup
     * @param {string} journalId - The journal ID
     * @param {ParsedPage[]} pages - The parsed pages
     * @private
     */
    _buildKeywordIndex(journalId, pages) {
        for (const page of pages) {
            // Extract significant words (3+ characters, not common words)
            const words = page.text
                .toLowerCase()
                .split(/\s+/)
                .filter(word => word.length >= 3);

            for (const word of words) {
                const key = `${journalId}:${word}`;
                if (!this._keywordIndex.has(key)) {
                    this._keywordIndex.set(key, new Set());
                }
                this._keywordIndex.get(key).add(page.id);
            }
        }
    }

    /**
     * Searches for pages containing specific keywords
     * @param {string} journalId - The journal ID to search in
     * @param {string[]} keywords - Keywords to search for
     * @returns {ParsedPage[]} Pages containing the keywords
     */
    searchByKeywords(journalId, keywords) {
        const cached = this._cachedContent.get(journalId);
        if (!cached) {
            console.warn(`${MODULE_ID} | Journal not cached: ${journalId}`);
            return [];
        }

        const matchingPageIds = new Set();

        for (const keyword of keywords) {
            const normalizedKeyword = keyword.toLowerCase().trim();
            if (normalizedKeyword.length < 3) continue;

            const key = `${journalId}:${normalizedKeyword}`;
            const pageIds = this._keywordIndex.get(key);
            if (pageIds) {
                for (const pageId of pageIds) {
                    matchingPageIds.add(pageId);
                }
            }
        }

        return cached.pages.filter(page => matchingPageIds.has(page.id));
    }

    /**
     * Gets the full text content of a journal as a single string
     * Useful for providing context to AI
     * @param {string} journalId - The journal ID
     * @returns {string} Combined text content or empty string
     */
    getFullText(journalId) {
        const cached = this._cachedContent.get(journalId);
        if (!cached) {
            console.warn(`${MODULE_ID} | Journal not cached: ${journalId}`);
            return '';
        }

        return cached.pages
            .map(page => `## ${page.name}\n${page.text}`)
            .join('\n\n');
    }

    /**
     * Gets a specific page by ID from a cached journal
     * @param {string} journalId - The journal ID
     * @param {string} pageId - The page ID
     * @returns {ParsedPage|null} The page or null if not found
     */
    getPage(journalId, pageId) {
        const cached = this._cachedContent.get(journalId);
        if (!cached) {
            return null;
        }

        return cached.pages.find(page => page.id === pageId) || null;
    }

    /**
     * Gets a summary of the cached journal
     * @param {string} journalId - The journal ID
     * @returns {Object|null} Summary object or null if not cached
     */
    getSummary(journalId) {
        const cached = this._cachedContent.get(journalId);
        if (!cached) {
            return null;
        }

        return {
            id: cached.id,
            name: cached.name,
            pageCount: cached.pages.length,
            totalCharacters: cached.totalCharacters,
            parsedAt: cached.parsedAt,
            pageNames: cached.pages.map(p => p.name)
        };
    }

    /**
     * Lists all available journals in the game
     * @returns {Array<{id: string, name: string}>} Array of journal info objects
     */
    listAvailableJournals() {
        if (!game.journal) {
            console.warn(`${MODULE_ID} | Journal collection not available`);
            return [];
        }

        return game.journal.map(journal => ({
            id: journal.id,
            name: journal.name
        }));
    }

    /**
     * Clears the cache for a specific journal
     * @param {string} journalId - The journal ID to clear
     */
    clearCache(journalId) {
        this._cachedContent.delete(journalId);

        // Clear keyword index entries for this journal
        for (const key of this._keywordIndex.keys()) {
            if (key.startsWith(`${journalId}:`)) {
                this._keywordIndex.delete(key);
            }
        }

        console.log(`${MODULE_ID} | Cleared cache for journal: ${journalId}`);
    }

    /**
     * Clears all cached content
     */
    clearAllCache() {
        this._cachedContent.clear();
        this._keywordIndex.clear();
        console.log(`${MODULE_ID} | Cleared all journal cache`);
    }

    /**
     * Checks if a journal is cached
     * @param {string} journalId - The journal ID
     * @returns {boolean} True if cached
     */
    isCached(journalId) {
        return this._cachedContent.has(journalId);
    }

    /**
     * Refreshes the cache for a journal by re-parsing it
     * @param {string} journalId - The journal ID to refresh
     * @returns {Promise<ParsedJournal>} The freshly parsed journal
     */
    async refreshJournal(journalId) {
        this.clearCache(journalId);
        return this.parseJournal(journalId);
    }

    /**
     * Gets the content formatted for AI context
     * Includes structure markers and page references
     * @param {string} journalId - The journal ID
     * @param {number} [maxLength=50000] - Maximum length of output
     * @returns {string} Formatted content for AI
     */
    getContentForAI(journalId, maxLength = 50000) {
        const cached = this._cachedContent.get(journalId);
        if (!cached) {
            return '';
        }

        let content = `# Avventura: ${cached.name}\n\n`;

        for (const page of cached.pages) {
            const section = `## ${page.name}\n${page.text}\n\n`;

            if (content.length + section.length > maxLength) {
                content += `\n[... contenuto troncato per lunghezza ...]\n`;
                break;
            }

            content += section;
        }

        return content;
    }

    /**
     * Parses all journals available in the game
     * @returns {Promise<ParsedJournal[]>} Array of all parsed journals
     */
    async parseAllJournals() {
        if (!game.journal) {
            console.warn(`${MODULE_ID} | Journal collection not available`);
            return [];
        }

        const results = [];
        for (const journal of game.journal.contents) {
            try {
                const parsed = await this.parseJournal(journal.id);
                results.push(parsed);
            } catch (error) {
                console.warn(`${MODULE_ID} | Failed to parse journal "${journal.name}":`, error);
            }
        }

        console.log(`${MODULE_ID} | Parsed ${results.length} journals total`);
        return results;
    }

    /**
     * Gets the combined content of all cached journals formatted for AI context
     * @param {number} [maxLength=50000] - Maximum total length of output
     * @returns {string} Combined formatted content for AI
     */
    getAllContentForAI(maxLength = 50000) {
        let content = '';

        for (const cached of this._cachedContent.values()) {
            const journalHeader = `# ${cached.name}\n\n`;

            if (content.length + journalHeader.length > maxLength) {
                content += `\n[... contenuto troncato per lunghezza ...]\n`;
                break;
            }

            content += journalHeader;

            for (const page of cached.pages) {
                const section = `## ${page.name}\n${page.text}\n\n`;

                if (content.length + section.length > maxLength) {
                    content += `\n[... contenuto troncato per lunghezza ...]\n`;
                    break;
                }

                content += section;
            }
        }

        return content;
    }

    /**
     * Gets statistics about the parser cache
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        let totalPages = 0;
        let totalCharacters = 0;

        for (const journal of this._cachedContent.values()) {
            totalPages += journal.pages.length;
            totalCharacters += journal.totalCharacters;
        }

        return {
            cachedJournals: this._cachedContent.size,
            totalPages,
            totalCharacters,
            indexedKeywords: this._keywordIndex.size
        };
    }

    /**
     * Extracts proper nouns (character names, locations, etc.) from a journal
     * Useful for building custom vocabulary for transcription
     * @param {string} journalId - The journal ID to extract proper nouns from
     * @returns {string[]} Array of unique proper nouns found in the journal
     */
    extractProperNouns(journalId) {
        const cached = this._cachedContent.get(journalId);
        if (!cached) {
            console.warn(`${MODULE_ID} | Journal not cached: ${journalId}`);
            return [];
        }

        // Common words to exclude (Italian and English)
        const commonWords = new Set([
            // Italian articles, prepositions, conjunctions
            'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
            'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
            'e', 'o', 'ma', 'però', 'quindi', 'allora', 'quando', 'se',
            'che', 'chi', 'cui', 'quale', 'quanto',
            // Italian common words
            'non', 'si', 'anche', 'come', 'dove', 'dopo', 'prima',
            'molto', 'tutto', 'ogni', 'altro', 'stesso', 'sempre',
            // English articles, prepositions, conjunctions
            'the', 'a', 'an', 'of', 'to', 'in', 'for', 'on', 'with',
            'at', 'by', 'from', 'up', 'about', 'into', 'through',
            'and', 'or', 'but', 'if', 'then', 'when', 'where',
            'that', 'this', 'these', 'those', 'which', 'who', 'what',
            // English common words
            'not', 'all', 'can', 'will', 'just', 'should', 'now',
            'there', 'their', 'they', 'have', 'has', 'had', 'been'
        ]);

        const properNouns = new Map(); // Use Map to track frequency

        // Process each page
        for (const page of cached.pages) {
            const text = page.text;

            // Split into sentences to identify sentence-starting words
            const sentences = text.split(/[.!?]+/);

            for (const sentence of sentences) {
                const words = sentence.trim().split(/\s+/);

                // Skip first word of each sentence (likely capitalized but not proper noun)
                for (let i = 1; i < words.length; i++) {
                    const word = words[i];

                    // Check if word starts with capital letter
                    if (/^[A-ZÀ-ÖØ-Þ]/.test(word)) {
                        // Clean word (remove punctuation)
                        const cleanWord = word.replace(/[^a-zA-ZÀ-ÖØ-ÿ'-]/g, '');

                        // Filter out short words and common words
                        if (cleanWord.length >= 3 && !commonWords.has(cleanWord.toLowerCase())) {
                            const count = properNouns.get(cleanWord) || 0;
                            properNouns.set(cleanWord, count + 1);
                        }
                    }
                }
            }
        }

        // Convert to array and sort by frequency (most common first)
        const result = Array.from(properNouns.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([word]) => word);

        console.log(`${MODULE_ID} | Extracted ${result.length} proper nouns from journal: ${cached.name}`);

        return result;
    }

    /**
     * Extracts NPC profiles (names, descriptions, personalities) from a journal
     * Useful for generating contextual NPC dialogue
     * @param {string} journalId - The journal ID to extract NPC profiles from
     * @returns {Array<{name: string, description: string, personality: string, pages: string[]}>} Array of NPC profile objects
     */
    extractNPCProfiles(journalId) {
        const cached = this._cachedContent.get(journalId);
        if (!cached) {
            console.warn(`${MODULE_ID} | Journal not cached: ${journalId}`);
            return [];
        }

        // Get potential NPC names using existing extractProperNouns method
        const properNouns = this.extractProperNouns(journalId);

        // Keywords that indicate NPC descriptions (Italian and English)
        const npcIndicators = [
            // Italian
            'personaggio', 'png', 'npc', 'alleato', 'nemico', 'mercante',
            'locandiere', 'fabbro', 'mago', 'guerriero', 'chierico',
            'personalità', 'carattere', 'temperamento', 'atteggiamento',
            // English
            'character', 'npc', 'ally', 'enemy', 'merchant', 'innkeeper',
            'blacksmith', 'wizard', 'warrior', 'cleric',
            'personality', 'character', 'temperament', 'attitude'
        ];

        const npcProfiles = [];

        // Process each potential NPC name
        for (const npcName of properNouns) {
            const profile = {
                name: npcName,
                description: '',
                personality: '',
                pages: []
            };

            let contextFound = false;

            // Search for context around this name in all pages
            for (const page of cached.pages) {
                const text = page.text;
                const lowerText = text.toLowerCase();
                const nameLower = npcName.toLowerCase();

                // Check if this page mentions the NPC
                if (!lowerText.includes(nameLower)) {
                    continue;
                }

                // Track that this page mentions the NPC
                profile.pages.push(page.id);

                // Extract context around the NPC name (sentences containing the name)
                const sentences = text.split(/[.!?]+/);
                for (const sentence of sentences) {
                    if (sentence.toLowerCase().includes(nameLower)) {
                        const trimmedSentence = sentence.trim();

                        // Check if sentence contains NPC indicators
                        const hasIndicator = npcIndicators.some(indicator =>
                            sentence.toLowerCase().includes(indicator)
                        );

                        if (hasIndicator) {
                            contextFound = true;

                            // Extract description (sentences with character/merchant/etc. keywords)
                            if (!profile.description) {
                                profile.description = trimmedSentence;
                            } else {
                                profile.description += ' ' + trimmedSentence;
                            }
                        }

                        // Extract personality traits (sentences with personality/temperament keywords)
                        const personalityKeywords = [
                            'personalità', 'carattere', 'temperamento', 'atteggiamento',
                            'personality', 'character', 'temperament', 'attitude',
                            'gentile', 'brusco', 'amichevole', 'ostile', 'timido', 'coraggioso',
                            'kind', 'gruff', 'friendly', 'hostile', 'shy', 'brave'
                        ];

                        const hasPersonalityKeyword = personalityKeywords.some(keyword =>
                            sentence.toLowerCase().includes(keyword)
                        );

                        if (hasPersonalityKeyword) {
                            if (!profile.personality) {
                                profile.personality = trimmedSentence;
                            } else {
                                profile.personality += ' ' + trimmedSentence;
                            }
                        }
                    }
                }
            }

            // Only include NPCs that have some context found
            if (contextFound && profile.pages.length > 0) {
                // Limit description and personality length
                if (profile.description.length > 500) {
                    profile.description = profile.description.substring(0, 500) + '...';
                }
                if (profile.personality.length > 300) {
                    profile.personality = profile.personality.substring(0, 300) + '...';
                }

                npcProfiles.push(profile);
            }
        }

        console.log(`${MODULE_ID} | Extracted ${npcProfiles.length} NPC profiles from journal: ${cached.name}`);

        return npcProfiles;
    }

    /**
     * Gets contextual information about a specific NPC from the journal
     * Returns formatted text suitable for AI dialogue generation
     * @param {string} journalId - The journal ID to search in
     * @param {string} npcName - The name of the NPC to get context for
     * @returns {string} Formatted context string with NPC description, personality, and backstory
     */
    getNPCContext(journalId, npcName) {
        const cached = this._cachedContent.get(journalId);
        if (!cached) {
            console.warn(`${MODULE_ID} | Journal not cached: ${journalId}`);
            return '';
        }

        if (!npcName || typeof npcName !== 'string') {
            console.warn(`${MODULE_ID} | Invalid NPC name provided`);
            return '';
        }

        const nameLower = npcName.toLowerCase().trim();
        const contextParts = [];
        const relevantPages = [];

        // Search all pages for mentions of this NPC
        for (const page of cached.pages) {
            const text = page.text;
            const lowerText = text.toLowerCase();

            // Check if this page mentions the NPC
            if (!lowerText.includes(nameLower)) {
                continue;
            }

            // Extract sentences containing the NPC name
            const sentences = text.split(/[.!?]+/);
            const relevantSentences = [];

            for (const sentence of sentences) {
                if (sentence.toLowerCase().includes(nameLower)) {
                    const trimmed = sentence.trim();
                    if (trimmed) {
                        relevantSentences.push(trimmed);
                    }
                }
            }

            if (relevantSentences.length > 0) {
                relevantPages.push({
                    name: page.name,
                    content: relevantSentences.join('. ')
                });
            }
        }

        // If no context found, return empty string
        if (relevantPages.length === 0) {
            console.warn(`${MODULE_ID} | No context found for NPC: ${npcName}`);
            return '';
        }

        // Format the context for AI consumption
        contextParts.push(`# ${npcName}`);
        contextParts.push('');

        for (const page of relevantPages) {
            contextParts.push(`## ${page.name}`);
            contextParts.push(page.content);
            contextParts.push('');
        }

        const formattedContext = contextParts.join('\n');

        console.log(`${MODULE_ID} | Retrieved context for NPC "${npcName}" (${formattedContext.length} characters)`);

        return formattedContext;
    }
}
