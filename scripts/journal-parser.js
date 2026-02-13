/**
 * Journal Parser Module for Narrator Master
 * Reads and indexes adventure content from Foundry VTT journals
 * @module journal-parser
 */

import { MODULE_ID } from './settings.js';
import { Logger } from './logger.js';

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
 * Represents a chapter/section in the hierarchical structure
 * @typedef {Object} ChapterNode
 * @property {string} id - Unique identifier for this node
 * @property {string} title - The heading/section title
 * @property {number} level - Heading level (1-6 for h1-h6, 0 for page-level)
 * @property {string} type - Node type: 'page', 'heading', or 'section'
 * @property {string} pageId - The ID of the page containing this node
 * @property {string} pageName - The name of the page containing this node
 * @property {number} position - Character position in the page content
 * @property {string} content - Text content following this heading (until next heading)
 * @property {ChapterNode[]} children - Child nodes (subsections)
 */

/**
 * Represents the complete chapter structure of a journal
 * @typedef {Object} ChapterStructure
 * @property {string} journalId - The journal ID
 * @property {string} journalName - The journal name
 * @property {ChapterNode[]} chapters - Top-level chapters (pages or h1 headings)
 * @property {number} totalHeadings - Total number of headings found
 * @property {Date} extractedAt - Timestamp when structure was extracted
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
         * Keyword index with bounded size and LRU (Least Recently Used) eviction.
         * Maps keyword keys to page IDs and last access time for quick lookup.
         * When the index exceeds _maxKeywordIndexSize, the oldest accessed entries
         * are automatically evicted to prevent unbounded memory growth.
         *
         * @type {Map<string, {pageIds: Set<string>, lastAccessed: Date}>}
         * @private
         */
        this._keywordIndex = new Map();

        /**
         * Maximum number of keyword index entries before LRU eviction.
         * Default: 5000 entries (protects against unbounded memory growth in large journals)
         * @type {number}
         * @private
         */
        this._maxKeywordIndexSize = 5000;
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
            Logger.debug(`Using cached journal content for: ${journalId}`, 'JournalParser.parseJournal');
            return cached;
        }

        // Access journal via Foundry VTT API
        const journal = game.journal.get(journalId);
        if (!journal) {
            throw new Error(game.i18n.format('NARRATOR.Errors.JournalNotFound', { id: journalId }));
        }

        Logger.debug(`Parsing journal: ${journal.name}`, 'JournalParser.parseJournal');

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

        Logger.debug(`Parsed ${pages.length} pages, ${totalCharacters} characters`, 'JournalParser.parseJournal');

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
                // Use bounded index with LRU eviction
                this._addToKeywordIndex(key, page.id);
            }
        }
    }

    /**
     * Adds a keyword to the bounded keyword index with LRU tracking
     * @param {string} key - The keyword index key (format: "journalId:word")
     * @param {string} pageId - The page ID containing this keyword
     * @private
     */
    _addToKeywordIndex(key, pageId) {
        // Get existing entry or create new one
        let entry = this._keywordIndex.get(key);

        if (entry) {
            // Update existing entry
            entry.pageIds.add(pageId);
            entry.lastAccessed = new Date();
        } else {
            // Create new entry
            entry = {
                pageIds: new Set([pageId]),
                lastAccessed: new Date()
            };
            this._keywordIndex.set(key, entry);
        }

        // Trim index if size exceeded
        if (this._keywordIndex.size > this._maxKeywordIndexSize) {
            this._trimKeywordIndex();
        }
    }

    /**
     * Trims the bounded keyword index using LRU eviction
     * Removes oldest accessed entries until size is within limit
     * @private
     */
    _trimKeywordIndex() {
        const currentSize = this._keywordIndex.size;
        const targetSize = this._maxKeywordIndexSize;

        if (currentSize <= targetSize) {
            return; // No trimming needed
        }

        // Convert to array with keys and sort by lastAccessed (oldest first)
        const entries = Array.from(this._keywordIndex.entries());
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        // Calculate how many entries to remove
        const entriesToRemove = currentSize - targetSize;

        // Remove oldest entries
        for (let i = 0; i < entriesToRemove; i++) {
            const [key] = entries[i];
            this._keywordIndex.delete(key);
        }

        Logger.debug(
            `Trimmed keyword index: removed ${entriesToRemove} entries (${currentSize} → ${targetSize})`,
            'JournalParser._trimKeywordIndex'
        );
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
            Logger.warn(`Journal not cached: ${journalId}`, 'JournalParser.searchByKeywords');
            return [];
        }

        const matchingPageIds = new Set();

        for (const keyword of keywords) {
            const normalizedKeyword = keyword.toLowerCase().trim();
            if (normalizedKeyword.length < 3) continue;

            const key = `${journalId}:${normalizedKeyword}`;
            // Use bounded index with LRU tracking
            const entry = this._keywordIndex.get(key);
            if (entry) {
                // Update last accessed time for LRU tracking
                entry.lastAccessed = new Date();
                for (const pageId of entry.pageIds) {
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
            Logger.warn(`Journal not cached: ${journalId}`, 'JournalParser.getFullText');
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
            Logger.warn('Journal collection not available', 'JournalParser.listAvailableJournals');
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

        // Clear keyword index entries for this journal from bounded index
        for (const key of this._keywordIndex.keys()) {
            if (key.startsWith(`${journalId}:`)) {
                this._keywordIndex.delete(key);
            }
        }

        Logger.debug(`Cleared cache for journal: ${journalId}`, 'JournalParser.clearCache');
    }

    /**
     * Clears all cached content
     */
    clearAllCache() {
        this._cachedContent.clear();
        this._keywordIndex.clear();
        Logger.debug('Cleared all journal cache', 'JournalParser.clearAllCache');
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
            Logger.warn('Journal collection not available', 'JournalParser.parseAllJournals');
            return [];
        }

        const results = [];
        for (const journal of game.journal.contents) {
            try {
                const parsed = await this.parseJournal(journal.id);
                results.push(parsed);
            } catch (error) {
                Logger.warn(`Failed to parse journal "${journal.name}"`, 'JournalParser.parseAllJournals', error);
            }
        }

        Logger.debug(`Parsed ${results.length} journals total`, 'JournalParser.parseAllJournals');
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
            Logger.warn(`Journal not cached: ${journalId}`, 'JournalParser.extractProperNouns');
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

        Logger.debug(`Extracted ${result.length} proper nouns from journal: ${cached.name}`, 'JournalParser.extractProperNouns');

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
            Logger.warn(`Journal not cached: ${journalId}`, 'JournalParser.extractNPCProfiles');
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

        Logger.debug(`Extracted ${npcProfiles.length} NPC profiles from journal: ${cached.name}`, 'JournalParser.extractNPCProfiles');

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
            Logger.warn(`Journal not cached: ${journalId}`, 'JournalParser.getNPCContext');
            return '';
        }

        if (!npcName || typeof npcName !== 'string') {
            Logger.warn('Invalid NPC name provided', 'JournalParser.getNPCContext');
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
            Logger.warn(`No context found for NPC: ${npcName}`, 'JournalParser.getNPCContext');
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

        Logger.debug(`Retrieved context for NPC "${npcName}" (${formattedContext.length} characters)`, 'JournalParser.getNPCContext');

        return formattedContext;
    }

    /**
     * Extracts the hierarchical chapter structure from a journal
     * Detects headings (h1-h6), page boundaries, and section markers
     * @param {string} journalId - The journal ID to extract structure from
     * @returns {ChapterStructure|null} The chapter structure or null if not found
     */
    extractChapterStructure(journalId) {
        const cached = this._cachedContent.get(journalId);
        if (!cached) {
            Logger.warn(`Journal not cached: ${journalId}`, 'JournalParser.extractChapterStructure');
            return null;
        }

        const chapters = [];
        let totalHeadings = 0;
        let nodeIdCounter = 0;

        // Process each page
        for (const page of cached.pages) {
            // Get the raw HTML content for this page
            const journal = game.journal.get(journalId);
            if (!journal) {
                Logger.warn(`Journal not found: ${journalId}`, 'JournalParser.extractChapterStructure');
                continue;
            }

            const foundryPage = journal.pages.get(page.id);
            if (!foundryPage || foundryPage.type !== 'text') {
                continue;
            }

            const rawHtml = foundryPage.text?.content || '';

            // Extract headings and sections from HTML
            const headings = this._extractHeadingsFromHtml(rawHtml, page.id, page.name);
            totalHeadings += headings.length;

            // Create page-level node
            const pageNode = {
                id: `node-${++nodeIdCounter}`,
                title: page.name,
                level: 0,
                type: 'page',
                pageId: page.id,
                pageName: page.name,
                position: 0,
                content: page.text,
                children: []
            };

            // Build hierarchical structure from flat headings list
            if (headings.length > 0) {
                pageNode.children = this._buildHeadingHierarchy(headings, nodeIdCounter);
                nodeIdCounter += headings.length;
            }

            chapters.push(pageNode);
        }

        const structure = {
            journalId: cached.id,
            journalName: cached.name,
            chapters,
            totalHeadings,
            extractedAt: new Date()
        };

        Logger.debug(
            `Extracted chapter structure: ${chapters.length} pages, ${totalHeadings} headings`,
            'JournalParser.extractChapterStructure'
        );

        return structure;
    }

    /**
     * Extracts heading elements from HTML content
     * @param {string} html - The HTML content to parse
     * @param {string} pageId - The page ID
     * @param {string} pageName - The page name
     * @returns {Array<{level: number, title: string, position: number, content: string}>} Array of heading objects
     * @private
     */
    _extractHeadingsFromHtml(html, pageId, pageName) {
        if (!html || typeof html !== 'string') {
            return [];
        }

        const headings = [];

        // Create a temporary DOM element to parse HTML
        const div = document.createElement('div');
        div.innerHTML = html;

        // Find all heading elements (h1-h6)
        const headingElements = div.querySelectorAll('h1, h2, h3, h4, h5, h6');

        for (let i = 0; i < headingElements.length; i++) {
            const heading = headingElements[i];
            const tagName = heading.tagName.toLowerCase();
            const level = parseInt(tagName.charAt(1), 10);
            const title = (heading.textContent || heading.innerText || '').trim();

            // Skip empty headings
            if (!title) {
                continue;
            }

            // Calculate position in original HTML
            const position = html.indexOf(heading.outerHTML);

            // Extract content between this heading and the next
            const content = this._extractContentUntilNextHeading(heading, headingElements[i + 1]);

            headings.push({
                level,
                title,
                position: position >= 0 ? position : 0,
                content,
                pageId,
                pageName
            });
        }

        // Also detect section markers (hr, dividers, etc.)
        const sectionMarkers = this._extractSectionMarkers(div, pageId, pageName);

        // Merge section markers with headings, maintaining position order
        const allSections = [...headings, ...sectionMarkers];
        allSections.sort((a, b) => a.position - b.position);

        return allSections;
    }

    /**
     * Extracts content between a heading and the next heading element
     * @param {HTMLElement} currentHeading - The current heading element
     * @param {HTMLElement|undefined} nextHeading - The next heading element (if any)
     * @returns {string} The text content between headings
     * @private
     */
    _extractContentUntilNextHeading(currentHeading, nextHeading) {
        const contentParts = [];
        let sibling = currentHeading.nextElementSibling;

        while (sibling) {
            // Stop if we hit the next heading
            if (nextHeading && sibling === nextHeading) {
                break;
            }

            // Stop if this is a heading element
            if (/^H[1-6]$/i.test(sibling.tagName)) {
                break;
            }

            // Extract text content
            const text = (sibling.textContent || sibling.innerText || '').trim();
            if (text) {
                contentParts.push(text);
            }

            sibling = sibling.nextElementSibling;
        }

        return contentParts.join(' ');
    }

    /**
     * Extracts section markers (hr, dividers, special formatting) from HTML
     * @param {HTMLElement} container - The container element to search
     * @param {string} pageId - The page ID
     * @param {string} pageName - The page name
     * @returns {Array<{level: number, title: string, position: number, content: string, type: string}>} Array of section markers
     * @private
     */
    _extractSectionMarkers(container, pageId, pageName) {
        const markers = [];

        // Find horizontal rules (commonly used as section dividers)
        const hrElements = container.querySelectorAll('hr');
        for (const hr of hrElements) {
            // Find the next text content after the hr
            let nextContent = '';
            let sibling = hr.nextElementSibling;
            while (sibling && !nextContent) {
                nextContent = (sibling.textContent || sibling.innerText || '').trim();
                sibling = sibling.nextElementSibling;
            }

            // Only include if there's content after the divider
            if (nextContent) {
                // Get position in parent's HTML
                const parentHtml = container.innerHTML;
                const position = parentHtml.indexOf(hr.outerHTML);

                markers.push({
                    level: 7, // Level 7 for section markers (below h6)
                    title: game.i18n?.localize('NARRATOR.Journal.SectionBreak') || '---',
                    position: position >= 0 ? position : 0,
                    content: nextContent.substring(0, 200), // First 200 chars as preview
                    pageId,
                    pageName,
                    type: 'section'
                });
            }
        }

        // Find elements with common section-marking classes
        const sectionClasses = ['section', 'chapter', 'scene', 'act', 'encounter', 'location'];
        for (const className of sectionClasses) {
            const elements = container.querySelectorAll(`.${className}, [data-${className}]`);
            for (const element of elements) {
                // Skip if this is already a heading
                if (/^H[1-6]$/i.test(element.tagName)) {
                    continue;
                }

                const title = (element.textContent || element.innerText || '').trim();
                if (title && title.length < 100) { // Reasonable title length
                    const parentHtml = container.innerHTML;
                    const position = parentHtml.indexOf(element.outerHTML);

                    markers.push({
                        level: 7,
                        title: title.substring(0, 50),
                        position: position >= 0 ? position : 0,
                        content: title,
                        pageId,
                        pageName,
                        type: 'section'
                    });
                }
            }
        }

        return markers;
    }

    /**
     * Builds a hierarchical structure from a flat list of headings
     * @param {Array<{level: number, title: string, position: number, content: string, pageId: string, pageName: string}>} headings - Flat list of headings
     * @param {number} startId - Starting ID counter for node IDs
     * @returns {ChapterNode[]} Hierarchical chapter nodes
     * @private
     */
    _buildHeadingHierarchy(headings, startId) {
        if (!headings || headings.length === 0) {
            return [];
        }

        const root = [];
        const stack = [{ node: { children: root }, level: 0 }];
        let nodeId = startId;

        for (const heading of headings) {
            const node = {
                id: `node-${++nodeId}`,
                title: heading.title,
                level: heading.level,
                type: heading.type || 'heading',
                pageId: heading.pageId,
                pageName: heading.pageName,
                position: heading.position,
                content: heading.content || '',
                children: []
            };

            // Pop stack until we find a parent with lower level
            while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }

            // Add node as child of current parent
            const parent = stack[stack.length - 1];
            parent.node.children.push(node);

            // Push this node as potential parent for subsequent headings
            stack.push({ node, level: heading.level });
        }

        return root;
    }

    /**
     * Gets a flattened list of all chapters and sections for navigation
     * @param {string} journalId - The journal ID
     * @returns {Array<{id: string, title: string, level: number, pageId: string, path: string}>} Flat navigation list
     */
    getFlatChapterList(journalId) {
        const structure = this.extractChapterStructure(journalId);
        if (!structure) {
            return [];
        }

        const flatList = [];

        const flatten = (nodes, path = []) => {
            for (const node of nodes) {
                const currentPath = [...path, node.title];
                flatList.push({
                    id: node.id,
                    title: node.title,
                    level: node.level,
                    type: node.type,
                    pageId: node.pageId,
                    pageName: node.pageName,
                    path: currentPath.join(' > ')
                });

                if (node.children && node.children.length > 0) {
                    flatten(node.children, currentPath);
                }
            }
        };

        flatten(structure.chapters);
        return flatList;
    }

    /**
     * Gets the chapter node at a specific position in a page
     * @param {string} journalId - The journal ID
     * @param {string} pageId - The page ID
     * @param {number} [position=0] - Character position in the page
     * @returns {ChapterNode|null} The chapter node at the position
     */
    getChapterAtPosition(journalId, pageId, position = 0) {
        const structure = this.extractChapterStructure(journalId);
        if (!structure) {
            return null;
        }

        // Find the page
        const pageChapter = structure.chapters.find(c => c.pageId === pageId);
        if (!pageChapter) {
            return null;
        }

        // If no children, return the page itself
        if (!pageChapter.children || pageChapter.children.length === 0) {
            return pageChapter;
        }

        // Find the deepest heading that comes before this position
        const findAtPosition = (nodes) => {
            let result = null;
            for (const node of nodes) {
                if (node.position <= position) {
                    result = node;
                    // Check children for more specific match
                    if (node.children && node.children.length > 0) {
                        const childResult = findAtPosition(node.children);
                        if (childResult) {
                            result = childResult;
                        }
                    }
                }
            }
            return result;
        };

        return findAtPosition(pageChapter.children) || pageChapter;
    }

    /**
     * Finds a chapter/section by matching against a scene name
     * Uses pattern matching to handle various naming conventions:
     * - "Chapter 1: The Tavern" → matches "The Tavern" or "Chapter 1"
     * - "Scene - The Dark Forest" → matches "The Dark Forest"
     * - "Act 2 - The Betrayal" → matches "Act 2" or "The Betrayal"
     *
     * @param {string} journalId - The journal ID to search in
     * @param {string} sceneName - The scene name to match (e.g., "Chapter 1: The Tavern")
     * @returns {ChapterNode|null} The best matching chapter node or null if no match found
     */
    getChapterBySceneName(journalId, sceneName) {
        if (!sceneName || typeof sceneName !== 'string') {
            Logger.warn('Invalid scene name provided', 'JournalParser.getChapterBySceneName');
            return null;
        }

        const structure = this.extractChapterStructure(journalId);
        if (!structure) {
            Logger.warn(`Could not extract chapter structure for journal: ${journalId}`, 'JournalParser.getChapterBySceneName');
            return null;
        }

        // Extract searchable terms from scene name
        const searchTerms = this._extractSearchTermsFromSceneName(sceneName);

        if (searchTerms.length === 0) {
            Logger.warn(`No valid search terms extracted from scene name: ${sceneName}`, 'JournalParser.getChapterBySceneName');
            return null;
        }

        // Find best matching chapter
        const flatList = this.getFlatChapterList(journalId);
        let bestMatch = null;
        let bestScore = 0;

        for (const chapter of flatList) {
            const score = this._calculateChapterMatchScore(chapter.title, searchTerms, sceneName);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = chapter;
            }
        }

        // Require a minimum match score to avoid false positives
        const MIN_MATCH_SCORE = 0.3;
        if (bestScore < MIN_MATCH_SCORE) {
            Logger.debug(
                `No chapter found matching scene "${sceneName}" (best score: ${bestScore.toFixed(2)})`,
                'JournalParser.getChapterBySceneName'
            );
            return null;
        }

        // Get the full ChapterNode from the structure
        const fullNode = this._findChapterNodeById(structure.chapters, bestMatch.id);

        Logger.debug(
            `Matched scene "${sceneName}" to chapter "${bestMatch.title}" (score: ${bestScore.toFixed(2)})`,
            'JournalParser.getChapterBySceneName'
        );

        return fullNode;
    }

    /**
     * Extracts searchable terms from a scene name
     * Handles common patterns like "Chapter X:", "Scene -", "Act N:", numbered prefixes, etc.
     * @param {string} sceneName - The scene name to parse
     * @returns {string[]} Array of normalized search terms
     * @private
     */
    _extractSearchTermsFromSceneName(sceneName) {
        const terms = [];

        // Normalize the scene name
        let normalized = sceneName.trim();

        // Common separators in scene names
        const separators = [':', '-', '–', '—', '|', '/'];

        // Common prefixes to handle (Italian and English)
        const prefixPatterns = [
            /^(chapter|capitolo|cap\.?)\s*(\d+|[ivxlcdm]+)/i,      // Chapter 1, Capitolo 2, Cap. 3, Chapter IV
            /^(scene|scena)\s*(\d+|[ivxlcdm]+)?/i,                  // Scene 1, Scena 2
            /^(act|atto)\s*(\d+|[ivxlcdm]+)/i,                      // Act 1, Atto 2
            /^(part|parte)\s*(\d+|[ivxlcdm]+)/i,                    // Part 1, Parte 2
            /^(episode|episodio)\s*(\d+|[ivxlcdm]+)/i,              // Episode 1, Episodio 2
            /^(section|sezione)\s*(\d+|[ivxlcdm]+)?/i,              // Section 1, Sezione 2
            /^(\d+)\s*[-.:)]/,                                       // "1. ", "1: ", "1 - "
            /^([ivxlcdm]+)\s*[-.:)]/i                                // "I. ", "IV: "
        ];

        // Check for prefix patterns and extract both prefix and remainder
        for (const pattern of prefixPatterns) {
            const match = normalized.match(pattern);
            if (match) {
                // Add the prefix as a term (e.g., "Chapter 1", "Act 2")
                const prefixTerm = match[0].replace(/[-.:)\s]+$/, '').trim();
                if (prefixTerm.length >= 2) {
                    terms.push(prefixTerm.toLowerCase());
                }
                break;
            }
        }

        // Split by separators and extract meaningful parts
        let parts = [normalized];
        for (const sep of separators) {
            const newParts = [];
            for (const part of parts) {
                newParts.push(...part.split(sep).map(p => p.trim()).filter(p => p.length > 0));
            }
            parts = newParts;
        }

        // Process each part
        for (const part of parts) {
            // Skip if it's just a prefix pattern we already captured
            const isJustPrefix = prefixPatterns.some(pattern => {
                const match = part.match(pattern);
                return match && match[0].length === part.length;
            });

            if (!isJustPrefix && part.length >= 2) {
                // Remove leading/trailing punctuation and normalize
                const cleanPart = part.replace(/^[^\w\s]+|[^\w\s]+$/g, '').trim().toLowerCase();
                if (cleanPart.length >= 2 && !terms.includes(cleanPart)) {
                    terms.push(cleanPart);
                }
            }
        }

        // Also add the full scene name (normalized) for exact matching
        const fullNormalized = normalized.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (fullNormalized.length >= 2 && !terms.includes(fullNormalized)) {
            terms.push(fullNormalized);
        }

        return terms;
    }

    /**
     * Calculates a match score between a chapter title and search terms
     * @param {string} chapterTitle - The chapter title to match against
     * @param {string[]} searchTerms - The search terms to look for
     * @param {string} originalSceneName - The original scene name for exact matching
     * @returns {number} Match score between 0 and 1
     * @private
     */
    _calculateChapterMatchScore(chapterTitle, searchTerms, originalSceneName) {
        if (!chapterTitle || !searchTerms || searchTerms.length === 0) {
            return 0;
        }

        const normalizedTitle = chapterTitle.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length >= 2);

        let totalScore = 0;
        let matchedTerms = 0;

        // Check for exact match (highest priority)
        const normalizedSceneName = originalSceneName.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (normalizedTitle === normalizedSceneName) {
            return 1.0; // Perfect match
        }

        // Check each search term
        for (const term of searchTerms) {
            const termWords = term.split(/\s+/).filter(w => w.length >= 2);

            // Check for exact term match in title
            if (normalizedTitle.includes(term)) {
                // Weight by term length relative to title length (longer matches = better)
                const matchWeight = Math.min(1.0, term.length / normalizedTitle.length * 2);
                totalScore += 0.8 * matchWeight;
                matchedTerms++;
                continue;
            }

            // Check for word-by-word matching
            let wordMatches = 0;
            for (const termWord of termWords) {
                // Check for exact word match
                if (titleWords.includes(termWord)) {
                    wordMatches++;
                } else {
                    // Check for partial match (word starts with term or vice versa)
                    for (const titleWord of titleWords) {
                        if (titleWord.startsWith(termWord) || termWord.startsWith(titleWord)) {
                            wordMatches += 0.5;
                            break;
                        }
                    }
                }
            }

            if (termWords.length > 0 && wordMatches > 0) {
                const wordMatchScore = wordMatches / termWords.length;
                totalScore += 0.5 * wordMatchScore;
                if (wordMatchScore > 0.5) {
                    matchedTerms++;
                }
            }
        }

        // Calculate final score
        const termCoverage = matchedTerms / searchTerms.length;
        const finalScore = (totalScore / searchTerms.length) * 0.7 + termCoverage * 0.3;

        return Math.min(1.0, finalScore);
    }

    /**
     * Finds a ChapterNode by its ID in the hierarchical structure
     * @param {ChapterNode[]} chapters - Array of chapter nodes to search
     * @param {string} nodeId - The node ID to find
     * @returns {ChapterNode|null} The found node or null
     * @private
     */
    _findChapterNodeById(chapters, nodeId) {
        for (const chapter of chapters) {
            if (chapter.id === nodeId) {
                return chapter;
            }

            if (chapter.children && chapter.children.length > 0) {
                const found = this._findChapterNodeById(chapter.children, nodeId);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }
}
