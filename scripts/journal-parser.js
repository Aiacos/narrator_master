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

        // Use DOMParser to safely parse HTML without executing scripts
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Get text content from the parsed document
        let text = doc.body.textContent || '';

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
}
